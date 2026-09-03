import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, apiErrorMessage } from "../api/client";
import { AutoInfracao } from "../types";
import { downloadAutoInfracaoPdf } from "../utils/downloadAutoInfracaoPdf";
import { ANEXO_A_INFRACOES, NIVEL_LABEL } from "../data/anexoAInfracoes";

type FormState = {
  numero: string;
  dataLavratura: string;
  horario: string;
  razaoSocial: string;
  nomeFantasia: string;
  ppciPspci: string;
  numeroLogradouro: string;
  logradouro: string;
  bairro: string;
  municipio: string;
  complemento: string;
  infratorRazaoSocial: string;
  infratorCnpj: string;
  infratorNome: string;
  infratorCpf: string;
  infratorTelefone: string;
  infratorEmail: string;
};

const EMPTY: FormState = {
  numero: "",
  dataLavratura: new Date().toISOString().slice(0, 10),
  horario: "",
  razaoSocial: "",
  nomeFantasia: "",
  ppciPspci: "",
  numeroLogradouro: "",
  logradouro: "",
  bairro: "",
  municipio: "",
  complemento: "",
  infratorRazaoSocial: "",
  infratorCnpj: "",
  infratorNome: "",
  infratorCpf: "",
  infratorTelefone: "",
  infratorEmail: "",
};

function inputClass() {
  return "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500";
}

function labelClass() {
  return "mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500";
}

