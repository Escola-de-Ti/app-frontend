// === src/services/profile.ts ===
import { api } from '../api/client';
import type { MyProfile, UpdateUserRequest, ID, Imagem } from '../types';

const IMAGEM_ENDPOINT = '/api/imagem';

/**
 * Extrai mensagem amigável de erro das respostas da API.
 */
function extractErrorMessage(err: any): string {
  if (err?.response?.data?.message) return err.response.data.message;
  if (typeof err?.message === 'string') return err.message;
  return 'Falha ao processar a requisição.';
}

/**
 * Converte uma URI local/remota em bytes (ArrayBuffer) para envio em octet-stream.
 * Funciona com `file://`, `content://` e URLs http(s).
 */
async function uriToBytes(uri: string): Promise<ArrayBuffer> {
  const res = await fetch(uri);
  if (!res.ok) {
    throw new Error('Não foi possível ler o arquivo de imagem.');
  }
  const blob = await res.blob();
  return await blob.arrayBuffer();
}

// ================== PERFIL ==================

// Meu perfil (para tela de edição e dados base)
export async function getMyProfile(): Promise<MyProfile> {
  const { data } = await api.get<MyProfile>('/api/usuarios/user');
  return data;
}

// Perfil "cadastral" de qualquer usuário por ID
export async function getUserById(id: ID): Promise<MyProfile> {
  const numId = Number(id);
  if (Number.isNaN(numId)) throw new Error(`ID inválido: ${id}`);
  const { data } = await api.get<MyProfile>(`/api/usuarios/${numId}`);
  return data;
}

// Perfil com estatísticas / detalhes (nivel, xp, tokens, qtdPosts, imagemUrl, etc.)
export async function getUserDetails(id: ID): Promise<any> {
  const numId = Number(id);
  if (Number.isNaN(numId)) throw new Error(`ID inválido: ${id}`);
  const { data } = await api.get(`/api/usuarios/detalhes/${numId}`);
  return data;
}

// Atualizar MEU perfil (dados textuais + tags + telefone etc.)
export async function updateMyProfile(payload: UpdateUserRequest): Promise<MyProfile> {
  const { data } = await api.put<MyProfile>('/api/usuarios/user', payload);
  return data;
}

// ================== IMAGENS DE PERFIL ==================

/**
 * Faz upload de uma nova imagem de perfil para um usuário.
 * Backend costuma associar pelo `type` + `id_type`.
 *
 * Exemplo de params esperados no back:
 *   type = 'USUARIO' (ou 'USER' / 'PERFIL' — ajuste se for outro nome)
 *   id_type = ID do usuário
 */
export async function uploadUserAvatar(userId: number, uri: string): Promise<Imagem> {
  try {
    const bytes = await uriToBytes(uri);

    const { data } = await api.post<Imagem>(`${IMAGEM_ENDPOINT}/upload`, bytes, {
      headers: {
        'Content-Type': 'application/octet-stream',
      },
      params: {
        type: 'USUARIO', // 🔴 ajuste aqui se o back usar outro valor
        id_type: String(userId),
      },
    });

    return data;
  } catch (err: any) {
    console.log('[uploadUserAvatar][ERR]', { uri, errMessage: err?.message });
    throw new Error(extractErrorMessage(err));
  }
}

/**
 * Atualiza uma imagem de perfil existente (sobrescreve o arquivo).
 * Usa o mesmo endpoint de update usado pra posts: /api/imagem/update/{id}
 */
export async function updateUserAvatar(imagemId: number, uri: string): Promise<Imagem> {
  try {
    const bytes = await uriToBytes(uri);

    const { data } = await api.put<Imagem>(`${IMAGEM_ENDPOINT}/update/${imagemId}`, bytes, {
      headers: {
        'Content-Type': 'application/octet-stream',
      },
    });

    return data;
  } catch (err: any) {
    console.log('[updateUserAvatar][ERR]', { imagemId, errMessage: err?.message });
    throw new Error(extractErrorMessage(err));
  }
}

/**
 * Remove uma imagem de perfil pelo ID (seu back provavelmente já faz:
 * - deletar o registro da imagem
 * - e remover referência do usuário, se houver regra pra isso)
 */
export async function deleteUserAvatar(imagemId: number): Promise<void> {
  try {
    await api.delete(`${IMAGEM_ENDPOINT}/delete/${imagemId}`);
  } catch (err: any) {
    console.log('[deleteUserAvatar][ERR]', { imagemId, errMessage: err?.message });
    throw new Error(extractErrorMessage(err));
  }
}
