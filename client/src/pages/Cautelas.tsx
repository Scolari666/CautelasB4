import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client";
import { Cautela } from "../types";
import { useStockSocket } from "../hooks/useStockSocket";
import { CautelaCombinadaModal } from "../components/CautelaCombinadaModal";
import { CautelaCard } from "../components/CautelaCard";
import { Location, LOCATION_LABEL, estoqueLocation } from "../constants/location";

const tabClass = (active: boolean) =>
  `rounded-full px-4 py-1.5 text-sm font-semibold transition ${
    active ? "bg-brand-700 text-white shadow-sm" : "bg-white text-slate-600 border border-slate-300 hover:bg-slate-50"
  }`;

function cautelaLocation(c: Cautela): Location | null {
  const name = c.items[0]?.item.estoque?.name;
  return name ? estoqueLocation(name) : null;
}

export function Cautelas() {
  const [tab, setTab] = useState<"todas" | "minhas">("todas");
  const [showNova, setShowNova] = useState(false);

  const [cautelas, setCautelas] = useState<Cautela[]>([]);
  const [statusFilter, setStatusFilter] = useState<"ATIVA" | "DEVOLVIDA" | "">("ATIVA");

  const [minhas, setMinhas] = useState<Cautela[]>([]);

  const loadTodas = useCallback(async () => {
    const res = await api.get<Cautela[]>("/cautelas", { params: statusFilter ? { status: statusFilter } : {} });
    setCautelas(res.data);
  }, [statusFilter]);

  const loadMinhas = useCallback(async () => {
    const res = await api.get<Cautela[]>("/cautelas/minhas");
    setMinhas(res.data);
  }, []);

  useEffect(() => {
    if (tab === "todas") loadTodas();
    else loadMinhas();
  }, [tab, loadTodas, loadMinhas]);

  useStockSocket(tab === "todas" ? loadTodas : loadMinhas);

  const load = tab === "todas" ? loadTodas : loadMinhas;

  const ativas = minhas.filter((c) => c.items.some((i) => i.status === "ATIVA"));
  const devolvidas = minhas.filter((c) => c.items.every((i) => i.status === "DEVOLVIDA"));

  const allSections: { key: Location | "OUTROS"; label: string; cautelas: Cautela[] }[] = (
    ["POA", "CACHOEIRINHA", "B4"] as Location[]
  ).map((loc) => ({ key: loc, label: LOCATION_LABEL[loc], cautelas: cautelas.filter((c) => cautelaLocation(c) === loc) }));
  allSections.push({ key: "OUTROS", label: "Outros materiais", cautelas: cautelas.filter((c) => cautelaLocation(c) === null) });
  const locationSections = allSections.filter((s) => s.cautelas.length > 0);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-800">Cautelas</h1>
        <button
          onClick={() => setShowNova(true)}
          className="rounded-md bg-brand-700 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-800"
        >
          + Nova cautela
        </button>
      </div>

      <div className="mb-6 flex gap-2">
        <button onClick={() => setTab("todas")} className={tabClass(tab === "todas")}>
          Todas
        </button>
        <button onClick={() => setTab("minhas")} className={tabClass(tab === "minhas")}>
          Minhas Cautelas
        </button>
      </div>

      {tab === "todas" ? (
        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
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

          {cautelas.length === 0 ? (
            <p className="text-slate-500">Nenhuma cautela encontrada.</p>
          ) : (
            locationSections.map((section) => (
              <section key={section.key} className="mb-8">
                <h3 className="mb-3 border-b border-slate-200 pb-1 text-base font-bold text-slate-700">
                  {section.label}
                </h3>
                <div className="flex flex-col gap-3">
                  {section.cautelas.map((c) => (
                    <CautelaCard key={c.id} cautela={c} onChanged={loadTodas} />
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      ) : (
        <div>
          <section className="mb-8">
            <h2 className="mb-2 font-semibold text-slate-800">Ativas</h2>
            {ativas.length === 0 ? (
              <p className="text-sm text-slate-500">Você não possui itens cautelados no momento.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {ativas.map((c) => (
                  <CautelaCard key={c.id} cautela={c} onChanged={loadMinhas} />
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
                  <CautelaCard key={c.id} cautela={c} onChanged={loadMinhas} />
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {showNova && <CautelaCombinadaModal onClose={() => setShowNova(false)} onDone={load} />}
    </div>
  );
}
