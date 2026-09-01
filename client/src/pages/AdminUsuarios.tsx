import { FormEvent, useCallback, useEffect, useState } from "react";
import { api, apiErrorMessage } from "../api/client";
import { Role, User } from "../types";
import { useAuth } from "../context/AuthContext";
import { Modal } from "../components/Modal";

export function AdminUsuarios() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [resettingUser, setResettingUser] = useState<User | null>(null);

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
    <div className="max-w-4xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-800">Usuários</h1>
        <button
          onClick={() => setShowNew(true)}
          className="rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          + Novo usuário
        </button>
      </div>
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Nome</th>
              <th className="px-4 py-2">Usuário</th>
              <th className="px-4 py-2">Graduação</th>
              <th className="px-4 py-2">Pelotão</th>
              <th className="px-4 py-2">Matrícula</th>
              <th className="px-4 py-2">Telefone</th>
              <th className="px-4 py-2">Papel</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-slate-100">
                <td className="px-4 py-2 font-medium text-slate-800">{u.name}</td>
                <td className="px-4 py-2 text-slate-600">{u.username}</td>
                <td className="px-4 py-2">{u.graduacao ?? "-"}</td>
                <td className="px-4 py-2">{u.pelotao ?? "-"}</td>
                <td className="px-4 py-2">{u.matricula ?? "-"}</td>
                <td className="px-4 py-2">{u.telefone ?? "-"}</td>
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
                  <div className="flex flex-wrap justify-end gap-3">
                    <button onClick={() => setEditingUser(u)} className="text-xs font-semibold text-slate-600">
                      Editar
                    </button>
                    <button onClick={() => setResettingUser(u)} className="text-xs font-semibold text-slate-600">
                      Redefinir senha
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

      {showNew && <NewUserModal onClose={() => setShowNew(false)} onSaved={load} />}
      {editingUser && (
        <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} onSaved={load} />
      )}
      {resettingUser && (
        <ResetPasswordModal user={resettingUser} onClose={() => setResettingUser(null)} />
      )}
    </div>
  );
}

function NewUserModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [graduacao, setGraduacao] = useState("");
  const [pelotao, setPelotao] = useState("");
  const [matricula, setMatricula] = useState("");
  const [telefone, setTelefone] = useState("");
  const [role, setRole] = useState<Role>("USER");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.post("/users", { name, username, password, email, graduacao, pelotao, matricula, telefone, role });
      onSaved();
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err, "Não foi possível criar o usuário"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Novo usuário" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          required
          placeholder="Nome completo"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <div className="flex gap-3">
          <input
            required
            placeholder="Usuário (login)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Senha (mín. 6 caracteres)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <input
          type="email"
          placeholder="E-mail (opcional)"
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
            placeholder="Pelotão"
            value={pelotao}
            onChange={(e) => setPelotao(e.target.value)}
            className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex gap-3">
          <input
            placeholder="Matrícula"
            value={matricula}
            onChange={(e) => setMatricula(e.target.value)}
            className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            placeholder="Telefone"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <label className="text-sm text-slate-600">
          Papel
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="USER">Usuário</option>
            <option value="ADMIN">Administrador</option>
          </select>
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-brand-700 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
        >
          {saving ? "Criando..." : "Criar usuário"}
        </button>
      </form>
    </Modal>
  );
}

function EditUserModal({ user, onClose, onSaved }: { user: User; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(user.name);
  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email ?? "");
  const [graduacao, setGraduacao] = useState(user.graduacao ?? "");
  const [pelotao, setPelotao] = useState(user.pelotao ?? "");
  const [matricula, setMatricula] = useState(user.matricula ?? "");
  const [telefone, setTelefone] = useState(user.telefone ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.patch(`/users/${user.id}`, { name, username, email, graduacao, pelotao, matricula, telefone });
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
          required
          placeholder="Usuário (login)"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          type="email"
          placeholder="E-mail (opcional)"
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
            placeholder="Pelotão"
            value={pelotao}
            onChange={(e) => setPelotao(e.target.value)}
            className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex gap-3">
          <input
            placeholder="Matrícula"
            value={matricula}
            onChange={(e) => setMatricula(e.target.value)}
            className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            placeholder="Telefone"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
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

function ResetPasswordModal({ user, onClose }: { user: User; onClose: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.patch(`/users/${user.id}/password`, { password });
      setDone(true);
    } catch (err) {
      setError(apiErrorMessage(err, "Não foi possível redefinir a senha"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={`Redefinir senha de ${user.name}`} onClose={onClose}>
      {done ? (
        <p className="text-sm text-emerald-700">Senha redefinida com sucesso.</p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="password"
            required
            minLength={6}
            placeholder="Nova senha (mín. 6 caracteres)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-brand-700 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
          >
            {saving ? "Salvando..." : "Redefinir senha"}
          </button>
        </form>
      )}
    </Modal>
  );
}
