import { useCallback, useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { useLang } from "@/lib/i18n";
import { authHeaders } from "@/lib/authToken";
import { L, type LS } from "@/lib/shared";
import func2url from "../../../backend/func2url.json";

type Suggestion = {
  userId: number;
  publicId: number;
  name: string;
  mutual: number;
  reason: "mutual" | "same_title" | "same_city" | "top";
  provider: { name: LS; title: LS; avatar: string | null; verified: boolean } | null;
};

// «Возможно, вы знакомы» — горизонтальная лента карточек, как в LinkedIn и
// ВКонтакте. Главная проблема новичка в любой сети — пустота: он не знает,
// кого искать, и уходит. Рекомендации дают первые связи в одно касание.
//
// Почему лента, а не список: на телефоне она занимает одну строку высоты
// и не выталкивает вниз переписку — главное, ради чего сюда заходят.
export default function PeopleYouMayKnow({ onChanged }: { onChanged?: () => void }) {
  const { tr, lang } = useLang();
  const [items, setItems] = useState<Suggestion[] | null>(null);
  const [sent, setSent] = useState<Set<number>>(new Set());
  const [hidden, setHidden] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState<number | null>(null);

  const load = useCallback(() => {
    fetch(`${func2url["friends"]}?action=suggest`, { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setItems(d && Array.isArray(d.suggestions) ? d.suggestions : []))
      .catch(() => setItems([]));
  }, []);

  useEffect(() => { load(); }, [load]);

  const add = async (userId: number) => {
    setBusy(userId);
    try {
      const r = await fetch(func2url["friends"], {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ action: "request", targetUserId: userId }),
      });
      if (r.ok || r.status === 409) {
        setSent((prev) => new Set(prev).add(userId));
        onChanged?.();
      }
    } finally {
      setBusy(null);
    }
  };

  const visible = (items || []).filter((s) => !hidden.has(s.userId));
  if (!items || visible.length === 0) return null;

  const reasonText = (s: Suggestion) =>
    s.reason === "mutual" ? tr("pymkMutual").replace("{n}", String(s.mutual))
    : s.reason === "same_title" ? tr("pymkSameTitle")
    : s.reason === "same_city" ? tr("pymkSameCity")
    : tr("pymkTop");

  return (
    <section aria-labelledby="pymk-title" className="border border-border rounded-sm bg-card p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-1">
        <Icon name="Sparkles" size={14} className="text-gold" />
        <h3 id="pymk-title" className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest">{tr("pymkTitle")}</h3>
      </div>
      <p className="text-[11px] text-muted-foreground mb-4">{tr("pymkHint")}</p>

      <ul className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-1 px-1 scrollbar-thin">
        {visible.map((s) => {
          const name = s.provider ? L(s.provider.name, lang) || s.name : s.name;
          const isSent = sent.has(s.userId);
          return (
            <li key={s.userId} className="snap-start shrink-0 w-[168px] border border-border rounded-sm p-3 flex flex-col items-center text-center relative hover:border-gold/40 transition-colors">
              <button
                onClick={() => setHidden((prev) => new Set(prev).add(s.userId))}
                aria-label={tr("pymkHide")}
                className="absolute top-1 end-1 p-1.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Icon name="X" size={13} />
              </button>
              <div className="relative w-16 h-16 rounded-full overflow-hidden gold-gradient flex items-center justify-center mb-2 mt-1">
                {s.provider?.avatar
                  ? <img src={s.provider.avatar} alt="" loading="lazy" className="w-full h-full object-cover" />
                  : <span className="font-montserrat font-bold text-xl text-[hsl(28,20%,7%)]">{(name || "?").charAt(0).toUpperCase()}</span>}
              </div>
              <div className="text-sm font-montserrat font-semibold text-foreground w-full truncate flex items-center justify-center gap-1">
                <span className="truncate">{name}</span>
                {s.provider?.verified && <Icon name="BadgeCheck" size={13} className="text-gold shrink-0" aria-label={tr("pymkVerified")} />}
              </div>
              <div className="text-[11px] text-muted-foreground w-full truncate min-h-[16px]">
                {s.provider ? L(s.provider.title, lang) : ""}
              </div>
              <div className="text-[10px] text-gold/80 mt-1 mb-3 flex items-center gap-1 min-h-[14px]">
                <Icon name={s.reason === "mutual" ? "Users" : s.reason === "same_city" ? "MapPin" : "Briefcase"} size={11} />
                <span className="truncate">{reasonText(s)}</span>
              </div>
              <button
                onClick={() => add(s.userId)}
                disabled={isSent || busy === s.userId}
                className={`mt-auto w-full text-xs font-montserrat font-bold py-2 rounded-sm flex items-center justify-center gap-1.5 transition-colors ${isSent ? "border border-border text-muted-foreground" : "gold-gradient text-[hsl(28,20%,7%)]"} disabled:cursor-default`}
              >
                <Icon name={isSent ? "Check" : busy === s.userId ? "Loader" : "UserPlus"} size={13} className={busy === s.userId ? "animate-spin" : ""} />
                {tr(isSent ? "pymkSent" : "pdAddFriend")}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
