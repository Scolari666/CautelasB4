import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, apiErrorMessage } from "../api/client";
import { AutoInfracao } from "../types";
import { useAuth } from "../context/AuthContext";
import { downloadAutoInfracaoPdf } from "../utils/downloadAutoInfracaoPdf";
import { ANEXO_A_INFRACOES, NIVEL_BADGE_CLASS } from "../data/anexoAInfracoes";

const NIVEL_BY_CODE = new Map(
  ANEXO_A_INFRACOES.flatMap((grupo) => grupo.itens.map((item) => [item.code, grupo.nivel] as const))
);

function maiorNivel(codes: string[]): "LEVE" | "MEDIA" | "GRAVE" | null {
  if (codes.some((c) => NIVEL_BY_CODE.get(c) === "GRAVE")) return "GRAVE";
  if (codes.some((c) => NIVEL_BY_CODE.get(c) === "MEDIA")) return "MEDIA";
  if (codes.some((c) => NIVEL_BY_CODE.get(c) === "LEVE")) return "LEVE";
  return null;
}

export function AutosInfracao() {
  const { user } = useAuth();
  const [autos, setAutos] = useState<AutoInfracao[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await api.get<AutoInfracao[]>("/autos-infracao");
      setAutos(res.data);
    } catch (err) {
      setError(apiErrorMessage(err, "Não foi possível carregar os autos de infração"));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleExcluir(id: string) {
    if (!confirm("Excluir este auto de infração? Esta ação não pode ser desfeita.")) return;
    try {
      await api.delete(`/autos-infracao/${id}`);
      load();
    } catch (err) {
      setError(apiErrorMessage(err, "Não foi possível excluir"));
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Anexo A — Autos de Infração</h1>
          <p className="text-sm text-slate-500">Auto de Infração de Segurança Contra Incêndio (CBMRS)</p>
        </div>
        <Link
          to="/autos-infracao/novo"
          className="rounded-md bg-brand-700 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-800"
        >
          + Novo auto de infração
        </Link>
      </div>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      {autos.length === 0 ? (
        <p className="text-slate-500">Nenhum auto de infração cadastrado.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {autos.map((auto) => {
            const nivel = maiorNivel(auto.infracoes);
            const canManage = user?.role === "ADMIN" || user?.id === auto.createdById;
            return (
              <div key={auto.id} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-800">
                      Auto n.º A {auto.numero}
                      {nivel && (
                        <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium ${NIVEL_BADGE_CLASS[nivel]}`}>
                          {auto.infracoes.length} infração(ões) · {nivel === "LEVE" ? "leve" : nivel === "MEDIA" ? "média" : "grave"}
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-slate-500">
                      {new Date(auto.dataLavratura).toLocaleDateString("pt-BR")}
                      {auto.horario ? ` às ${auto.horario}` : ""}
                      {auto.razaoSocial ? ` · ${auto.razaoSocial}` : auto.nomeFantasia ? ` · ${auto.nomeFantasia}` : ""}
                    </p>
                    <p className="text-xs text-slate-400">
                      Lavrado por {auto.createdBy.name}
                      {auto.createdBy.graduacao ? ` (${auto.createdBy.graduacao})` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => downloadAutoInfracaoPdf(auto.id, auto.numero)}
                      className="rounded-md bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                    >
                      PDF
                    </button>
                    {canManage && (
                      <>
                        <Link
                          to={`/autos-infracao/${auto.id}`}
                          className="rounded-md bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-100"
                        >
                          Editar
                        </Link>
                        <button
                          onClick={() => handleExcluir(auto.id)}
                          className="rounded-md bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                        >
                          Excluir
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
