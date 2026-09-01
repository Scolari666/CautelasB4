import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, apiErrorMessage } from "../api/client";
import { Cautela } from "../types";
import { useAuth } from "../context/AuthContext";
import { useStockSocket } from "../hooks/useStockSocket";

export function Cautelas() {
  const { user } = useAuth();
  const [cautelas, setCautelas] = useState<Cautela[]>([]);
  const [statusFilter, setStatusFilter] = useState<"ATIVA" | "DEVOLVIDA" | "">("ATIVA");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await api.get<Cautela[]>("/cautelas", { params: statusFilter ? { status: statusFilter } : {} });
    setCautelas(res.data);
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  useStockSocket(load);

  async function handleDevolver(id: string) {
    try {
      await api.post(`/cautelas/${id}/devolver`, {});
      load();
    } catch (err) {
      setError(apiErrorMessage(err, "Não foi possível devolver"));
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-800">Cautelas</h1>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "ATIVA" | "DEVOLVIDA" | "")}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="ATIVA">Ativas</option>
          <option value="DEVOLVIDA">Devolvidas</option>
          <option value="">Todas</option>
        </select>
      </div>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      {cautelas.length === 0 ? (
        <p className="text-slate-500">Nenhuma cautela encontrada.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Item</th>
                <th className="px-4 py-2">Responsável</th>
                <th className="px-4 py-2">Qtd.</th>
                <th className="px-4 py-2">Retirado em</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {cautelas.map((c) => (
                <tr key={c.id} className="border-t border-slate-100">
                  <td className="px-4 py-2">
                    <Link to={`/itens/${c.itemId}`} className="font-medium text-brand-600">
                      {c.item.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2">
                    {c.user.name} {c.user.matricula ? `(${c.user.matricula})` : ""}
                  </td>
                  <td className="px-4 py-2">{c.quantity}</td>
                  <td className="px-4 py-2">{new Date(c.takenAt).toLocaleDateString("pt-BR")}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        c.status === "ATIVA" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {c.status === "ATIVA" ? "Ativa" : "Devolvida"}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    {c.status === "ATIVA" && (user?.role === "ADMIN" || user?.id === c.userId) && (
                      <button
                        onClick={() => handleDevolver(c.id)}
                        className="rounded-md bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                      >
                        Devolver
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
