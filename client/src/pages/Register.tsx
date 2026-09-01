import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiErrorMessage } from "../api/client";

export function Register() {
  const { register, user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [matricula, setMatricula] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(name, email, password, matricula || undefined);
      navigate("/");
    } catch (err) {
      setError(apiErrorMessage(err, "Não foi possível criar a conta"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto mt-12 max-w-sm overflow-hidden rounded-xl border border-brand-100 bg-white shadow-lg">
      <div className="flex flex-col items-center gap-2 border-b-4 border-gold-500 bg-gradient-to-b from-brand-700 to-brand-800 px-6 py-6 text-center">
        <img src="/logo-cbmrs.png" alt="Brasão CBMRS" className="h-20 w-20 rounded-lg shadow-md ring-1 ring-white/30" />
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gold-100">
          Corpo de Bombeiros Militar do Rio Grande do Sul
        </p>
        <h1 className="text-lg font-bold text-white">Criar conta</h1>
      </div>
      <div className="p-6">
        <p className="mb-4 text-sm text-slate-500">CautelasB4 - Controle de Materiais</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            required
            placeholder="Nome completo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <input
            placeholder="Matrícula / identificação (opcional)"
            value={matricula}
            onChange={(e) => setMatricula(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <input
            type="email"
            required
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Senha (mín. 6 caracteres)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-brand-700 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
          >
            {loading ? "Criando..." : "Criar conta"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          Já tem conta?{" "}
          <Link to="/login" className="font-medium text-brand-700">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
