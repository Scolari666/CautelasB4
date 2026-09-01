import { FormEvent, useEffect, useState } from "react";
import { api, apiErrorMessage } from "../api/client";
import { UserDirectoryEntry } from "../types";
import { Modal } from "./Modal";

export function NovaMissaoModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedToId, setAssignedToId] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [users, setUsers] = useState<UserDirectoryEntry[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<UserDirectoryEntry[]>("/users/directory").then((res) => setUsers(res.data));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.post("/missoes", {
        title,
        description,
        assignedToId: assignedToId || undefined,
        startAt: startAt || undefined,
        endAt: endAt || undefined,
      });
      onDone();
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err, "Não foi possível criar a missão"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Nova missão" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          required
          placeholder="Título da missão"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <textarea
          placeholder="Descrição (opcional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <label className="text-sm text-slate-600">
          Atribuir a (opcional)
          <select
            value={assignedToId}
            onChange={(e) => setAssignedToId(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Sem atribuição específica</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} {u.pelotao ? `(${u.pelotao})` : ""}
              </option>
            ))}
          </select>
        </label>
        <div className="flex gap-3">
          <label className="flex-1 text-sm text-slate-600">
            Início (opcional)
            <input
              type="date"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="flex-1 text-sm text-slate-600">
            Fim (opcional)
            <input
              type="date"
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-brand-700 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
        >
          {saving ? "Criando..." : "Criar missão"}
        </button>
      </form>
    </Modal>
  );
}
