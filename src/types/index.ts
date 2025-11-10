// src/types/index.ts

export type ID = string | number;

export type OrdenacaoTipo = 'MAIS_RECENTES' | 'MAIS_ANTIGOS' | 'MAIS_POPULARES';
export type Direcao = 'ASC' | 'DESC';
export type StatusWorkshop = 'ABERTO' | 'EM_ANDAMENTO' | 'CONCLUIDO';

// ======== Auth / Tokens ========
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface JwtTokenDTO {
  access_token?: string | null;
  token_type?: string | null;
  expires_in?: number | null;
  refresh_token?: string | null;
}

// ======== Usuário ========
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
  tipoUsuario?: string;
}

// ======== Mídia / Tag ========
export interface Imagem {
  id: ID;
  url: string;
  key?: string;
}

export type Tag = {
  id: ID;
  nome: string;
};

// ======== Posts (CRUD básico) ========
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

// ======== Workshops ========
export interface DescricaoWorkshopDTO {
  tema: string;
  descricao?: string;
}

export interface WorkshopDTO {
  id: ID;
  titulo: string;
  linkMeet?: string;
  status: StatusWorkshop;
  instrutorId: ID;
  instrutorNome: string;
  dataCriacao: string;
  dataInicio: string;
  dataTermino: string;
  descricao?: DescricaoWorkshopDTO;
}

export interface Workshop extends Omit<WorkshopDTO, 'dataCriacao' | 'dataInicio' | 'dataTermino'> {
  dataCriacao: Date;
  dataInicio: Date;
  dataTermino: Date;
}

export interface WorkshopCreateDTO {
  titulo: string;
  instrutorId: ID;
  linkMeet?: string;
  dataInicio: string;
  dataTermino: string;
  descricao: DescricaoWorkshopDTO;
}

export type WorkshopUpdateDTO = Partial<{
  titulo: string;
  linkMeet?: string;
  dataInicio: string;
  dataTermino: string;
  descricao: DescricaoWorkshopDTO;
  status: StatusWorkshop;
}>;

// ======== Utils de data ========
export function toUtcNoMillis(date: Date): string {
  const two = (n: number) => String(n).padStart(2, '0');
  const y = date.getUTCFullYear();
  const m = two(date.getUTCMonth() + 1);
  const d = two(date.getUTCDate());
  const hh = two(date.getUTCHours());
  const mm = two(date.getUTCMinutes());
  const ss = two(date.getUTCSeconds());
  return `${y}-${m}-${d}T${hh}:${mm}:${ss}`;
}

export const toIsoWithMillis = (date: Date) => date.toISOString();

export const mapWorkshopDTO = (dto: WorkshopDTO): Workshop => ({
  ...dto,
  dataCriacao: new Date(dto.dataCriacao),
  dataInicio: new Date(dto.dataInicio),
  dataTermino: new Date(dto.dataTermino),
});

export const toWorkshopCreateDTO = (w: {
  titulo: string;
  instrutorId: ID;
  dataInicio: Date;
  dataTermino: Date;
  descricao?: string;
  tema?: string;
  linkMeet?: string;
}): WorkshopCreateDTO => ({
  titulo: w.titulo.trim(),
  instrutorId: w.instrutorId,
  linkMeet: w.linkMeet?.trim() || undefined,
  dataInicio: toUtcNoMillis(w.dataInicio),
  dataTermino: toUtcNoMillis(w.dataTermino),
  descricao: {
    tema: (w.tema ?? w.titulo).trim(),
    descricao: w.descricao?.trim() || undefined,
  },
});

export const formatWorkshopDateRange = (w: Workshop) => {
  const fmt = (d?: Date) =>
    d
      ? d.toLocaleDateString() +
        ' ' +
        d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '';
  return `${fmt(w.dataInicio)} — ${fmt(w.dataTermino)}`;
};

// ======== Feed de Posts ========
export type PostTagModel = Tag;

export interface PostFeedTagDTO {
  id: ID;
  nome?: string;
  name?: string;
}

export interface PostFeedDTO {
  id: ID;
  usuarioId: ID;
  nomeUsuario: string;
  titulo: string;
  descricao?: string | null;
  totalUpVotes?: number | null;
  totalComentarios?: number | string | null;
  userVoted?: boolean | null;
  usuarioJaVotou?: boolean | null;
  tags?: PostFeedTagDTO[] | null;
  dataCriacao: string;
  relevanceScore?: number | null;
  tagsEmComum?: number | null;
}

export interface PostFeedModel {
  id: ID;
  usuarioId: ID;
  nomeUsuario: string;
  titulo: string;
  descricao?: string | null;
  totalUpVotes: number;
  totalComentarios?: number;
  usuarioJaVotou?: boolean;
  tags: PostTagModel[];
  dataCriacao: string;
  relevanceScore?: number | null;
  tagsEmComum?: number | null;
}

export interface GetFeedResponseDTO {
  posts: PostFeedDTO[];
  lastPostId?: number | null;
  lastScore?: number | null;
  hasMore?: boolean;
}

// ======== Comentários ========
export interface UserRef {
  id: ID;
  nome?: string;
  name?: string;
  avatarUrl?: string | null;
  email?: string;
}

export interface CommentDTO {
  id: ID;
  postId: ID;
  autorId?: ID;
  author?: UserRef | null;
  conteudo?: string; // pode vir com esse nome em outras telas
  texto?: string; // alias comum
  createdAt?: string;
  updatedAt?: string;
  parentId?: ID | null;
  comentarioPaiId?: ID | null;
  children?: CommentDTO[];
  repliesCount?: number | null;
}

export type Comment = CommentDTO;
