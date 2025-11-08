// src/services/tags.ts
import { api } from '../api/client';

export type TagResponseDTO = { id: number | string; name: string };

export async function createOrGetTag(name: string): Promise<TagResponseDTO> {
  const clean = String(name ?? '').trim();
  if (!clean) throw new Error('Nome de tag vazio');
  const { data } = await api.post<TagResponseDTO>('/api/tags', { name: clean });
  return data;
}

export async function createOrGetTagIds(names: string[]): Promise<number[]> {
  const unique = Array.from(new Set(names.map((n) => String(n ?? '').trim()).filter(Boolean)));
  if (!unique.length) return [];
  const results = await Promise.allSettled(unique.map((n) => createOrGetTag(n)));
  const ids: number[] = [];
  results.forEach((r) => {
    if (r.status === 'fulfilled') {
      const v = Number(r.value.id);
      if (Number.isFinite(v)) ids.push(v);
    }
  });
  return Array.from(new Set(ids));
}

/** Normaliza respostas variadas em [{id,name}] */
function normalizePopular(raw: any): TagResponseDTO[] {
  if (!raw) return [];
  const arr = Array.isArray(raw) ? raw : Array.isArray(raw.items) ? raw.items : [];
  return arr
    .map((x: any, i: number) => {
      if (typeof x === 'string') return { id: i + 1, name: x };
      if (x && typeof x === 'object') {
        const name = String(x.name ?? x.nome ?? '').trim();
        const id = x.id ?? x.tagId ?? i + 1;
        if (!name) return null;
        return { id, name };
      }
      return null;
    })
    .filter(Boolean) as TagResponseDTO[];
}

/** Pode lançar erro (a “bruta”) */
export async function getPopularTags(qtd: number = 12): Promise<TagResponseDTO[]> {
  // tenta com quantidade
  try {
    const { data } = await api.get('/api/tags/popular', { params: { quantidade: qtd } });
    const out = normalizePopular(data);
    if (out.length) return out;
  } catch {}
  // tenta sem quantidade
  try {
    const { data } = await api.get('/api/tags/popular');
    const out = normalizePopular(data);
    if (out.length) return out;
  } catch {}
  return [];
}

/** Nunca lança erro: se o back der 500, retorna [] e pronto */
export async function getPopularTagsSafe(qtd: number = 12): Promise<TagResponseDTO[]> {
  try {
    return await getPopularTags(qtd);
  } catch {
    return [];
  }
}
