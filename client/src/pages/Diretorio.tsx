import { useEffect, useState } from "react";
import { api } from "../api/client";
import { UserDirectoryEntry } from "../types";
import { useAuth } from "../context/AuthContext";
import { PELOTAO_OPTIONS } from "../constants/pelotoes";
import { Location, LOCATION_LABEL, pelotaoLocation, userLocationAccess } from "../constants/location";

const SEM_PELOTAO = "Sem pelotão";

const PELOTAO_PALETTE = [
  { border: "border-l-blue-400", head: "bg-blue-50 text-blue-800", dot: "bg-blue-500" },
  { border: "border-l-emerald-400", head: "bg-emerald-50 text-emerald-800", dot: "bg-emerald-500" },
  { border: "border-l-amber-400", head: "bg-amber-50 text-amber-800", dot: "bg-amber-500" },
  { border: "border-l-purple-400", head: "bg-purple-50 text-purple-800", dot: "bg-purple-500" },
  { border: "border-l-pink-400", head: "bg-pink-50 text-pink-800", dot: "bg-pink-500" },
  { border: "border-l-cyan-400", head: "bg-cyan-50 text-cyan-800", dot: "bg-cyan-500" },
  { border: "border-l-orange-400", head: "bg-orange-50 text-orange-800", dot: "bg-orange-500" },
  { border: "border-l-indigo-400", head: "bg-indigo-50 text-indigo-800", dot: "bg-indigo-500" },
];

const SEM_PELOTAO_STYLE = { border: "border-l-slate-300", head: "bg-slate-50 text-slate-600", dot: "bg-slate-400" };

function pelotaoStyle(name: string) {
  if (name === SEM_PELOTAO) return SEM_PELOTAO_STYLE;
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return PELOTAO_PALETTE[hash % PELOTAO_PALETTE.length];
}

export function Diretorio() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserDirectoryEntry[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<UserDirectoryEntry[]>("/users/directory").then((res) => {
      setUsers(res.data);
      setLoading(false);
    });
  }, []);

  const filtered = users.filter((u) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      u.name.toLowerCase().includes(term) ||
      (u.graduacao ?? "").toLowerCase().includes(term) ||
      (u.pelotao ?? "").toLowerCase().includes(term) ||
      (u.matricula ?? "").toLowerCase().includes(term)
    );
  });

  const grouped = filtered.reduce<Record<string, UserDirectoryEntry[]>>((acc, u) => {
    const key = u.pelotao?.trim() || SEM_PELOTAO;
    acc[key] = acc[key] ?? [];
    acc[key].push(u);
    return acc;
  }, {});

  const groupNames = Object.keys(grouped).sort((a, b) => {
    if (a === SEM_PELOTAO) return 1;
    if (b === SEM_PELOTAO) return -1;
    const indexA = PELOTAO_OPTIONS.indexOf(a);
    const indexB = PELOTAO_OPTIONS.indexOf(b);
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return a.localeCompare(b, "pt-BR");
  });

  const access = userLocationAccess(user?.pelotao, user?.role ?? "USER");
  const locationGroups: Record<Location, string[]> = { POA: [], CACHOEIRINHA: [], B4: [] };
  const commonGroups: string[] = [];
  for (const name of groupNames) {
    const loc = name === SEM_PELOTAO ? null : pelotaoLocation(name);
    if (loc) locationGroups[loc].push(name);
    else commonGroups.push(name);
  }

  function renderGroup(groupName: string) {
    const style = pelotaoStyle(groupName);
    return (
      <section key={groupName} className={`mb-6 overflow-hidden rounded-xl border border-l-4 border-slate-200 bg-white ${style.border}`}>
        <h2 className={`flex items-center gap-2 px-4 py-2 text-sm font-bold uppercase tracking-wide ${style.head}`}>
          <span className={`h-2.5 w-2.5 rounded-full ${style.dot}`} />
          {groupName} <span className="font-normal normal-case text-slate-400">({grouped[groupName].length})</span>
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2"></th>
                <th className="px-4 py-2">Nome</th>
                <th className="px-4 py-2">Graduação</th>
                <th className="px-4 py-2">Matrícula</th>
                <th className="px-4 py-2">Telefone</th>
              </tr>
            </thead>
            <tbody>
              {grouped[groupName].map((u) => (
                <tr key={u.id} className="border-t border-slate-100">
                  <td className="px-4 py-2">
                    {u.avatarUrl ? (
                      <img src={u.avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500">
                        {u.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 font-medium text-slate-800">{u.name}</td>
                  <td className="px-4 py-2">{u.graduacao ?? "-"}</td>
                  <td className="px-4 py-2">{u.matricula ?? "-"}</td>
                  <td className="px-4 py-2">{u.telefone ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  return (
    <div className="max-w-4xl">
      <h1 className="mb-4 text-xl font-bold text-slate-800">Diretório</h1>

      <input
        placeholder="Buscar por nome, graduação, pelotão ou matrícula..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-6 w-full max-w-sm rounded-md border border-slate-300 px-3 py-2 text-sm"
      />

      {loading ? (
        <p className="text-slate-500">Carregando...</p>
      ) : filtered.length === 0 ? (
        <p className="text-slate-500">Nenhum militar encontrado.</p>
      ) : (
        <>
          {(["POA", "CACHOEIRINHA"] as Location[])
            .filter((loc) => access.has(loc) && locationGroups[loc].length > 0)
            .map((loc) => (
              <div key={loc} className="mb-8">
                <h3 className="mb-3 border-b border-slate-200 pb-1 text-base font-bold text-slate-700">
                  {LOCATION_LABEL[loc]}
                </h3>
                {locationGroups[loc].map(renderGroup)}
              </div>
            ))}
          {commonGroups.map(renderGroup)}
        </>
      )}
    </div>
  );
}
