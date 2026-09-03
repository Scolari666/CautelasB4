import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `block rounded-md px-3 py-2 text-sm font-medium transition ${
    isActive ? "bg-white text-brand-800 shadow-sm" : "text-red-50 hover:bg-white/10"
  }`;

export function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  if (!user) return null;

  const close = () => setOpen(false);

  return (
    <nav className="border-b-4 border-gold-500 bg-gradient-to-r from-brand-800 via-brand-700 to-brand-800 shadow-md">
      <div className="mx-auto max-w-6xl px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img src="/logo-cbmrs.png" alt="Brasão CBMRS" className="h-10 w-10 rounded-md shadow ring-1 ring-white/30" />
            <div className="leading-tight">
              <p className="text-sm font-bold uppercase tracking-wide text-white">CBMRS</p>
              <p className="text-[11px] text-gold-100">Sistema Online para B4</p>
            </div>
          </div>

          <div className="hidden items-center gap-3 text-sm text-red-50 md:flex">
            <NavLink to="/perfil" className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-white/10">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="h-7 w-7 rounded-full object-cover ring-1 ring-white/40" />
              ) : (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-xs font-bold text-white ring-1 ring-white/40">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              )}
              <span>
                {user.name} <span className="text-gold-100">({user.role === "ADMIN" ? "admin" : "usuário"})</span>
              </span>
            </NavLink>
            <button
              onClick={logout}
              className="rounded-md bg-white/10 px-3 py-1.5 font-medium text-white hover:bg-white/20"
            >
              Sair
            </button>
          </div>

          <button
            onClick={() => setOpen((v) => !v)}
            className="rounded-md p-2 text-white hover:bg-white/10 md:hidden"
            aria-label={open ? "Fechar menu" : "Abrir menu"}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6">
              {open ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        <div className={`${open ? "mt-3 flex" : "hidden"} flex-col gap-1 md:mt-3 md:flex md:flex-row md:flex-wrap md:items-center md:gap-1.5`}>
          <NavLink to="/" end className={linkClass} onClick={close}>
            Materiais
          </NavLink>
          <NavLink to="/cautelas" className={linkClass} onClick={close}>
            Cautelas
          </NavLink>
          <NavLink to="/minhas-cautelas" className={linkClass} onClick={close}>
            Minhas Cautelas
          </NavLink>
          <NavLink to="/diretorio" className={linkClass} onClick={close}>
            Diretório
          </NavLink>
          <NavLink to="/missoes-pedidos" className={linkClass} onClick={close}>
            Missões e Pedidos
          </NavLink>
          <NavLink to="/autos-infracao" className={linkClass} onClick={close}>
            Anexo A
          </NavLink>
          <NavLink
            to="/perfil"
            className={({ isActive }) => `${linkClass({ isActive })} md:hidden`}
            onClick={close}
          >
            Meu Perfil
          </NavLink>

          {user.role === "ADMIN" && (
            <>
              <div className="my-1 h-px bg-white/20 md:my-0 md:h-5 md:w-px md:self-center" />
              <NavLink to="/admin/categorias" className={linkClass} onClick={close}>
                Categorias
              </NavLink>
              <NavLink to="/admin/estoques" className={linkClass} onClick={close}>
                Estoques
              </NavLink>
              <NavLink to="/admin/usuarios" className={linkClass} onClick={close}>
                Usuários
              </NavLink>
              <NavLink to="/admin/importar" className={linkClass} onClick={close}>
                Importar materiais
              </NavLink>
            </>
          )}

          <div className="mt-2 flex items-center justify-between gap-3 border-t border-white/10 pt-2 text-sm text-red-50 md:hidden">
            <span className="flex items-center gap-2">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="h-7 w-7 rounded-full object-cover ring-1 ring-white/40" />
              ) : (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-xs font-bold text-white ring-1 ring-white/40">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              )}
              {user.name} <span className="text-gold-100">({user.role === "ADMIN" ? "admin" : "usuário"})</span>
            </span>
            <button
              onClick={logout}
              className="rounded-md bg-white/10 px-3 py-1.5 font-medium text-white hover:bg-white/20"
            >
              Sair
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
