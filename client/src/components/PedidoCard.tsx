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
      <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-800">
            {pedido.instrucao} <span className="font-normal text-slate-400">· {pedido.pelotao}</span>
          </p>
          <p className="text-xs text-slate-500">
            Para {new Date(pedido.neededAt).toLocaleDateString("pt-BR")} · solicitado por {pedido.requestedBy.name}
          </p>
        </div>
        {isAdmin ? (
          <select
            value={pedido.status}
            onChange={(e) => handleStatusChange(e.target.value as PedidoStatus)}
            className={`rounded-full border-0 px-2.5 py-1 text-xs font-medium ${STATUS_TONE[pedido.status]}`}
          >
            {(Object.keys(STATUS_LABEL) as PedidoStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        ) : (
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_TONE[pedido.status]}`}>
            {STATUS_LABEL[pedido.status]}
          </span>
        )}
      </div>

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
