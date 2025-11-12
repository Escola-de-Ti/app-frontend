// === src/services/transactions.ts ===
import { api } from '../api/client';
import type { HistoricoResponse } from '../types';

/** Converte Date -> 'YYYY-MM-DDTHH:mm:ss' no fuso local (sem 'Z'/'ms').
 * Compatível com @DateTimeFormat(iso = ISO.DATE_TIME) + LocalDateTime
 */
function toLocalIsoNoMillis(d: Date): string {
  const two = (n: number) => String(n).padStart(2, '0');
  const y = d.getFullYear();
  const m = two(d.getMonth() + 1);
  const day = two(d.getDate());
  const hh = two(d.getHours());
  const mm = two(d.getMinutes());
  const ss = two(d.getSeconds());
  return `${y}-${m}-${day}T${hh}:${mm}:${ss}`;
}

export type GetHistoryParams = {
  page?: number; // default 0
  size?: number; // default 20
  motivo?: string; // enum MotivoTransacao (string)
  dataInicio?: Date | string;
  dataFim?: Date | string;
};

export async function getTransactionHistory(
  params: GetHistoryParams = {}
): Promise<HistoricoResponse> {
  const { page = 0, size = 20, motivo, dataInicio, dataFim } = params;

  const parsedInicio =
    typeof dataInicio === 'string'
      ? dataInicio
      : dataInicio instanceof Date
        ? toLocalIsoNoMillis(dataInicio)
        : undefined;

  const parsedFim =
    typeof dataFim === 'string'
      ? dataFim
      : dataFim instanceof Date
        ? toLocalIsoNoMillis(dataFim)
        : undefined;

  const { data } = await api.get<HistoricoResponse>('/api/historico-transacoes', {
    params: {
      page,
      size,
      ...(motivo ? { motivo } : {}),
      ...(parsedInicio ? { dataInicio: parsedInicio } : {}),
      ...(parsedFim ? { dataFim: parsedFim } : {}),
    },
  });

  return data;
}
