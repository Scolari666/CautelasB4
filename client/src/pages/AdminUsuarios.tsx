import { useCallback, useEffect, useState } from "react";
import { api, apiErrorMessage } from "../api/client";
import { User } from "../types";
import { useAuth } from "../context/AuthContext";

export function AdminUsuarios() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await api.get<User[]>("/users");
    setUsers(res.data);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleRole(u: User) {
    const nextRole = u.role === "ADMIN" ? "USER" : "ADMIN";
    try {
      await api.patch(`/users/${u.id}/role`, { role: nextRole });
      load();
    } catch (err) {
      setError(apiErrorMessage(err, "Não foi possível alterar o papel do usuário"));
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="mb-4 text-xl font-bold text-slate-800">Usuários</h1>
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Nome</th>
              <th className="px-4 py-2">E-mail</th>
              <th className="px-4 py-2">Graduação</th>
              <th className="px-4 py-2">Matrícula</th>
              <th className="px-4 py-2">Papel</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-slate-100">
                <td className="px-4 py-2 font-medium text-slate-800">{u.name}</td>
                <td className="px-4 py-2">{u.email}</td>
                <td className="px-4 py-2">{u.graduacao ?? "-"}</td>
                <td className="px-4 py-2">{u.matricula ?? "-"}</td>
                <td className="px-4 py-2">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      u.role === "ADMIN" ? "bg-brand-100 text-brand-700" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {u.role === "ADMIN" ? "Administrador" : "Usuário"}
                  </span>
                </td>
                <td className="px-4 py-2 text-right">
                  <button
                    onClick={() => toggleRole(u)}
                    disabled={u.id === currentUser?.id && u.role === "ADMIN"}
                    className="text-xs font-semibold text-brand-600 disabled:cursor-not-allowed disabled:text-slate-300"
                  >
                    {u.role === "ADMIN" ? "Tornar usuário" : "Tornar admin"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
