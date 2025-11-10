// src/services/tags.ts
import { api } from '../api/client';

export type TagResponseDTO = { id: number; name: string };

/** Cria OU retorna a tag existente (o back já cuida disso). */
export async function createOrGetTag(name: string): Promise<TagResponseDTO> {
  const clean = String(name ?? '').trim();
  if (!clean) throw new Error('Nome de tag vazio');

  const { data } = await api.post<TagResponseDTO>('/api/tags', { name: clean });
  return {
    id: Number(data.id),
    name: String(data.name),
  };
}

/** Dado um array de nomes, retorna os IDs únicos das tags correspondentes. */
export async function createOrGetTagIds(names: string[]): Promise<number[]> {
  const unique = Array.from(new Set(names.map((n) => String(n ?? '').trim()).filter(Boolean)));
  if (!unique.length) return [];

  const results = await Promise.allSettled(unique.map((n) => createOrGetTag(n)));
  const ids = new Set<number>();

  results.forEach((r) => {
    if (r.status === 'fulfilled') {
      const v = Number(r.value.id);
      if (Number.isFinite(v)) ids.add(v);
    }
  });

  return Array.from(ids);
}

/** Retorna as tags mais populares (nunca lança erro: em falha devolve []). */
export async function getPopularTagsSafe(qtd: number = 12): Promise<TagResponseDTO[]> {
  try {
    const { data } = await api.get<TagResponseDTO[]>('/api/tags/popular', {
      params: { quantidade: qtd },
    });
    return (Array.isArray(data) ? data : []).map((t) => ({
      id: Number((t as any).id),
      name: String((t as any).name),
    }));
  } catch {
    return [];
  }
}

/** Versão que lança erro (se preferir tratar no chamador). */
export async function getPopularTags(qtd: number = 12): Promise<TagResponseDTO[]> {
  const { data } = await api.get<TagResponseDTO[]>('/api/tags/popular', {
    params: { quantidade: qtd },
  });
  return (Array.isArray(data) ? data : []).map((t) => ({
    id: Number((t as any).id),
    name: String((t as any).name),
  }));
}
