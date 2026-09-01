import { useCallback, useEffect, useState } from "react";
import { api, apiErrorMessage } from "../api/client";
import { Category, Item } from "../types";
import { ItemCard } from "../components/ItemCard";
import { Modal } from "../components/Modal";
import { PhotoInput } from "../components/PhotoInput";
import { useAuth } from "../context/AuthContext";
import { useStockSocket } from "../hooks/useStockSocket";

export function Estoque() {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);

  const load = useCallback(async () => {
    const [itemsRes, categoriesRes] = await Promise.all([api.get<Item[]>("/items"), api.get<Category[]>("/categories")]);
    setItems(itemsRes.data);
    setCategories(categoriesRes.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useStockSocket(load);

  const filtered = items.filter((item) => {
    if (categoryFilter && item.categoryId !== categoryFilter) return false;
    if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const grouped = filtered.reduce<Record<string, Item[]>>((acc, item) => {
    const key = item.category.name;
    acc[key] = acc[key] ?? [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-800">Estoque</h1>
        {user?.role === "ADMIN" && (
          <button
            onClick={() => setShowNew(true)}
            className="rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            + Novo item
          </button>
        )}
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <input
          placeholder="Buscar item..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-56 rounded-md border border-slate-300 px-3 py-2 text-sm"
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

      {loading ? (
        <p className="text-slate-500">Carregando estoque...</p>
      ) : filtered.length === 0 ? (
        <p className="text-slate-500">Nenhum item encontrado.</p>
      ) : (
        Object.entries(grouped).map(([categoryName, categoryItems]) => (
          <section key={categoryName} className="mb-8">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">{categoryName}</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {categoryItems.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        ))
      )}

      {showNew && (
        <NewItemModal categories={categories} onClose={() => setShowNew(false)} onCreated={load} />
      )}
    </div>
  );
}

function NewItemModal({
  categories,
  onClose,
  onCreated,
}: {
  categories: Category[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [quantityTotal, setQuantityTotal] = useState(1);
  const [photo, setPhoto] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!categoryId) {
      setError("Crie uma categoria antes de cadastrar itens");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await api.post("/items", { name, description, categoryId, quantityTotal, photo });
      onCreated();
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err, "Não foi possível criar o item"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Novo item" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <PhotoInput value={photo} onChange={setPhoto} />
        <input
          required
          placeholder="Nome do item"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <textarea
          placeholder="Descrição (opcional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <label className="text-sm text-slate-600">
          Quantidade em estoque
          <input
            type="number"
            min={0}
            required
            value={quantityTotal}
            onChange={(e) => setQuantityTotal(Number(e.target.value))}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {saving ? "Salvando..." : "Criar item"}
        </button>
      </form>
    </Modal>
  );
}
