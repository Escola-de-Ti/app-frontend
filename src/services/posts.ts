// src/services/posts.ts
import { api } from '../api/client';
import type { GetFeedResponseDTO, Imagem } from '../types';

// ===== Endpoints =====
const POSTS_ENDPOINT = '/api/posts';
const COMMENTS_ENDPOINT = '/api/comentarios';
const VOTES_ENDPOINT = '/api/votos';
const IMAGEM_ENDPOINT = '/api/imagem';

// ===== Re-export dos tipos de FEED (vem de src/types) =====
export type { PostFeedDTO, GetFeedResponseDTO } from '../types';

// ===== Tipos específicos (detalhes/comentários) =====
export type TagDTO = {
  id: number;
  name: string;
};

export type ComentarioDTO = {
  id: number;
  postId: number;
  usuarioId: number;
  usuarioNome: string;
  texto: string;
  totalUpVotes: number;
  totalSuperVotes: number;
  comentarioPaiId: number | null;
  dataCriacao: string;
  /** flag vinda do back (Boolean jaVotou) */
  jaVotou?: boolean;
  /** alias mais semântico pro front usar */
  usuarioJaVotou?: boolean;
  /** nível / profundidade do comentário na árvore */
  nivel?: number | null;
};

export type PostDetalhesDTO = {
  id: number;
  usuarioId: number;
  usuarioNome: string;
  titulo: string;
  descricao: string;
  totalUpVotes: number;
  tags: TagDTO[];
  dataCriacao: string;
  comentarios: ComentarioDTO[];
  hasMoreComentarios: boolean;
  /** flag vinda do back (Boolean jaVotou) */
  jaVotou?: boolean;
  /** nível do post (mesma ideia de “nivel” no comentário) */
  nivel?: number | null;
  /** imagens associadas ao post (List<ImagemPostDTO> no back) */
  urlsImagens?: Imagem[];
};

export type PostDetalhesResponse = PostDetalhesDTO & {
  usuarioJaVotou?: boolean;
  votado?: boolean;
};

// ===== Helpers =====
export type CreatePostPayload = {
  usuarioId: number;
  titulo: string;
  descricao?: string;
  tagIds?: number[];
};

export type UpdatePostPayload = {
  usuarioId?: number;
  titulo?: string;
  descricao?: string;
  tagIds?: number[];
};

function uniqFiniteNumbers(input?: number[]) {
  if (!Array.isArray(input)) return [];
  const out = new Set<number>();
  for (const n of input) {
    const v = Number(n);
    if (Number.isFinite(v)) out.add(v);
  }
  return Array.from(out);
}

function trimOrUndefined(s?: string) {
  if (typeof s !== 'string') return undefined;
  const t = s.trim();
  return t.length ? t : undefined;
}

function buildCreateBody(payload: CreatePostPayload): Record<string, unknown> {
  const body: Record<string, unknown> = {
    usuarioId: Number(payload.usuarioId),
    titulo: trimOrUndefined(payload.titulo),
    descricao: trimOrUndefined(payload.descricao),
  };

  const tagIds = uniqFiniteNumbers(payload.tagIds);
  if (tagIds.length) body.tagIds = tagIds;

  Object.keys(body).forEach((k) => body[k] === undefined && delete body[k]);
  return body;
}

function buildUpdateBody(postId: number, payload: UpdatePostPayload): Record<string, unknown> {
  const body: Record<string, unknown> = {
    id: Number(postId),
    usuarioId:
      payload.usuarioId != null && !Number.isNaN(Number(payload.usuarioId))
        ? Number(payload.usuarioId)
        : undefined,
    titulo: trimOrUndefined(payload.titulo),
    descricao: trimOrUndefined(payload.descricao),
  };

  const tagIds = uniqFiniteNumbers(payload.tagIds);
  if (tagIds.length) body.tagIds = tagIds;

  Object.keys(body).forEach((k) => body[k] === undefined && delete body[k]);
  return body;
}

const toBool = (v: any): boolean => {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v === 1;
  if (typeof v === 'string') return v.toLowerCase() === 'true' || v === '1';
  return false;
};

