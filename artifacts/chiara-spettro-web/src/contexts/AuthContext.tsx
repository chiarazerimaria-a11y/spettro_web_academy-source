import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  avatarType: string;
  avatarUrl?: string | null;
  rank: string;
  totalPoints: number;
  machinesSolved: number;
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, avatarType: string) => Promise<void>;
  updateProfile: (username: string, avatarUrl?: string | null) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);
const STORAGE_KEY = "spettro_user";
const BASE = import.meta.env.BASE_URL;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setUser(JSON.parse(stored));
    } catch {}
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch(`${BASE}api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al iniciar sesión");
    setUser(data.user);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user));
  };

  const register = async (username: string, email: string, password: string, avatarType: string) => {
    const res = await fetch(`${BASE}api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password, avatarType }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al registrarse");
    setUser(data.user);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user));
  };

  const updateProfile = async (username: string, avatarUrl?: string | null) => {
    if (!user) throw new Error("No hay sesión activa");
    const res = await fetch(`${BASE}api/auth/profile`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: user.id, username, avatarUrl }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al actualizar perfil");
    const updated = { ...user, ...data.user };
    setUser(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, updateProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
