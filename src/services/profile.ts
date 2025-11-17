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
 * Funciona em web e React Native:
 * - tenta usar blob.arrayBuffer()
 * - se não existir, faz fallback usando FileReader via globalThis (any)
 */
async function uriToBytes(uri: string): Promise<ArrayBuffer> {
  const res = await fetch(uri);
  if (!res.ok) {
    throw new Error('Não foi possível ler o arquivo de imagem.');
  }

  const blob: any = await res.blob();

  // Navegador moderno / alguns ambientes: blob.arrayBuffer já existe
  if (typeof blob.arrayBuffer === 'function') {
    return await blob.arrayBuffer();
  }

  // Fallback pra React Native / ambientes sem blob.arrayBuffer
  return await new Promise<ArrayBuffer>((resolve, reject) => {
    try {
      const FileReaderCtor = (globalThis as any).FileReader;
      if (typeof FileReaderCtor !== 'function') {
        reject(new Error('Leitura de arquivo não suportada neste ambiente.'));
        return;
      }

      const reader = new FileReaderCtor();
      reader.onloadend = () => {
        const result = reader.result;
        if (result instanceof ArrayBuffer) {
          resolve(result);
        } else if (result && (result as any).buffer instanceof ArrayBuffer) {
          resolve((result as any).buffer);
        } else {
          reject(new Error('Falha ao ler o arquivo de imagem.'));
        }
      };
      reader.onerror = () => {
        reject(new Error('Falha ao ler o arquivo de imagem.'));
      };
      reader.readAsArrayBuffer(blob);
    } catch (e) {
      reject(new Error('Leitura de arquivo não suportada neste ambiente.'));
    }
  });
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
 * Backend espera bytes (application/octet-stream) + params `type` e `id_type`.
 */
export async function uploadUserAvatar(userId: number, uri: string): Promise<Imagem> {
  try {
    const bytes = await uriToBytes(uri);

    const { data } = await api.post<Imagem>(`${IMAGEM_ENDPOINT}/upload`, bytes, {
      headers: {
        'Content-Type': 'application/octet-stream',
      },
      params: {
        type: 'USUARIO', // ajuste se o back usar outro valor
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
 * Usa o mesmo padrão octet-stream do back: PUT /api/imagem/update/{id}
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
 * Remove uma imagem de perfil pelo ID.
 */
export async function deleteUserAvatar(imagemId: number): Promise<void> {
  try {
    await api.delete(`${IMAGEM_ENDPOINT}/delete/${imagemId}`);
  } catch (err: any) {
    console.log('[deleteUserAvatar][ERR]', { imagemId, errMessage: err?.message });
    throw new Error(extractErrorMessage(err));
  }
}
