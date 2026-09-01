import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client";
import { Cautela } from "../types";
import { useStockSocket } from "../hooks/useStockSocket";
import { CautelaCard } from "../components/CautelaCard";

export function MinhasCautelas() {
  const [cautelas, setCautelas] = useState<Cautela[]>([]);

  const load = useCallback(async () => {
    const res = await api.get<Cautela[]>("/cautelas/minhas");
    setCautelas(res.data);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useStockSocket(load);

  const ativas = cautelas.filter((c) => c.items.some((i) => i.status === "ATIVA"));
  const devolvidas = cautelas.filter((c) => c.items.every((i) => i.status === "DEVOLVIDA"));

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-slate-800">Minhas Cautelas</h1>

      <section className="mb-8">
        <h2 className="mb-2 font-semibold text-slate-800">Ativas</h2>
        {ativas.length === 0 ? (
          <p className="text-sm text-slate-500">Você não possui itens cautelados no momento.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {ativas.map((c) => (
              <CautelaCard key={c.id} cautela={c} onChanged={load} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-2 font-semibold text-slate-800">Histórico</h2>
        {devolvidas.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhuma cautela devolvida ainda.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {devolvidas.map((c) => (
              <CautelaCard key={c.id} cautela={c} onChanged={load} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
