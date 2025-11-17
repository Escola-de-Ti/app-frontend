import { api } from '../api/client';

export type Usuario = {
  id: number; // BigInteger no back, aqui usamos number
  email: string;
  nome?: string;
  // ...outros campos se precisar
};

export async function listUsuarios(): Promise<Usuario[]> {
  const { data } = await api.get('/api/usuarios');
  return data as Usuario[];
}

export async function getUsuarioIdByEmail(email: string): Promise<number | null> {
  const usuarios = await listUsuarios();
  const u = usuarios.find((x) => x.email?.toLowerCase() === email.toLowerCase());
  return u?.id ?? null;
}

export interface RankingUsuarioDTO {
  id: number;
  posicao: number;
  nome: string;
  qntdXp: number;
  nivel: number;
}

// GET /api/usuarios/buscar?nome=...
export async function buscarUsuariosPorNome(nome: string): Promise<RankingUsuarioDTO[]> {
  const query = (nome || '').trim();

  if (!query) {
    return [];
  }

  const { data } = await api.get<RankingUsuarioDTO[]>('/api/usuarios/buscar', {
    params: { nome: query },
  });

  return Array.isArray(data) ? data : [];
}
