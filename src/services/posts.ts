// src/services/posts.ts
import { api } from '../api/client';
import type { GetFeedResponseDTO } from '../types';

// ===== Endpoints =====
const POSTS_ENDPOINT = '/api/posts';
const COMMENTS_ENDPOINT = '/api/comentarios';
const VOTES_ENDPOINT = '/api/votos';

// ===== Re-export dos tipos de FEED (vem de src/types) =====
export type { PostFeedDTO, GetFeedResponseDTO } from '../types';

// ===== Tipos específicos (detalhes/comentários) =====
export type TagDTO = { id: number; name: string };

export type ComentarioDTO = {
  id: number;
  postId: number;
  usuarioId: number;
  usuarioNome: string;
  texto: string;
  totalUpVotes: number;
  totalSuperVotes: number;
  comentarioPaiId: number | null;
  dataCriacao: string; // ISO
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
};

// Algumas APIs podem devolver esse campo opcionalmente
export type PostDetalhesResponse = PostDetalhesDTO & {
  usuarioJaVotou?: boolean;
};

// ===== Helpers =====
export type CreatePostPayload = {
  usuarioId: number;
  titulo: string;
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

function buildBody(payload: CreatePostPayload): Record<string, unknown> {
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

/** Extrai mensagem amigável de erros Spring/Problem+JSON/strings. */
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

// ===== API =====
export async function createPost(payload: CreatePostPayload) {
  try {
    const body = buildBody(payload);
    const { data } = await api.post(POSTS_ENDPOINT, body);
    return data as PostDetalhesDTO;
  } catch (err: any) {
    console.log('[POST][DEBUG]', err?.response?.status, err?.response?.data);
    throw new Error(extractErrorMessage(err));
  }
}

/**
 * GET /api/posts/feed
 * paginação via lastPostId/lastScore
 */
export type FeedParams = {
  pageSize?: number;
  lastPostId?: number | null;
  lastScore?: number | null;
  q?: string;
  // filtros opcionais:
  // tagIds?: number[];
  // tagOperador?: 'E' | 'OU';
  // dataInicio?: string; // yyyy-MM-dd
  // dataFim?: string;    // yyyy-MM-dd
};

let FEED_SEQ = 0;

export async function getFeed(params: FeedParams = {}): Promise<GetFeedResponseDTO> {
  const seq = ++FEED_SEQ; // id da chamada p/ rastrear
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

    // Normaliza campos sensíveis a undefined
    const totalUpVotes =
      typeof (data as any)?.totalUpVotes === 'number' ? (data as any).totalUpVotes : 0;

    return {
      ...data,
      totalUpVotes,
      usuarioJaVotou:
        typeof (data as any)?.usuarioJaVotou === 'boolean'
          ? (data as any).usuarioJaVotou
          : undefined,
      comentarios: Array.isArray((data as any)?.comentarios) ? (data as any).comentarios : [],
      hasMoreComentarios: Boolean((data as any)?.hasMoreComentarios),
    };
  } catch (err: any) {
    throw new Error(extractErrorMessage(err));
  }
}

/** POST /api/comentarios
 * Body esperado pelo back: { postId, texto, comentarioPaiId }
 */
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
      postId, // obrigatório
      texto: (args.texto ?? '').trim(), // string limpa
      comentarioPaiId: parent, // null p/ raiz, número p/ reply
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

    // aceita variações de payload
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

/**
 * POST /api/votos/post/{postId}
 * Retorna shape normalizado para a UI decidir (toggle no back ou idempotente).
 */
export type UpvoteResponse = {
  userVoted: boolean; // estado final do voto após a operação
  totalUpVotes?: number; // contagem final após a operação (se o back fornecer)
};

export async function upvotePost(postId: number): Promise<UpvoteResponse> {
  try {
    const { data } = await api.post(`${VOTES_ENDPOINT}/post/${postId}`);

    // Normaliza possíveis chaves do back
    const userVotedRaw =
      (data as any)?.userVoted ?? (data as any)?.usuarioJaVotou ?? (data as any)?.jaVotou;

    const totalRaw = (data as any)?.totalUpVotes ?? (data as any)?.upvotes ?? (data as any)?.total;

    return {
      userVoted: Boolean(userVotedRaw ?? true), // se o endpoint não mandar, assume votado
      totalUpVotes: typeof totalRaw === 'number' ? totalRaw : undefined,
    };
  } catch (err: any) {
    const status = err?.response?.status;
    const body = err?.response?.data;

    // Caso comum: servidor retorna 409/400 dizendo que já estava votado
    if (status === 409 || status === 400) {
      const msg = (typeof body === 'string' ? body : body?.message || '').toLowerCase();
      if (msg.includes('já vot') || msg.includes('already')) {
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
    throw new Error(extractErrorMessage(err));
  }
}

/** POST /api/votos/comentario/{comentarioId}/super */
export async function superVoteComment(comentarioId: number) {
  try {
    const { data } = await api.post(`${VOTES_ENDPOINT}/comentario/${comentarioId}/super`);
    return data;
  } catch (err: any) {
    throw new Error(extractErrorMessage(err));
  }
}
