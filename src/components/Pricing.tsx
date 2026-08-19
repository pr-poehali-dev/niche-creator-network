import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { useLang, t } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { authHeaders } from "@/lib/authToken";
import { useGeo } from "@/lib/geo";
import ErrorBoundary from "@/components/ErrorBoundary";
import { downloadReceipt } from "@/lib/receipt";
import { trackGoal, GOALS } from "@/lib/analytics";
import { parsePrice, type Section } from "@/lib/shared";
import func2url from "../../backend/func2url.json";

export type PayPlan = { name: keyof typeof t; price: keyof typeof t };

const PLAN_KEY_MAP: Record<string, string> = {
  planStartName: "start",
  planProName: "pro",
  planPremiumName: "premium",
  planChopName: "chop",
};

export function PaymentModal({ plan, onClose, defaultEmail = "", slug = "" }: { plan: PayPlan; onClose: () => void; defaultEmail?: string; slug?: string }) {
  const { lang, tr } = useLang();
  const { geo } = useGeo();
  const [method, setMethod] = useState<"card" | "sbp">("card");
  const [status, setStatus] = useState<"form" | "processing" | "success">("form");
  const [email, setEmail] = useState(defaultEmail);
  const [emailState, setEmailState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [autoSent, setAutoSent] = useState(false);
  const [period, setPeriod] = useState<"month" | "year">("month");
  const [quote, setQuote] = useState<{ currency: string; amount: number; provider: string; countryCode: string; promo?: boolean; promoDiscount?: number; promoUntil?: string; fullAmount?: number } | null>(null);
  const [payErr, setPayErr] = useState("");

  const planKey = PLAN_KEY_MAP[plan.name as string] || "pro";

  useEffect(() => {
    let alive = true;
    fetch(func2url["create-payment"], {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "quote", plan: planKey, period, countryCode: geo?.countryCode || "" }),
    })
      .then((r) => r.json())
      .then((d) => { if (alive && d && d.currency) setQuote(d); })
      .catch(() => {});
    return () => { alive = false; };
  }, [planKey, period, geo?.countryCode]);

  const isForeign = !!quote && quote.countryCode !== "RU";
  const fmtCurrency = (amount: number, currency: string) => {
    try {
      return new Intl.NumberFormat(lang === "ru" ? "ru-RU" : "en-US", { style: "currency", currency, maximumFractionDigits: currency === "RUB" ? 0 : 2 }).format(amount);
    } catch {
      return `${Math.round(amount).toLocaleString(lang === "ru" ? "ru-RU" : "en-US")} ${currency || ""}`.trim();
    }
  };
  const localAmountStr = quote ? fmtCurrency(quote.amount, quote.currency) : null;

  // Parse the monthly price string ("2 490 ₽" / "from $90") into number + currency formatting
  const priceStr = String(tr(plan.price) ?? "");
  const priceNum = parseFloat(priceStr.replace(/[^\d.,]/g, "").replace(/\s/g, "").replace(",", ".")) || 0;
  const fmt = (n: number) => {
    const safe = Number.isFinite(n) ? n : 0;
    const rounded = Math.round(safe);
    const grouped = rounded.toLocaleString(lang === "ru" ? "ru-RU" : "en-US");
    return priceStr ? priceStr.replace(/[\d\s.,]+/, grouped) : `${grouped} ₽`;
  };
  const yearlyFull = priceNum * 12;
  const yearlyDiscounted = Math.round(yearlyFull * 0.83);
  const yearlySaving = Math.round(yearlyFull - yearlyDiscounted);

  // Промо-скидка 30% до 1 декабря 2026 (источник истины — бэкенд quote.promo)
  const promoActive = quote ? !!quote.promo : (new Date() < new Date("2026-12-01T00:00:00Z"));
  const promoPct = quote && quote.promoDiscount ? quote.promoDiscount : 30;
  const promoFactor = (100 - promoPct) / 100;

  const baseFull = period === "year" ? yearlyDiscounted : priceNum;
  const baseFinal = promoActive ? Math.round(baseFull * promoFactor) : baseFull;
  const amountStr = fmt(baseFinal);
  const amountFullStr = fmt(baseFull);

  const receipt = (to?: string) => ({
    receiptNo: "SN-" + new Date().toISOString().slice(0, 10).replace(/-/g, "") + "-" + Math.floor(Math.random() * 900 + 100),
    date: new Date().toLocaleDateString(lang === "ru" ? "ru-RU" : "en-US"),
    plan: tr(plan.name),
    period: period === "year" ? tr("payOneYear") : tr("payOneMonth"),
    amount: amountStr,
    payer: (to || email) || "",
    method: tr(method === "card" ? "payCard" : "paySbp"),
    lang: (lang === "ru" ? "ru" : "en") as "ru" | "en",
  });

  const sendTo = async (to: string) => {
    if (!to || !to.includes("@")) return;
    setEmailState("sending");
    try {
      const res = await fetch(func2url["send-receipt"], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...receipt(to), email: to }),
      });
      setEmailState(res.ok ? "sent" : "error");
    } catch {
      setEmailState("error");
    }
  };

  const pay = async () => {
    setPayErr("");
    setStatus("processing");
    try {
      const res = await fetch(func2url["create-payment"], {
        method: "POST",
        // Токен обязателен: сервер определяет по нему, чей профиль оплачивается.
        // Без этого раньше можно было оформить подписку на чужой аккаунт.
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ plan: planKey, period, email, slug, countryCode: geo?.countryCode || "", returnUrl: window.location.href }),
      });
      const d = await res.json().catch(() => ({}));
      const redirect = d.confirmationUrl || d.checkoutUrl;
      if (d.configured && typeof redirect === "string" && redirect) {
        window.location.assign(redirect);
        return;
      }
      // Платёжная система не вернула ссылку на оплату. Раньше здесь
      // показывался «успех» и отправлялась квитанция — это вводило человека
      // в заблуждение: он видел галочку и письмо, хотя деньги не списывались,
      // а доступ не открывался. Теперь честно сообщаем об ошибке и НЕ
      // засчитываем несостоявшуюся оплату в статистику.
      setStatus("form");
      // Понятные подсказки вместо технических кодов ошибок.
      if (res.status === 401) setPayErr(tr("payNeedLogin"));
      else if (res.status === 403) setPayErr(tr("payProvidersOnly"));
      else if (res.status === 429) setPayErr(tr("payTooMany"));
      else setPayErr(tr(d.configured ? "payError" : "payNotConfigured"));
    } catch {
      setStatus("form");
      setPayErr(tr("payError"));
    }
  };

  const sendEmail = () => sendTo(email);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md border border-gold/40 rounded-sm glass-card security-glow max-h-[90vh] overflow-y-auto">
        {status === "success" ? (
          <div className="p-7">
            <div className="text-center mb-6">
              <div className="w-16 h-16 gold-gradient rounded-full flex items-center justify-center mx-auto mb-5 glow-gold-sm">
                <Icon name="Check" size={32} className="text-[hsl(220,20%,6%)]" />
              </div>
              <h3 className="font-montserrat font-extrabold text-xl text-foreground mb-2">{tr("paySuccess")}</h3>
              <p className="text-sm text-muted-foreground">{tr("paySuccessDesc")}</p>
            </div>

            <div className="border border-border rounded-sm bg-card p-4 mb-4">
              {autoSent && emailState === "sending" ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                  <Icon name="Loader" size={16} className="animate-spin text-gold" />
                  {tr("payAutoSending")}
                </div>
              ) : emailState === "sent" ? (
                <>
                  <div className="flex items-center gap-2 text-sm text-green-400 py-2">
                    <Icon name="MailCheck" size={16} />
                    {autoSent ? `${tr("payAutoSent")} ${email}` : tr("payEmailSent")}
                  </div>
                  <button onClick={() => { setEmail(""); setAutoSent(false); setEmailState("idle"); }} className="text-xs text-gold hover:underline mt-1">
                    {tr("payResend")}
                  </button>
                </>
              ) : (
                <>
                  <label className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest block mb-2">{tr("payEmailLabel")}</label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setEmailState("idle"); }}
                      placeholder={tr("payEmailPlaceholder")}
                      className="flex-1 min-w-0 bg-secondary border border-border rounded-sm px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-gold transition-colors"
                    />
                    <button
                      onClick={sendEmail}
                      disabled={emailState === "sending" || !email.includes("@")}
                      className="shrink-0 gold-gradient text-[hsl(220,20%,6%)] px-4 py-2.5 text-xs font-montserrat font-bold rounded-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {emailState === "sending" ? <Icon name="Loader" size={14} className="animate-spin" /> : <Icon name="Send" size={14} />}
                      <span className="hidden sm:inline">{tr(emailState === "sending" ? "payEmailSending" : "payEmailSend")}</span>
                    </button>
                  </div>
                  {emailState === "error" && <div className="text-xs text-destructive mt-2">{tr("payEmailError")}</div>}
                </>
              )}
            </div>

            <button onClick={() => downloadReceipt(receipt())} className="w-full border border-gold text-gold py-2.5 text-sm font-montserrat font-semibold rounded-sm hover:bg-gold hover:text-[hsl(220,20%,6%)] transition-all flex items-center justify-center gap-2 mb-2.5">
              <Icon name="Download" size={15} />
              {tr("payDownloadPdf")}
            </button>
            <button onClick={onClose} className="w-full gold-gradient text-[hsl(220,20%,6%)] py-3 text-sm font-montserrat font-bold rounded-sm hover:opacity-90 transition-opacity">{tr("payDone")}</button>
          </div>
        ) : (
          <div className="p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="font-montserrat font-bold text-lg text-foreground">{tr("payTitle")}</h3>
                <p className="text-xs text-muted-foreground">{tr("paySubtitle")}</p>
              </div>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors"><Icon name="X" size={20} /></button>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4 p-1 bg-secondary rounded-sm">
              <button
                onClick={() => setPeriod("month")}
                className={`py-2.5 text-xs font-montserrat font-bold rounded-sm transition-all ${period === "month" ? "bg-card text-foreground shadow" : "text-muted-foreground hover:text-foreground"}`}
              >
                {tr("billMonthly")}
              </button>
              <button
                onClick={() => setPeriod("year")}
                className={`relative py-2.5 text-xs font-montserrat font-bold rounded-sm transition-all ${period === "year" ? "gold-gradient text-[hsl(220,20%,6%)]" : "text-muted-foreground hover:text-foreground"}`}
              >
                {tr("billYearly")}
                <span className={`absolute -top-2 end-1 text-[9px] px-1.5 py-0.5 rounded-sm font-bold ${period === "year" ? "bg-[hsl(220,20%,6%)] text-gold" : "bg-gold text-[hsl(220,20%,6%)]"}`}>−17%</span>
              </button>
            </div>

            <div className="border border-border rounded-sm bg-card p-4 mb-5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{tr("payPlan")}</span>
                <span className="font-montserrat font-semibold text-foreground">{tr(plan.name)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{tr("payPeriod")}</span>
                <span className="font-montserrat font-semibold text-foreground">{period === "year" ? tr("payOneYear") : tr("payOneMonth")}</span>
              </div>
              {period === "year" && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{tr("billYearSaveLine")}</span>
                  <span className="font-montserrat font-bold text-green-400">−{fmt(yearlySaving)}</span>
                </div>
              )}
              {promoActive && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1"><Icon name="Tag" size={12} className="text-green-400" />{tr("promoLabel")}</span>
                  <span className="font-montserrat font-bold text-green-400">−{promoPct}%</span>
                </div>
              )}
              <div className="divider-gold my-1" />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{tr("payAmount")}</span>
                <div className="text-end">
                  {promoActive ? (
                    <div className="text-xs text-muted-foreground line-through">{amountFullStr}</div>
                  ) : period === "year" ? (
                    <div className="text-xs text-muted-foreground line-through">{fmt(yearlyFull)}</div>
                  ) : null}
                  <span className="font-montserrat font-extrabold text-2xl text-gold">{amountStr}</span>
                  <span className="text-xs text-muted-foreground ms-1">{period === "year" ? tr("billPerYear") : tr("perMonth")}</span>
                  {isForeign && localAmountStr && (
                    <div className="text-[11px] text-muted-foreground mt-1 flex items-center justify-end gap-1"><Icon name="Globe" size={11} className="text-gold" />{tr("payApproxInCurrency")} {localAmountStr}</div>
                  )}
                </div>
              </div>
              {promoActive && (
                <div className="text-[11px] text-green-400 text-center pt-1">{tr("promoUntil")}</div>
              )}
            </div>

            {isForeign ? (
              <div className="border border-gold/30 rounded-sm bg-card/60 p-4 mb-5 flex items-start gap-3">
                <Icon name="ShieldCheck" size={16} className="text-gold mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">{tr("payForeignNote")}</p>
              </div>
            ) : (
            <>
            <div className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest mb-2">{tr("payMethod")}</div>
            <div className="grid grid-cols-2 gap-2 mb-5">
              {(["card", "sbp"] as const).map((m) => (
                <button key={m} onClick={() => setMethod(m)}
                  className={`flex items-center justify-center gap-2 py-2.5 text-xs font-montserrat font-semibold rounded-sm border transition-all ${method === m ? "border-gold text-gold bg-gold/10" : "border-border text-muted-foreground hover:text-foreground"}`}>
                  <Icon name={m === "card" ? "CreditCard" : "QrCode"} size={15} />
                  {tr(m === "card" ? "payCard" : "paySbp")}
                </button>
              ))}
            </div>

            {method === "card" ? (
              <div className="space-y-3 mb-5">
                <input placeholder="0000 0000 0000 0000" inputMode="numeric" className="w-full bg-secondary border border-border rounded-sm px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-gold transition-colors" />
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="MM / YY" className="w-full bg-secondary border border-border rounded-sm px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-gold transition-colors" />
                  <input placeholder="CVC" inputMode="numeric" className="w-full bg-secondary border border-border rounded-sm px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-gold transition-colors" />
                </div>
                <input placeholder={tr("payCardName")} className="w-full bg-secondary border border-border rounded-sm px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-gold transition-colors" />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 mb-5 py-4">
                <div className="w-36 h-36 bg-secondary border border-border rounded-sm flex items-center justify-center">
                  <Icon name="QrCode" size={90} className="text-gold" />
                </div>
                <p className="text-xs text-muted-foreground text-center max-w-[220px]">{tr("paySbpHint")}</p>
              </div>
            )}
            </>
            )}

            {payErr && (
              <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-sm px-3 py-2 mb-3">
                <Icon name="Info" size={14} className="shrink-0" />{payErr}
              </div>
            )}

            <button onClick={pay} disabled={status === "processing"}
              className="w-full gold-gradient text-[hsl(220,20%,6%)] py-3.5 text-sm font-montserrat font-bold rounded-sm hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2">
              {status === "processing" ? (
                <><Icon name="Loader" size={16} className="animate-spin" /> {tr("payProcessing")}</>
              ) : (
                <><Icon name="Lock" size={15} /> {tr("payButton")} {amountStr}</>
              )}
            </button>
            <div className="flex items-center justify-center gap-1.5 mt-3 text-[10px] text-muted-foreground">
              <Icon name="ShieldCheck" size={12} className="text-gold" />
              {tr("paySecure")}
            </div>
            <div className="text-center text-[10px] text-muted-foreground/70 mt-1">{tr("payDemo")}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// Парсит цену из строки перевода вида "4 900 ₽" / "$49" в число.

