// === src/services/workshops.ts ===
import { api } from '../api/client';
import type { Workshop, WorkshopDTO, WorkshopCreateDTO, WorkshopUpdateDTO, Imagem } from '../types';
import { mapWorkshopDTO } from '../types';

const IMAGEM_ENDPOINT = '/api/imagem';

async function uriToBytes(uri: string): Promise<ArrayBuffer> {
  const res = await fetch(uri);
  if (!res.ok) {
    throw new Error(`Falha ao ler imagem local (status ${res.status})`);
  }
  return res.arrayBuffer();
}

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

// ========== WORKSHOPS CRUD BÁSICO ==========

export async function listAll(params?: {
  status?: 'ABERTO' | 'EM_ANDAMENTO' | 'CONCLUIDO';
  instrutorId?: number;
}): Promise<Workshop[]> {
  const { data } = await api.get<WorkshopDTO[]>('/api/workshops', { params });
  return data.map(mapWorkshopDTO);
}

export async function listOpen(): Promise<Workshop[]> {
  const { data } = await api.get<WorkshopDTO[]>('/api/workshops/abertos');
  return data.map(mapWorkshopDTO);
}

export async function searchByTitle(termo: string): Promise<Workshop[]> {
  const { data } = await api.get<WorkshopDTO[]>('/api/workshops/buscar', {
    params: { termo },
  });
  return data.map(mapWorkshopDTO);
}

export async function getWorkshopById(id: number): Promise<Workshop> {
  const { data } = await api.get<WorkshopDTO>(`/api/workshops/${id}`);
  return mapWorkshopDTO(data);
}

export async function createWorkshop(payload: WorkshopCreateDTO): Promise<Workshop> {
  const { data } = await api.post<WorkshopDTO>('/api/workshops', payload);
  return mapWorkshopDTO(data);
}

export async function updateWorkshop(id: number, payload: WorkshopUpdateDTO): Promise<Workshop> {
  const { data } = await api.put<WorkshopDTO>(`/api/workshops/${id}`, payload);
  return mapWorkshopDTO(data);
}

export async function deleteWorkshop(id: number): Promise<void> {
  await api.delete(`/api/workshops/${id}`);
}

// ========== IMAGENS DE WORKSHOP ==========

/**
 * @param workshopId
 * @param imageUris
 * @returns
 */
export async function uploadWorkshopImages(
  workshopId: number,
  imageUris: string[]
): Promise<Imagem[]> {
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
          type: 'WORKSHOP',
          id_type: String(workshopId),
        },
      });

      uploaded.push(data);
    } catch (err: any) {
      console.log('[uploadWorkshopImages][ERR]', { uri, errMessage: err?.message });
      throw new Error(extractErrorMessage(err));
    }
  }

  return uploaded;
}

/**
 * @param imagemId
 * @param uri
 */
export async function updateWorkshopImage(imagemId: number, uri: string): Promise<Imagem> {
  try {
    const bytes = await uriToBytes(uri);

    const { data } = await api.put<Imagem>(`${IMAGEM_ENDPOINT}/update/${imagemId}`, bytes, {
      headers: {
        'Content-Type': 'application/octet-stream',
      },
    });

    return data;
  } catch (err: any) {
    console.log('[updateWorkshopImage][ERR]', { imagemId, errMessage: err?.message });
    throw new Error(extractErrorMessage(err));
  }
}
