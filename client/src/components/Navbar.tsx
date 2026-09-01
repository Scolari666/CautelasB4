import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-2 text-sm font-medium ${
    isActive ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-100"
  }`;

export function Navbar() {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <nav className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3">
        <div className="flex items-center gap-1 flex-wrap">
          <span className="mr-3 text-lg font-bold text-brand-700">CautelasB4</span>
          <NavLink to="/" end className={linkClass}>
            Estoque
          </NavLink>
          <NavLink to="/cautelas" className={linkClass}>
            Cautelas
          </NavLink>
          <NavLink to="/minhas-cautelas" className={linkClass}>
            Minhas Cautelas
          </NavLink>
          {user.role === "ADMIN" && (
            <>
              <NavLink to="/admin/categorias" className={linkClass}>
                Categorias
              </NavLink>
              <NavLink to="/admin/usuarios" className={linkClass}>
                Usuários
              </NavLink>
            </>
          )}
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <span>
            {user.name} <span className="text-slate-400">({user.role === "ADMIN" ? "admin" : "usuário"})</span>
          </span>
          <button onClick={logout} className="rounded-md bg-slate-100 px-3 py-1.5 font-medium hover:bg-slate-200">
            Sair
          </button>
        </div>
      </div>
    </nav>
  );
}
