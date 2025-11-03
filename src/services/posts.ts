import { api } from '../api/client';
import type { CreatePostDTO, ID, OrdenacaoTipo, Direcao, Paged, PostItem } from '../types';

export async function createPost(dto: CreatePostDTO): Promise<PostItem> {
  const { data } = await api.post('/api/posts', dto);
  return data;
}

export async function getFeed(params?: {
  page?: number;
  size?: number;
  ordenacao?: OrdenacaoTipo;
  direcao?: Direcao;
}): Promise<Paged<PostItem>> {
  const { page = 0, size = 10, ordenacao = 'MAIS_RECENTES', direcao = 'DESC' } = params || {};
  const { data } = await api.get('/api/posts/feed', { params: { page, size, ordenacao, direcao } });
  return data;
}

export async function searchPosts(params?: {
  q?: string;
  tagIds?: ID[];
  page?: number;
  size?: number;
  ordenacao?: OrdenacaoTipo;
  direcao?: Direcao;
}): Promise<Paged<PostItem>> {
  const { data } = await api.get('/api/posts/buscar', { params });
  return data;
}

export async function getPost(id: ID): Promise<PostItem> {
  const { data } = await api.get(`/api/posts/${id}`);
  return data;
}

export async function updatePost(id: ID, partial: Partial<PostItem>): Promise<PostItem> {
  const { data } = await api.patch(`/api/posts/${id}`, partial);
  return data;
}

export async function deletePost(id: ID): Promise<void> {
  await api.delete(`/api/posts/${id}`);
}
