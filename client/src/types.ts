export type Role = "ADMIN" | "USER";
export type CautelaStatus = "ATIVA" | "DEVOLVIDA";

export interface User {
  id: string;
  name: string;
  email: string;
  matricula?: string | null;
  role: Role;
  createdAt?: string;
}

export interface Category {
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
  quantityTotal: number;
  quantityAvailable: number;
  quantityCheckedOut: number;
  quantityUnavailable: number;
  cautelas?: Cautela[];
}

export interface Cautela {
  id: string;
  itemId: string;
  item: Item;
  userId: string;
  user: { id: string; name: string; matricula?: string | null };
  quantity: number;
  status: CautelaStatus;
  purpose?: string | null;
  takenAt: string;
  expectedReturnAt?: string | null;
  returnedAt?: string | null;
  returnNotes?: string | null;
}
