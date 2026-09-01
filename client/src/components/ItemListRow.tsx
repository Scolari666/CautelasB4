import { Link } from "react-router-dom";
import { Item } from "../types";
import { StatusBadge } from "./StatusBadge";

export function ItemListRow({ item }: { item: Item }) {
  return (
    <Link
      to={`/itens/${item.id}`}
      className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-3 py-2.5 transition last:border-b-0 hover:bg-slate-50"
    >
      <span className="font-medium text-slate-800">{item.name}</span>
      <div className="flex flex-wrap gap-1.5">
        <StatusBadge label="Disponível" value={item.quantityAvailable} tone="green" />
        <StatusBadge label="Cautelado" value={item.quantityCheckedOut} tone="amber" />
        <StatusBadge label="F.A" value={item.quantityUnavailable} tone="red" />
      </div>
    </Link>
  );
}
