import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { login as apiLogin, register as apiRegister, logout as apiLogout } from '../services/auth';
import { getUserIdFromJwt } from '../lib/jwt';
import { setTokens, getAccessToken, clearTokens } from '../lib/secure';

type AuthContextType = {
  isAuthenticated: boolean;
  userId: string | null;
  isLoading: boolean;
  login(email: string, senha: string): Promise<void>;
  register(payload: {
    nome: string;
    email: string;
    senha: string;
    cpf?: string;
    telefone?: string;
    sobrenome?: string;
  }): Promise<void>;
  logout(): Promise<void>;
};

// 👉 sem "any": undefined como valor inicial e checagem no hook
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const token = await getAccessToken();
      setUserId(getUserIdFromJwt(token));
      setLoading(false);
    })();
  }, []);

  const login = useCallback(async (email: string, senha: string) => {
    setLoading(true);
    try {
      const { accessToken, refreshToken } = await apiLogin({ email, senha });
      await setTokens(accessToken, refreshToken);
      setUserId(getUserIdFromJwt(accessToken));
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(
    async (payload: {
      nome: string;
      email: string;
      senha: string;
      cpf?: string;
      telefone?: string;
      sobrenome?: string;
    }) => {
      await apiRegister(payload);
    },
    []
  );

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

  // sem JSX pra não dar zebra de parsing
  return React.createElement(AuthContext.Provider, { value }, children as React.ReactNode);
};

// Hook com garantia de contexto
export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within <AuthProvider>');
  }
  return ctx;
};
