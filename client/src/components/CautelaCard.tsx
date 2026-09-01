import { useState } from "react";
import { Link } from "react-router-dom";
import { api, apiErrorMessage } from "../api/client";
import { Cautela } from "../types";
import { useAuth } from "../context/AuthContext";
import { downloadCautelaPdf } from "../utils/downloadCautelaPdf";

export function CautelaCard({ cautela, onChanged }: { cautela: Cautela; onChanged: () => void }) {
  const { user } = useAuth();
  const [error, setError] = useState("");
  const canManage = user?.role === "ADMIN" || user?.id === cautela.userId;
  const hasActive = cautela.items.some((i) => i.status === "ATIVA");

  async function handleDevolverItem(cautelaItemId: string) {
    setError("");
    try {
      await api.post(`/cautelas/items/${cautelaItemId}/devolver`, {});
      onChanged();
    } catch (err) {
      setError(apiErrorMessage(err, "Não foi possível devolver"));
    }
  }

  async function handleDevolverTudo() {
    setError("");
    try {
      await api.post(`/cautelas/${cautela.id}/devolver`, {});
      onChanged();
    } catch (err) {
      setError(apiErrorMessage(err, "Não foi possível devolver"));
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium text-slate-800">
            {cautela.retiradoPorNome || cautela.user.name}{" "}
            {cautela.user.matricula ? `(${cautela.user.matricula})` : ""}
          </p>
          <p className="text-sm text-slate-500">
            {new Date(cautela.takenAt).toLocaleDateString("pt-BR")}
            {cautela.purpose ? ` · ${cautela.purpose}` : ""}
          </p>
        </div>
        {canManage && (
          <div className="flex shrink-0 gap-2">
            <button
              onClick={() => downloadCautelaPdf(cautela.id)}
              className="rounded-md bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
            >
              PDF
            </button>
            {hasActive && (
              <button
                onClick={handleDevolverTudo}
                className="rounded-md bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
              >
                Devolver tudo
              </button>
            )}
          </div>
        )}
      </div>

      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}

      <ul className="divide-y divide-slate-100 border-t border-slate-100">
        {cautela.items.map((ci) => (
          <li key={ci.id} className="flex items-center justify-between py-2 text-sm">
            <div>
              <Link to={`/itens/${ci.itemId}`} className="font-medium text-brand-600">
                {ci.item.name}
              </Link>
              <span className="ml-2 text-slate-500">{ci.quantity} un.</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-2 py-1 text-xs font-medium ${
                  ci.status === "ATIVA" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"
                }`}
              >
                {ci.status === "ATIVA" ? "Ativa" : "Devolvida"}
              </span>
              {canManage && ci.status === "ATIVA" && (
                <button
                  onClick={() => handleDevolverItem(ci.id)}
                  className="rounded-md bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                >
                  Devolver
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