const toNum = (v: any): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

function extractErrorMessage(err: any): string {
  const data = err?.response?.data;

  if (typeof data === 'string' && data.trim()) return data.trim();

  if (data?.title || data?.detail) {
    const title = data.title ? String(data.title) : '';
    const detail = data.detail ? String(data.detail) : '';
    return [title, detail].filter(Boolean).join(' - ') || 'Erro ao processar requisição.';
  }

  if (Array.isArray(data?.errors) && data.errors.length) {
    const msgs = data.errors.map((e: any) => e?.message ?? e?.defaultMessage).filter(Boolean);
    if (msgs.length) return msgs.join('\n');
  }

  if (data?.message) return String(data.message);

  return err?.message || 'Falha na requisição.';
}

export class OwnContentVoteError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OwnContentVoteError';
  }
}

// ===== API =====
export async function createPost(payload: CreatePostPayload) {
  try {
    const body = buildCreateBody(payload);
    const { data } = await api.post(POSTS_ENDPOINT, body);
    return data as PostDetalhesDTO;
  } catch (err: any) {
    console.log('[POST][CREATE][ERR]', err?.response?.status, err?.response?.data);
    throw new Error(extractErrorMessage(err));
  }
}

/** PUT /api/posts/{id} - atualização de post */
export async function updatePost(postId: number, payload: UpdatePostPayload) {
  try {
    const body = buildUpdateBody(postId, payload);
    console.log('[POST][UPDATE][REQ]', { postId, body });

    const { data } = await api.patch<PostDetalhesDTO>(`${POSTS_ENDPOINT}/${postId}`, body);

    console.log('[POST][UPDATE][OK]', { postId, data });
    return data;
  } catch (err: any) {
    console.log('[POST][UPDATE][ERR]', err?.response?.status, err?.response?.data);
    throw new Error(extractErrorMessage(err));
  }
}

/* GET /api/posts/feed */
export type OrderBy = 'RELEVANCE' | 'UPVOTES_DESC' | 'UPVOTES_ASC' | 'DATE_DESC' | 'DATE_ASC';

export type FeedParams = {
  pageSize?: number;
  lastPostId?: number | null;
  lastScore?: number | null;
  q?: string;
  orderBy?: OrderBy;
  // filtros opcionais:
  // tagIds?: number[];
  // tagOperador?: 'E' | 'OU';
  // dataInicio?: string; // yyyy-MM-dd
  // dataFim?: string;    // yyyy-MM-dd
};

let FEED_SEQ = 0;

export async function getFeed(params: FeedParams = {}): Promise<GetFeedResponseDTO> {
  const seq = ++FEED_SEQ;
  const finalParams = { pageSize: 20, ...params };

  console.log('[FEED][API][REQ]', { seq, finalParams });

  const { data } = await api.get<GetFeedResponseDTO>('/api/posts/feed', { params: finalParams });

  const count = Array.isArray((data as any)?.posts) ? (data as any).posts.length : 0;
  console.log('[FEED][API][RESP]', {
    seq,
    count,
    lastPostId: (data as any)?.lastPostId,
    lastScore: (data as any)?.lastScore,
  });

  return {
    posts: Array.isArray((data as any)?.posts) ? (data as any).posts : [],
    hasMore: Boolean((data as any)?.hasMore),
    lastPostId: (data as any)?.lastPostId ?? null,
    lastScore: (data as any)?.lastScore ?? null,
  };
}

