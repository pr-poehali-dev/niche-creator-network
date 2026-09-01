import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { useLang } from "@/lib/i18n";
import { authHeaders } from "@/lib/authToken";
import func2url from "../../backend/func2url.json";

type Resume = {
  isPublished: boolean;
  position: string;
  employment: string;
  relocation: boolean;
  remoteOk: boolean;
  salaryFrom: number | null;
  salaryCurrency: string;
  experienceYears: number;
  city: string;
  about: string;
  skills: string[];
  education: string;
  history: string;
  contactPhone: string;
  contactEmail: string;
};

const EMPTY: Resume = {
  isPublished: false, position: "", employment: "full", relocation: false, remoteOk: false,
  salaryFrom: null, salaryCurrency: "RUB", experienceYears: 0, city: "", about: "",
  skills: [], education: "", history: "", contactPhone: "", contactEmail: "",
};

const EMPLOYMENT_KEYS = [
  { v: "full", k: "resEmpFull" as const },
  { v: "part", k: "resEmpPart" as const },
  { v: "project", k: "resEmpProject" as const },
  { v: "shift", k: "resEmpShift" as const },
];

export default function ResumeTab() {
  const { lang, tr } = useLang();
  const [data, setData] = useState<Resume>(EMPTY);
  const [views, setViews] = useState<{ company: string; at: string | null }[]>([]);
  const [viewsCount, setViewsCount] = useState(0);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [skillInput, setSkillInput] = useState("");
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(() => {
    fetch(`${func2url["resumes"]}?kind=my`, { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.resume) setData({ ...EMPTY, ...d.resume });
        if (Array.isArray(d?.views)) setViews(d.views);
        if (typeof d?.viewsCount === "number") setViewsCount(d.viewsCount);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async (override?: Partial<Resume>) => {
    const payload = { ...data, ...override };
    setState("saving");
    try {
      const res = await fetch(func2url["resumes"], {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ action: "save", ...payload }),
      });
      setState(res.ok ? "saved" : "error");
    } catch {
      setState("error");
    }
  };

  // Публикация — отдельным действием: человек должен осознанно решить,
  // что его данные попадут в базу для работодателей.
  const togglePublish = async () => {
    const next = !data.isPublished;
    if (next && !data.position.trim()) return;
    setData((d) => ({ ...d, isPublished: next }));
    await save({ isPublished: next });
  };

  const addSkill = () => {
    const s = skillInput.trim();
    if (!s || data.skills.includes(s) || data.skills.length >= 20) return;
    setData((d) => ({ ...d, skills: [...d.skills, s] }));
    setSkillInput("");
    setState("idle");
  };

  const upd = (patch: Partial<Resume>) => { setData((d) => ({ ...d, ...patch })); setState("idle"); };

  const field = "w-full bg-secondary border border-border rounded-sm px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-gold transition-colors";
  const label = "text-xs font-montserrat font-semibold text-foreground flex items-center gap-1.5 mb-2";

  if (!loaded) {
    return (
      <div className="border border-border rounded-sm bg-card p-10 flex justify-center">
        <Icon name="Loader" size={22} className="animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Главный выключатель: пока он выключен, человек — просто исполнитель,
          и в базе работодателей его нет. */}
      <div className={`border rounded-sm p-6 ${data.isPublished ? "border-gold/50 bg-gold/[0.04]" : "border-border bg-card"}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="font-montserrat font-bold text-sm text-foreground flex items-center gap-2">
              <Icon name="BriefcaseBusiness" size={16} className="text-gold" />
              {tr("resLookingTitle")}
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed max-w-lg">
              {data.isPublished ? tr("resLookingOn") : tr("resLookingOff")}
            </p>
          </div>
          <button
            onClick={togglePublish}
            role="switch"
            aria-checked={data.isPublished}
            disabled={!data.position.trim() && !data.isPublished}
            className={`relative w-12 h-6.5 rounded-full transition-colors shrink-0 mt-1 disabled:opacity-40 ${data.isPublished ? "bg-gold" : "bg-secondary border border-border"}`}
            style={{ height: "26px" }}
          >
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${data.isPublished ? "start-[26px]" : "start-0.5"}`} />
          </button>
        </div>
        {!data.position.trim() && !data.isPublished && (
          <div className="mt-3 text-[11px] text-muted-foreground flex items-center gap-1.5">
            <Icon name="Info" size={13} className="text-gold" />{tr("resNeedPosition")}
          </div>
        )}
      </div>

      {/* Кто смотрел резюме */}
      {viewsCount > 0 && (
        <div className="border border-border rounded-sm bg-card p-6">
          <div className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
            <Icon name="Eye" size={14} className="text-gold" />
            {tr("resViewsTitle")} · {viewsCount}
          </div>
          <div className="space-y-2">
            {views.slice(0, 10).map((v, i) => (
              <div key={i} className="flex items-center justify-between gap-3 border border-border rounded-sm px-3 py-2.5">
                <span className="text-sm font-montserrat font-semibold text-foreground truncate">{v.company}</span>
                <span className="text-[11px] text-muted-foreground shrink-0">
                  {v.at ? new Date(v.at).toLocaleDateString(lang === "ru" ? "ru-RU" : "en-US", { day: "numeric", month: "short" }) : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="border border-border rounded-sm bg-card p-6 space-y-5">
        <div>
          <div className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest mb-1">{tr("resFormTitle")}</div>
          <p className="text-xs text-muted-foreground">{tr("resFormHint")}</p>
        </div>

        <div>
          <label className={label}><Icon name="Briefcase" size={13} className="text-gold" />{tr("resPosition")}</label>
          <input value={data.position} onChange={(e) => upd({ position: e.target.value })} placeholder={tr("resPositionPh")} className={field} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={label}><Icon name="MapPin" size={13} className="text-gold" />{tr("resCity")}</label>
            <input value={data.city} onChange={(e) => upd({ city: e.target.value })} placeholder={tr("resCityPh")} className={field} />
          </div>
          <div>
            <label className={label}><Icon name="Clock" size={13} className="text-gold" />{tr("resExperience")}</label>
            <input type="number" min={0} max={60} value={data.experienceYears || ""} onChange={(e) => upd({ experienceYears: Number(e.target.value) || 0 })} placeholder="5" className={field} />
          </div>
        </div>

        <div>
          <label className={label}><Icon name="Wallet" size={13} className="text-gold" />{tr("resSalary")}</label>
          <input type="number" min={0} value={data.salaryFrom ?? ""} onChange={(e) => upd({ salaryFrom: Number(e.target.value) || null })} placeholder={tr("resSalaryPh")} className={field} />
        </div>

        <div>
          <label className={label}><Icon name="CalendarClock" size={13} className="text-gold" />{tr("resEmployment")}</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {EMPLOYMENT_KEYS.map((e) => (
              <button key={e.v} onClick={() => upd({ employment: e.v })}
                className={`py-2.5 text-xs font-montserrat font-semibold rounded-sm border transition-all ${data.employment === e.v ? "border-gold text-gold bg-gold/10" : "border-border text-muted-foreground hover:text-foreground"}`}>
                {tr(e.k)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {([
            { key: "remoteOk" as const, k: "resRemote" as const, icon: "Wifi" },
            { key: "relocation" as const, k: "resRelocation" as const, icon: "Plane" },
          ]).map((o) => (
            <button key={o.key} onClick={() => upd({ [o.key]: !data[o.key] } as Partial<Resume>)}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-sm border text-xs font-montserrat font-semibold transition-all ${data[o.key] ? "border-gold text-gold bg-gold/10" : "border-border text-muted-foreground hover:text-foreground"}`}>
              <Icon name={data[o.key] ? "CircleCheckBig" : "Circle"} size={15} />
              <Icon name={o.icon} size={14} />
              {tr(o.k)}
            </button>
          ))}
        </div>

        <div>
          <label className={label}><Icon name="Tags" size={13} className="text-gold" />{tr("resSkills")}</label>
          <div className="flex gap-2">
            <input value={skillInput} onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
              placeholder={tr("resSkillsPh")} className={field} />
            <button onClick={addSkill} aria-label={tr("resSkills")} className="shrink-0 border border-gold text-gold px-4 rounded-sm hover:bg-gold hover:text-[hsl(28,20%,7%)] transition-all">
              <Icon name="Plus" size={16} />
            </button>
          </div>
          {data.skills.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {data.skills.map((s) => (
                <span key={s} className="inline-flex items-center gap-1.5 text-[11px] font-montserrat font-semibold text-gold border border-gold/40 bg-gold/10 rounded-sm px-2.5 py-1">
                  {s}
                  <button onClick={() => upd({ skills: data.skills.filter((x) => x !== s) })} aria-label={tr("cdRemove")} className="hover:text-destructive transition-colors">
                    <Icon name="X" size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className={label}><Icon name="FileText" size={13} className="text-gold" />{tr("resAbout")}</label>
          <textarea value={data.about} onChange={(e) => upd({ about: e.target.value })} rows={4} maxLength={2000} placeholder={tr("resAboutPh")} className={`${field} resize-none`} />
        </div>

        <div>
          <label className={label}><Icon name="GraduationCap" size={13} className="text-gold" />{tr("resEducation")}</label>
          <textarea value={data.education} onChange={(e) => upd({ education: e.target.value })} rows={3} maxLength={1500} placeholder={tr("resEducationPh")} className={`${field} resize-none`} />
        </div>

        <div>
          <label className={label}><Icon name="History" size={13} className="text-gold" />{tr("resHistory")}</label>
          <textarea value={data.history} onChange={(e) => upd({ history: e.target.value })} rows={5} maxLength={3000} placeholder={tr("resHistoryPh")} className={`${field} resize-none`} />
        </div>

        <div className="divider-gold" />

        {/* Контакты видит только работодатель с оплаченным доступом. */}
        <div className="flex items-start gap-2.5 border border-gold/30 rounded-sm bg-gold/5 px-3 py-2.5">
          <Icon name="ShieldCheck" size={15} className="text-gold shrink-0 mt-0.5" />
          <div className="text-[11px] text-muted-foreground leading-relaxed">{tr("resContactsHint")}</div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={label}><Icon name="Phone" size={13} className="text-gold" />{tr("cdClientPhone")}</label>
            <input type="tel" value={data.contactPhone} onChange={(e) => upd({ contactPhone: e.target.value })} placeholder="+7 999 000-00-00" className={field} />
          </div>
          <div>
            <label className={label}><Icon name="Mail" size={13} className="text-gold" />Email</label>
            <input type="email" value={data.contactEmail} onChange={(e) => upd({ contactEmail: e.target.value })} placeholder="you@email.com" className={field} />
          </div>
        </div>

        {state === "saved" && <div className="flex items-center gap-2 text-sm text-green-400"><Icon name="CheckCircle2" size={16} />{tr("resSaved")}</div>}
        {state === "error" && <div className="flex items-center gap-2 text-sm text-destructive"><Icon name="CircleAlert" size={16} />{tr("cdClientSaveErr")}</div>}

        <button onClick={() => save()} disabled={state === "saving"}
          className="w-full gold-gradient text-[hsl(28,20%,7%)] py-3 text-xs font-montserrat font-bold rounded-sm hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2">
          {state === "saving" ? <Icon name="Loader" size={15} className="animate-spin" /> : <Icon name="Save" size={15} />}
          {tr("dashSave")}
        </button>
      </div>
    </div>
  );
}