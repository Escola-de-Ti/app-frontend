// src/services/posts.ts
import { api } from '../api/client';

const POSTS_ENDPOINT = '/api/posts';

export type CreatePostPayload = {
  usuarioId: number; // obrigatório
  titulo: string; // obrigatório
  descricao?: string; // opcional no back, mas tratamos aqui
  tagIds?: number[]; // opcional
  // imagemIds?: number[] // quando o back aceitar, adiciona aqui
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

/**
 * Normaliza o payload:
 * - trim em strings
 * - remove campos undefined
 * - dedup em tagIds
 */
function buildBody(payload: CreatePostPayload): Record<string, unknown> {
  const body: Record<string, unknown> = {
    usuarioId: Number(payload.usuarioId),
    titulo: trimOrUndefined(payload.titulo),
    descricao: trimOrUndefined(payload.descricao),
  };

  const tagIds = uniqFiniteNumbers(payload.tagIds);
  if (tagIds.length) body.tagIds = tagIds;

  // quando o back aceitar imagens, descomenta:
  // const imagemIds = uniqFiniteNumbers(payload.imagemIds as any);
  // if (imagemIds.length) body.imagemIds = imagemIds;

  // remove chaves com undefined (só por higiene)
  Object.keys(body).forEach((k) => body[k] === undefined && delete body[k]);
  return body;
}

/**
 * Extrai a melhor mensagem possível de erros de backends Spring/Problem+JSON/strings.
 */
function extractErrorMessage(err: any): string {
  const data = err?.response?.data;

  // string direta
  if (typeof data === 'string' && data.trim()) return data.trim();

  // Problem+JSON (RFC7807) comum no Spring
  if (data?.title || data?.detail) {
    const title = data.title ? String(data.title) : '';
    const detail = data.detail ? String(data.detail) : '';
    return [title, detail].filter(Boolean).join(' - ') || 'Erro ao processar requisição.';
  }

  // Bean Validation: { errors: [{field, message|defaultMessage}, ...] }
  if (Array.isArray(data?.errors) && data.errors.length) {
    const msgs = data.errors.map((e: any) => e?.message ?? e?.defaultMessage).filter(Boolean);
    if (msgs.length) return msgs.join('\n');
  }

  // { message: '...' }
  if (data?.message) return String(data.message);

  // Fallback genérico
  return err?.message || 'Falha ao criar post.';
}

export async function createPost(payload: CreatePostPayload) {
  try {
    const body = buildBody(payload);
    const { data } = await api.post(POSTS_ENDPOINT, body);
    return data;
  } catch (err: any) {
    const status = err?.response?.status;
    const data = err?.response?.data;

    // logs úteis no dev
    console.log('[POST][DEBUG] status =', status);
    console.log('[POST][DEBUG] data =', data);

    throw new Error(extractErrorMessage(err));
  }
}
