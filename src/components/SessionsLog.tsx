import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { useLang } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { authHeaders } from "@/lib/authToken";
import func2url from "../../backend/func2url.json";

type SessionItem = {
  current: boolean;
  device: string;
  ip: string;
  createdAt: string | null;
  lastSeenAt: string | null;
  active: boolean;
};

/**
 * Журнал входов в аккаунт: показывает, с каких устройств заходили.
 * Помогает пользователю самому заметить чужую активность — это часто
 * быстрее, чем любая автоматическая защита.
 */
export default function SessionsLog() {
  const { tr, lang } = useLang();
  const { logoutAll } = useAuth();
  const [items, setItems] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(func2url["auth"], {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ action: "sessions" }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        if (Array.isArray(d.sessions)) setItems(d.sessions);
        else setFailed(true);
      })
      .catch(() => alive && setFailed(true))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const fmt = (iso: string | null) => {
    if (!iso) return "—";
    const d = new Date(iso.endsWith("Z") ? iso : iso + "Z");
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString(lang === "ru" ? "ru-RU" : "en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const active = items.filter((s) => s.active);

  return (
    <div className="border border-border rounded-sm bg-card p-5">
      <div className="flex items-center gap-2 mb-1">
        <Icon name="MonitorSmartphone" size={16} className="text-gold" />
        <h3 className="font-montserrat font-bold text-sm text-foreground">{tr("sessDevices")}</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4">{tr("sessHint")}</p>

      {loading && <div className="text-xs text-muted-foreground py-3">{tr("sessLoading")}</div>}

      {!loading && failed && (
        <div className="text-xs text-muted-foreground py-3">{tr("sessError")}</div>
      )}

      {!loading && !failed && active.length === 0 && (
        <div className="text-xs text-muted-foreground py-3">{tr("sessEmpty")}</div>
      )}

      {!loading && !failed && active.length > 0 && (
        <div className="space-y-2 mb-4">
          {active.map((s, i) => (
            <div
              key={`${s.device}-${s.lastSeenAt}-${i}`}
              className={`flex items-start gap-3 p-3 rounded-sm border ${
                s.current ? "border-gold/40 bg-gold/5" : "border-border bg-background"
              }`}
            >
              <Icon
                name={/iPhone|iPad|Android/i.test(s.device) ? "Smartphone" : "Monitor"}
                size={15}
                className={s.current ? "text-gold mt-0.5" : "text-muted-foreground mt-0.5"}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-xs font-montserrat font-semibold text-foreground">{s.device}</span>
                  {s.current && (
                    <span className="text-[10px] font-montserrat font-semibold text-gold border border-gold/40 rounded-sm px-1.5 py-0.5">
                      {tr("sessCurrent")}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">
                  {tr("sessLastSeen")}: {fmt(s.lastSeenAt)}
                  {s.ip && <span className="ms-2">IP: {s.ip}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && !failed && active.length > 1 && (
        <button
          onClick={() => {
            if (window.confirm(tr("dashLogoutAllConfirm"))) logoutAll();
          }}
          className="w-full border border-border text-muted-foreground text-xs font-montserrat font-semibold px-3 py-2 rounded-sm hover:border-destructive hover:text-destructive transition-all flex items-center justify-center gap-1.5"
        >
          <Icon name="ShieldOff" size={13} />
          {tr("sessEndOthers")}
        </button>
      )}
    </div>
  );
}
