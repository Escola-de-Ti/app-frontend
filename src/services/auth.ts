// src/services/auth.ts
import { api } from '../api/client';
import { setTokens, clearTokens } from '../lib/secure';
import type { AuthTokens, LoginRequest, TipoUsuario, RegisterRequest } from '../types';

function pickAccessToken(data: any, headers?: any) {
  return (
    data?.access_token ??
    data?.accessToken ??
    data?.token ??
    data?.jwt ??
    headers?.authorization?.match(/Bearer\s+(.+)/i)?.[1] ??
    null
  );
}
const pickRefreshToken = (d: any) => d?.refresh_token ?? d?.refreshToken ?? null;

export async function login(payload: LoginRequest): Promise<AuthTokens> {
  const resp = await api.post('/api/usuarios/login', payload);
  const { data, headers } = resp as any;

  const accessToken = pickAccessToken(data, headers);
  const refreshToken = pickRefreshToken(data);

  if (!accessToken) throw new Error('Resposta de login sem tokens');
  await setTokens(accessToken, refreshToken ?? '');
  return { accessToken, refreshToken };
}

export async function register(payload: RegisterRequest & { tipoUsuario: TipoUsuario }) {
  const body = {
    email: payload.email,
    cpf: payload.cpf ?? '',
    telefone: payload.telefone ?? '',
    telefone2: payload.telefone2 ?? '',
    nome: payload.nome,
    biografia: '',
    senha: payload.senha,
    imageBase64: null,
    tipoUsuario: payload.tipoUsuario,
  };
  await api.post('/api/usuarios', body);
}

export async function logout(): Promise<void> {
  try {
    await api.options('/api/usuarios/logout');
  } catch {}
  await clearTokens();
}
