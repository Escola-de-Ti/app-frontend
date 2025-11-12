// === src/services/ranking.ts ===
import { api } from '../api/client';
import {
  type RankingApiResponse,
  mapRankingApiToModel,
  type MyRankingStats,
  type RankingUser,
} from '../types';

/** Busca o response bruto exatamente como a API retorna */
export async function getRanking(): Promise<RankingApiResponse> {
  const { data } = await api.get<RankingApiResponse>('/api/usuarios/ranking');
  return data;
}

/** Conveniência: já mapeia para o modelo amigável de UI */
export async function getRankingModel(): Promise<{ users: RankingUser[]; me: MyRankingStats }> {
  const raw = await getRanking();
  return mapRankingApiToModel(raw);
}
