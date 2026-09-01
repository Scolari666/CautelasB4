import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, apiErrorMessage } from "../api/client";
import { Cautela } from "../types";
import { useStockSocket } from "../hooks/useStockSocket";
import { downloadCautelaPdf } from "../utils/downloadCautelaPdf";

export function MinhasCautelas() {
  const [cautelas, setCautelas] = useState<Cautela[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await api.get<Cautela[]>("/cautelas/minhas");
    setCautelas(res.data);
  }, []);

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

  const ativas = cautelas.filter((c) => c.status === "ATIVA");
  const devolvidas = cautelas.filter((c) => c.status === "DEVOLVIDA");

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-slate-800">Minhas Cautelas</h1>
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      <section className="mb-8">
        <h2 className="mb-2 font-semibold text-slate-800">Ativas</h2>
        {ativas.length === 0 ? (
          <p className="text-sm text-slate-500">Você não possui itens cautelados no momento.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {ativas.map((c) => (
              <li key={c.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 text-sm">
                <div>
                  <Link to={`/itens/${c.itemId}`} className="font-medium text-brand-600">
                    {c.item.name}
                  </Link>
                  <p className="text-slate-500">
                    {c.quantity} un. desde {new Date(c.takenAt).toLocaleDateString("pt-BR")}
                    {c.purpose ? ` · ${c.purpose}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => downloadCautelaPdf(c.id)}
                    className="rounded-md bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                  >
                    PDF
                  </button>
                  <button
                    onClick={() => handleDevolver(c.id)}
                    className="rounded-md bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                  >
                    Devolver
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-2 font-semibold text-slate-800">Histórico</h2>
        {devolvidas.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhuma cautela devolvida ainda.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {devolvidas.map((c) => (
              <li key={c.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-600">
                <span>
                  <Link to={`/itens/${c.itemId}`} className="font-medium text-brand-600">
                    {c.item.name}
                  </Link>{" "}
                  — {c.quantity} un., devolvido em{" "}
                  {c.returnedAt ? new Date(c.returnedAt).toLocaleDateString("pt-BR") : "-"}
                </span>
                <button
                  onClick={() => downloadCautelaPdf(c.id)}
                  className="shrink-0 rounded-md bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                >
                  PDF
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
