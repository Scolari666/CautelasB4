import { useEffect, useState } from "react";
import { api } from "../api/client";
import { Category, Item } from "../types";
import { Modal } from "./Modal";

export function ItemPickerModal({
  items,
  onSelect,
  onClose,
}: {
  items: Item[];
  onSelect: (item: Item) => void;
  onClose: () => void;
}) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  useEffect(() => {
    api.get<Category[]>("/categories").then((res) => setCategories(res.data));
  }, []);

  const filtered = items.filter((item) => {
    if (categoryFilter && item.categoryId !== categoryFilter) return false;
    if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <Modal title="Selecionar material" onClose={onClose}>
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          <input
            autoFocus
            placeholder="Buscar por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Todas as categorias</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {filtered.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">Nenhum material encontrado.</p>
        ) : (
          <div className="grid max-h-[50vh] grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
            {filtered.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item)}
                className="flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white text-left transition hover:border-brand-400 hover:shadow-sm"
              >
                <div className="aspect-square w-full bg-slate-100">
                  {item.photo ? (
                    <img src={item.photo} alt={item.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-300">
                      <span className="text-2xl">📦</span>
                    </div>
                  )}
                </div>
                <div className="p-2">
                  <p className="text-[10px] uppercase tracking-wide text-slate-400">{item.category.name}</p>
                  <p className="text-sm font-semibold leading-tight text-slate-800">{item.name}</p>
                  <p className="mt-0.5 text-xs text-emerald-600">disp: {item.quantityAvailable}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