/** GET /api/posts/{id}/detalhes */
export async function getPostDetails(
  postId: number,
  pageSize: number = 50
): Promise<PostDetalhesResponse> {
  try {
    const { data } = await api.get<PostDetalhesResponse>(`${POSTS_ENDPOINT}/${postId}/detalhes`, {
      params: { pageSize },
    });

    const raw = data as any;

    const totalUpVotes = toNum(raw?.totalUpVotes);
    const voted = raw?.usuarioJaVotou ?? raw?.jaVotou ?? raw?.votado;

    // normaliza comentários pra garantir número e flags
    const comentarios: ComentarioDTO[] = Array.isArray(raw?.comentarios)
      ? (raw.comentarios as any[]).map((c): ComentarioDTO => {
          const totalUp = toNum(c?.totalUpVotes);
          const totalSuper = toNum(c?.totalSuperVotes);
          const votedComentario = c?.usuarioJaVotou ?? c?.jaVotou;

          return {
            id: Number(c.id),
            postId: Number(c.postId),
            usuarioId: Number(c.usuarioId),
            usuarioNome: String(c.usuarioNome ?? ''),
            texto: String(c.texto ?? ''),
            totalUpVotes: totalUp,
            totalSuperVotes: totalSuper,
            comentarioPaiId:
              c.comentarioPaiId != null && !Number.isNaN(Number(c.comentarioPaiId))
                ? Number(c.comentarioPaiId)
                : null,
            dataCriacao: String(c.dataCriacao ?? ''),
            jaVotou: typeof c?.jaVotou === 'boolean' ? c.jaVotou : undefined,
            usuarioJaVotou: typeof votedComentario === 'boolean' ? votedComentario : undefined,
            nivel: c.nivel != null && !Number.isNaN(Number(c.nivel)) ? Number(c.nivel) : null,
          };
        })
      : [];

    const nivelPost =
      raw?.nivel != null && !Number.isNaN(Number(raw.nivel)) ? Number(raw.nivel) : null;

    return {
      ...(data as PostDetalhesDTO),
      totalUpVotes,
      usuarioJaVotou: typeof voted === 'boolean' ? voted : undefined,
      hasMoreComentarios: Boolean(raw?.hasMoreComentarios),
      comentarios,
      nivel: nivelPost,
    };
  } catch (err: any) {
    throw new Error(extractErrorMessage(err));
  }
}

/** POST /api/comentarios */
export async function createComment(args: {
  postId: number;
  texto: string;
  comentarioPaiId?: number | null;
}) {
  try {
    const postId = Number(args.postId);
    const parent =
      args.comentarioPaiId == null
        ? null
        : Number.isFinite(Number(args.comentarioPaiId))
          ? Number(args.comentarioPaiId)
          : null;

    const payload = {
      postId,
      texto: (args.texto ?? '').trim(),
      comentarioPaiId: parent,
    };

    const { data } = await api.post<ComentarioDTO>(COMMENTS_ENDPOINT, payload, {
      headers: { 'Content-Type': 'application/json' },
    });
    return data;
  } catch (err: any) {
    console.log('[createComment][ERR]', err?.response?.status, err?.response?.data);
    throw new Error(extractErrorMessage(err));
  }
}

/** GET /api/comentarios/{comentarioId}/respostas?pageSize= */
export async function getCommentReplies(
  comentarioId: number,
  pageSize: number = 50
): Promise<ComentarioDTO[]> {
  try {
    const { data } = await api.get(`${COMMENTS_ENDPOINT}/${comentarioId}/respostas`, {
      params: { pageSize },
    });

    if (Array.isArray(data)) return data as ComentarioDTO[];
    if (Array.isArray((data as any)?.comentarios))
      return (data as any).comentarios as ComentarioDTO[];
    if (Array.isArray((data as any)?.items)) return (data as any).items as ComentarioDTO[];
    return [];
  } catch (err: any) {
    console.log('[getCommentReplies][ERR]', err?.response?.status, err?.response?.data);
    throw new Error(extractErrorMessage(err));
  }
}

/* POST /api/votos/post/{postId} */
export type UpvoteResponse = {
  userVoted: boolean;
  totalUpVotes?: number;
};

