import { useLang } from "@/lib/i18n";

export type PresenceInfo = { status: "online" | "recent" | "today" | "week" | "long"; minutes?: number } | null | undefined;

// Зелёная точка на аватаре — как в Telegram, WhatsApp и LinkedIn. Показывает
// только «в сети прямо сейчас»: остальные статусы — текстом рядом с именем.
export function PresenceDot({ presence, className = "" }: { presence: PresenceInfo; className?: string }) {
  const { tr } = useLang();
  if (presence?.status !== "online") return null;
  return (
    <span
      role="img"
      aria-label={tr("presOnline")}
      className={`absolute -bottom-0.5 -end-0.5 w-3 h-3 rounded-full bg-green-500 ring-2 ring-card ${className}`}
    />
  );
}

// Подпись под именем: «в сети», «был 5 мин назад», «был сегодня»…
// Если человек скрыл статус — ничего не показываем, без намёков.
export function PresenceText({ presence }: { presence: PresenceInfo }) {
  const { tr } = useLang();
  if (!presence) return null;
  const text =
    presence.status === "online" ? tr("presOnline")
    : presence.status === "recent" ? tr("presRecent").replace("{n}", String(Math.max(1, presence.minutes ?? 1)))
    : presence.status === "today" ? tr("presToday")
    : presence.status === "week" ? tr("presWeek")
    : tr("presLong");
  return (
    <span className={`text-[10px] ${presence.status === "online" ? "text-green-400" : "text-muted-foreground"}`}>
      {text}
    </span>
  );
}
