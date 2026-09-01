import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api } from "../api/client";
import { User } from "../types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, matricula?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("cautelasb4_token");
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get<User>("/auth/me")
      .then((res) => setUser(res.data))
      .catch(() => {
        localStorage.removeItem("cautelasb4_token");
      })
      .finally(() => setLoading(false));
  }, []);

  function applySession(token: string, user: User) {
    localStorage.setItem("cautelasb4_token", token);
    localStorage.setItem("cautelasb4_user", JSON.stringify(user));
    setUser(user);
  }

  async function login(email: string, password: string) {
    const res = await api.post("/auth/login", { email, password });
    applySession(res.data.token, res.data.user);
  }

  async function register(name: string, email: string, password: string, matricula?: string) {
    const res = await api.post("/auth/register", { name, email, password, matricula });
    applySession(res.data.token, res.data.user);
  }

  function logout() {
    localStorage.removeItem("cautelasb4_token");
    localStorage.removeItem("cautelasb4_user");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
