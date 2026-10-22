import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { useLang } from "@/lib/i18n";

// Дата окончания акции −30% (совпадает с текстами promoUntil).
const PROMO_END = new Date("2026-12-01T00:00:00Z").getTime();

function getRemaining() {
  const diff = PROMO_END - Date.now();
  if (diff <= 0) return null;
  return { days: Math.ceil(diff / 86400000) };
}

/**
 * Баннер акции: срок указан честно — числом дней и датой окончания.
 *
 * Раньше здесь тикал секундомер. Он был законным: акция настоящая,
 * скидка списывается на сервере и действительно заканчивается 1 декабря
 * (регуляторы преследуют таймеры, которые сбрасываются или ведут к
 * фиктивному сроку, — это не наш случай). Заменили по другой причине:
 * бегущие секунды при сроке в несколько недель не дают информации, а
 * баннер закреплён под шапкой, и это постоянное движение в поле зрения
 * на каждой странице. Число дней и дата сообщают то же самое спокойно.
 */
export function UrgencyBanner({ onCta, sticky = false }: { onCta?: () => void; sticky?: boolean }) {
  const { tr } = useLang();
  const [time, setTime] = useState(getRemaining());

  // Обновляем раз в час — этого достаточно для счёта в днях.
  useEffect(() => {
    const timer = setInterval(() => setTime(getRemaining()), 3600000);
    return () => clearInterval(timer);
  }, []);

  if (!time) return null;

  return (
    <div className={`${sticky ? "sticky top-[var(--header-h,64px)]" : "relative"} z-40 gold-gradient shadow-lg shadow-black/20`}>
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-col sm:flex-row items-center justify-center gap-x-5 gap-y-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Icon name="BadgePercent" size={18} className="text-[hsl(28,20%,7%)] shrink-0" />
          <span className="font-montserrat font-bold text-xs sm:text-sm text-[hsl(28,20%,7%)]">{tr("urgencyPrefix")}</span>
        </div>
        <span className="font-montserrat font-semibold text-xs sm:text-sm text-[hsl(28,20%,7%)] tabular-nums">
          {tr("urgencyUntil")} · {tr("urgencyDaysLeft").replace("{n}", String(time.days))}
        </span>
        {onCta && (
          <button
            onClick={onCta}
            className="shrink-0 bg-[hsl(28,20%,7%)] text-gold px-4 min-h-[36px] rounded-sm font-montserrat font-bold text-xs hover:opacity-90 transition-opacity inline-flex items-center gap-1.5"
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