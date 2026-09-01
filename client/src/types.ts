export type Role = "ADMIN" | "USER";
export type CautelaStatus = "ATIVA" | "DEVOLVIDA";

export interface User {
  id: string;
  name: string;
  username: string;
  email?: string | null;
  matricula?: string | null;
  graduacao?: string | null;
  telefone?: string | null;
  pelotao?: string | null;
  avatarUrl?: string | null;
  role: Role;
  createdAt?: string;
}

export interface UserDirectoryEntry {
  id: string;
  name: string;
  graduacao?: string | null;
  telefone?: string | null;
  matricula?: string | null;
  pelotao?: string | null;
  avatarUrl?: string | null;
}

export interface Category {
  id: string;
  name: string;
  _count?: { items: number };
}

export interface Estoque {
  id: string;
  name: string;
  _count?: { items: number };
}

export interface Item {
  id: string;
  name: string;
  description?: string | null;
  photo?: string | null;
  categoryId: string;
  category: Category;
  estoqueId: string;
  estoque: Estoque;
  quantityTotal: number;
  quantityAvailable: number;
  quantityCheckedOut: number;
  quantityUnavailable: number;
  cautelaItems?: CautelaItem[];
}

export interface CautelaItem {
  id: string;
  cautelaId: string;
  itemId: string;
  item: Item;
  quantity: number;
  status: CautelaStatus;
  returnedAt?: string | null;
  returnNotes?: string | null;
  cautela?: Cautela;
}

export interface Cautela {
  id: string;
  userId: string;
  user: { id: string; name: string; matricula?: string | null };
  purpose?: string | null;
  takenAt: string;
  expectedReturnAt?: string | null;
  retiradoPorNome?: string | null;
  retiradoPorTelefone?: string | null;
  items: CautelaItem[];
}

export type MissaoStatus = "PLANEJADA" | "EM_ANDAMENTO" | "CONCLUIDA" | "CANCELADA";

export interface Missao {
  id: string;
  title: string;
  description?: string | null;
  status: MissaoStatus;
  startAt?: string | null;
  endAt?: string | null;
  assignedToId?: string | null;
  assignedTo?: { id: string; name: string; matricula?: string | null; pelotao?: string | null } | null;
  createdById: string;
  createdBy: { id: string; name: string };
  createdAt: string;
}

export type PedidoStatus = "PENDENTE" | "APROVADO" | "RECUSADO" | "ATENDIDO";

export interface PedidoItem {
  id: string;
  pedidoId: string;
  itemId: string;
  item: Item;
  quantity: number;
}

export interface Pedido {
  id: string;
  pelotao: string;
  instrucao: string;
  neededAt: string;
  status: PedidoStatus;
  notes?: string | null;
  requestedById: string;
  requestedBy: { id: string; name: string; matricula?: string | null; pelotao?: string | null };
  createdAt: string;
  items: PedidoItem[];
}