export async function upvotePost(postId: number): Promise<UpvoteResponse> {
  try {
    const { data } = await api.post(`${VOTES_ENDPOINT}/post/${postId}`);

    const userVotedRaw =
      (data as any)?.userVoted ??
      (data as any)?.usuarioJaVotou ??
      (data as any)?.jaVotou ??
      (data as any)?.votado;

    const totalRaw = (data as any)?.totalUpVotes ?? (data as any)?.upvotes ?? (data as any)?.total;

    return {
      userVoted: typeof userVotedRaw === 'boolean' ? userVotedRaw : false,
      totalUpVotes: typeof totalRaw === 'number' ? totalRaw : undefined,
    };
  } catch (err: any) {
    const status = err?.response?.status;
    const body = err?.response?.data;

    const rawMsg = typeof body === 'string' ? body : body?.message || extractErrorMessage(err);
    const lower = String(rawMsg).toLowerCase();

    if (lower.includes('você não pode votar no próprio post')) {
      throw new OwnContentVoteError(String(rawMsg));
    }

    if (status === 409 || status === 400) {
      if (lower.includes('já vot') || lower.includes('already')) {
        return { userVoted: true };
      }
    }

    throw new Error(extractErrorMessage(err));
  }
}

/** POST /api/votos/comentario/{comentarioId} */
export async function upvoteComment(comentarioId: number) {
  try {
    const { data } = await api.post(`${VOTES_ENDPOINT}/comentario/${comentarioId}`);
    return data;
  } catch (err: any) {
    const message = extractErrorMessage(err);
    const lower = message.toLowerCase();

    if (lower.includes('você não pode votar no próprio comentário')) {
      throw new OwnContentVoteError(message);
    }

    throw new Error(message);
  }
}

/** POST /api/votos/comentario/{comentarioId}/super */
export async function superVoteComment(comentarioId: number) {
  try {
    const { data } = await api.post(`${VOTES_ENDPOINT}/comentario/${comentarioId}/super`);
    return data;
  } catch (err: any) {
    const message = extractErrorMessage(err);
    const lower = message.toLowerCase();

    if (lower.includes('você não pode votar no próprio comentário')) {
      throw new OwnContentVoteError(message);
    }

    throw new Error(message);
  }
}

async function uriToBytes(uri: string): Promise<ArrayBuffer> {
  const res = await fetch(uri);
  if (!res.ok) {
    throw new Error(`Falha ao ler imagem local (status ${res.status})`);
  }
  return res.arrayBuffer();
}

export async function uploadPostImages(postId: number, imageUris: string[]): Promise<Imagem[]> {
  const validUris = Array.from(
    new Set((imageUris || []).filter((u) => typeof u === 'string' && u.trim().length > 0))
  );

  if (!validUris.length) return [];

  const uploaded: Imagem[] = [];

  for (const uri of validUris) {
    try {
      const bytes = await uriToBytes(uri);

      const { data } = await api.post<Imagem>(`${IMAGEM_ENDPOINT}/upload`, bytes, {
        headers: {
          'Content-Type': 'application/octet-stream',
        },
        params: {
          type: 'POST',
          id_type: String(postId),
        },
      });

      uploaded.push(data);
    } catch (err: any) {
      console.log('[uploadPostImages][ERR]', { uri, errMessage: err?.message });
      throw new Error(extractErrorMessage(err));
    }
  }

  return uploaded;
}

export async function updatePostImage(imagemId: number, uri: string): Promise<Imagem> {
  try {
    const bytes = await uriToBytes(uri);

    const { data } = await api.put<Imagem>(`${IMAGEM_ENDPOINT}/update/${imagemId}`, bytes, {
      headers: {
        'Content-Type': 'application/octet-stream',
      },
    });

    return data;
  } catch (err: any) {
    console.log('[updatePostImage][ERR]', { imagemId, errMessage: err?.message });
    throw new Error(extractErrorMessage(err));
  }
}

/** DELETE /api/imagem/delete/{id} - deletar imagem de post */
export async function deletePostImage(imagemId: number): Promise<void> {
  try {
    await api.delete(`${IMAGEM_ENDPOINT}/delete/${imagemId}`);
  } catch (err: any) {
    console.log('[deletePostImage][ERR]', { imagemId, errMessage: err?.message });
    throw new Error(extractErrorMessage(err));
  }
}

/** DELETE /api/posts/{id} */
export async function deletePost(postId: number) {
  try {
    await api.delete(`${POSTS_ENDPOINT}/${postId}`);
  } catch (err: any) {
    throw new Error(extractErrorMessage(err));
  }
}
