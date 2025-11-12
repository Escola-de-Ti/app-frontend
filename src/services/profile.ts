// === src/services/profile.ts ===
import { api } from '../api/client';

export type MyProfile = {
  id: number;
  nome: string;
  sobrenome?: string;
  email: string;
  telefone?: string;
  avatarUrl?: string | null;

  // preferências visuais (opcionais no back)
  bannerColorHex?: string | null; // ex: "#b14cb3"
  bannerOpacity?: number | null; // 0..1
};

export type UpdateMyProfileDTO = Partial<{
  nome: string;
  sobrenome: string;
  telefone: string;
  avatarUrl: string | null;
  bannerColorHex: string | null; // ex: "#b14cb3"
  bannerOpacity: number | null; // 0..1
}>;

// GET /api/usuarios/me
export async function getMyProfile(): Promise<MyProfile> {
  const { data } = await api.get<MyProfile>('/api/usuarios/me');
  return data;
}

// PUT /api/usuarios/me
export async function updateMyProfile(payload: UpdateMyProfileDTO): Promise<MyProfile> {
  const { data } = await api.put<MyProfile>('/api/usuarios/me', payload);
  return data;
}
