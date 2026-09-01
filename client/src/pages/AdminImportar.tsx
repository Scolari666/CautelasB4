import { useCallback, useEffect, useState } from "react";
import { api, apiErrorMessage } from "../api/client";
import { Category, Estoque, Item } from "../types";

interface Row {
  key: number;
  categoria: string;
  material: string;
  quantidade: number;
  fa: number;
  include: boolean;
}

interface RowResult {
  key: number;
  status: "ok" | "error";
  message?: string;
}

function parseInput(text: string): Row[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"))
    .map((line, i) => {
      const [categoria, material, quantidade, fa] = line.split("|").map((p) => p.trim());
      return {
        key: i,
        categoria: categoria ?? "",
        material: material ?? "",
        quantidade: Number(quantidade) || 0,
        fa: Number(fa) || 0,
        include: true,
      };
    })
    .filter((r) => r.categoria && r.material);
}

export function AdminImportar() {
  const [estoques, setEstoques] = useState<Estoque[]>([]);
  const [estoqueId, setEstoqueId] = useState("");
  const [existingCategories, setExistingCategories] = useState<Category[]>([]);
  const [existingItems, setExistingItems] = useState<Item[]>([]);
  const [text, setText] = useState("");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState("");
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(0);
  const [results, setResults] = useState<RowResult[] | null>(null);

  const load = useCallback(async () => {
    const [estoquesRes, categoriesRes, itemsRes] = await Promise.all([
      api.get<Estoque[]>("/estoques"),
      api.get<Category[]>("/categories"),
      api.get<Item[]>("/items"),
    ]);
    setEstoques(estoquesRes.data);
    setEstoqueId((prev) => prev || estoquesRes.data[0]?.id || "");
    setExistingCategories(categoriesRes.data);
    setExistingItems(itemsRes.data);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function isDuplicate(row: Row) {
    return existingItems.some(
      (i) => i.name.trim().toLowerCase() === row.material.toLowerCase() && i.category.name.toLowerCase() === row.categoria.toLowerCase()
    );
  }

  function handleAnalyze() {
    setError("");
    setResults(null);
    const parsed = parseInput(text);
    if (parsed.length === 0) {
      setError("Nenhuma linha válida encontrada. Confira o formato.");
      setRows(null);
      return;
    }
    setRows(parsed);
  }

  function updateRow(key: number, patch: Partial<Row>) {
    setRows((prev) => prev?.map((r) => (r.key === key ? { ...r, ...patch } : r)) ?? null);
  }

  async function handleImport() {
    if (!rows || !estoqueId) return;
    setImporting(true);
    setDone(0);
    setError("");
    const toImport = rows.filter((r) => r.include);
    const results: RowResult[] = [];

    const categoryMap = new Map(existingCategories.map((c) => [c.name.toLowerCase(), c.id]));
    const neededCategoryNames = [...new Set(toImport.map((r) => r.categoria))];
    for (const name of neededCategoryNames) {
      if (categoryMap.has(name.toLowerCase())) continue;
      try {
        const res = await api.post<Category>("/categories", { name });
        categoryMap.set(name.toLowerCase(), res.data.id);
      } catch (err) {
        setError(`Não foi possível criar a categoria "${name}": ${apiErrorMessage(err)}`);
        setImporting(false);
        return;
      }
    }

    for (const row of toImport) {
      const categoryId = categoryMap.get(row.categoria.toLowerCase());
      try {
        if (!categoryId) throw new Error("Categoria não encontrada");
        const itemRes = await api.post<Item>("/items", {
          name: row.material,
          categoryId,
          estoqueId,
          quantityTotal: row.quantidade,
        });
        if (row.fa > 0) {
          await api.patch(`/items/${itemRes.data.id}/adjust`, { to: "UNAVAILABLE", quantity: row.fa });
        }
        results.push({ key: row.key, status: "ok" });
      } catch (err) {
        results.push({ key: row.key, status: "error", message: apiErrorMessage(err) });
      }
      setDone((d) => d + 1);
    }

    setResults(results);
    setImporting(false);
    load();
  }

  const includedCount = rows?.filter((r) => r.include).length ?? 0;

  return (
    <div className="max-w-4xl">
      <h1 className="mb-2 text-xl font-bold text-slate-800">Importar materiais</h1>
      <p className="mb-4 text-sm text-slate-500">
        Cole uma lista de materiais para cadastrar vários de uma vez. Categorias novas são criadas automaticamente.
      </p>

      <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4">
        <label className="text-sm text-slate-600">
          Estoque de destino
          <select
            value={estoqueId}
            onChange={(e) => setEstoqueId(e.target.value)}
            className="mt-1 w-full max-w-xs rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            {estoques.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </label>

        <p className="mb-1 mt-4 text-sm font-medium text-slate-700">
          Uma linha por item, no formato: <code className="rounded bg-slate-100 px-1">Categoria | Material | Quantidade | Fora de uso</code>
        </p>
        <p className="mb-2 text-xs text-slate-400">
          O último campo (Fora de uso) é opcional — use quando parte do estoque já está quebrada/indisponível.
        </p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={"Terrestre | Capacete | 10 | 1\nALTURA | Mosquetão Delta | 68 | 0"}
          rows={8}
          className="w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-xs"
        />
        <button
          onClick={handleAnalyze}
          className="mt-3 rounded-md bg-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Analisar lista
        </button>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>

      {rows && (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">
              Prévia — {rows.length} itens encontrados, {includedCount} selecionados
            </h2>
            <button
              onClick={handleImport}
              disabled={importing || includedCount === 0 || !estoqueId}
              className="rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
            >
              {importing ? `Importando... (${done}/${includedCount})` : `Importar ${includedCount} itens`}
            </button>
          </div>

          <div className="max-h-[50vh] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-2 py-2"></th>
                  <th className="px-2 py-2">Categoria</th>
                  <th className="px-2 py-2">Material</th>
                  <th className="px-2 py-2">Quantidade</th>
                  <th className="px-2 py-2">Fora de uso</th>
                  <th className="px-2 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const result = results?.find((r) => r.key === row.key);
                  const duplicate = isDuplicate(row);
                  return (
                    <tr key={row.key} className="border-t border-slate-100">
                      <td className="px-2 py-1.5">
                        <input
                          type="checkbox"
                          checked={row.include}
                          onChange={(e) => updateRow(row.key, { include: e.target.checked })}
                        />
                      </td>
                      <td className="px-2 py-1.5">{row.categoria}</td>
                      <td className="px-2 py-1.5">
                        {row.material}
                        {duplicate && (
                          <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                            já existe
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          type="number"
                          min={0}
                          value={row.quantidade}
                          onChange={(e) => updateRow(row.key, { quantidade: Number(e.target.value) })}
                          className="w-20 rounded-md border border-slate-300 px-2 py-1 text-sm"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          type="number"
                          min={0}
                          value={row.fa}
                          onChange={(e) => updateRow(row.key, { fa: Number(e.target.value) })}
                          className="w-20 rounded-md border border-slate-300 px-2 py-1 text-sm"
                        />
                      </td>
                      <td className="px-2 py-1.5 text-xs">
                        {result?.status === "ok" && <span className="font-semibold text-emerald-600">✓ importado</span>}
                        {result?.status === "error" && (
                          <span className="font-semibold text-red-600">✕ {result.message}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {results && (
            <p className="mt-3 text-sm text-slate-600">
              {results.filter((r) => r.status === "ok").length} de {results.length} itens importados com sucesso.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
