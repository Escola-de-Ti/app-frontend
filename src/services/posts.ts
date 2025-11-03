// src/services/posts.ts
import { api } from '../api/client';

const POSTS_ENDPOINT = '/api/posts'; // troque aqui se seu endpoint for outro (ex: '/api/publicacoes')

export type CreatePostPayload = {
  titulo: string;
  conteudo: string;
  tags?: string[];
  usuarioId: string; // obrigatório pro seu back
};

export async function createPost(payload: CreatePostPayload) {
  try {
    const body: Record<string, unknown> = {
      titulo: payload.titulo?.trim(),
      conteudo: payload.conteudo?.trim(),
      usuarioId: payload.usuarioId, // <- chave exata pedida pelo back
    };
    if (Array.isArray(payload.tags)) body.tags = payload.tags.filter(Boolean);

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
