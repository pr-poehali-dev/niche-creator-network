import Icon from "@/components/ui/icon";
import { useLang } from "@/lib/i18n";

export type ChecklistStep = {
  key: string;
  done: boolean;
  label: string;
  hint: string;
  icon: string;
  /** Куда ведёт кнопка «Заполнить» — вкладка кабинета. */
  goto?: string;
  /** Вес шага: контакты и специализация важнее, чем аватар. */
  weight: number;
};

/**
 * Чек-лист заполнения профиля.
 *
 * Раньше здесь стояло жёстко вписанное «85%» — одинаковое и для новичка
 * с пустой анкетой, и для полностью заполненного профиля. Человек видел
 * почти готовую полосу и не понимал, чего от него хотят.
 *
 * Теперь показываем честный процент и конкретный следующий шаг: что
 * сделать прямо сейчас, чтобы клиенты начали находить.
 */
export default function ProfileChecklist({ steps, onGo }: { steps: ChecklistStep[]; onGo?: (tab: string) => void }) {
  const { tr } = useLang();
  const total = steps.reduce((s, x) => s + x.weight, 0) || 1;
  const filled = steps.reduce((s, x) => s + (x.done ? x.weight : 0), 0);
  const percent = Math.round((filled / total) * 100);
  const left = steps.filter((s) => !s.done);
  const next = left[0];
  const complete = left.length === 0;

  return (
    <div className={`border rounded-sm p-6 ${complete ? "border-green-500/40 bg-green-500/[0.04]" : "border-gold/40 bg-gold/[0.03]"}`}>
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest">
          {tr("pdProfileFill")}
        </span>
        <span className={`text-sm font-montserrat font-bold ${complete ? "text-green-400" : "text-gold"}`}>{percent}%</span>
      </div>

      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${complete ? "bg-green-500" : "gold-gradient"}`}
          style={{ width: `${percent}%` }}
        />
      </div>

      {complete ? (
        <div className="flex items-start gap-2.5 mt-4 text-xs text-foreground leading-relaxed">
          <Icon name="PartyPopper" size={15} className="text-green-400 shrink-0 mt-0.5" />
          <span>{tr("pcDoneAll")}</span>
        </div>
      ) : (
        <>
          {/* Один следующий шаг вместо списка из десяти задач: так понятно,
              за что взяться сейчас, и не опускаются руки. */}
          <div className="mt-4 flex items-start gap-3 border border-border rounded-sm bg-card p-3.5">
            <div className="w-8 h-8 gold-gradient rounded-sm flex items-center justify-center shrink-0">
              <Icon name={next.icon} size={15} className="text-[hsl(28,20%,7%)]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-montserrat font-bold text-foreground">{next.label}</div>
              <div className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">{next.hint}</div>
            </div>
            {next.goto && onGo && (
              <button
                onClick={() => onGo(next.goto as string)}
                className="shrink-0 self-center border border-gold text-gold text-[11px] font-montserrat font-bold px-3 py-1.5 rounded-sm hover:bg-gold hover:text-[hsl(28,20%,7%)] transition-all"
              >
                {tr("pcFill")}
              </button>
            )}
          </div>

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
            {steps.map((s) => (
              <div key={s.key} className="flex items-center gap-2 text-[11px]">
                <Icon
                  name={s.done ? "CircleCheck" : "Circle"}
                  size={13}
                  className={s.done ? "text-green-400 shrink-0" : "text-muted-foreground/40 shrink-0"}
                />
                <span className={s.done ? "text-muted-foreground line-through" : "text-foreground"}>{s.label}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
