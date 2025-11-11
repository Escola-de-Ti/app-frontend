// === src/services/workshops.ts ===
import { api } from '../api/client';
import type { Workshop, WorkshopDTO, WorkshopCreateDTO, WorkshopUpdateDTO } from '../types';
import { mapWorkshopDTO } from '../types';

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
  const { data } = await api.patch<WorkshopDTO>(`/api/workshops/${id}`, payload);
  return mapWorkshopDTO(data);
}

export async function deleteWorkshop(id: number): Promise<void> {
  await api.delete(`/api/workshops/${id}`);
}
