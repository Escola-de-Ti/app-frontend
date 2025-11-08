export type ID = string;
export type OrdenacaoTipo = 'MAIS_RECENTES' | 'MAIS_ANTIGOS' | 'MAIS_POPULARES';
export type Direcao = 'ASC' | 'DESC';
export type StatusWorkshop = 'ABERTO' | 'EM_ANDAMENTO' | 'CONCLUIDO';

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

export type Tag = {
  id: number | string;
  nome: string;
};

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

export interface DescricaoWorkshopDTO {
  tema: string;
  descricao?: string;
}

export interface WorkshopDTO {
  id: number;
  titulo: string;
  linkMeet?: string;
  status: StatusWorkshop;
  instrutorId: number;
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
  instrutorId: number;
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
  instrutorId: number;
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
