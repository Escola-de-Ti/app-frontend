import { api } from '../api/client';
import type { Tag } from '../types';

export async function getPopularTags(): Promise<Tag[]> {
  const { data } = await api.get('/api/tags/popular');
  return data;
}

export async function getAllTags(): Promise<Tag[]> {
  const { data } = await api.get('/api/tags');
  return data;
}
