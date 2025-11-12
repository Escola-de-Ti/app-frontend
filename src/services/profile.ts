// === src/services/profile.ts ===
import { api } from '../api/client';
import type { MyProfile, UpdateUserRequest, ID } from '../types';

export async function getUserById(id: ID): Promise<MyProfile> {
  const numId = Number(id);
  if (Number.isNaN(numId)) throw new Error(`ID inválido: ${id}`);
  const { data } = await api.get<MyProfile>(`/api/usuarios/${numId}`);
  return data;
}

export async function updateMyProfile(payload: UpdateUserRequest): Promise<MyProfile> {
  // PUT exclusivo para o usuário logado
  const { data } = await api.put<MyProfile>('/api/usuarios/user', payload);
  return data;
}