type PricingPlan = { name: keyof typeof t; price: keyof typeof t; enterprise: boolean };

// Калькулятор окупаемости подписки: клиент вводит средний чек заказа и
// сколько заказов ожидает в месяц — калькулятор считает точку окупаемости и прибыль.
function PricingCalculator({ plans, promoActive }: { plans: PricingPlan[]; promoActive: boolean }) {
  const { tr } = useLang();
  const payPlans = plans.filter((p) => !p.enterprise);
  const [planIdx, setPlanIdx] = useState(1); // по умолчанию — второй тариф (обычно самый популярный)
  const [avgCheck, setAvgCheck] = useState(15000);
  const [ordersMonth, setOrdersMonth] = useState(3);

  const plan = payPlans[Math.min(planIdx, payPlans.length - 1)];
  const rawPrice = parsePrice(tr(plan.price));
  const price = promoActive ? Math.round(rawPrice * 0.7) : rawPrice;

  const breakEvenOrders = avgCheck > 0 ? Math.ceil(price / avgCheck) : 0;
  const monthlyRevenue = avgCheck * ordersMonth;
  const monthlyProfit = monthlyRevenue - price;
  const isProfitable = monthlyProfit >= 0;

  const fmt = (n: number) => n.toLocaleString("ru-RU");

  return (
    <div className="mt-10 border border-gold/30 rounded-sm bg-card p-6 md:p-8 relative overflow-hidden">
      <div className="organic-blob w-64 h-64 -bottom-20 -start-20 bg-gold" />
      <div className="relative z-10 flex items-center gap-2 mb-1">
        <Icon name="Calculator" size={18} className="text-gold" />
        <h2 className="font-montserrat font-bold text-lg text-foreground">{tr("calcTitle")}</h2>
      </div>
      <p className="relative z-10 text-xs text-muted-foreground mb-6">{tr("calcSubtitle")}</p>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-5">
          <div>
            <label className="text-[11px] font-montserrat font-bold text-muted-foreground uppercase tracking-widest block mb-2">{tr("calcPlan")}</label>
            <div className="flex flex-wrap gap-2">
              {payPlans.map((p, i) => (
                <button
                  key={p.name}
                  onClick={() => setPlanIdx(i)}
                  className={`px-3 py-2 text-xs font-montserrat font-semibold rounded-sm border transition-all ${planIdx === i ? "gold-gradient text-[hsl(220,20%,6%)] border-transparent" : "border-border text-muted-foreground hover:border-gold hover:text-gold"}`}
                >
                  {tr(p.name)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[11px] font-montserrat font-bold text-muted-foreground uppercase tracking-widest block mb-2">
              {tr("calcAvgCheck")}: <span className="text-gold">{fmt(avgCheck)} ₽</span>
            </label>
            <input
              type="range" min={2000} max={100000} step={1000}
              value={avgCheck}
              onChange={(e) => setAvgCheck(Number(e.target.value))}
              className="w-full accent-gold"
            />
          </div>

          <div>
            <label className="text-[11px] font-montserrat font-bold text-muted-foreground uppercase tracking-widest block mb-2">
              {tr("calcOrdersMonth")}: <span className="text-gold">{ordersMonth}</span>
            </label>
            <input
              type="range" min={0} max={30} step={1}
              value={ordersMonth}
              onChange={(e) => setOrdersMonth(Number(e.target.value))}
              className="w-full accent-gold"
            />
          </div>
        </div>

        <div className="border border-border rounded-sm bg-secondary/30 p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{tr("calcSubCost")}</span>
            <span className="font-montserrat font-bold text-sm text-foreground">{fmt(price)} ₽/{tr("perMonthShort")}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{tr("calcBreakEven")}</span>
            <span className="font-montserrat font-bold text-sm text-gold">{breakEvenOrders} {tr("calcOrdersUnit")}</span>
          </div>
          <div className="divider-gold" />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{tr("calcMonthlyRevenue")}</span>
            <span className="font-montserrat font-semibold text-sm text-foreground">{fmt(monthlyRevenue)} ₽</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-montserrat font-semibold text-foreground">{tr("calcNetProfit")}</span>
            <span className={`font-montserrat font-extrabold text-xl ${isProfitable ? "text-green-400" : "text-destructive"}`}>
              {isProfitable ? "+" : ""}{fmt(monthlyProfit)} ₽
            </span>
          </div>
          <div className={`flex items-start gap-2 rounded-sm px-3 py-2.5 ${isProfitable ? "bg-green-500/10 border border-green-500/30" : "bg-destructive/10 border border-destructive/30"}`}>
            <Icon name={isProfitable ? "TrendingUp" : "Info"} size={14} className={`shrink-0 mt-0.5 ${isProfitable ? "text-green-400" : "text-destructive"}`} />
            <span className="text-[11px] text-foreground leading-relaxed">
              {isProfitable ? tr("calcProfitableNote") : tr("calcNeedMoreNote")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PricingSection({ setActive }: { setActive: (s: Section) => void }) {
  const { tr } = useLang();
  const { user } = useAuth();
  const [payPlan, setPayPlan] = useState<PayPlan | null>(null);
  const promoActive = new Date() < new Date("2026-12-01T00:00:00Z");

  useEffect(() => { trackGoal(GOALS.openPricing); }, []);
  const plans = [
    {
      name: "planStartName" as const,
      price: "planStartPrice" as const,
      for: "planStartFor" as const,
      featured: false,
      premium: false,
      enterprise: false,
      features: ["featProfile", "feat5cases", "featChat"] as const,
      muted: ["featCourses", "featPriority", "featTopPlacement", "featManager"] as const,
    },
    {
      name: "planProName" as const,
      price: "planProPrice" as const,
      for: "planProFor" as const,
      featured: true,
      premium: false,
      enterprise: false,
      features: ["featProfile", "feat20cases", "featChat", "featCourses", "featPriority"] as const,
      muted: ["featTopPlacement", "featManager"] as const,
    },
    {
      name: "planPremiumName" as const,
      price: "planPremiumPrice" as const,
      for: "planPremiumFor" as const,
      featured: false,
      premium: true,
      enterprise: false,
      features: ["featProfile", "featUnlimCases", "featChat", "featCourses", "featPriority", "featTopPlacement", "featBadge", "featPremiumCard", "featPremiumTop", "featPremiumAnalytics"] as const,
      muted: [] as const,
    },
    {
      name: "planChopName" as const,
      price: "planChopPrice" as const,
      for: "planChopFor" as const,
      featured: false,
      premium: false,
      enterprise: false,
      chop: true,
      features: ["featProfile", "featUnlimCases", "featChat", "featCourses", "featPriority", "featTopPlacement", "featBadge", "featPremiumCard", "featPremiumTop", "featChopVerified", "featChopTeam"] as const,
      muted: [] as const,
    },
    {
      name: "planEntName" as const,
      price: "planEntPrice" as const,
      for: "planEntFor" as const,
      featured: false,
      premium: false,
      enterprise: true,
      features: ["featProfile", "featUnlimCases", "featTopPlacement", "featBadge", "featManager", "featTeam", "featApi"] as const,
      muted: [] as const,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <div className="tag-security mb-3 inline-block">{tr("pricingTag")}</div>
        <h1 className="font-montserrat font-extrabold text-3xl md:text-4xl text-foreground mb-3 max-w-3xl mx-auto">{tr("pricingTitle")}</h1>
        <p className="text-muted-foreground text-sm max-w-2xl mx-auto">{tr("pricingDesc")}</p>
      </div>

      {promoActive && (
        <div className="border border-green-500/40 bg-green-500/10 rounded-sm p-4 mb-8 max-w-3xl mx-auto flex items-center gap-3 justify-center text-center">
          <Icon name="BadgePercent" size={22} className="text-green-400 shrink-0" />
          <div>
            <div className="font-montserrat font-bold text-sm text-foreground">{tr("promoBannerTitle")}</div>
            <div className="text-xs text-muted-foreground">{tr("promoBannerText")}</div>
          </div>
        </div>
      )}

      {/* No-commission highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10 max-w-4xl mx-auto">
        {[
          { icon: "BadgePercent", title: "priceNoCommission" as const, desc: "priceNoCommissionDesc" as const },
          { icon: "HandCoins", title: "priceKeepAll" as const, desc: "priceKeepAllDesc" as const },
          { icon: "Tag", title: "priceFixed" as const, desc: "priceFixedDesc" as const },
        ].map((h) => (
          <div key={h.title} className="flex items-start gap-3 border border-gold/30 rounded-sm bg-card p-4">
            <div className="w-9 h-9 gold-gradient rounded flex items-center justify-center shrink-0">
              <Icon name={h.icon} size={16} className="text-[hsl(220,20%,6%)]" />
            </div>
            <div>
              <div className="font-montserrat font-bold text-sm text-foreground leading-tight">{tr(h.title)}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{tr(h.desc)}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5 stagger">
        {plans.map((p) => (
          <div
            key={p.name}
            className={`relative flex flex-col rounded-sm p-6 card-hover ${p.premium ? "border-2 border-gold security-glow ambient-gold bg-gradient-to-b from-gold/[0.07] to-card glow-gold-sm md:-mt-2 md:mb-2" : ("chop" in p && p.chop) ? "border-2 border-blue-500/60 security-glow bg-gradient-to-b from-blue-500/[0.06] to-card" : p.featured ? "border border-gold security-glow bg-card" : "border border-border bg-card"}`}
          >
            {p.premium && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 gold-gradient text-[hsl(220,20%,6%)] text-[10px] font-montserrat font-extrabold tracking-widest uppercase px-3 py-1 rounded-sm whitespace-nowrap flex items-center gap-1 shadow-lg">
                <Icon name="Crown" size={11} />{tr("bestChoice")}
              </div>
            )}
            {("chop" in p && p.chop) && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-[10px] font-montserrat font-extrabold tracking-widest uppercase px-3 py-1 rounded-sm whitespace-nowrap flex items-center gap-1 shadow-lg">
                <Icon name="ShieldCheck" size={11} />{tr("planChopBadge")}
              </div>
            )}
            {p.featured && !p.premium && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 badge-pro whitespace-nowrap flex items-center gap-1">
                <Icon name="Star" size={10} className="fill-current" />{tr("mostPopular")}
              </div>
            )}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-1">
                {p.premium && <Icon name="Crown" size={18} className="text-gold" />}
                <span className={`font-montserrat font-bold text-foreground ${p.premium ? "text-xl gold-text-gradient" : "text-lg"}`}>{tr(p.name)}</span>
              </div>
              <div className="text-xs text-muted-foreground">{tr(p.for)}</div>
              {p.featured && !p.premium && (
                <div className="inline-flex items-center gap-1 mt-2 text-[10px] font-montserrat font-semibold text-gold">
                  <Icon name="TrendingUp" size={11} />
                  {tr("planPopularProof")}
                </div>
              )}
            </div>
            <div className="mb-6">
              {promoActive && !p.enterprise ? (() => {
                const ps = tr(p.price);
                const n = parseFloat(ps.replace(/[^\d.,]/g, "").replace(/\s/g, "").replace(",", ".")) || 0;
                const discounted = Math.round(n * 0.7).toLocaleString("ru-RU");
                const discStr = ps.replace(/[\d\s.,]+/, discounted);
                return (
                  <div>
                    <span className="text-sm text-muted-foreground line-through me-2">{ps}</span>
                    <span className="inline-flex items-center text-[10px] font-montserrat font-bold text-green-400 bg-green-500/15 rounded-sm px-1.5 py-0.5 align-middle">−30%</span>
                    <div>
                      <span className={`font-grotesk font-bold text-gold tracking-tight ${p.premium ? "text-4xl" : "text-3xl"}`}>{discStr}</span>
                      <span className="text-xs text-muted-foreground ms-1">{tr("perMonth")}</span>
                    </div>
                  </div>
                );
              })() : (
                <div>
                  <span className={`font-grotesk font-bold text-gold tracking-tight ${p.premium ? "text-4xl" : "text-3xl"}`}>{tr(p.price)}</span>
                  {!p.enterprise && <span className="text-xs text-muted-foreground ms-1">{tr("perMonth")}</span>}
                </div>
              )}
              {!p.enterprise && (
                <div className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-montserrat font-semibold text-green-400">
                  <Icon name="Check" size={11} />
                  {tr("priceOnlySub")} · {tr("priceNoCommission")}
                </div>
              )}
            </div>
            {p.premium && (
              <div className="mb-5 -mt-1 rounded-sm bg-gold/10 border border-gold/30 px-3 py-2 flex items-start gap-2">
                <Icon name="Sparkles" size={13} className="text-gold mt-0.5 shrink-0" />
                <span className="text-[11px] text-foreground leading-snug">{tr("premiumValueNote")}</span>
              </div>
            )}
            <div className="divider-gold mb-5" />
            <div className="space-y-2.5 flex-1 mb-6">
              {p.features.map((f) => {
                const isExtra = (["featPremiumCard", "featPremiumTop", "featPremiumAnalytics"] as string[]).includes(f);
                return (
                  <div key={f} className="flex items-center gap-2">
                    <Icon name={isExtra ? "Sparkles" : "Check"} size={14} className={`shrink-0 ${isExtra ? "text-gold" : "text-gold"}`} />
                    <span className={`text-xs ${isExtra ? "text-gold font-semibold" : "text-foreground"}`}>{tr(f)}</span>
                  </div>
                );
              })}
              {p.muted.map((f) => (
                <div key={f} className="flex items-center gap-2 opacity-40">
                  <Icon name="X" size={14} className="text-muted-foreground shrink-0" />
                  <span className="text-xs text-muted-foreground line-through">{tr(f)}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => p.enterprise ? setActive("contacts") : (trackGoal(GOALS.startPayment), setPayPlan({ name: p.name, price: p.price }))}
              className={`w-full py-3 text-xs font-montserrat font-bold rounded-sm transition-all ${(p.featured || p.premium) ? "gold-gradient text-[hsl(220,20%,6%)] hover:opacity-90 glow-gold-sm" : "border border-gold text-gold hover:bg-gold hover:text-[hsl(220,20%,6%)]"}`}
            >
              {p.enterprise ? tr("contactSales") : p.premium ? tr("choosePremium") : tr("choosePlan")}
            </button>
            {!p.enterprise && (
              <div className="mt-2.5 flex items-center justify-center gap-1 text-[10px] text-muted-foreground text-center leading-tight">
                <Icon name="ShieldCheck" size={11} className="text-green-400 shrink-0" />
                <span>{tr("planCancelAnytime")}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground text-center">
        <Icon name="Lock" size={13} className="text-green-400 shrink-0" />
        <span>{tr("planGuarantee")}</span>
      </div>

      <PricingCalculator plans={plans} promoActive={promoActive} />

      {payPlan && (
        <ErrorBoundary fallback={null} onReset={() => setPayPlan(null)}>
          <PaymentModal plan={payPlan} onClose={() => setPayPlan(null)} defaultEmail={user?.email || ""} slug={user ? `provider-${user.id}` : ""} />
        </ErrorBoundary>
      )}

      {/* No-commission promise */}
      <div className="mt-10 border border-gold/30 rounded-sm glass-card p-6 flex flex-col md:flex-row items-start md:items-center gap-4 security-glow">
        <div className="w-10 h-10 gold-gradient rounded-full flex items-center justify-center shrink-0 glow-gold-sm">
          <Icon name="HandCoins" size={18} className="text-[hsl(220,20%,6%)]" />
        </div>
        <div>
          <div className="font-montserrat font-semibold text-sm text-foreground mb-1">{tr("pricingBottomTitle")}</div>
          <div className="text-xs text-muted-foreground">{tr("pricingBottomDesc")}</div>
        </div>
        <button onClick={() => setActive("contacts")} className="shrink-0 border border-border text-muted-foreground text-xs font-montserrat font-semibold px-4 py-2 hover:border-gold hover:text-gold transition-all rounded-sm ms-auto">
          {tr("contactUs")}
        </button>
      </div>
    </div>
  );
}