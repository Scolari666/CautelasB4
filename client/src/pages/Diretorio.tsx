import { useEffect, useState } from "react";
import { api } from "../api/client";
import { UserDirectoryEntry } from "../types";

export function Diretorio() {
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

  return (
    <div className="max-w-4xl">
      <h1 className="mb-4 text-xl font-bold text-slate-800">Diretório</h1>

      <input
        placeholder="Buscar por nome, graduação, pelotão ou matrícula..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 w-full max-w-sm rounded-md border border-slate-300 px-3 py-2 text-sm"
      />

      {loading ? (
        <p className="text-slate-500">Carregando...</p>
      ) : filtered.length === 0 ? (
        <p className="text-slate-500">Nenhum militar encontrado.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Nome</th>
                <th className="px-4 py-2">Graduação</th>
                <th className="px-4 py-2">Pelotão</th>
                <th className="px-4 py-2">Matrícula</th>
                <th className="px-4 py-2">Telefone</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-t border-slate-100">
                  <td className="px-4 py-2 font-medium text-slate-800">{u.name}</td>
                  <td className="px-4 py-2">{u.graduacao ?? "-"}</td>
                  <td className="px-4 py-2">{u.pelotao ?? "-"}</td>
                  <td className="px-4 py-2">{u.matricula ?? "-"}</td>
                  <td className="px-4 py-2">{u.telefone ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
