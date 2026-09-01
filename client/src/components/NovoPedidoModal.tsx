import { FormEvent, useEffect, useState } from "react";
import { api, apiErrorMessage } from "../api/client";
import { Item } from "../types";
import { useAuth } from "../context/AuthContext";
import { Modal } from "./Modal";

interface Row {
  itemId: string;
  quantity: number;
}

const MAX_ROWS = 20;

export function NovoPedidoModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [rows, setRows] = useState<Row[]>([{ itemId: "", quantity: 1 }]);
  const [pelotao, setPelotao] = useState(user?.pelotao ?? "");
  const [instrucao, setInstrucao] = useState("");
  const [neededAt, setNeededAt] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<Item[]>("/items").then((res) => setItems(res.data));
  }, []);

  function updateRow(index: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function addRow() {
    if (rows.length >= MAX_ROWS) return;
    setRows((prev) => [...prev, { itemId: "", quantity: 1 }]);
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  function availableOptionsFor(index: number) {
    const chosenElsewhere = new Set(rows.filter((_, i) => i !== index).map((r) => r.itemId));
    return items.filter((i) => !chosenElsewhere.has(i.id) || i.id === rows[index].itemId);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const valid = rows.filter((r) => r.itemId && r.quantity > 0);
    if (valid.length === 0) {
      setError("Adicione ao menos um material válido");
      return;
    }
    setSaving(true);
    try {
      await api.post("/pedidos", {
        pelotao,
        instrucao,
        neededAt,
        notes,
        items: valid.map((r) => ({ itemId: r.itemId, quantity: r.quantity })),
      });
      onDone();
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err, "Não foi possível criar o pedido"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Novo pedido de material" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex gap-3">
          <label className="flex-1 text-sm text-slate-600">
            Pelotão
            <input
              required
              value={pelotao}
              onChange={(e) => setPelotao(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="flex-1 text-sm text-slate-600">
            Para quando
            <input
              type="date"
              required
              value={neededAt}
              onChange={(e) => setNeededAt(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
        </div>
        <label className="text-sm text-slate-600">
          Instrução
          <input
            required
            placeholder="Ex: Instrução de combate a incêndio estrutural"
            value={instrucao}
            onChange={(e) => setInstrucao(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </label>

        <div className="flex flex-col gap-2">
          {rows.map((row, index) => (
            <div key={index} className="flex items-center gap-2">
              <select
                required
                value={row.itemId}
                onChange={(e) => updateRow(index, { itemId: e.target.value })}
                className="flex-1 rounded-md border border-slate-300 px-2 py-2 text-sm"
              >
                <option value="">Selecione um material...</option>
                {availableOptionsFor(index).map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                required
                value={row.quantity === 0 ? "" : row.quantity}
                onChange={(e) => updateRow(index, { quantity: e.target.value === "" ? 0 : Number(e.target.value) })}
                className="w-20 rounded-md border border-slate-300 px-2 py-2 text-sm"
              />
              {rows.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeRow(index)}
                  className="shrink-0 text-red-600"
                  aria-label="Remover linha"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>

        {rows.length < MAX_ROWS && (
          <button
            type="button"
            onClick={addRow}
            className="self-start rounded-md bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
          >
            + Adicionar material
          </button>
        )}

        <label className="text-sm text-slate-600">
          Observações (opcional)
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-brand-700 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
        >
          {saving ? "Enviando..." : "Enviar pedido"}
        </button>
      </form>
    </Modal>
  );
}
