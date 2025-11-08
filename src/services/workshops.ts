// === src/services/workshops.ts ===
import { api } from '../api/client';
import type { Workshop, WorkshopDTO } from '../types';
import { mapWorkshopDTO } from '../types';

export async function listAvailableWorkshops(): Promise<Workshop[]> {
  const { data } = await api.get<WorkshopDTO[]>('/api/workshops/available');
  return data.map(mapWorkshopDTO);
}

export async function listMyWorkshops(): Promise<Workshop[]> {
  const { data } = await api.get<WorkshopDTO[]>('/api/workshops/mine');
  return data.map(mapWorkshopDTO);
}

export async function listEnrolledWorkshops(): Promise<Workshop[]> {
  const { data } = await api.get<WorkshopDTO[]>('/api/workshops/enrolled');
  return data.map(mapWorkshopDTO);
}

export async function enrollInWorkshop(id: number): Promise<void> {
  await api.post(`/api/workshops/${id}/enroll`);
}

export async function cancelEnrollment(id: number): Promise<void> {
  await api.post(`/api/workshops/${id}/cancel`);
}
