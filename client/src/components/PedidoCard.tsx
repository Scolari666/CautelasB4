import { useState } from "react";
import { Link } from "react-router-dom";
import { api, apiErrorMessage } from "../api/client";
import { Pedido, PedidoStatus } from "../types";
import { useAuth } from "../context/AuthContext";

const STATUS_LABEL: Record<PedidoStatus, string> = {
  PENDENTE: "Pendente",
  APROVADO: "Aprovado",
  RECUSADO: "Recusado",
  ATENDIDO: "Atendido",
};

const STATUS_TONE: Record<PedidoStatus, string> = {
  PENDENTE: "bg-amber-100 text-amber-700",
  APROVADO: "bg-blue-100 text-blue-700",
  RECUSADO: "bg-red-100 text-red-700",
  ATENDIDO: "bg-emerald-100 text-emerald-700",
};

export function PedidoCard({ pedido, onChanged }: { pedido: Pedido; onChanged: () => void }) {
  const { user } = useAuth();
  const [error, setError] = useState("");
  const isAdmin = user?.role === "ADMIN";
  const isOwner = user?.id === pedido.requestedById;
  const canDelete = isAdmin || (isOwner && pedido.status === "PENDENTE");

  async function handleStatusChange(status: PedidoStatus) {
    setError("");
    try {
      await api.patch(`/pedidos/${pedido.id}/status`, { status });
      onChanged();
    } catch (err) {
      setError(apiErrorMessage(err, "Não foi possível alterar o status"));
    }
  }

  async function handleDelete() {
    if (!confirm("Remover este pedido?")) return;
    try {
      await api.delete(`/pedidos/${pedido.id}`);
      onChanged();
    } catch (err) {
      setError(apiErrorMessage(err, "Não foi possível remover"));
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-brand-700 px-3 py-1.5 text-sm font-bold text-white">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.958a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.368 2.447a1 1 0 00-.364 1.118l1.287 3.957c.3.922-.755 1.688-1.538 1.118l-3.367-2.446a1 1 0 00-1.176 0l-3.367 2.446c-.783.57-1.838-.196-1.538-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.062 9.385c-.783-.57-.38-1.81.588-1.81h4.163a1 1 0 00.95-.69l1.286-3.958z" />
            </svg>
            {pedido.pelotao}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-gold-100 px-3 py-1.5 text-sm font-bold text-gold-800">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path
                fillRule="evenodd"
                d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5a1.25 1.25 0 00-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5a1.25 1.25 0 00-1.25-1.25H4.75z"
                clipRule="evenodd"
              />
            </svg>
            {new Date(pedido.neededAt).toLocaleDateString("pt-BR")}
          </span>
        </div>
        {isAdmin ? (
          <select
            value={pedido.status}
            onChange={(e) => handleStatusChange(e.target.value as PedidoStatus)}
            className={`rounded-full border-0 px-3 py-1.5 text-sm font-bold ${STATUS_TONE[pedido.status]}`}
          >
            {(Object.keys(STATUS_LABEL) as PedidoStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        ) : (
          <span className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-bold ${STATUS_TONE[pedido.status]}`}>
            {STATUS_LABEL[pedido.status]}
          </span>
        )}
      </div>

      <p className="mb-2 font-semibold text-slate-800">
        {pedido.instrucao}
        <span className="ml-2 text-xs font-normal text-slate-400">solicitado por {pedido.requestedBy.name}</span>
      </p>

      {pedido.notes && <p className="mb-2 text-sm text-slate-600">{pedido.notes}</p>}

      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}

      <ul className="divide-y divide-slate-100 border-t border-slate-100">
        {pedido.items.map((pi) => (
          <li key={pi.id} className="flex items-center justify-between py-2 text-sm">
            <Link to={`/itens/${pi.itemId}`} className="font-medium text-brand-600">
              {pi.item.name}
            </Link>
            <span className="text-slate-500">{pi.quantity} un.</span>
          </li>
        ))}
      </ul>

      {canDelete && (
        <div className="mt-3 flex justify-end">
          <button onClick={handleDelete} className="text-xs font-semibold text-red-600">
            Remover
          </button>
        </div>
      )}
    </div>
  );
}
