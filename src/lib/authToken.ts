const TOKEN_KEY = "shchit_auth_token";

/** Токен текущей сессии из localStorage (или null). */
export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/** Заголовки с авторизацией для защищённых запросов к backend. */
export function authHeaders(base: Record<string, string> = {}): Record<string, string> {
  const token = getAuthToken();
  return token ? { ...base, "X-Auth-Token": token } : base;
}
