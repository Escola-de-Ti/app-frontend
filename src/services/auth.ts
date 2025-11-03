import { api } from '../api/client';
import { setTokens, clearTokens } from '../lib/secure';

export type AuthTokens = { accessToken: string; refreshToken: string | null };
export type LoginRequest = { email: string; senha: string };

function extractBearer(authHeader?: string | null) {
  if (!authHeader) return null;
  const m = authHeader.match(/Bearer\s+(.+)/i);
  return m?.[1] ?? null;
}

export async function login(payload: LoginRequest): Promise<AuthTokens> {
  const resp = await api.post('/api/usuarios/login', payload);
  const { data, headers } = resp as any;

  // tenta nas chaves mais comuns
  const accessToken =
    data?.accessToken ??
    data?.token ??
    data?.jwt ??
    data?.access_token ??
    extractBearer(headers?.authorization);

  const refreshToken = data?.refreshToken ?? data?.refresh_token ?? null;

  if (!accessToken) {
    // log pra debug rápido
    console.log('[LOGIN] resp sem token. data=', data, 'headers=', headers);
    throw new Error('Resposta de login sem tokens');
  }

  // guarda o que tiver: se não vier refresh, salva só o access
  await setTokens(accessToken, refreshToken ?? '');

  return { accessToken, refreshToken };
}

export async function register(payload: any): Promise<void> {
  const body = { ...payload, tipoUsuario: 'ALUNO' as const };
  await api.post('/api/usuarios', body);
}

export async function logout(): Promise<void> {
  try {
    await api.post('/api/usuarios/logout');
  } catch {}
  await clearTokens();
}
