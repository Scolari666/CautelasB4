export type Role = "ADMIN" | "USER";
export type CautelaStatus = "ATIVA" | "DEVOLVIDA";

export interface User {
  id: string;
  name: string;
  username: string;
  email?: string | null;
  matricula?: string | null;
  graduacao?: string | null;
  role: Role;
  createdAt?: string;
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
