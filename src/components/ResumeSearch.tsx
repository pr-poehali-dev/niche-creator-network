import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { useLang } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { authHeaders } from "@/lib/authToken";
import { PaymentModal } from "@/components/Pricing";
import ErrorBoundary from "@/components/ErrorBoundary";
import { L, resolveAvatar, type LS } from "@/lib/shared";
import func2url from "../../backend/func2url.json";

type Card = {
  id: number;
  position: string;
  employment: string;
  relocation: boolean;
  remoteOk: boolean;
  salaryFrom: number | null;
  salaryCurrency: string;
  experienceYears: number;
  city: string;
  aboutTeaser: string;
  skills: string[];
  updatedAt: string | null;
  locked: boolean;
  name?: LS | null;
  avatar?: string | null;
  rating?: number | null;
  verified?: boolean;
};

type Full = Card & { about: string; education: string; history: string; contactPhone: string; contactEmail: string };

const EMPLOYMENT_KEYS: Record<string, "resEmpFull" | "resEmpPart" | "resEmpProject" | "resEmpShift"> = {
  full: "resEmpFull", part: "resEmpPart", project: "resEmpProject", shift: "resEmpShift",
};

export default function ResumeSearch() {
  const { lang, tr } = useLang();
  const { user } = useAuth();
  const [items, setItems] = useState<Card[]>([]);
  const [paid, setPaid] = useState(false);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [remote, setRemote] = useState(false);
  const [relocation, setRelocation] = useState(false);
  const [open, setOpen] = useState<Full | null>(null);
  const [payOpen, setPayOpen] = useState(false);
  const [company, setCompany] = useState("");

  const search = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams({ kind: "search" });
    if (q.trim()) p.set("q", q.trim());
    if (city.trim()) p.set("city", city.trim());
    if (remote) p.set("remote", "1");
    if (relocation) p.set("relocation", "1");
    fetch(`${func2url["resumes"]}?${p}`, { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) { setItems(d.items || []); setPaid(!!d.paid); }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [q, city, remote, relocation]);

  useEffect(() => { search(); }, [search]);

  useEffect(() => {
    fetch(`${func2url["resumes"]}?kind=access`, { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) { setPaid(!!d.active); setCompany(d.company || ""); } })
      .catch(() => {});
  }, []);

  const openResume = async (id: number) => {
    const res = await fetch(`${func2url["resumes"]}?kind=one&id=${id}`, { headers: authHeaders() });
    if (res.status === 402) { setPayOpen(true); return; }
    const d = await res.json().catch(() => null);
    if (d?.resume) setOpen(d.resume);
  };

  const saveCompany = async (value: string) => {
    setCompany(value);
    await fetch(func2url["resumes"], {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ action: "set_company", company: value }),
    }).catch(() => {});
  };

  const money = (n: number | null, cur: string) =>
    n ? `${tr("resFrom")} ${n.toLocaleString(lang === "ru" ? "ru-RU" : "en-US")} ${cur === "RUB" ? "₽" : cur}` : tr("resSalaryAny");

  const field = "w-full bg-secondary border border-border rounded-sm px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-gold transition-colors";

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <div className="tag-security mb-3 inline-block">{tr("resSearchTag")}</div>
        <h1 className="font-montserrat font-extrabold text-3xl md:text-4xl text-foreground mb-3">{tr("resSearchTitle")}</h1>
        <p className="text-muted-foreground text-sm max-w-2xl mx-auto">{tr("resSearchDesc")}</p>
      </div>

      {/* Пока доступ не оплачен — объясняем, что именно даёт оплата. */}
      {!paid && (
        <div className="border border-gold/40 rounded-sm glass-card p-6 mb-8 security-glow flex flex-col md:flex-row items-start md:items-center gap-5">
          <div className="w-12 h-12 gold-gradient rounded-sm flex items-center justify-center shrink-0">
            <Icon name="Lock" size={22} className="text-[hsl(28,20%,7%)]" />
          </div>
          <div className="flex-1">
            <div className="font-montserrat font-bold text-base text-foreground mb-1">{tr("resPaywallTitle")}</div>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">{tr("resPaywallDesc")}</p>
          </div>
          <button onClick={() => setPayOpen(true)}
            className="shrink-0 gold-gradient text-[hsl(28,20%,7%)] px-6 py-3 text-xs font-montserrat font-bold rounded-sm hover:opacity-90 transition-opacity flex items-center gap-2">
            <Icon name="Wallet" size={15} />{tr("resPaywallCta")}
          </button>
        </div>
      )}

      {paid && (
        <div className="border border-green-500/40 bg-green-500/[0.06] rounded-sm p-4 mb-6 flex flex-col sm:flex-row sm:items-center gap-3">
          <Icon name="ShieldCheck" size={18} className="text-green-400 shrink-0" />
          <span className="text-xs text-foreground flex-1">{tr("resAccessActive")}</span>
          <input value={company} onChange={(e) => saveCompany(e.target.value)} placeholder={tr("resCompanyPh")}
            className="bg-secondary border border-border rounded-sm px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-gold sm:max-w-[240px]" />
        </div>
      )}

      <div className="border border-border rounded-sm bg-card p-5 mb-6 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={tr("resSearchPh")} className={field} />
          <input value={city} onChange={(e) => setCity(e.target.value)} placeholder={tr("resCityPh")} className={field} />
        </div>
        <div className="flex flex-wrap gap-2">
          {([
            { on: remote, set: setRemote, k: "resRemote" as const, icon: "Wifi" },
            { on: relocation, set: setRelocation, k: "resRelocation" as const, icon: "Plane" },
          ]).map((f) => (
            <button key={f.k} onClick={() => f.set(!f.on)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-montserrat font-semibold rounded-sm border transition-all ${f.on ? "border-gold text-gold bg-gold/10" : "border-border text-muted-foreground hover:text-foreground"}`}>
              <Icon name={f.icon} size={14} />{tr(f.k)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-16 flex justify-center"><Icon name="Loader" size={26} className="animate-spin text-gold" /></div>
      ) : items.length === 0 ? (
        <div className="border border-dashed border-border rounded-sm py-16 flex flex-col items-center gap-3 text-center">
          <Icon name="SearchX" size={38} className="text-muted-foreground/30" />
          <span className="text-sm text-muted-foreground">{tr("resNothingFound")}</span>
        </div>
      ) : (
        <>
          <div className="text-xs text-muted-foreground mb-4">{tr("resFoundCount")}: <span className="text-gold font-bold">{items.length}</span></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((c) => (
              <div key={c.id} className="border border-border rounded-sm bg-card p-5 card-lift flex flex-col">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 rounded-sm overflow-hidden shrink-0 flex items-center justify-center bg-secondary">
                    {c.locked
                      ? <Icon name="UserRound" size={22} className="text-muted-foreground/50" />
                      : <img src={resolveAvatar(c.avatar, undefined)} alt="" loading="lazy" className="w-full h-full object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-montserrat font-bold text-sm text-foreground truncate">{c.position}</div>
                    {c.locked ? (
                      <div className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                        <Icon name="Lock" size={11} className="text-gold" />{tr("resHiddenName")}
                      </div>
                    ) : (
                      <div className="text-[11px] text-gold truncate mt-0.5 flex items-center gap-1">
                        {c.name ? L(c.name, lang) : `#${c.id}`}
                        {c.verified && <Icon name="BadgeCheck" size={12} />}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  <span className="text-[10px] text-muted-foreground border border-border rounded-sm px-2 py-1">{tr(EMPLOYMENT_KEYS[c.employment] || "resEmpFull")}</span>
                  {c.city && <span className="text-[10px] text-muted-foreground border border-border rounded-sm px-2 py-1 inline-flex items-center gap-1"><Icon name="MapPin" size={10} />{c.city}</span>}
                  {c.experienceYears > 0 && <span className="text-[10px] text-muted-foreground border border-border rounded-sm px-2 py-1">{tr("resExpShort")} {c.experienceYears}</span>}
                  {c.remoteOk && <span className="text-[10px] text-gold border border-gold/40 rounded-sm px-2 py-1">{tr("resRemote")}</span>}
                  {c.relocation && <span className="text-[10px] text-gold border border-gold/40 rounded-sm px-2 py-1">{tr("resRelocation")}</span>}
                </div>

                <div className="font-montserrat font-bold text-sm text-gold mb-2">{money(c.salaryFrom, c.salaryCurrency)}</div>
                {c.aboutTeaser && <p className="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-3">{c.aboutTeaser}{c.locked && "…"}</p>}

                {c.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {c.skills.slice(0, 5).map((s) => (
                      <span key={s} className="text-[10px] font-montserrat font-semibold text-foreground bg-secondary border border-border rounded-sm px-2 py-0.5">{s}</span>
                    ))}
                  </div>
                )}

                <button onClick={() => (c.locked ? setPayOpen(true) : openResume(c.id))}
                  className={`mt-auto w-full py-2.5 text-xs font-montserrat font-bold rounded-sm transition-all flex items-center justify-center gap-2 ${c.locked ? "border border-gold text-gold hover:bg-gold hover:text-[hsl(28,20%,7%)]" : "gold-gradient text-[hsl(28,20%,7%)] hover:opacity-90"}`}>
                  <Icon name={c.locked ? "Lock" : "Eye"} size={14} />
                  {tr(c.locked ? "resUnlockCta" : "resOpenCta")}
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {open && (
        <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setOpen(null)}>
          <div className="bg-card border border-gold/40 rounded-sm max-w-2xl w-full max-h-[90vh] overflow-y-auto p-7 security-glow" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-4 mb-5">
              <div className="w-16 h-16 rounded-sm overflow-hidden shrink-0">
                <img src={resolveAvatar(open.avatar, undefined)} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-montserrat font-extrabold text-lg text-foreground">{open.name ? L(open.name, lang) : `#${open.id}`}</div>
                <div className="text-sm text-gold">{open.position}</div>
                <div className="text-xs text-muted-foreground mt-1">{[open.city, open.experienceYears ? `${tr("resExpShort")} ${open.experienceYears}` : ""].filter(Boolean).join(" · ")}</div>
              </div>
              <button aria-label={tr("cancel")} onClick={() => setOpen(null)} className="text-muted-foreground hover:text-foreground"><Icon name="X" size={20} /></button>
            </div>

            <div className="font-montserrat font-bold text-base text-gold mb-4">{money(open.salaryFrom, open.salaryCurrency)}</div>

            <div className="border border-gold/30 bg-gold/5 rounded-sm p-4 mb-5 space-y-2">
              <div className="text-xs font-montserrat font-bold text-foreground uppercase tracking-widest mb-1">{tr("resContacts")}</div>
              {open.contactPhone && <a href={`tel:${open.contactPhone}`} className="flex items-center gap-2 text-sm text-foreground hover:text-gold transition-colors"><Icon name="Phone" size={14} className="text-gold" />{open.contactPhone}</a>}
              {open.contactEmail && <a href={`mailto:${open.contactEmail}`} className="flex items-center gap-2 text-sm text-foreground hover:text-gold transition-colors"><Icon name="Mail" size={14} className="text-gold" />{open.contactEmail}</a>}
              {!open.contactPhone && !open.contactEmail && <div className="text-xs text-muted-foreground">{tr("resNoContacts")}</div>}
            </div>

            {([
              { title: "resAbout" as const, text: open.about },
              { title: "resEducation" as const, text: open.education },
              { title: "resHistory" as const, text: open.history },
            ]).filter((s) => s.text).map((s) => (
              <div key={s.title} className="mb-5">
                <div className="text-xs font-montserrat font-bold text-foreground uppercase tracking-widest mb-2">{tr(s.title)}</div>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{s.text}</p>
              </div>
            ))}

            {open.skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {open.skills.map((s) => (
                  <span key={s} className="text-[11px] font-montserrat font-semibold text-gold border border-gold/40 bg-gold/10 rounded-sm px-2.5 py-1">{s}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {payOpen && (
        <ErrorBoundary fallback={null} onReset={() => setPayOpen(false)}>
          <PaymentModal
            plan={{ name: "planHrName", price: "planHrPrice" }}
            onClose={() => setPayOpen(false)}
            defaultEmail={user?.email || ""}
            slug={user ? `hr-${user.id}` : ""}
          />
        </ErrorBoundary>
      )}
    </div>
  );
}
