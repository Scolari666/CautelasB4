import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client";
import { Cautela } from "../types";
import { useStockSocket } from "../hooks/useStockSocket";
import { CautelaCombinadaModal } from "../components/CautelaCombinadaModal";
import { CautelaCard } from "../components/CautelaCard";

export function Cautelas() {
  const [cautelas, setCautelas] = useState<Cautela[]>([]);
  const [statusFilter, setStatusFilter] = useState<"ATIVA" | "DEVOLVIDA" | "">("ATIVA");
  const [showNova, setShowNova] = useState(false);

  const load = useCallback(async () => {
    const res = await api.get<Cautela[]>("/cautelas", { params: statusFilter ? { status: statusFilter } : {} });
    setCautelas(res.data);
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  useStockSocket(load);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-800">Cautelas</h1>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "ATIVA" | "DEVOLVIDA" | "")}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="ATIVA">Ativas</option>
            <option value="DEVOLVIDA">Devolvidas</option>
            <option value="">Todas</option>
          </select>
          <button
            onClick={() => setShowNova(true)}
            className="rounded-md bg-brand-700 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-800"
          >
            + Nova cautela
          </button>
        </div>
      </div>

      {cautelas.length === 0 ? (
        <p className="text-slate-500">Nenhuma cautela encontrada.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {cautelas.map((c) => (
            <CautelaCard key={c.id} cautela={c} onChanged={load} />
          ))}
        </div>
      )}

      {showNova && <CautelaCombinadaModal onClose={() => setShowNova(false)} onDone={load} />}
    </div>
  );
}
