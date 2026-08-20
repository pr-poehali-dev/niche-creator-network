/**
 * Автоматическая подпись всех обращений к нашему серверу.
 *
 * Вместо того чтобы дописывать подпись в каждый из десятков запросов (и
 * однажды забыть про один), перехватываем fetch один раз при старте
 * приложения. Любой запрос к функциям проекта, где есть токен входа,
 * получает подпись устройства.
 *
 * Если браузер не умеет нужную криптографию — запрос уходит как раньше,
 * просто без подписи. Ничего не ломается.
 */

import { signRequest } from "@/lib/deviceKey";

const FUNCTIONS_HOST = "functions.poehali.dev";

let installed = false;

export function installSecureFetch(): void {
  if (installed || typeof window === "undefined" || !window.fetch) return;
  installed = true;

  const original = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    let url = "";
    try {
      url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    } catch {
      return original(input as RequestInfo, init);
    }

    // Подписываем только обращения к своим функциям и только когда
    // пользователь авторизован: гостевым запросам подпись не нужна.
    if (!url.includes(FUNCTIONS_HOST)) return original(input as RequestInfo, init);

    const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined));
    if (!headers.has("X-Auth-Token")) return original(input as RequestInfo, init);

    try {
      const signed = await signRequest();
      if (signed) {
        headers.set("X-Device-Sig", signed.sig);
        headers.set("X-Device-Ts", signed.ts);
      }
    } catch {
      /* подпись не обязательна — не мешаем работе */
    }

    if (input instanceof Request) {
      return original(new Request(input, { headers }));
    }
    return original(input as RequestInfo, { ...init, headers });
  };
}
