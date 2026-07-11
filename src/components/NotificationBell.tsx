import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { useLang } from "@/lib/i18n";
import func2url from "../../backend/func2url.json";

const NOTIF_URL = (func2url as Record<string, string>)["notifications"];

type Notif = {
  id: number;
  type: string;
  title: string;
  body: string;
  link: string | null;
  isRead: boolean;
  createdAt: string | null;
};

// Иконка по типу уведомления.
const TYPE_ICON: Record<string, string> = {
  system: "Info",
  message: "MessageSquare",
  terms: "FileText",
  price: "Tag",
  task: "Briefcase",
  community: "Users",
};

function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const token = (typeof window !== "undefined" && localStorage.getItem("shchit_auth_token")) || "";
  return { "X-Auth-Token": token, ...extra };
}

export default function NotificationBell() {
  const { tr } = useLang();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(() => {
    if (!NOTIF_URL) return;
    fetch(NOTIF_URL, { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.notifications)) setItems(d.notifications);
        if (typeof d.unread === "number") setUnread(d.unread);
        if (typeof d.emailEnabled === "boolean") setEmailEnabled(d.emailEnabled);
      })
      .catch(() => {});
  }, []);

  // Первичная загрузка и мягкий опрос каждые 60 секунд.
  useEffect(() => {
    load();
    const timer = setInterval(load, 60000);
    return () => clearInterval(timer);
  }, [load]);

  // Закрытие панели по клику вне её области.
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const post = (payload: Record<string, unknown>) =>
    fetch(NOTIF_URL, { method: "POST", headers: authHeaders({ "Content-Type": "application/json" }), body: JSON.stringify(payload) });

  const markAllRead = async () => {
    setUnread(0);
    setItems((xs) => xs.map((x) => ({ ...x, isRead: true })));
    await post({ action: "mark_all_read" }).catch(() => {});
  };

  const markRead = async (id: number) => {
    setItems((xs) => xs.map((x) => (x.id === id ? { ...x, isRead: true } : x)));
    setUnread((u) => Math.max(0, u - 1));
    await post({ action: "mark_read", id }).catch(() => {});
  };

  const toggleEmail = async () => {
    const next = !emailEnabled;
    setEmailEnabled(next);
    await post({ action: "set_email", enabled: next }).catch(() => setEmailEnabled(!next));
  };

  const timeAgo = (iso: string | null) => {
    if (!iso) return "";
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return tr("notifJustNow");
    if (m < 60) return `${m} ${tr("notifMinAgo")}`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} ${tr("notifHourAgo")}`;
    return `${Math.floor(h / 24)} ${tr("notifDayAgo")}`;
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => { setOpen((o) => !o); if (!open) load(); }}
        aria-label={tr("notifAria")}
        className="relative flex items-center justify-center border border-border text-muted-foreground w-9 h-9 rounded-sm hover:border-gold hover:text-gold transition-all shrink-0"
      >
        <Icon name="Bell" size={16} />
        {unread > 0 && (
          <span className="absolute -top-1.5 -end-1.5 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-white text-[10px] font-bold flex items-center justify-center leading-none">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute end-0 mt-2 w-[320px] max-w-[92vw] bg-card border border-border rounded-sm shadow-xl shadow-black/40 z-[70] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="font-montserrat font-bold text-sm text-foreground">{tr("notifTitle")}</span>
            {items.some((x) => !x.isRead) && (
              <button onClick={markAllRead} className="text-[11px] text-gold hover:underline font-montserrat font-semibold">
                {tr("notifMarkAll")}
              </button>
            )}
          </div>

          <div className="max-h-[340px] overflow-y-auto">
            {items.length === 0 ? (
              <div className="py-10 flex flex-col items-center gap-2 text-center">
                <Icon name="BellOff" size={28} className="text-muted-foreground/30" />
                <span className="text-xs text-muted-foreground">{tr("notifEmpty")}</span>
              </div>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => !n.isRead && markRead(n.id)}
                  className={`w-full text-start flex gap-3 px-4 py-3 border-b border-border last:border-0 transition-colors hover:bg-secondary/40 ${n.isRead ? "" : "bg-gold/5"}`}
                >
                  <div className={`w-8 h-8 rounded-sm flex items-center justify-center shrink-0 ${n.isRead ? "bg-secondary text-muted-foreground" : "gold-gradient text-[hsl(220,20%,6%)]"}`}>
                    <Icon name={TYPE_ICON[n.type] || "Info"} fallback="Info" size={15} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-montserrat font-semibold text-xs text-foreground truncate flex-1">{n.title}</span>
                      {!n.isRead && <span className="w-2 h-2 rounded-full bg-gold shrink-0" />}
                    </div>
                    {n.body && <p className="text-[11px] text-muted-foreground leading-snug mt-0.5 line-clamp-2">{n.body}</p>}
                    <span className="text-[10px] text-muted-foreground/70 mt-1 block">{timeAgo(n.createdAt)}</span>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Настройка дублирования на почту */}
          <div className="px-4 py-3 border-t border-border bg-background/50">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs font-montserrat font-semibold text-foreground flex items-center gap-1.5">
                  <Icon name="Mail" size={13} className="text-gold" />{tr("notifEmailDup")}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{emailEnabled ? tr("notifEmailOn") : tr("notifEmailOff")}</div>
              </div>
              <button
                onClick={toggleEmail}
                role="switch"
                aria-checked={emailEnabled}
                className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${emailEnabled ? "bg-gold" : "bg-secondary border border-border"}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${emailEnabled ? "start-[22px]" : "start-0.5"}`} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
