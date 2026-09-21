import Icon from "@/components/ui/icon";

/**
 * Пустое состояние раздела.
 *
 * Раньше на месте пустого списка стояла серая строчка вроде «Нет заявок».
 * Человек видел тупик и не понимал, он что-то сделал не так или просто
 * ещё рано. Здесь — объяснение и понятное следующее действие.
 */
export default function EmptyState({
  icon,
  title,
  text,
  actionLabel,
  onAction,
  tone = "neutral",
}: {
  icon: string;
  title: string;
  text: string;
  actionLabel?: string;
  onAction?: () => void;
  tone?: "neutral" | "gold";
}) {
  return (
    <div className={`border border-dashed rounded-sm py-12 px-6 flex flex-col items-center text-center ${tone === "gold" ? "border-gold/40 bg-gold/[0.03]" : "border-border bg-card/50"}`}>
      <div className={`w-14 h-14 rounded-sm flex items-center justify-center mb-4 ${tone === "gold" ? "gold-gradient" : "bg-secondary"}`}>
        <Icon name={icon} size={24} className={tone === "gold" ? "text-[hsl(28,20%,7%)]" : "text-muted-foreground"} />
      </div>
      <div className="font-montserrat font-bold text-sm text-foreground mb-1.5">{title}</div>
      <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">{text}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-5 gold-gradient text-[hsl(28,20%,7%)] px-5 py-2.5 text-xs font-montserrat font-bold rounded-sm"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
