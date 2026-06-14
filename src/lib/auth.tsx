import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import func2url from "../../backend/func2url.json";

export type AuthRole = "client" | "provider";
export type AuthUser = { id: number; email: string; role: AuthRole; name: string };

type AuthResult = { ok: boolean; error?: string };

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  isAuthed: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (email: string, password: string, role: AuthRole, name: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
};

const TOKEN_KEY = "shchit_auth_token";
const AuthContext = createContext<AuthContextValue | null>(null);

async function callAuth(payload: Record<string, unknown>, token?: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["X-Auth-Token"] = token;
  const res = await fetch(func2url["auth"], {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }
    let alive = true;
    callAuth({ action: "me" }, token)
      .then(({ res, data }) => {
        if (!alive) return;
        if (res.ok && data.user) setUser(data.user);
        else localStorage.removeItem(TOKEN_KEY);
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    const { res, data } = await callAuth({ action: "login", email, password });
    if (res.ok && data.token) {
      localStorage.setItem(TOKEN_KEY, data.token);
      setUser(data.user);
      return { ok: true };
    }
    return { ok: false, error: data.error || "error" };
  }, []);

  const register = useCallback(
    async (email: string, password: string, role: AuthRole, name: string): Promise<AuthResult> => {
      const { res, data } = await callAuth({ action: "register", email, password, role, name });
      if (res.ok && data.token) {
        localStorage.setItem(TOKEN_KEY, data.token);
        setUser(data.user);
        return { ok: true };
      }
      return { ok: false, error: data.error || "error" };
    },
    []
  );

  const logout = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    if (token) await callAuth({ action: "logout" }, token).catch(() => {});
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isAuthed: !!user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
