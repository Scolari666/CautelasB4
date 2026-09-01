import { FormEvent, useCallback, useEffect, useState } from "react";
import { api, apiErrorMessage } from "../api/client";
import { Category } from "../types";

export function AdminCategorias() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await api.get<Category[]>("/categories");
    setCategories(res.data);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/categories", { name });
      setName("");
      load();
    } catch (err) {
      setError(apiErrorMessage(err, "Não foi possível criar a categoria"));
    }
  }

  async function handleRename(id: string) {
    try {
      await api.put(`/categories/${id}`, { name: editingName });
      setEditingId(null);
      load();
    } catch (err) {
      setError(apiErrorMessage(err, "Não foi possível renomear"));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover esta categoria?")) return;
    try {
      await api.delete(`/categories/${id}`);
      load();
    } catch (err) {
      setError(apiErrorMessage(err, "Não foi possível remover"));
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="mb-4 text-xl font-bold text-slate-800">Categorias</h1>

      <form onSubmit={handleCreate} className="mb-6 flex gap-2">
        <input
          required
          placeholder="Nova categoria"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <button className="rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700">
          Adicionar
        </button>
      </form>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      <ul className="flex flex-col gap-2">
        {categories.map((c) => (
          <li key={c.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 text-sm">
            {editingId === c.id ? (
              <input
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                className="mr-2 flex-1 rounded-md border border-slate-300 px-2 py-1 text-sm"
              />
            ) : (
              <span className="font-medium text-slate-800">
                {c.name} <span className="text-slate-400">({c._count?.items ?? 0} itens)</span>
              </span>
            )}
            <div className="flex gap-2">
              {editingId === c.id ? (
                <button onClick={() => handleRename(c.id)} className="text-xs font-semibold text-brand-600">
                  Salvar
                </button>
              ) : (
                <button
                  onClick={() => {
                    setEditingId(c.id);
                    setEditingName(c.name);
                  }}
                  className="text-xs font-semibold text-slate-500"
                >
                  Renomear
                </button>
              )}
              <button onClick={() => handleDelete(c.id)} className="text-xs font-semibold text-red-600">
                Remover
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
