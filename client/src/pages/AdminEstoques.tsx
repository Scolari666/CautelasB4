import { FormEvent, useCallback, useEffect, useState } from "react";
import { api, apiErrorMessage } from "../api/client";
import { Estoque } from "../types";

export function AdminEstoques() {
  const [estoques, setEstoques] = useState<Estoque[]>([]);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await api.get<Estoque[]>("/estoques");
    setEstoques(res.data);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/estoques", { name });
      setName("");
      load();
    } catch (err) {
      setError(apiErrorMessage(err, "Não foi possível criar o estoque"));
    }
  }

  async function handleRename(id: string) {
    try {
      await api.put(`/estoques/${id}`, { name: editingName });
      setEditingId(null);
      load();
    } catch (err) {
      setError(apiErrorMessage(err, "Não foi possível renomear"));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover este estoque?")) return;
    try {
      await api.delete(`/estoques/${id}`);
      load();
    } catch (err) {
      setError(apiErrorMessage(err, "Não foi possível remover"));
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="mb-4 text-xl font-bold text-slate-800">Estoques</h1>
      <p className="mb-4 text-sm text-slate-500">
        Cada estoque tem seu próprio controle de itens e quantidades — útil para separar unidades/depósitos
        diferentes (ex: SMA POA, SMA Cachoeirinha).
      </p>

      <form onSubmit={handleCreate} className="mb-6 flex gap-2">
        <input
          required
          placeholder="Novo estoque"
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
        {estoques.map((e) => (
          <li key={e.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 text-sm">
            {editingId === e.id ? (
              <input
                value={editingName}
                onChange={(ev) => setEditingName(ev.target.value)}
                className="mr-2 flex-1 rounded-md border border-slate-300 px-2 py-1 text-sm"
              />
            ) : (
              <span className="font-medium text-slate-800">
                {e.name} <span className="text-slate-400">({e._count?.items ?? 0} itens)</span>
              </span>
            )}
            <div className="flex gap-2">
              {editingId === e.id ? (
                <button onClick={() => handleRename(e.id)} className="text-xs font-semibold text-brand-600">
                  Salvar
                </button>
              ) : (
                <button
                  onClick={() => {
                    setEditingId(e.id);
                    setEditingName(e.name);
                  }}
                  className="text-xs font-semibold text-slate-500"
                >
                  Renomear
                </button>
              )}
              <button onClick={() => handleDelete(e.id)} className="text-xs font-semibold text-red-600">
                Remover
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
