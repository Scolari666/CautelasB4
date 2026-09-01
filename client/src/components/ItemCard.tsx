import { Link } from "react-router-dom";
import { Item } from "../types";
import { StatusBadge } from "./StatusBadge";

export function ItemCard({ item }: { item: Item }) {
  return (
    <Link
      to={`/itens/${item.id}`}
      className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
    >
      <div className="relative w-full bg-slate-100" style={{ paddingTop: "100%" }}>
        <div className="absolute inset-0">
          {item.photo ? (
            <img src={item.photo} alt={item.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-300">
              <span className="text-4xl">📦</span>
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">{item.category.name}</p>
          <h3 className="font-semibold text-slate-800">{item.name}</h3>
        </div>
        <div className="mt-auto flex flex-wrap gap-1.5">
          <StatusBadge label="Disponível" value={item.quantityAvailable} tone="green" />
          <StatusBadge label="Cautelado" value={item.quantityCheckedOut} tone="amber" />
          <StatusBadge label="F.A" value={item.quantityUnavailable} tone="red" />
        </div>
      </div>
    </Link>
  );
}
