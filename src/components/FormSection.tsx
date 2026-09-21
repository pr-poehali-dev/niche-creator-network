import { useState, type ReactNode } from "react";
import Icon from "@/components/ui/icon";

/**
 * Сворачиваемый блок формы.
 *
 * Анкета специалиста — это девять разнородных групп полей подряд: от пола
 * и возраста до часового пояса. Одним сплошным полотном она пугает: не
 * видно ни начала, ни конца, непонятно, что обязательно, а что нет.
 *
 * Здесь каждая группа свёрнута в строку с подписью и отметкой «заполнено».
 * Человек открывает то, чем занимается сейчас, и видит прогресс.
 */
export default function FormSection({
  icon,
  title,
  hint,
  done,
  defaultOpen = false,
  children,
}: {
  icon: string;
  title: string;
  hint?: string;
  done?: boolean;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`border rounded-sm transition-colors ${open ? "border-gold/40 bg-card" : "border-border bg-card"}`}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-start"
      >
        <div className={`w-8 h-8 rounded-sm flex items-center justify-center shrink-0 ${done ? "bg-green-500/15" : "bg-secondary"}`}>
          <Icon name={done ? "Check" : icon} size={15} className={done ? "text-green-400" : "text-gold"} />
        </div>
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-montserrat font-bold text-foreground">{title}</span>
          {hint && <span className="block text-[11px] text-muted-foreground truncate mt-0.5">{hint}</span>}
        </span>
        <Icon name={open ? "ChevronUp" : "ChevronDown"} size={16} className="text-muted-foreground shrink-0" />
      </button>
      {open && <div className="px-4 pb-4 pt-1 space-y-4 animate-fade-in">{children}</div>}
    </div>
  );
}
