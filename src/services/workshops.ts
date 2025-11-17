// === src/services/workshops.ts ===
import { api } from '../api/client';
import type { Workshop, WorkshopDTO, WorkshopCreateDTO, WorkshopUpdateDTO, Imagem } from '../types';
import { mapWorkshopDTO } from '../types';

const IMAGEM_ENDPOINT = '/api/imagem';
const INSCRICOES_ENDPOINT = '/api/inscricoes';

async function uriToBytes(uri: string): Promise<ArrayBuffer> {
  const res = await fetch(uri);
  if (!res.ok) {
    throw new Error(`Falha ao ler imagem local (status ${res.status})`);
  }
  return res.arrayBuffer();
}

function extractErrorMessage(err: any): string {
  const data = err?.response?.data;

  if (typeof data === 'string' && data.trim()) return data.trim();

  if (data?.title || data?.detail) {
    const title = data.title ? String(data.title) : '';
    const detail = data.detail ? String(data.detail) : '';
    return [title, detail].filter(Boolean).join(' - ') || 'Erro ao processar requisição.';
  }

  if (Array.isArray(data?.errors) && data.errors.length) {
    const msgs = data.errors.map((e: any) => e?.message ?? e?.defaultMessage).filter(Boolean);
    if (msgs.length) return msgs.join('\n');
  }

  if (data?.message) return String(data.message);

  return err?.message || 'Falha na requisição.';
}

// ===== Erros específicos de inscrição em workshop =====
export class OwnWorkshopEnrollError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OwnWorkshopEnrollError';
  }
}

export class NotEnoughTokensEnrollError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotEnoughTokensEnrollError';
  }
}

// ========== TIPOS DE INSCRIÇÃO ==========

export type EnrollmentStatus = 'INSCRITO' | 'CANCELADO';

export interface EnrollmentDTO {
  id: number;
  usuarioId: number;
  usuarioNome: string;
  workshopId: number;
  workshopTitulo: string;
  status: EnrollmentStatus;
  dataInscricao: string;
}

// ========== WORKSHOPS CRUD BÁSICO ==========

export async function listAll(params?: {
  status?: 'ABERTO' | 'EM_ANDAMENTO' | 'CONCLUIDO';
  instrutorId?: number;
}): Promise<Workshop[]> {
  const { data } = await api.get<WorkshopDTO[]>('/api/workshops', { params });
  return data.map(mapWorkshopDTO);
}

export async function listOpen(): Promise<Workshop[]> {
  // agora usa /api/workshops?status=ABERTO
  return listAll({ status: 'ABERTO' });
}

export async function searchByTitle(termo: string): Promise<Workshop[]> {
  const { data } = await api.get<WorkshopDTO[]>('/api/workshops/buscar', {
    params: { termo },
  });
  return data.map(mapWorkshopDTO);
}

export async function getWorkshopById(id: number): Promise<Workshop> {
  const { data } = await api.get<WorkshopDTO>(`/api/workshops/${id}`);
  return mapWorkshopDTO(data);
}

export async function createWorkshop(payload: WorkshopCreateDTO): Promise<Workshop> {
  const { data } = await api.post<WorkshopDTO>('/api/workshops', payload);
  return mapWorkshopDTO(data);
}

export async function updateWorkshop(id: number, payload: WorkshopUpdateDTO): Promise<Workshop> {
  const { data } = await api.patch<WorkshopDTO>(`/api/workshops/${id}`, payload);
  return mapWorkshopDTO(data);
}

export async function deleteWorkshop(id: number): Promise<void> {
  await api.delete(`/api/workshops/${id}`);
}

// ========== INSCRIÇÕES EM WORKSHOP ==========

/**
 * Inscreve o usuário logado em um workshop.
 * POST /api/inscricoes/workshops/{id}
 */
