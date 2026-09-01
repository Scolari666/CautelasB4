import { FormEvent, useCallback, useEffect, useState } from "react";
import { api, apiErrorMessage } from "../api/client";
import { User } from "../types";
import { useAuth } from "../context/AuthContext";
import { Modal } from "../components/Modal";

export function AdminUsuarios() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState("");
  const [editingUser, setEditingUser] = useState<User | null>(null);

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
    <div className="max-w-3xl">
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
                  <div className="flex justify-end gap-3">
                    <button onClick={() => setEditingUser(u)} className="text-xs font-semibold text-slate-600">
                      Editar
                    </button>
                    <button
                      onClick={() => toggleRole(u)}
                      disabled={u.id === currentUser?.id && u.role === "ADMIN"}
                      className="text-xs font-semibold text-brand-600 disabled:cursor-not-allowed disabled:text-slate-300"
                    >
                      {u.role === "ADMIN" ? "Tornar usuário" : "Tornar admin"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingUser && (
        <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} onSaved={load} />
      )}
    </div>
  );
}

function EditUserModal({ user, onClose, onSaved }: { user: User; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [graduacao, setGraduacao] = useState(user.graduacao ?? "");
  const [matricula, setMatricula] = useState(user.matricula ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.patch(`/users/${user.id}`, { name, email, graduacao, matricula });
      onSaved();
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err, "Não foi possível salvar"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Editar usuário" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          required
          placeholder="Nome completo"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          type="email"
          required
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <div className="flex gap-3">
          <input
            placeholder="Graduação"
            value={graduacao}
            onChange={(e) => setGraduacao(e.target.value)}
            className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            placeholder="Matrícula"
            value={matricula}
            onChange={(e) => setMatricula(e.target.value)}
            className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-brand-700 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
        >
          {saving ? "Salvando..." : "Salvar alterações"}
        </button>
      </form>
    </Modal>
  );
}
