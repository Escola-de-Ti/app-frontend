import { api, setTokens, clearTokens } from '../api/client';
import type { AuthTokens, LoginRequest, RegisterRequest, Usuario } from '../types';

export async function login(payload: LoginRequest): Promise<AuthTokens> {
  const { data } = await api.post('/api/usuarios/login', payload);
  const accessToken = data?.accessToken ?? data?.token;
  const refreshToken = data?.refreshToken;
  if (!accessToken || !refreshToken) throw new Error('Resposta de login sem tokens');
  await setTokens(accessToken, refreshToken);
  return { accessToken, refreshToken };
}

export async function register(payload: RegisterRequest): Promise<void> {
  await api.post('/api/usuarios', payload);
}

export async function getUsuario(id: string): Promise<Usuario> {
  const { data } = await api.get(`/api/usuarios/${id}`);
  return data;
}

export async function updateUsuario(id: string, partial: Partial<Usuario>): Promise<Usuario> {
  const { data } = await api.put(`/api/usuarios/${id}`, partial);
  return data;
}

export async function logout(): Promise<void> {
  await clearTokens();
}
