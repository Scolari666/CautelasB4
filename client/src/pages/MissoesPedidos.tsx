import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client";
import { Missao, MissaoStatus, Pedido, PedidoStatus } from "../types";
import { useAuth } from "../context/AuthContext";
import { useStockSocket } from "../hooks/useStockSocket";
import { MissaoCard } from "../components/MissaoCard";
import { NovaMissaoModal } from "../components/NovaMissaoModal";
import { PedidoCard } from "../components/PedidoCard";
import { NovoPedidoModal } from "../components/NovoPedidoModal";

const MISSAO_STATUS_OPTIONS: { value: MissaoStatus | ""; label: string }[] = [
  { value: "", label: "Todos os status" },
  { value: "PLANEJADA", label: "Planejada" },
  { value: "EM_ANDAMENTO", label: "Em andamento" },
  { value: "CONCLUIDA", label: "Concluída" },
  { value: "CANCELADA", label: "Cancelada" },
];

const PEDIDO_STATUS_OPTIONS: { value: PedidoStatus | ""; label: string }[] = [
  { value: "", label: "Todos os status" },
  { value: "PENDENTE", label: "Pendente" },
  { value: "APROVADO", label: "Aprovado" },
  { value: "RECUSADO", label: "Recusado" },
  { value: "ATENDIDO", label: "Atendido" },
];

export function MissoesPedidos() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"missoes" | "pedidos">("missoes");

  const [missoes, setMissoes] = useState<Missao[]>([]);
  const [missaoStatus, setMissaoStatus] = useState<MissaoStatus | "">("");
  const [showNovaMissao, setShowNovaMissao] = useState(false);

  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [pedidoStatus, setPedidoStatus] = useState<PedidoStatus | "">("");
  const [showNovoPedido, setShowNovoPedido] = useState(false);

  const loadMissoes = useCallback(async () => {
    const res = await api.get<Missao[]>("/missoes", { params: missaoStatus ? { status: missaoStatus } : {} });
    setMissoes(res.data);
  }, [missaoStatus]);

  const loadPedidos = useCallback(async () => {
    const res = await api.get<Pedido[]>("/pedidos", { params: pedidoStatus ? { status: pedidoStatus } : {} });
    setPedidos(res.data);
  }, [pedidoStatus]);

  useEffect(() => {
    if (tab === "missoes") loadMissoes();
    else loadPedidos();
  }, [tab, loadMissoes, loadPedidos]);

  useStockSocket(tab === "missoes" ? loadMissoes : loadPedidos);

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-slate-800">Missões e Pedidos</h1>

      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setTab("missoes")}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
            tab === "missoes" ? "bg-brand-700 text-white shadow-sm" : "bg-white text-slate-600 border border-slate-300 hover:bg-slate-50"
          }`}
        >
          Missões
        </button>
        <button
          onClick={() => setTab("pedidos")}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
            tab === "pedidos" ? "bg-brand-700 text-white shadow-sm" : "bg-white text-slate-600 border border-slate-300 hover:bg-slate-50"
          }`}
        >
          Pedidos de Material
        </button>
      </div>

      {tab === "missoes" ? (
        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <select
              value={missaoStatus}
              onChange={(e) => setMissaoStatus(e.target.value as MissaoStatus | "")}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              {MISSAO_STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            {user?.role === "ADMIN" && (
              <button
                onClick={() => setShowNovaMissao(true)}
                className="rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700"
              >
                + Nova missão
              </button>
            )}
          </div>

          {missoes.length === 0 ? (
            <p className="text-slate-500">Nenhuma missão encontrada.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {missoes.map((m) => (
                <MissaoCard key={m.id} missao={m} onChanged={loadMissoes} />
              ))}
            </div>
          )}

          {showNovaMissao && <NovaMissaoModal onClose={() => setShowNovaMissao(false)} onDone={loadMissoes} />}
        </div>
      ) : (
        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <select
              value={pedidoStatus}
              onChange={(e) => setPedidoStatus(e.target.value as PedidoStatus | "")}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              {PEDIDO_STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => setShowNovoPedido(true)}
              className="rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            >
              + Novo pedido
            </button>
          </div>

          {pedidos.length === 0 ? (
            <p className="text-slate-500">Nenhum pedido encontrado.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {pedidos.map((p) => (
                <PedidoCard key={p.id} pedido={p} onChanged={loadPedidos} />
              ))}
            </div>
          )}

          {showNovoPedido && <NovoPedidoModal onClose={() => setShowNovoPedido(false)} onDone={loadPedidos} />}
        </div>
      )}
    </div>
  );
}
