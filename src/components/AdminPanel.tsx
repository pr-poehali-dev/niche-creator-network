import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { useLang, t } from "@/lib/i18n";
import { L } from "@/lib/shared";
import func2url from "../../backend/func2url.json";

type AdminProvider = { slug: string; name: { ru: string; en: string }; legalStatus: string; verified: boolean; licenseVerified: boolean; licenses: (string | { number?: string; date?: string; authority?: string })[]; active: boolean; documents: { title: string; url: string }[]; fullName: string; registry: string };

type AdminComplaint = { id: number; reporterUserId: number; reporterRole: string; targetType: string; targetId: string; reason: string; details: string; status: string; createdAt: string | null };

export default function AdminPanel() {
  const { lang, tr } = useLang();
  const [adminTab, setAdminTab] = useState<"providers" | "complaints">("providers");
  const [items, setItems] = useState<AdminProvider[] | null>(null);
  const [error, setError] = useState(false);
  const [savingSlug, setSavingSlug] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  const [complaints, setComplaints] = useState<AdminComplaint[] | null>(null);
  const [complaintsError, setComplaintsError] = useState(false);
  const [resolvingId, setResolvingId] = useState<number | null>(null);

  // Просмотр темы форума прямо из карточки жалобы — без ухода со страницы модерации.
  const [previewTopicId, setPreviewTopicId] = useState<number | null>(null);
  const [previewTopic, setPreviewTopic] = useState<{ title: string; author: string; posts: { author: string; text: string; createdAt: string | null }[] } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const toggleTopicPreview = (topicId: number) => {
    if (previewTopicId === topicId) {
      setPreviewTopicId(null);
      setPreviewTopic(null);
      return;
    }
    setPreviewTopicId(topicId);
    setPreviewLoading(true);
    setPreviewTopic(null);
    fetch(`${func2url["messages"]}?kind=forum_topic&topicId=${topicId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.topic) setPreviewTopic({ title: d.topic.title, author: d.topic.author, posts: Array.isArray(d.posts) ? d.posts : [] });
      })
      .catch(() => {})
      .finally(() => setPreviewLoading(false));
  };

  // Переход к исполнителю из жалобы: переключаемся на вкладку «Исполнители»
  // и подставляем его slug в поиск — карточка сразу видна.
  const openProviderFromComplaint = (slug: string) => {
    setAdminTab("providers");
    setQuery(slug);
    setOpenSlug(slug);
  };

  const token = () => localStorage.getItem("shchit_auth_token") || "";

  const load = useCallback(() => {
    setError(false);
    fetch(func2url["admin-providers"], { headers: { "X-Auth-Token": token() } })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setItems(Array.isArray(d.providers) ? d.providers : []))
      .catch(() => { setError(true); setItems([]); });
  }, []);

  const loadComplaints = useCallback(() => {
    setComplaintsError(false);
    fetch(func2url["complaints"], { headers: { "X-Auth-Token": token() } })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setComplaints(Array.isArray(d.complaints) ? d.complaints : []))
      .catch(() => { setComplaintsError(true); setComplaints([]); });
  }, []);

  useEffect(() => { load(); loadComplaints(); }, [load, loadComplaints]);

  const newComplaintsCount = (complaints || []).filter((c) => c.status === "new").length;

  const resolveComplaint = async (id: number, status: "resolved" | "dismissed") => {
    setResolvingId(id);
    try {
      const res = await fetch(func2url["complaints"], {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Auth-Token": token() },
        body: JSON.stringify({ action: "resolve", complaintId: id, status }),
      });
      if (res.ok) {
        setComplaints((prev) => (prev || []).map((c) => (c.id === id ? { ...c, status } : c)));
      }
    } finally {
      setResolvingId(null);
    }
  };

  const toggle = async (p: AdminProvider, field: "licenseVerified" | "verified") => {
    setSavingSlug(p.slug + field);
    try {
      const next = !p[field];
      const res = await fetch(func2url["admin-providers"], {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Auth-Token": token() },
        body: JSON.stringify({ slug: p.slug, [field]: next }),
      });
      if (res.ok) {
        setItems((prev) => (prev || []).map((x) => {
          if (x.slug !== p.slug) return x;
          const upd = { ...x, [field]: next };
          if (field === "verified" && !next) upd.licenseVerified = false;
          return upd;
        }));
      }
    } finally {
      setSavingSlug(null);
    }
  };

  const isOrg = (s: string) => ["ip", "company", "ип", "ооо", "llc"].includes((s || "").toLowerCase());
  const statusLabel = (s: string) => {
    const v = (s || "").toLowerCase();
    if (v === "ip" || v === "ип") return "ИП";
    if (v === "company" || v === "ооо" || v === "llc") return "ООО";
    if (v === "self") return tr("adminStatusSelf");
    return "—";
  };

  const filtered = (items || []).filter((p) => {
    const n = (p.name.ru + " " + p.name.en + " " + p.slug).toLowerCase();
    return n.includes(query.toLowerCase());
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="border border-gold/30 rounded-sm glass-card p-6 md:p-8 mb-6 relative overflow-hidden security-glow">
        <div className="absolute inset-0 grid-line-bg opacity-30" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 gold-gradient rounded-full flex items-center justify-center shrink-0 glow-gold-sm">
            <Icon name="ShieldCheck" size={26} className="text-[hsl(28,20%,7%)]" />
          </div>
          <div>
            <h1 className="font-montserrat font-extrabold text-2xl md:text-3xl text-foreground">{tr("adminPanelTitle")}</h1>
            <p className="text-xs text-muted-foreground mt-1">{tr("adminLicenseHint")}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-5 border-b border-border">
        <button
          onClick={() => setAdminTab("providers")}
          className={`px-4 py-2.5 text-sm font-montserrat font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${adminTab === "providers" ? "border-gold text-gold" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          <Icon name="Users" size={14} />{tr("adminTabProviders")}
        </button>
        <button
          onClick={() => setAdminTab("complaints")}
          className={`px-4 py-2.5 text-sm font-montserrat font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${adminTab === "complaints" ? "border-gold text-gold" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          <Icon name="Flag" size={14} />{tr("adminTabComplaints")}
          {newComplaintsCount > 0 && (
            <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-white text-[10px] font-bold flex items-center justify-center">{newComplaintsCount}</span>
          )}
        </button>
      </div>

      {adminTab === "providers" && (
      <>
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 flex items-center gap-2 border border-border bg-card rounded-sm px-4">
          <Icon name="Search" size={15} className="text-muted-foreground" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={tr("adminSearch")} className="flex-1 bg-transparent py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none" />
        </div>
        <button onClick={load} className="flex items-center gap-1.5 border border-border text-muted-foreground px-3 py-2.5 text-xs font-montserrat font-semibold rounded-sm hover:border-gold hover:text-gold transition-all">
          <Icon name="RefreshCw" size={14} />{tr("adminRefresh")}
        </button>
      </div>

      {items === null ? (
        <div className="border border-dashed border-border rounded-sm bg-card/50 py-16 flex justify-center"><Icon name="Loader" size={28} className="text-gold animate-spin" /></div>
      ) : error ? (
        <div className="border border-destructive/30 rounded-sm bg-destructive/10 p-4 text-sm text-destructive flex items-center gap-2"><Icon name="CircleAlert" size={16} />{tr("adminError")}</div>
      ) : (
        <div className="border border-border rounded-sm bg-card overflow-hidden">
          {filtered.map((p) => {
            const eligible = p.verified && isOrg(p.legalStatus) && p.licenses.length > 0;
            const docCount = p.documents.length + p.licenses.length;
            const open = openSlug === p.slug;
            return (
              <div key={p.slug} className="border-b border-border last:border-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3.5">
                  <div className="flex-1 min-w-0">
                    <div className="font-montserrat font-semibold text-sm text-foreground truncate">{L(p.name, lang)}</div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-[10px] text-muted-foreground">{p.slug}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-sm ${isOrg(p.legalStatus) ? "bg-gold/10 text-gold" : "bg-secondary text-muted-foreground"}`}>{statusLabel(p.legalStatus)}</span>
                      <span className="text-[10px] text-muted-foreground">· {p.licenses.length} {tr("adminLicensesCount")}</span>
                    </div>
                    {!eligible && (
                      <div className="text-[10px] text-amber-400/80 mt-1 flex items-center gap-1"><Icon name="TriangleAlert" size={10} />{tr("adminNotEligible")}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <button
                      onClick={() => setOpenSlug(open ? null : p.slug)}
                      className={`flex items-center gap-1.5 px-3 py-2 text-xs font-montserrat font-semibold rounded-sm transition-all border ${open ? "border-gold text-gold bg-gold/10" : "border-border text-muted-foreground hover:border-gold hover:text-gold"}`}
                    >
                      <Icon name="FileText" size={14} />
                      {tr("adminDocs")} ({docCount})
                      <Icon name={open ? "ChevronUp" : "ChevronDown"} size={13} />
                    </button>
                    <button
                      onClick={() => toggle(p, "verified")}
                      disabled={savingSlug === p.slug + "verified"}
                      className={`flex items-center gap-1.5 px-3 py-2 text-xs font-montserrat font-bold rounded-sm transition-all disabled:opacity-50 ${p.verified ? "bg-green-500/15 border border-green-500/40 text-green-400" : "border border-border text-muted-foreground hover:border-green-500 hover:text-green-400"}`}
                    >
                      {savingSlug === p.slug + "verified" ? <Icon name="Loader" size={14} className="animate-spin" /> : <Icon name={p.verified ? "ShieldCheck" : "Shield"} size={14} />}
                      {p.verified ? tr("adminVerifyOn") : tr("adminVerifyOff")}
                    </button>
                    <button
                      onClick={() => toggle(p, "licenseVerified")}
                      disabled={savingSlug === p.slug + "licenseVerified"}
                      className={`flex items-center gap-1.5 px-3 py-2 text-xs font-montserrat font-bold rounded-sm transition-all disabled:opacity-50 ${p.licenseVerified ? "gold-gradient text-[hsl(28,20%,7%)]" : "border border-border text-muted-foreground hover:border-gold hover:text-gold"}`}
                    >
                      {savingSlug === p.slug + "licenseVerified" ? <Icon name="Loader" size={14} className="animate-spin" /> : <Icon name={p.licenseVerified ? "BadgeCheck" : "Badge"} size={14} />}
                      {p.licenseVerified ? tr("adminLicenseOn") : tr("adminLicenseOff")}
                    </button>
                  </div>
                </div>
                {open && (
                  <div className="px-4 pb-4 -mt-1 animate-fade-in">
                    <div className="border border-border rounded-sm bg-secondary/40 p-4 space-y-3">
                      {(p.fullName || p.registry) && (
                        <div className="flex flex-wrap gap-x-6 gap-y-1 text-[11px]">
                          {p.fullName && <div><span className="text-muted-foreground">{tr("adminFullName")}: </span><span className="text-foreground font-semibold">{p.fullName}</span></div>}
                          {p.registry && <div><span className="text-muted-foreground">{tr("adminRegistry")}: </span><span className="text-foreground font-semibold">{p.registry}</span></div>}
                        </div>
                      )}
                      <div>
                        <div className="text-[10px] font-montserrat font-bold text-muted-foreground uppercase tracking-widest mb-1.5">{tr("adminLicensesList")}</div>
                        {p.licenses.length ? (
                          <div className="space-y-1">
                            {p.licenses.map((l, i) => {
                              const lic = typeof l === "string" ? { number: l, date: "", authority: "" } : (l as { number?: string; date?: string; authority?: string });
                              const extra = [lic.authority, lic.date].filter(Boolean).join(", ");
                              return (
                                <div key={i} className="flex items-center gap-1.5 text-xs text-foreground"><Icon name="Award" size={13} className="text-gold shrink-0" />{lic.number}{extra ? <span className="text-muted-foreground"> — {extra}</span> : null}</div>
                              );
                            })}
                          </div>
                        ) : <div className="text-xs text-muted-foreground">{tr("adminNoLicenses")}</div>}
                      </div>
                      <div>
                        <div className="text-[10px] font-montserrat font-bold text-muted-foreground uppercase tracking-widest mb-1.5">{tr("adminDocsList")}</div>
                        {p.documents.length ? (
                          <div className="flex flex-wrap gap-2">
                            {p.documents.map((d, i) => (
                              d.url ? (
                                <a key={i} href={d.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-gold border border-gold/30 rounded-sm px-2.5 py-1.5 hover:bg-gold/10 transition-all">
                                  <Icon name="FileText" size={13} />{d.title || tr("adminOpenDoc")}<Icon name="ExternalLink" size={11} />
                                </a>
                              ) : (
                                <span key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground border border-border rounded-sm px-2.5 py-1.5"><Icon name="FileText" size={13} />{d.title}</span>
                              )
                            ))}
                          </div>
                        ) : <div className="text-xs text-muted-foreground">{tr("adminNoDocs")}</div>}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-muted-foreground">{tr("adminEmpty")}</div>
          )}
        </div>
      )}
      </>
      )}

      {adminTab === "complaints" && (
        <div className="border border-border rounded-sm bg-card overflow-hidden">
          {complaints === null ? (
            <div className="border border-dashed border-border rounded-sm bg-card/50 py-16 flex justify-center"><Icon name="Loader" size={28} className="text-gold animate-spin" /></div>
          ) : complaintsError ? (
            <div className="border border-destructive/30 rounded-sm bg-destructive/10 p-4 text-sm text-destructive flex items-center gap-2"><Icon name="CircleAlert" size={16} />{tr("adminError")}</div>
          ) : complaints.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">{tr("adminComplaintsEmpty")}</div>
          ) : (
            complaints.map((c) => {
              const targetLabel = ({ provider: tr("reportTargetProvider"), client: tr("reportTargetClient"), message: tr("reportTargetMessage"), forum_topic: tr("reportTargetForum") } as Record<string, string>)[c.targetType] || c.targetType;
              const reasonLabel = tr(`reportReason_${c.reason}` as keyof typeof t);
              return (
                <div key={c.id} className="border-b border-border last:border-0 px-4 py-3.5">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className={`text-[10px] font-montserrat font-bold px-2 py-0.5 rounded-sm ${c.status === "new" ? "bg-destructive/15 text-destructive" : c.status === "resolved" ? "bg-green-500/15 text-green-400" : "bg-secondary text-muted-foreground"}`}>
                      {c.status === "new" ? tr("adminComplaintNew") : c.status === "resolved" ? tr("adminComplaintResolved") : tr("adminComplaintDismissed")}
                    </span>
                    <span className="text-xs font-montserrat font-semibold text-foreground">{reasonLabel}</span>
                    <span className="text-[10px] text-muted-foreground">· {targetLabel}: {c.targetId}</span>
                    <span className="text-[10px] text-muted-foreground ms-auto">{c.createdAt ? new Date(c.createdAt).toLocaleString(lang, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}</span>
                  </div>
                  {c.details && <p className="text-xs text-muted-foreground mb-2 leading-relaxed">{c.details}</p>}

                  <div className="flex flex-wrap items-center gap-2">
                    {c.targetType === "provider" && (
                      <button
                        onClick={() => openProviderFromComplaint(c.targetId)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-montserrat font-semibold rounded-sm border border-gold/40 text-gold hover:bg-gold/10 transition-all"
                      >
                        <Icon name="ExternalLink" size={13} />{tr("adminGoToProvider")}
                      </button>
                    )}
                    {c.targetType === "forum_topic" && (
                      <button
                        onClick={() => toggleTopicPreview(Number(c.targetId))}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-montserrat font-semibold rounded-sm border border-gold/40 text-gold hover:bg-gold/10 transition-all"
                      >
                        <Icon name={previewTopicId === Number(c.targetId) ? "ChevronUp" : "MessagesSquare"} size={13} />
                        {previewTopicId === Number(c.targetId) ? tr("adminHideTopic") : tr("adminViewTopic")}
                      </button>
                    )}
                    {(c.targetType === "client" || c.targetType === "message") && (
                      <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground italic">
                        <Icon name="Lock" size={12} />
                        {c.targetType === "client" ? tr("adminNoClientProfile") : tr("adminMessageEncrypted")}
                      </span>
                    )}
                    {c.status === "new" && (
                      <>
                        <button
                          onClick={() => resolveComplaint(c.id, "resolved")}
                          disabled={resolvingId === c.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-montserrat font-semibold rounded-sm border border-green-500/40 text-green-400 hover:bg-green-500/10 transition-all disabled:opacity-50"
                        >
                          <Icon name="Check" size={13} />{tr("adminComplaintResolve")}
                        </button>
                        <button
                          onClick={() => resolveComplaint(c.id, "dismissed")}
                          disabled={resolvingId === c.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-montserrat font-semibold rounded-sm border border-border text-muted-foreground hover:border-destructive hover:text-destructive transition-all disabled:opacity-50"
                        >
                          <Icon name="X" size={13} />{tr("adminComplaintDismiss")}
                        </button>
                      </>
                    )}
                  </div>

                  {previewTopicId === Number(c.targetId) && c.targetType === "forum_topic" && (
                    <div className="mt-3 border border-border rounded-sm bg-secondary/40 p-3">
                      {previewLoading ? (
                        <div className="flex justify-center py-4"><Icon name="Loader" size={18} className="text-gold animate-spin" /></div>
                      ) : previewTopic ? (
                        <>
                          <div className="text-sm font-montserrat font-bold text-foreground mb-1">{previewTopic.title}</div>
                          <div className="text-[11px] text-muted-foreground mb-2">{previewTopic.author}</div>
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {previewTopic.posts.length === 0 ? (
                              <div className="text-xs text-muted-foreground italic">{tr("forumNoPosts")}</div>
                            ) : previewTopic.posts.map((p, i) => (
                              <div key={i} className="border border-border rounded-sm bg-card p-2.5">
                                <div className="text-[11px] font-montserrat font-semibold text-foreground mb-0.5">{p.author}</div>
                                <div className="text-xs text-muted-foreground whitespace-pre-line">{p.text}</div>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="text-xs text-destructive">{tr("adminError")}</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
