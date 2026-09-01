import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import func2url from "../../backend/func2url.json";
import { getDevicePublicKey, clearDeviceKey } from "@/lib/deviceKey";

export type AuthRole = "client" | "provider";
export type AuthUser = { id: number; email: string; role: AuthRole; name: string; isAdmin?: boolean; publicId?: number };

type AuthResult = { ok: boolean; error?: string; need2fa?: boolean; challengeId?: string; emailHint?: string; sent?: boolean };

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  isAuthed: boolean;
  login: (email: string, password: string, lang?: string) => Promise<AuthResult>;
  verify2fa: (challengeId: string, code: string) => Promise<AuthResult>;
  resend2fa: (challengeId: string, lang?: string) => Promise<AuthResult>;
  register: (email: string, password: string, role: AuthRole, name: string) => Promise<AuthResult>;
  adminLogin: (password: string, role: AuthRole) => Promise<AuthResult>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  resetRequest: (email: string, lang?: string) => Promise<AuthResult>;
  resetConfirm: (email: string, code: string, password: string) => Promise<AuthResult>;
};

const TOKEN_KEY = "shchit_auth_token";
const AuthContext = createContext<AuthContextValue | null>(null);

// Действия, при которых создаётся новая сессия: к ним прикладываем открытый
// ключ устройства, чтобы сервер привязал сессию к этому браузеру.
const SESSION_ACTIONS = new Set(["login", "register", "admin_login", "verify_2fa"]);

async function callAuth(payload: Record<string, unknown>, token?: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["X-Auth-Token"] = token;
  if (SESSION_ACTIONS.has(String(payload.action || ""))) {
    const pub = await getDevicePublicKey();
    if (pub) payload = { ...payload, devicePubKey: pub };
  }
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

  const login = useCallback(async (email: string, password: string, lang = "ru"): Promise<AuthResult> => {
    const { res, data } = await callAuth({ action: "login", email, password, lang });
    if (res.ok && data.need2fa) {
      return { ok: false, need2fa: true, challengeId: data.challengeId, emailHint: data.emailHint, sent: data.sent };
    }
    if (res.ok && data.token) {
      localStorage.setItem(TOKEN_KEY, data.token);
      setUser(data.user);
      return { ok: true };
    }
    return { ok: false, error: data.error || "error" };
  }, []);

  const verify2fa = useCallback(async (challengeId: string, code: string): Promise<AuthResult> => {
    const { res, data } = await callAuth({ action: "verify_2fa", challengeId, code });
    if (res.ok && data.token) {
      localStorage.setItem(TOKEN_KEY, data.token);
      setUser(data.user);
      return { ok: true };
    }
    return { ok: false, error: data.error || "error" };
  }, []);

  const resend2fa = useCallback(async (challengeId: string, lang = "ru"): Promise<AuthResult> => {
    const { res, data } = await callAuth({ action: "resend_2fa", challengeId, lang });
    if (res.ok && data.challengeId) return { ok: true, challengeId: data.challengeId, sent: data.sent };
    return { ok: false, error: data.error || "error" };
  }, []);

  const register = useCallback(
    async (email: string, password: string, role: AuthRole, name: string): Promise<AuthResult> => {
      const { res, data } = await callAuth({ action: "register", email, password, role, name, consent: true, consentVersion: "1.0" });
      if (res.ok && data.token) {
        localStorage.setItem(TOKEN_KEY, data.token);
        setUser(data.user);
        return { ok: true };
      }
      return { ok: false, error: data.error || "error" };
    },
    []
  );

  const adminLogin = useCallback(async (password: string, role: AuthRole): Promise<AuthResult> => {
    const { res, data } = await callAuth({ action: "admin_login", password, role });
    if (res.ok && data.token) {
      localStorage.setItem(TOKEN_KEY, data.token);
      setUser(data.user);
      return { ok: true };
    }
    return { ok: false, error: data.error || "error" };
  }, []);

  // Восстановление пароля. Ответ на запрос кода всегда успешный — сервер
  // намеренно не говорит, зарегистрирована почта или нет.
  const resetRequest = useCallback(async (email: string, lang?: string): Promise<AuthResult> => {
    const { res, data } = await callAuth({ action: "reset_request", email, lang });
    if (res.ok) return { ok: true };
    return { ok: false, error: data.error || "error" };
  }, []);

  const resetConfirm = useCallback(async (email: string, code: string, password: string): Promise<AuthResult> => {
    const { res, data } = await callAuth({ action: "reset_confirm", email, code, password });
    if (res.ok) return { ok: true };
    return { ok: false, error: data.error || "error" };
  }, []);

  const logout = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    if (token) await callAuth({ action: "logout" }, token).catch(() => {});
    // Ключ устройства больше не нужен: на общем компьютере он не должен
    // оставаться после выхода.
    await clearDeviceKey().catch(() => {});
  }, []);

  // Выход на всех устройствах: гасит все сессии пользователя на сервере.
  // Нужен, если есть подозрение, что доступом завладел кто-то ещё.
  const logoutAll = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    if (token) await callAuth({ action: "logout_all" }, token).catch(() => {});
    await clearDeviceKey().catch(() => {});
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isAuthed: !!user, login, verify2fa, resend2fa, register, adminLogin, logout, logoutAll, resetRequest, resetConfirm }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}