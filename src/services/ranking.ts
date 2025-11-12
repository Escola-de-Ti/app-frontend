// === src/services/ranking.ts ===
import { api } from '../api/client';

export type RankingUser = {
  id: number;
  nome: string;
  posicao: number;
  cor?: string;
  xp: number;
  nivel: number;
  tokens: number;
};

export type MyRankingStats = {
  posicaoAtual?: number;
  xpMes?: number;
};

// Tenta algumas rotas comuns e retorna a primeira que funcionar
async function tryGet<T>(paths: string[]): Promise<T> {
  let lastErr: any;
  for (const p of paths) {
    try {
      const { data } = await api.get<T>(p);
      return data;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}

export async function getRanking(): Promise<RankingUser[]> {
  // ajuste conforme seu back (ordem de tentativas):
  const data = await tryGet<RankingUser[]>([
    '/api/ranking',
    '/api/users/ranking',
    '/api/usuarios/ranking',
  ]);
  // garante ordenação por posição
  return [...data].sort((a, b) => a.posicao - b.posicao);
}

export async function getMyRankingStats(): Promise<MyRankingStats> {
  const data = await tryGet<MyRankingStats>([
    '/api/ranking/me',
    '/api/users/me/ranking',
    '/api/usuarios/me/ranking',
  ]);
  return data ?? {};
}
