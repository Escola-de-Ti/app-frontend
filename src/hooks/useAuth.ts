// import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
// import { jwtDecode } from 'jwt-decode';
// import { login as apiLogin, register as apiRegister, logout as apiLogout } from '../services/auth';
// import { setTokens, getAccessToken, clearTokens } from '../api/client';

// type Decoded = { sub?: string; id?: string; exp?: number; [k: string]: any };

// type AuthContextType = {
//   isAuthenticated: boolean;
//   userId: string | null;
//   isLoading: boolean;
//   login(email: string, senha: string): Promise<void>;
//   register(payload: { nome: string; email: string; senha: string; cpf?: string; telefone?: string; sobrenome?: string }): Promise<void>;
//   logout(): Promise<void>;
// };

// const AuthContext = createContext<AuthContextType>({} as any);

// export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//   const [isLoading, setLoading] = useState(true);
//   const [userId, setUserId] = useState<string | null>(null);

//   const parseUserId = (token?: string | null) => {
//     if (!token) return null;
//     try {
//       const d: Decoded = jwtDecode(token);
//       return (d.id || d.sub) as string | null;
//     } catch {
//       return null;
//     }
//   };

//   useEffect(() => {
//     (async () => {
//       const token = await getAccessToken();
//       setUserId(parseUserId(token));
//       setLoading(false);
//     })();
//   }, []);

//   const login = useCallback(async (email: string, senha: string) => {
//     setLoading(true);
//     try {
//       const { accessToken, refreshToken } = await apiLogin({ email, senha });
//       await setTokens(accessToken, refreshToken);
//       setUserId(parseUserId(accessToken));
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   const register = useCallback(async (payload: { nome: string; email: string; senha: string; cpf?: string; telefone?: string; sobrenome?: string }) => {
//     await apiRegister(payload);
//   }, []);

//   const logout = useCallback(async () => {
//     await apiLogout();
//     await clearTokens();
//     setUserId(null);
//   }, []);

//   const value = useMemo(() => ({
//     isAuthenticated: !!userId,
//     userId,
//     isLoading,
//     login,
//     register,
//     logout,
//   }), [userId, isLoading, login, register, logout]);

//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
// };

// export const useAuth = () => useContext(AuthContext);
