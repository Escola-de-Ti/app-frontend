export type ID = string;
export type OrdenacaoTipo = 'MAIS_RECENTES' | 'MAIS_ANTIGOS' | 'MAIS_POPULARES';
export type Direcao = 'ASC' | 'DESC';
export type NivelWorkshop = 'BASICO' | 'INTERMEDIARIO' | 'AVANCADO';

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
  tipoUsuario?: string;
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

export interface WorkshopDTO {
  id: number;
  titulo: string;
  descricao: string;
  dataInicio: string;
  dataFim?: string;
  local?: string;
  nivel: NivelWorkshop;
  tokens: number;
  vagasTotais?: number;
  vagasDisponiveis?: number;
  criadoPorUsuarioId: number;
  inscrito?: boolean;
}

export interface Workshop extends Omit<WorkshopDTO, 'dataInicio' | 'dataFim'> {
  dataInicio: Date;
  dataFim?: Date;
}

export const mapWorkshopDTO = (dto: WorkshopDTO): Workshop => ({
  ...dto,
  dataInicio: new Date(dto.dataInicio),
  dataFim: dto.dataFim ? new Date(dto.dataFim) : undefined,
});

export const formatWorkshopDateRange = (w: Workshop) => {
  const fmt = (d?: Date) =>
    d
      ? d.toLocaleDateString() +
        ' ' +
        d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '';
  return w.dataFim ? `${fmt(w.dataInicio)} — ${fmt(w.dataFim)}` : fmt(w.dataInicio);
};