export function AutoInfracaoForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>(EMPTY);
  const [infracoes, setInfracoes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await api.get<AutoInfracao>(`/autos-infracao/${id}`);
        const a = res.data;
        setForm({
          numero: a.numero,
          dataLavratura: a.dataLavratura.slice(0, 10),
          horario: a.horario ?? "",
          razaoSocial: a.razaoSocial ?? "",
          nomeFantasia: a.nomeFantasia ?? "",
          ppciPspci: a.ppciPspci ?? "",
          numeroLogradouro: a.numeroLogradouro ?? "",
          logradouro: a.logradouro ?? "",
          bairro: a.bairro ?? "",
          municipio: a.municipio ?? "",
          complemento: a.complemento ?? "",
          infratorRazaoSocial: a.infratorRazaoSocial ?? "",
          infratorCnpj: a.infratorCnpj ?? "",
          infratorNome: a.infratorNome ?? "",
          infratorCpf: a.infratorCpf ?? "",
          infratorTelefone: a.infratorTelefone ?? "",
          infratorEmail: a.infratorEmail ?? "",
        });
        setInfracoes(new Set(a.infracoes));
      } catch (err) {
        setError(apiErrorMessage(err, "Não foi possível carregar este auto de infração"));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  function set<K extends keyof FormState>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleInfracao(code: string) {
    setInfracoes((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  async function save(thenDownload: boolean) {
    if (!form.numero.trim()) {
      setError("Informe o número do auto de infração");
      return;
    }
    setSaving(true);
    setError("");
    const payload = { ...form, infracoes: Array.from(infracoes) };
    try {
      const res = isEdit
        ? await api.put<AutoInfracao>(`/autos-infracao/${id}`, payload)
        : await api.post<AutoInfracao>("/autos-infracao", payload);
      if (thenDownload) await downloadAutoInfracaoPdf(res.data.id, res.data.numero);
      navigate("/autos-infracao");
    } catch (err) {
      setError(apiErrorMessage(err, "Não foi possível salvar"));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-8 text-center text-slate-500">Carregando...</div>;

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-1 text-xl font-bold text-slate-800">{isEdit ? "Editar" : "Novo"} Auto de Infração — Anexo A</h1>
      <p className="mb-6 text-sm text-slate-500">Auto de Infração de Segurança Contra Incêndio (CBMRS)</p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          save(false);
        }}
        className="flex flex-col gap-6"
      >
        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-brand-700">Auto de Infração</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className={labelClass()}>Auto de infração n.º A</label>
              <input className={inputClass()} value={form.numero} onChange={(e) => set("numero", e.target.value)} placeholder="2460" required />
            </div>
            <div>
              <label className={labelClass()}>Data da lavratura</label>
              <input type="date" className={inputClass()} value={form.dataLavratura} onChange={(e) => set("dataLavratura", e.target.value)} />
            </div>
            <div>
              <label className={labelClass()}>Horário</label>
              <input type="time" className={inputClass()} value={form.horario} onChange={(e) => set("horario", e.target.value)} />
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-brand-700">
            Identificação da edificação ou área de risco de incêndio
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClass()}>Razão social</label>
              <input className={inputClass()} value={form.razaoSocial} onChange={(e) => set("razaoSocial", e.target.value)} />
            </div>
            <div>
              <label className={labelClass()}>Nome fantasia</label>
              <input className={inputClass()} value={form.nomeFantasia} onChange={(e) => set("nomeFantasia", e.target.value)} />
            </div>
            <div>
              <label className={labelClass()}>PPCI / PSPCI n.º</label>
              <input className={inputClass()} value={form.ppciPspci} onChange={(e) => set("ppciPspci", e.target.value)} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className={labelClass()}>Logradouro</label>
                <input className={inputClass()} value={form.logradouro} onChange={(e) => set("logradouro", e.target.value)} />
              </div>
              <div>
                <label className={labelClass()}>N.º</label>
                <input className={inputClass()} value={form.numeroLogradouro} onChange={(e) => set("numeroLogradouro", e.target.value)} />
              </div>
            </div>
            <div>
              <label className={labelClass()}>Complemento</label>
              <input className={inputClass()} value={form.complemento} onChange={(e) => set("complemento", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass()}>Bairro</label>
                <input className={inputClass()} value={form.bairro} onChange={(e) => set("bairro", e.target.value)} />
              </div>
              <div>
                <label className={labelClass()}>Município</label>
                <input className={inputClass()} value={form.municipio} onChange={(e) => set("municipio", e.target.value)} />
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-brand-700">
            Identificação do infrator (proprietário ou responsável pelo uso)
          </h2>
          <p className="mb-3 text-xs text-slate-500">Preencha os dados de pessoa jurídica e/ou pessoa física, conforme o caso.</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClass()}>Razão social (pessoa jurídica)</label>
              <input className={inputClass()} value={form.infratorRazaoSocial} onChange={(e) => set("infratorRazaoSocial", e.target.value)} />
            </div>
            <div>
              <label className={labelClass()}>CNPJ</label>
              <input className={inputClass()} value={form.infratorCnpj} onChange={(e) => set("infratorCnpj", e.target.value)} />
            </div>
            <div>
              <label className={labelClass()}>Nome (pessoa física)</label>
              <input className={inputClass()} value={form.infratorNome} onChange={(e) => set("infratorNome", e.target.value)} />
            </div>
            <div>
              <label className={labelClass()}>CPF</label>
              <input className={inputClass()} value={form.infratorCpf} onChange={(e) => set("infratorCpf", e.target.value)} />
            </div>
            <div>
              <label className={labelClass()}>Telefone</label>
              <input className={inputClass()} value={form.infratorTelefone} onChange={(e) => set("infratorTelefone", e.target.value)} />
            </div>
            <div>
              <label className={labelClass()}>E-mail</label>
              <input type="email" className={inputClass()} value={form.infratorEmail} onChange={(e) => set("infratorEmail", e.target.value)} />
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-1 text-sm font-bold uppercase tracking-wide text-brand-700">
            Descrição da infração — Artigo 18, Decreto Estadual n.º 51.803, de 10 de setembro de 2014
          </h2>
          <p className="mb-3 text-xs text-slate-500">Marque todas as infrações constatadas.</p>

          {ANEXO_A_INFRACOES.map((grupo) => (
            <div key={grupo.nivel} className="mb-4 last:mb-0">
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-600">{grupo.titulo}</h3>
              <div className="flex flex-col gap-2">
                {grupo.itens.map((item) => (
                  <label
                    key={item.code}
                    className={`flex cursor-pointer items-start gap-2 rounded-md border p-2 text-sm transition ${
                      infracoes.has(item.code) ? "border-brand-400 bg-brand-50" : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                      checked={infracoes.has(item.code)}
                      onChange={() => toggleInfracao(item.code)}
                    />
                    <span className="text-slate-700">
                      <span className="font-semibold">{item.letra})</span> {item.texto}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}

          {infracoes.size > 0 && (
            <p className="mt-2 text-xs font-medium text-brand-700">
              {infracoes.size} infração(ões) marcada(s):{" "}
              {Array.from(infracoes)
                .map((code) => `${NIVEL_LABEL[code.startsWith("LEVE") ? "LEVE" : code.startsWith("MEDIA") ? "MEDIA" : "GRAVE"]} ${code.split("_")[1]}`)
                .join(", ")}
            </p>
          )}
        </section>

        <div className="sticky bottom-4 flex flex-wrap justify-end gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
          <button
            type="button"
            onClick={() => navigate("/autos-infracao")}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-50"
          >
            Salvar
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => save(true)}
            className="rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50"
          >
            Salvar e gerar PDF
          </button>
        </div>
      </form>
    </div>
  );
}