export async function enrollInWorkshop(workshopId: number): Promise<void> {
  try {
    await api.post(`${INSCRICOES_ENDPOINT}/workshops/${workshopId}`, {});
    return;
  } catch (err: any) {
    const msg = extractErrorMessage(err) || 'Falha ao se inscrever no workshop.';
    const lower = msg.toLowerCase();

    // 🚫 tentar se inscrever no próprio workshop
    if (
      lower.includes('próprio workshop') ||
      lower.includes('seu próprio workshop') ||
      lower.includes('own workshop')
    ) {
      throw new OwnWorkshopEnrollError(
        msg || 'Você não pode se inscrever no seu próprio workshop.'
      );
    }

    // 💸 tokens insuficientes
    if (
      lower.includes('token') &&
      (lower.includes('insuficiente') ||
        lower.includes('insuficientes') ||
        lower.includes('saldo') ||
        lower.includes('não possui') ||
        lower.includes('not enough') ||
        lower.includes('insufficient'))
    ) {
      throw new NotEnoughTokensEnrollError(
        msg || 'Você não possui tokens suficientes para se inscrever neste workshop.'
      );
    }

    // ✅ já está inscrito
    if (
      lower.includes('já está inscrito') ||
      lower.includes('ja esta inscrito') ||
      lower.includes('já inscrito') ||
      lower.includes('ja inscrito') ||
      lower.includes('already enrolled')
    ) {
      throw new Error('Você já está inscrito neste workshop.');
    }

    // fallback genérico
    throw new Error(msg);
  }
}

/**
 * Lista TODAS as inscrições do usuário logado.
 * GET /api/inscricoes/minhas
 */
export async function listMyEnrollments(): Promise<EnrollmentDTO[]> {
  const { data } = await api.get<EnrollmentDTO[]>(`${INSCRICOES_ENDPOINT}/minhas`);
  return data;
}

/**
 * Retorna SOMENTE os workshops em que o usuário está inscrito (status = INSCRITO),
 * já mapeados para o tipo Workshop, igual a lógica do frontend web.
 */
export async function listMyEnrolledWorkshops(): Promise<Workshop[]> {
  const inscricoes = await listMyEnrollments();
  const ativas = inscricoes.filter((i) => i.status === 'INSCRITO');

  if (!ativas.length) return [];

  const detalhes = await Promise.all(
    ativas.map(async (i) => {
      try {
        return await getWorkshopById(i.workshopId);
      } catch (e) {
        console.log('[listMyEnrolledWorkshops] erro ao buscar workshop', {
          workshopId: i.workshopId,
          errMessage: (e as any)?.message,
        });
        return null;
      }
    })
  );

  return detalhes.filter((w): w is Workshop => w != null);
}

/**
 * Cancela inscrição do usuário em um workshop.
 * DELETE /api/inscricoes/workshops/{id}
 */
export async function cancelWorkshopEnrollment(workshopId: number): Promise<void> {
  try {
    await api.delete(`${INSCRICOES_ENDPOINT}/workshops/${workshopId}`);
  } catch (err: any) {
    throw new Error(extractErrorMessage(err));
  }
}

// ========== IMAGENS DE WORKSHOP ==========

/**
 * Faz upload de uma ou mais imagens para um workshop.
 */
export async function uploadWorkshopImages(
  workshopId: number,
  imageUris: string[]
): Promise<Imagem[]> {
  const validUris = Array.from(
    new Set((imageUris || []).filter((u) => typeof u === 'string' && u.trim().length > 0))
  );

  if (!validUris.length) return [];

  const uploaded: Imagem[] = [];

  for (const uri of validUris) {
    try {
      const bytes = await uriToBytes(uri);

      const { data } = await api.post<Imagem>(`${IMAGEM_ENDPOINT}/upload`, bytes, {
        headers: {
          'Content-Type': 'application/octet-stream',
        },
        params: {
          type: 'WORKSHOP',
          id_type: String(workshopId),
        },
      });

      uploaded.push(data);
    } catch (err: any) {
      console.log('[uploadWorkshopImages][ERR]', { uri, errMessage: err?.message });
      throw new Error(extractErrorMessage(err));
    }
  }

  return uploaded;
}

/**
 * Atualiza uma imagem existente de workshop.
 */
export async function updateWorkshopImage(imagemId: number, uri: string): Promise<Imagem> {
  try {
    const bytes = await uriToBytes(uri);

    const { data } = await api.put<Imagem>(`${IMAGEM_ENDPOINT}/update/${imagemId}`, bytes, {
      headers: {
        'Content-Type': 'application/octet-stream',
      },
    });

    return data;
  } catch (err: any) {
    console.log('[updateWorkshopImage][ERR]', { imagemId, errMessage: err?.message });
    throw new Error(extractErrorMessage(err));
  }
}

/* DELETE /api/imagem/delete/{id} */
export async function deleteWorkshopImage(imagemId: number): Promise<void> {
  try {
    await api.delete(`${IMAGEM_ENDPOINT}/delete/${imagemId}`);
  } catch (err: any) {
    console.log('[deleteWorkshopImage][ERR]', { imagemId, errMessage: err?.message });
    throw new Error(extractErrorMessage(err));
  }
}
