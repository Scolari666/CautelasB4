import { useState } from "react";
import { api, apiErrorMessage } from "../api/client";
import { Missao, MissaoStatus } from "../types";
import { useAuth } from "../context/AuthContext";

const STATUS_LABEL: Record<MissaoStatus, string> = {
  PLANEJADA: "Aguardando",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDA: "Pronta",
  CANCELADA: "Cancelada",
};

const STATUS_TONE: Record<MissaoStatus, string> = {
  PLANEJADA: "bg-amber-100 text-amber-800",
  EM_ANDAMENTO: "bg-blue-100 text-blue-700",
  CONCLUIDA: "bg-emerald-100 text-emerald-700",
  CANCELADA: "bg-red-100 text-red-700",
};

const STATUS_BORDER: Record<MissaoStatus, string> = {
  PLANEJADA: "border-l-amber-400",
  EM_ANDAMENTO: "border-l-blue-400",
  CONCLUIDA: "border-l-emerald-400",
  CANCELADA: "border-l-red-400",
};

const STATUS_DOT: Record<MissaoStatus, string> = {
  PLANEJADA: "bg-amber-500",
  EM_ANDAMENTO: "bg-blue-500",
  CONCLUIDA: "bg-emerald-500",
  CANCELADA: "bg-red-500",
};

function formatDate(value?: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleDateString("pt-BR");
}

export function MissaoCard({ missao, onChanged }: { missao: Missao; onChanged: () => void }) {
  const { user } = useAuth();
  const [error, setError] = useState("");
  const isAdmin = user?.role === "ADMIN";
  const isMine = user?.id === missao.assignedToId;

  async function handleStatusChange(status: MissaoStatus) {
    setError("");
    try {
      await api.patch(`/missoes/${missao.id}`, { status });
      onChanged();
    } catch (err) {
      setError(apiErrorMessage(err, "Não foi possível alterar o status"));
    }
  }

  async function handleDelete() {
    if (!confirm(`Remover a missão "${missao.title}"?`)) return;
    try {
      await api.delete(`/missoes/${missao.id}`);
      onChanged();
    } catch (err) {
      setError(apiErrorMessage(err, "Não foi possível remover"));
    }
  }

  const period = [formatDate(missao.startAt), formatDate(missao.endAt)].filter(Boolean).join(" – ");

  return (
    <div
      className={`rounded-xl border border-l-4 bg-white p-4 ${STATUS_BORDER[missao.status]} ${
        isMine ? "border-brand-300 ring-1 ring-brand-100" : "border-slate-200"
      }`}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        {isAdmin ? (
          <select
            value={missao.status}
            onChange={(e) => handleStatusChange(e.target.value as MissaoStatus)}
            className={`flex items-center gap-1.5 rounded-full border-0 px-3 py-1.5 text-sm font-bold ${STATUS_TONE[missao.status]}`}
          >
            {(Object.keys(STATUS_LABEL) as MissaoStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        ) : (
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold ${STATUS_TONE[missao.status]}`}>
            <span className={`h-2 w-2 rounded-full ${STATUS_DOT[missao.status]}`} />
            {STATUS_LABEL[missao.status]}
          </span>
        )}
        {isMine && (
          <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-700">
            atribuída a você
          </span>
        )}
      </div>

      <h3 className="font-semibold text-slate-800">{missao.title}</h3>
      <p className="text-xs text-slate-500">
        {missao.assignedTo ? `${missao.assignedTo.name}${missao.assignedTo.pelotao ? ` · ${missao.assignedTo.pelotao}` : ""}` : "Sem atribuição específica"}
        {period ? ` · ${period}` : ""}
      </p>

      {missao.description && <p className="mt-2 text-sm text-slate-600">{missao.description}</p>}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
        <span>Criada por {missao.createdBy.name}</span>
        {isAdmin && (
          <button onClick={handleDelete} className="font-semibold text-red-600">
            Remover
          </button>
        )}
      </div>
    </div>
  );
}
