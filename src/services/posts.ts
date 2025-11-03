import { api } from '../api/client';

const POSTS_ENDPOINT = '/api/posts';

export type CreatePostPayload = {
  titulo: string;
  descricao: string; // no back é "descricao"
  usuarioId: number; // BigInteger no back → number aqui
  tagIds?: number[]; // se/quando tiver ids
};

export async function createPost(payload: CreatePostPayload) {
  try {
    const body: Record<string, unknown> = {
      titulo: payload.titulo?.trim(),
      descricao: payload.descricao?.trim(),
      usuarioId: payload.usuarioId,
    };
    if (Array.isArray(payload.tagIds)) {
      body.tagIds = payload.tagIds.filter((n) => Number.isFinite(n));
    }

    const { data } = await api.post(POSTS_ENDPOINT, body, {
      headers: { 'Content-Type': 'application/json' },
    });
    return data;
  } catch (err: any) {
    const status = err?.response?.status;
    const data = err?.response?.data;
    console.log('[POST][DEBUG] status =', status);
    console.log('[POST][DEBUG] data =', data);
    const msg =
      (typeof data === 'string' && data) ||
      data?.message ||
      (Array.isArray(data?.errors) && data.errors.join('\n')) ||
      'Falha ao criar post.';
    throw new Error(msg);
  }
}
