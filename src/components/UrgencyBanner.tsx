import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { useLang } from "@/lib/i18n";

// Дата окончания акции −30% (совпадает с текстами promoUntil).
const PROMO_END = new Date("2026-12-01T00:00:00Z").getTime();

function getRemaining() {
  const diff = PROMO_END - Date.now();
  if (diff <= 0) return null;
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  return { days, hours, mins, secs };
}

/**
 * Баннер срочности с обратным отсчётом (принцип дефицита).
 * Показывается вверху главной, мотивирует оформить подписку до конца акции.
 */
export function UrgencyBanner({ onCta, sticky = false }: { onCta?: () => void; sticky?: boolean }) {
  const { tr } = useLang();
  const [time, setTime] = useState(getRemaining());

  useEffect(() => {
    const timer = setInterval(() => setTime(getRemaining()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!time) return null;

  const pad = (n: number) => String(n).padStart(2, "0");
  const cell = (value: string, label: string) => (
    <div className="flex flex-col items-center min-w-[38px]">
      <span className="font-montserrat font-extrabold text-base sm:text-lg text-[hsl(220,20%,6%)] leading-none tabular-nums">{value}</span>
      <span className="text-[8px] uppercase tracking-wider text-[hsl(220,20%,6%)]/70 mt-0.5">{label}</span>
    </div>
  );

  return (
    <div className={`${sticky ? "sticky top-[var(--header-h,64px)]" : "relative"} z-40 gold-gradient shadow-lg shadow-black/20`}>
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-col sm:flex-row items-center justify-center gap-x-5 gap-y-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Icon name="BadgePercent" size={18} className="text-[hsl(220,20%,6%)] shrink-0" />
          <span className="font-montserrat font-bold text-xs sm:text-sm text-[hsl(220,20%,6%)]">{tr("urgencyPrefix")}</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          {cell(String(time.days), tr("urgencyDays"))}
          <span className="text-[hsl(220,20%,6%)]/50 font-bold">:</span>
          {cell(pad(time.hours), tr("urgencyHours"))}
          <span className="text-[hsl(220,20%,6%)]/50 font-bold">:</span>
          {cell(pad(time.mins), tr("urgencyMins"))}
          <span className="text-[hsl(220,20%,6%)]/50 font-bold">:</span>
          {cell(pad(time.secs), tr("urgencySecs"))}
          <span className="text-[10px] text-[hsl(220,20%,6%)]/70 ms-1 hidden sm:inline">{tr("urgencyEnds")}</span>
        </div>
        {onCta && (
          <button
            onClick={onCta}
            className="shrink-0 bg-[hsl(220,20%,6%)] text-gold px-4 py-1.5 rounded-sm font-montserrat font-bold text-xs hover:opacity-90 transition-opacity inline-flex items-center gap-1.5"
          >
            {tr("urgencyCta")}
            <Icon name="ArrowRight" size={13} />
          </button>
        )}
      </div>
    </div>
  );
}

export default UrgencyBanner;