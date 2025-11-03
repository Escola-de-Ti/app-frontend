export type ID = string;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface Usuario {
  id: ID;
  nome: string;
  sobrenome?: string;
  email: string;
  telefone?: string;
  ativo?: boolean;
}

export interface LoginRequest {
  email: string;
  senha: string;
}

export interface RegisterRequest {
  nome: string;
  sobrenome?: string;
  email: string;
  cpf?: string;
  telefone?: string;
  senha: string;
}

export interface Imagem {
  id: ID;
  url: string;
  key?: string;
}

export interface Tag {
  id: ID;
  nome: string;
  popularidade?: number;
}

export interface PostItem {
  id: ID;
  titulo: string;
  conteudo: string;
  autorId: ID;
  createdAt?: string;
  updatedAt?: string;
  tags?: Tag[];
  imagens?: Imagem[];
}

export interface CreatePostDTO {
  titulo: string;
  conteudo: string;
  tagIds?: ID[];
  imagemIds?: ID[];
}

export interface Paged<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export type OrdenacaoTipo = 'MAIS_RECENTES' | 'MAIS_ANTIGOS' | 'MAIS_POPULARES';
export type Direcao = 'ASC' | 'DESC';
