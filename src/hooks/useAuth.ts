// src/hooks/useAuth.ts
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { login as apiLogin, register as apiRegister, logout as apiLogout } from '../services/auth';
import { getEmailFromJwt, getUserIdFromJwt } from '../lib/jwt';
import { setTokens, getAccessToken, clearTokens } from '../lib/secure';
import { getUsuarioIdByEmail } from '../services/user';

type RegisterPayload = {
  nome: string;
  email: string;
  senha: string;
  cpf?: string;
  telefone?: string;
  telefone2?: string; // se não usar, pode remover
};

type AuthContextType = {
  isAuthenticated: boolean;
  userId: string | null; // id numérico em string
  isLoading: boolean;
  login(email: string, senha: string): Promise<void>;
  register(payload: RegisterPayload): Promise<void>;
  logout(): Promise<void>;
};

// contexto tipado (sem any)
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function resolveUserIdFromToken(token: string | null): Promise<string | null> {
  // 1) se algum dia o id vier no token, usamos direto
  const idFromToken = getUserIdFromJwt(token);
  if (idFromToken) return idFromToken;

  // 2) no teu back, o sub do JWT é o e-mail → buscamos o usuário e pegamos o id
  const email = getEmailFromJwt(token);
  if (!email) return null;

  const id = await getUsuarioIdByEmail(email);
  return id != null ? String(id) : null;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // boot: lê token e resolve userId
  useEffect(() => {
    (async () => {
      const token = await getAccessToken();
      const resolvedId = await resolveUserIdFromToken(token);
      setUserId(resolvedId);
      setLoading(false);
    })();
  }, []);

  const login = useCallback(async (email: string, senha: string) => {
    setLoading(true);
    try {
      const { accessToken, refreshToken } = await apiLogin({ email, senha });
      await setTokens(accessToken, refreshToken ?? ''); // garante string
      const resolvedId = await resolveUserIdFromToken(accessToken);
      setUserId(resolvedId);
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    await apiRegister(payload);
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    await clearTokens();
    setUserId(null);
  }, []);

  const value: AuthContextType = useMemo(
    () => ({
      isAuthenticated: !!userId,
      userId,
      isLoading,
      login,
      register,
      logout,
    }),
    [userId, isLoading, login, register, logout]
  );

  // sem JSX pra evitar problemas de parsing fora de TSX
  return React.createElement(AuthContext.Provider, { value }, children as React.ReactNode);
};

// Hook com garantia de provider
export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within <AuthProvider>');
  }
  return ctx;
};
