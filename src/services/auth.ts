import { api } from '../api/client';
import { setTokens, clearTokens } from '../lib/secure';

export type AuthTokens = { accessToken: string; refreshToken: string };
export type LoginRequest = { email: string; senha: string };
export type RegisterRequest = {
  nome: string;
  email: string;
  senha: string;
  cpf?: string;
  telefone?: string;
  sobrenome?: string;
  tipoUsuario?: 'ALUNO' | string;
};

export async function login(payload: LoginRequest): Promise<AuthTokens> {
  const { data } = await api.post('/api/usuarios/login', payload);
  const accessToken = data?.accessToken ?? data?.token;
  const refreshToken = data?.refreshToken;
  if (!accessToken || !refreshToken) throw new Error('Resposta de login sem tokens');
  await setTokens(accessToken, refreshToken);
  return { accessToken, refreshToken };
}

export async function register(payload: RegisterRequest): Promise<void> {
  const body = { ...payload, tipoUsuario: 'ALUNO' as const };
  await api.post('/api/usuarios', body);
}

export async function logout(): Promise<void> {
  try {
    await api.post('/api/usuarios/logout'); // se existir
  } catch {}
  await clearTokens();
}
