import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { Navbar } from "./components/Navbar";
import { Login } from "./pages/Login";
import { Estoque } from "./pages/Estoque";
import { ItemDetail } from "./pages/ItemDetail";
import { Cautelas } from "./pages/Cautelas";
import { MinhasCautelas } from "./pages/MinhasCautelas";
import { Diretorio } from "./pages/Diretorio";
import { Perfil } from "./pages/Perfil";
import { MissoesPedidos } from "./pages/MissoesPedidos";
import { AdminCategorias } from "./pages/AdminCategorias";
import { AdminEstoques } from "./pages/AdminEstoques";
import { AdminUsuarios } from "./pages/AdminUsuarios";
import { AdminImportar } from "./pages/AdminImportar";

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8 text-center text-slate-500">Carregando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AdminRoute({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8 text-center text-slate-500">Carregando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "ADMIN") return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <div className="relative min-h-screen">
      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-[length:520px] bg-no-repeat bg-right-top opacity-[0.05]"
        style={{ backgroundImage: "url('/logo-cbmrs.png')" }}
      />
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Estoque />
              </ProtectedRoute>
            }
          />
          <Route
            path="/itens/:id"
            element={
              <ProtectedRoute>
                <ItemDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cautelas"
            element={
              <ProtectedRoute>
                <Cautelas />
              </ProtectedRoute>
            }
          />
          <Route
            path="/minhas-cautelas"
            element={
              <ProtectedRoute>
                <MinhasCautelas />
              </ProtectedRoute>
            }
          />
          <Route
            path="/diretorio"
            element={
              <ProtectedRoute>
                <Diretorio />
              </ProtectedRoute>
            }
          />
          <Route
            path="/missoes-pedidos"
            element={
              <ProtectedRoute>
                <MissoesPedidos />
              </ProtectedRoute>
            }
          />
          <Route
            path="/perfil"
            element={
              <ProtectedRoute>
                <Perfil />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/categorias"
            element={
              <AdminRoute>
                <AdminCategorias />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/usuarios"
            element={
              <AdminRoute>
                <AdminUsuarios />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/estoques"
            element={
              <AdminRoute>
                <AdminEstoques />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/importar"
            element={
              <AdminRoute>
                <AdminImportar />
              </AdminRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
