import { useState, lazy, Suspense } from "react";
import Icon from "@/components/ui/icon";
import { useLang } from "@/lib/i18n";
import { authHeaders } from "@/lib/authToken";
import { L, type LS } from "@/lib/shared";
import { services as SERVICE_CATALOG } from "@/lib/servicesCatalog";
import { PresenceDot, PresenceText, type PresenceInfo } from "./Presence";
import func2url from "../../../backend/func2url.json";

const ReportModal = lazy(() => import("@/components/ReviewsAndReports").then((m) => ({ default: m.ReportModal })));

type Endorsement = { skill: string; count: number; mine: boolean };

export type FriendCardData = {
  userId: number;
  pairKey: string;
  provider: { name: LS; title: LS; avatar: string | null; verified?: boolean } | null;
  presence?: PresenceInfo;
};

// Карточка друга. Раньше — строка «имя + две кнопки». Теперь в ней то, что
// делает профессиональную сеть ценной, а не просто списком контактов:
// статус «в сети», подтверждение навыков коллеги и защита от давления
// (блокировка и жалоба), спрятанные в меню «ещё», чтобы не нажать случайно.
export default function FriendCard({
  f,
  onMessage,
  onRemove,
  onBlocked,
}: {
  f: FriendCardData;
  onMessage?: () => void;
  onRemove: () => void;
  onBlocked: () => void;
}) {
  const { tr, lang } = useLang();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [skills, setSkills] = useState<string[] | null>(null);
  const [endorse, setEndorse] = useState<Endorsement[]>([]);
  const [busySkill, setBusySkill] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);

  const name = f.provider ? L(f.provider.name, lang) : `#${f.userId}`;

  const loadSkills = () => {
    if (skills !== null) return;
    fetch(`${func2url["friends"]}?action=endorsements&userId=${f.userId}`, { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        setSkills(d && Array.isArray(d.skills) ? d.skills : []);
        setEndorse(d && Array.isArray(d.endorsements) ? d.endorsements : []);
      })
      .catch(() => setSkills([]));
  };

  const toggleOpen = () => {
    const next = !open;
    setOpen(next);
    if (next) loadSkills();
  };

  const toggleEndorse = async (skill: string) => {
    setBusySkill(skill);
    try {
      const r = await fetch(func2url["friends"], {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ action: "endorse", targetUserId: f.userId, skill }),
      });
      const d = await r.json().catch(() => null);
      if (r.ok && d && Array.isArray(d.endorsements)) setEndorse(d.endorsements);
    } finally {
      setBusySkill(null);
    }
  };

  const block = async () => {
    setMenu(false);
    if (!window.confirm(tr("blockConfirm").replace("{name}", name))) return;
    await fetch(func2url["friends"], {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ action: "block", targetUserId: f.userId }),
    }).catch(() => {});
    onBlocked();
  };

  const report = () => {
    setMenu(false);
    setReportOpen(true);
  };

  const endorseFor = (skill: string) => endorse.find((e) => e.skill === skill);

  return (
    <div className="border border-border rounded-sm hover:border-gold/30 transition-colors">
      {reportOpen && (
        <Suspense fallback={null}>
          <ReportModal targetType="provider" targetId={`provider-${f.userId}`} onClose={() => setReportOpen(false)} />
        </Suspense>
      )}
      <div className="flex items-center gap-3 p-3">
        <button onClick={toggleOpen} className="relative w-11 h-11 shrink-0" aria-expanded={open} aria-label={tr("friendSkillsOpen").replace("{name}", name)}>
          <span className="block w-full h-full rounded-full overflow-hidden gold-gradient flex items-center justify-center">
            {f.provider?.avatar
              ? <img src={f.provider.avatar} alt="" loading="lazy" className="w-full h-full object-cover" />
              : <span className="font-montserrat font-bold text-[hsl(28,20%,7%)]">{name.charAt(0).toUpperCase()}</span>}
          </span>
          <PresenceDot presence={f.presence} />
        </button>
        <button onClick={toggleOpen} className="flex-1 min-w-0 text-start" aria-expanded={open}>
          <div className="text-sm font-montserrat font-semibold text-foreground truncate flex items-center gap-1">
            <span className="truncate">{name}</span>
            {f.provider?.verified && <Icon name="BadgeCheck" size={13} className="text-gold shrink-0" />}
          </div>
          <div className="text-[11px] text-muted-foreground truncate">{f.provider ? L(f.provider.title, lang) : ""}</div>
          <PresenceText presence={f.presence} />
        </button>
        {onMessage && (
          <button
            onClick={onMessage}
            aria-label={tr("pdMessage")}
            className="border border-gold/40 text-gold text-xs font-montserrat font-semibold px-3 min-h-[36px] rounded-sm shrink-0 hover:bg-gold/10 flex items-center gap-1.5"
          >
            <Icon name="MessageSquare" size={14} />
            <span className="hidden sm:inline">{tr("pdMessage")}</span>
          </button>
        )}
        <div className="relative shrink-0">
          <button
            onClick={() => setMenu((v) => !v)}
            aria-label={tr("friendMore")}
            aria-expanded={menu}
            aria-haspopup="menu"
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Icon name="Ellipsis" size={18} />
          </button>
          {menu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenu(false)} aria-hidden />
              <div role="menu" className="absolute end-0 top-full mt-1 z-50 w-52 bg-card border border-border rounded-sm shadow-2xl py-1 animate-fade-in">
                <MenuItem icon="UserMinus" label={tr("pdRemoveFriend")} onClick={() => { setMenu(false); onRemove(); }} />
                <MenuItem icon="Flag" label={tr("friendReport")} onClick={report} />
                <MenuItem icon="Ban" label={tr("friendBlock")} onClick={block} danger />
              </div>
            </>
          )}
        </div>
      </div>

      {open && (
        <div className="px-3 pb-3 pt-1 border-t border-border/60">
          <div className="text-[10px] font-montserrat font-semibold text-muted-foreground uppercase tracking-widest mb-2 mt-2">{tr("endorseTitle")}</div>
          {skills === null ? (
            <div className="text-[11px] text-muted-foreground flex items-center gap-1.5"><Icon name="Loader" size={12} className="animate-spin" />{tr("loading")}</div>
          ) : skills.length === 0 ? (
            <div className="text-[11px] text-muted-foreground">{tr("endorseNone")}</div>
          ) : (
            <>
              <p className="text-[11px] text-muted-foreground mb-2">{tr("endorseHint")}</p>
              <div className="flex flex-wrap gap-1.5">
                {skills.map((sk) => {
                  const e = endorseFor(sk);
                  const mine = !!e?.mine;
                  return (
                    <button
                      key={sk}
                      onClick={() => toggleEndorse(sk)}
                      disabled={busySkill === sk}
                      aria-pressed={mine}
                      className={`text-[11px] font-semibold px-2.5 min-h-[32px] rounded-full border flex items-center gap-1.5 transition-colors ${mine ? "border-gold bg-gold/15 text-gold" : "border-border text-muted-foreground hover:border-gold/50 hover:text-foreground"}`}
                    >
                      <Icon name={mine ? "Check" : "Plus"} size={11} />
                      {skillLabel(sk, lang)}
                      {e && e.count > 0 && <span className={`rounded-full px-1.5 text-[10px] ${mine ? "bg-gold text-[hsl(28,20%,7%)]" : "bg-secondary text-foreground"}`}>{e.count}</span>}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Навыки в базе хранятся английским ключом услуги («Private investigator»).
// Показываем их на языке интерфейса через тот же каталог, что и в анкетах.
function skillLabel(key: string, lang: Parameters<typeof L>[1]): string {
  const svc = SERVICE_CATALOG.find((x) => x.title.en === key);
  return svc ? L(svc.title, lang) : key;
}

function MenuItem({ icon, label, onClick, danger }: { icon: string; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      role="menuitem"
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-start transition-colors ${danger ? "text-destructive hover:bg-destructive/10" : "text-foreground hover:bg-secondary"}`}
    >
      <Icon name={icon} size={14} />
      {label}
    </button>
  );
}
