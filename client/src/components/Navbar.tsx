import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-2 text-sm font-medium transition ${
    isActive ? "bg-white text-brand-800 shadow-sm" : "text-red-50 hover:bg-white/10"
  }`;

export function Navbar() {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <nav className="border-b-4 border-gold-500 bg-gradient-to-r from-brand-800 via-brand-700 to-brand-800 shadow-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3">
        <div className="flex items-center gap-3 flex-wrap">
          <img src="/logo-cbmrs.png" alt="Brasão CBMRS" className="h-11 w-11 rounded-md shadow ring-1 ring-white/30" />
          <div className="mr-2 leading-tight">
            <p className="text-sm font-bold uppercase tracking-wide text-white">CBMRS</p>
            <p className="text-[11px] text-gold-100">Cautelas B4</p>
          </div>
          <NavLink to="/" end className={linkClass}>
            Materiais
          </NavLink>
          <NavLink to="/cautelas" className={linkClass}>
            Cautelas
          </NavLink>
          <NavLink to="/minhas-cautelas" className={linkClass}>
            Minhas Cautelas
          </NavLink>
          <NavLink to="/diretorio" className={linkClass}>
            Diretório
          </NavLink>
          <NavLink to="/missoes-pedidos" className={linkClass}>
            Missões e Pedidos
          </NavLink>
          {user.role === "ADMIN" && (
            <>
              <NavLink to="/admin/categorias" className={linkClass}>
                Categorias
              </NavLink>
              <NavLink to="/admin/estoques" className={linkClass}>
                Estoques
              </NavLink>
              <NavLink to="/admin/usuarios" className={linkClass}>
                Usuários
              </NavLink>
            </>
          )}
        </div>
        <div className="flex items-center gap-3 text-sm text-red-50">
          <span>
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
    </nav>
  );
}
