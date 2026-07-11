// Тонкая обёртка над Яндекс.Метрикой для отправки целевых событий (целей).
// Счётчик уже подключён в index.html (id 101026698). Здесь мы безопасно
// вызываем reachGoal — если Метрика по какой-то причине не загрузилась,
// код не падает.

const YM_COUNTER_ID = 101026698;

type YmFn = (id: number, action: string, goal?: string, params?: Record<string, unknown>) => void;

/**
 * Отправляет цель (конверсию) в Яндекс.Метрику.
 * @param goal — идентификатор цели (латиницей), например "signup_provider".
 * @param params — дополнительные параметры визита (необязательно).
 */
export function trackGoal(goal: string, params?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  try {
    const ym = (window as unknown as { ym?: YmFn }).ym;
    if (typeof ym === "function") {
      ym(YM_COUNTER_ID, "reachGoal", goal, params);
    }
  } catch {
    // Метрика недоступна (блокировщик/не загрузилась) — молча игнорируем.
  }
}

// Список используемых целей — единый источник правды, чтобы не плодить опечатки.
export const GOALS = {
  signupClient: "signup_client",
  signupProvider: "signup_provider",
  login: "login",
  openPricing: "open_pricing",
  startPayment: "start_payment",
  paymentSuccess: "payment_success",
  respondRequest: "respond_request",
  createRequest: "create_request",
  contactProvider: "contact_provider",
  openContacts: "open_contacts",
} as const;
