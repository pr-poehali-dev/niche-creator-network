import { useCallback, useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { useLang } from "@/lib/i18n";
import { authHeaders } from "@/lib/authToken";
import { L, type LS } from "@/lib/shared";
import func2url from "../../../backend/func2url.json";

type Blocked = { userId: number; name: string; provider: { name: LS } | null };

// Приватность в сообществе: скрыть свой статус «в сети» и управлять
// заблокированными. Обе настройки есть в любой зрелой соцсети, а для людей,
// чья работа связана с риском, они не опция, а необходимость.
//
// Блок свёрнут по умолчанию: это настройка «один раз и забыл», она не должна
// занимать место над перепиской.
export default function PrivacyControls({ refreshKey = 0 }: { refreshKey?: number }) {
  const { tr, lang } = useLang();
  const [open, setOpen] = useState(false);
  const [showOnline, setShowOnline] = useState<boolean | null>(null);
  const [blocked, setBlocked] = useState<Blocked[] | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    fetch(func2url["notifications"], { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d && typeof d.showOnline === "boolean") setShowOnline(d.showOnline); })
      .catch(() => {});
    fetch(`${func2url["friends"]}?action=blocked`, { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setBlocked(d && Array.isArray(d.blocked) ? d.blocked : []))
      .catch(() => setBlocked([]));
  }, []);

  useEffect(() => { if (open) load(); }, [open, load, refreshKey]);

  const toggleOnline = async () => {
    if (showOnline === null) return;
    const next = !showOnline;
    setBusy(true);
    setShowOnline(next);
    try {
      const r = await fetch(func2url["notifications"], {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ action: "set_show_online", enabled: next }),
      });
      if (!r.ok) setShowOnline(!next);
    } catch {
      setShowOnline(!next);
    } finally {
      setBusy(false);
    }
  };

  const unblock = async (userId: number) => {
    await fetch(func2url["friends"], {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ action: "unblock", targetUserId: userId }),
    }).catch(() => {});
    setBlocked((prev) => (prev ? prev.filter((b) => b.userId !== userId) : prev));
  };

  return (
    <div className="border border-border rounded-sm bg-card">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center gap-2 p-4 sm:px-6 text-start"
      >
        <Icon name="Lock" size={14} className="text-gold" />
        <span className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest flex-1">{tr("privTitle")}</span>
        <Icon name={open ? "ChevronUp" : "ChevronDown"} size={16} className="text-muted-foreground" />
      </button>

      {open && (
        <div className="px-4 sm:px-6 pb-5 space-y-5">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <div className="text-sm text-foreground font-semibold">{tr("privOnlineTitle")}</div>
              <div className="text-[11px] text-muted-foreground leading-relaxed">{tr("privOnlineHint")}</div>
            </div>
            <button
              role="switch"
              aria-checked={!!showOnline}
              aria-label={tr("privOnlineTitle")}
              onClick={toggleOnline}
              disabled={busy || showOnline === null}
              aria-busy={showOnline === null}
              // Пока настройка не загрузилась, переключатель не показывает
              // ни «вкл», ни «выкл» — иначе человек видел «выключено» и
              // решал, что его статус скрыт, хотя он виден всем.
              className={`relative w-11 h-6 rounded-full shrink-0 transition-colors disabled:opacity-60 ${showOnline === null ? "bg-secondary border border-border animate-pulse" : showOnline ? "bg-gold" : "bg-secondary border border-border"}`}
            >
              {showOnline !== null && (
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-background shadow transition-all ${showOnline ? "start-[22px]" : "start-0.5"}`} />
              )}
            </button>
          </div>

          <div>
            <div className="text-sm text-foreground font-semibold mb-1">{tr("privBlockedTitle")}</div>
            <div className="text-[11px] text-muted-foreground leading-relaxed mb-3">{tr("privBlockedHint")}</div>
            {blocked === null ? (
              <div className="text-[11px] text-muted-foreground flex items-center gap-1.5"><Icon name="Loader" size={12} className="animate-spin" />{tr("loading")}</div>
            ) : blocked.length === 0 ? (
              <div className="text-[11px] text-muted-foreground italic">{tr("privBlockedEmpty")}</div>
            ) : (
              <ul className="space-y-2">
                {blocked.map((b) => (
                  <li key={b.userId} className="flex items-center gap-3 p-2.5 border border-border rounded-sm">
                    <Icon name="Ban" size={14} className="text-muted-foreground shrink-0" />
                    <span className="flex-1 text-sm text-foreground truncate">{b.provider ? L(b.provider.name, lang) || b.name : b.name}</span>
                    <button onClick={() => unblock(b.userId)} className="text-xs font-montserrat font-semibold text-gold hover:underline shrink-0 px-2 py-1">
                      {tr("privUnblock")}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
