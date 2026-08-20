import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import SessionsLog from "@/components/SessionsLog";
import { useLang } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { authHeaders } from "@/lib/authToken";
import { useProviders } from "@/lib/providers";
import { trackGoal, GOALS } from "@/lib/analytics";
import { StarRating, AvatarUploader } from "@/components/SharedControls";
import { serviceCategories } from "@/lib/servicesCatalog";
import { L, resolveAvatar, shortName, type Section } from "@/lib/shared";
import { useFavorites } from "@/hooks/useAppHooks";
import func2url from "../../backend/func2url.json";

export default function ClientDashboard({ setActive }: { setActive: (s: Section) => void }) {
  const { lang, tr } = useLang();
  const { logout, logoutAll, user } = useAuth();
  const { providers } = useProviders();
  const { favorites, removeFavorite } = useFavorites();
  const clientId = user ? `client-${user.id}` : "demo-client";
  const handleLogout = async () => { await logout(); setActive("home"); window.scrollTo({ top: 0 }); };
  // Завершение сеансов на всех устройствах — с подтверждением, так как
  // действие затрагивает и другие устройства пользователя.
  const handleLogoutAll = async () => {
    if (!window.confirm(tr("dashLogoutAllConfirm"))) return;
    await logoutAll();
    setActive("home");
    window.scrollTo({ top: 0 });
  };
  // Намерение «поставить задачу» с главной: открываем сразу вкладку «Мои задачи».
  const wantNewTask = (() => {
    try { return sessionStorage.getItem("open_new_task") === "1"; } catch { return false; }
  })();
  const [tab, setTab] = useState<"profile" | "requests" | "favorites" | "settings">(wantNewTask ? "requests" : "profile");

  const tabs = [
    { id: "profile" as const, key: "cdTab1" as const, icon: "User" },
    { id: "requests" as const, key: "cdTab2" as const, icon: "Inbox" },
    { id: "favorites" as const, key: "cdTab3" as const, icon: "Heart" },
    { id: "settings" as const, key: "cdTab4" as const, icon: "Settings" },
  ];

  const [clientData, setClientData] = useState({ fullName: "", phone: "", email: "", gender: "m" });
  const [clientState, setClientState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [clientAvatar, setClientAvatar] = useState<string>("");
  // Профиль блокируется от правок, когда заполнены имя и телефон. Далее — только через поддержку.
  const [profileLocked, setProfileLocked] = useState(false);

  useEffect(() => {
    fetch(func2url["clients"], { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => {
        if (d.client) {
          setClientData({ fullName: d.client.fullName || "", phone: d.client.phone || "", email: d.client.email || "", gender: d.client.gender || "m" });
          setClientAvatar(d.client.avatarUrl || "");
          if ((d.client.fullName || "").trim() && (d.client.phone || "").trim()) setProfileLocked(true);
        }
      })
      .catch(() => {});
  }, [clientId]);

  const saveClient = async () => {
    if (profileLocked) return;
    setClientState("saving");
    try {
      const res = await fetch(func2url["clients"], {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ ...clientData }),
      });
      if (res.ok) {
        setClientState("saved");
        if (clientData.fullName.trim() && clientData.phone.trim()) setProfileLocked(true);
      } else {
        setClientState("error");
      }
    } catch {
      setClientState("error");
    }
  };

  // Настройки уведомлений/связи/тишины клиента.
  const [notifEmail, setNotifEmail] = useState<boolean>(true);
  const [prefContact, setPrefContact] = useState<string>(() => {
    try { return localStorage.getItem("shchit_pref_contact") || "chat"; } catch { return "chat"; }
  });
  const [quietStart, setQuietStart] = useState<string>(() => {
    try { return localStorage.getItem("shchit_quiet_start") || ""; } catch { return ""; }
  });
  const [quietEnd, setQuietEnd] = useState<string>(() => {
    try { return localStorage.getItem("shchit_quiet_end") || ""; } catch { return ""; }
  });
  useEffect(() => {
    fetch(func2url["notifications"], { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => { if (typeof d.emailEnabled === "boolean") setNotifEmail(d.emailEnabled); })
      .catch(() => {});
  }, []);
  const toggleNotifEmail = async () => {
    const next = !notifEmail;
    setNotifEmail(next);
    await fetch(func2url["notifications"], {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ action: "set_email", enabled: next }),
    }).catch(() => setNotifEmail(!next));
  };
  const savePrefContact = (v: string) => { setPrefContact(v); try { localStorage.setItem("shchit_pref_contact", v); } catch { /* noop */ } };
  const saveQuiet = (start: string, end: string) => {
    setQuietStart(start); setQuietEnd(end);
    try { localStorage.setItem("shchit_quiet_start", start); localStorage.setItem("shchit_quiet_end", end); } catch { /* noop */ }
  };

  type ReqResponse = { providerSlug: string; providerName: string; message: string; price: string; status: string };
  type ClientReq = { id: number; category: string; service: string; description: string; budget: string; city: string; status: string; chosenProvider: string; createdAt: string | null; responses: ReqResponse[]; views?: number; neededDate?: string; neededTime?: string; providerMarkedDone?: boolean; canReview?: boolean };
  const [myReqs, setMyReqs] = useState<ClientReq[]>([]);
  const [reviewModal, setReviewModal] = useState<{ requestId: number; providerSlug: string } | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reqFormOpen, setReqFormOpen] = useState(wantNewTask);
  const [newReq, setNewReq] = useState({ category: "", service: "", description: "", budget: "", city: "", neededDate: "", neededTime: "" });
  const [reqBusy, setReqBusy] = useState(false);

  // Одноразовое намерение «поставить задачу» — очищаем флаг после применения.
  useEffect(() => {
    if (wantNewTask) {
      try { sessionStorage.removeItem("open_new_task"); } catch { /* noop */ }
    }
  }, [wantNewTask]);

  const loadReqs = useCallback(() => {
    fetch(func2url["requests"], { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d.requests)) setMyReqs(d.requests); })
      .catch(() => {});
  }, []);

  useEffect(() => { loadReqs(); }, [loadReqs]);

  const createReq = async () => {
    if (!newReq.category && !newReq.service.trim()) return;
    setReqBusy(true);
    try {
      await fetch(func2url["requests"], {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ action: "create", clientName: clientData.fullName || user?.name || "", ...newReq }),
      });
      trackGoal(GOALS.createRequest);
      setNewReq({ category: "", service: "", description: "", budget: "", city: "", neededDate: "", neededTime: "" });
      setReqFormOpen(false);
      loadReqs();
    } finally {
      setReqBusy(false);
    }
  };

  const chooseProvider = async (requestId: number, providerSlug: string) => {
    await fetch(func2url["requests"], {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ action: "choose", requestId, providerSlug }),
    });
    loadReqs();
  };

  const completeReq = async (requestId: number) => {
    await fetch(func2url["requests"], {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ action: "complete", requestId }),
    }).catch(() => {});
    loadReqs();
  };

  const submitReview = async () => {
    if (!reviewModal) return;
    setReviewBusy(true);
    try {
      const res = await fetch(func2url["reviews"], {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          action: "create",
          requestId: reviewModal.requestId,
          targetType: "provider",
          targetId: reviewModal.providerSlug,
          rating: reviewRating,
          text: reviewText,
          authorName: clientData.fullName || user?.name || "",
        }),
      });
      if (res.ok) {
        setReviewModal(null);
        setReviewRating(5);
        setReviewText("");
        loadReqs();
      }
    } finally {
      setReviewBusy(false);
    }
  };

  const displayName = clientData.fullName || user?.name || tr("dashWelcome");

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Header card */}
      <div className="border border-gold/30 rounded-sm glass-card p-6 md:p-8 mb-6 flex flex-col sm:flex-row sm:items-center gap-5 security-glow">
        <div className="w-16 h-16 rounded-sm overflow-hidden border-2 border-gold shrink-0">
          <img src={resolveAvatar(clientAvatar, clientData.gender, "client")} alt="avatar" loading="lazy" decoding="async" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1">
          <div className="text-xs text-muted-foreground font-montserrat mb-1">{tr("dashWelcome")},</div>
          <div className="font-montserrat font-extrabold text-2xl text-foreground flex items-center gap-2">
            {displayName}
            <Icon name="BadgeCheck" size={18} className="text-gold" />
          </div>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-muted-foreground">{user?.email || ""}</span>
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <button onClick={handleLogoutAll} className="border border-border text-muted-foreground text-xs font-montserrat font-semibold px-3 py-2 rounded-sm hover:border-destructive hover:text-destructive transition-all flex items-center gap-1.5" title={tr("dashLogoutAll")}>
            <Icon name="ShieldOff" size={13} />
            {tr("dashLogoutAll")}
          </button>
          <button aria-label="Выйти" onClick={handleLogout} className="border border-border text-muted-foreground text-xs font-montserrat font-semibold px-4 py-2 rounded-sm hover:border-destructive hover:text-destructive transition-all flex items-center gap-1.5">
            <Icon name="LogOut" size={13} />
            {tr("dashLogout")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Tabs sidebar */}
        <aside className="lg:col-span-1">
          <div className="border border-border rounded-sm bg-card p-2 lg:sticky lg:top-24 flex lg:flex-col gap-1 overflow-x-auto">
            {tabs.map((tb) => (
              <button key={tb.id} onClick={() => setTab(tb.id)}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-sm text-xs font-montserrat font-semibold whitespace-nowrap transition-colors text-left ${tab === tb.id ? "gold-gradient text-[hsl(28,20%,7%)]" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}>
                <Icon name={tb.icon} size={15} />
                {tr(tb.key)}
              </button>
            ))}
          </div>
        </aside>

        {/* Content */}
        <div className="lg:col-span-3 space-y-5">
          {tab === "profile" && (
            <div className="border border-border rounded-sm bg-card p-6 space-y-5">
              <div>
                <div className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest mb-1">{tr("cdClientData")}</div>
                <p className="text-xs text-muted-foreground leading-relaxed">{tr("cdClientDataHint")}</p>
              </div>

              {profileLocked && (
                <div className="flex items-start gap-2.5 border border-gold/30 rounded-sm bg-gold/5 px-3 py-2.5">
                  <Icon name="Lock" size={15} className="text-gold shrink-0 mt-0.5" />
                  <div className="text-[11px] text-muted-foreground leading-relaxed">
                    {tr("cdProfileLocked")}{" "}
                    <a href="https://poehali.dev/help" target="_blank" rel="noreferrer" className="text-gold hover:underline font-semibold">{tr("cdContactSupport")}</a>
                  </div>
                </div>
              )}

              <AvatarUploader current={clientAvatar} gender={clientData.gender} role="client" recordId={clientId} onUploaded={setClientAvatar} />
              <div>
                <label className="text-xs font-montserrat font-semibold text-foreground block mb-2">{tr("genderLabel")}</label>
                <div className="grid grid-cols-2 gap-2 max-w-xs">
                  {([{ v: "m", k: "genderMale" as const }, { v: "f", k: "genderFemale" as const }]).map((g) => (
                    <button key={g.v} disabled={profileLocked} onClick={() => { setClientData({ ...clientData, gender: g.v }); setClientState("idle"); }}
                      className={`py-2 text-xs font-montserrat font-semibold rounded-sm border transition-all disabled:opacity-60 disabled:cursor-not-allowed ${clientData.gender === g.v ? "border-gold text-gold bg-gold/10" : "border-border text-muted-foreground hover:text-foreground"}`}>
                      {tr(g.k)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="divider-gold" />

              <div>
                <label className="text-xs font-montserrat font-semibold text-foreground flex items-center gap-1.5 mb-2"><Icon name="User" size={13} className="text-gold" />{tr("cdClientName")}</label>
                <input value={clientData.fullName} readOnly={profileLocked} onChange={(e) => { setClientData({ ...clientData, fullName: e.target.value }); setClientState("idle"); }} placeholder={tr("cdClientName")} className="w-full bg-secondary border border-border rounded-sm px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-gold transition-colors read-only:opacity-70 read-only:cursor-not-allowed" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-montserrat font-semibold text-foreground flex items-center gap-1.5 mb-2"><Icon name="Phone" size={13} className="text-gold" />{tr("cdClientPhone")}</label>
                  <input type="tel" value={clientData.phone} readOnly={profileLocked} onChange={(e) => { setClientData({ ...clientData, phone: e.target.value }); setClientState("idle"); }} placeholder="+7 999 000-00-00" className="w-full bg-secondary border border-border rounded-sm px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-gold transition-colors read-only:opacity-70 read-only:cursor-not-allowed" />
                </div>
                <div>
                  <label className="text-xs font-montserrat font-semibold text-foreground flex items-center gap-1.5 mb-2"><Icon name="Mail" size={13} className="text-gold" />Email</label>
                  <input type="email" value={clientData.email} readOnly={profileLocked} onChange={(e) => { setClientData({ ...clientData, email: e.target.value }); setClientState("idle"); }} placeholder="you@email.com" className="w-full bg-secondary border border-border rounded-sm px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-gold transition-colors read-only:opacity-70 read-only:cursor-not-allowed" />
                </div>
              </div>
              {clientState === "saved" && <div className="flex items-center gap-2 text-sm text-green-400"><Icon name="CheckCircle2" size={16} />{tr("cdClientSaved")}</div>}
              {clientState === "error" && <div className="flex items-center gap-2 text-sm text-destructive"><Icon name="CircleAlert" size={16} />{tr("cdClientSaveErr")}</div>}
              {!profileLocked && (
                <button onClick={saveClient} disabled={clientState === "saving"} className="w-full gold-gradient text-[hsl(28,20%,7%)] py-3 text-xs font-montserrat font-bold rounded-sm hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2">
                  {clientState === "saving" ? <Icon name="Loader" size={15} className="animate-spin" /> : <Icon name="Save" size={15} />}
                  {tr("dashSave")}
                </button>
              )}
            </div>
          )}

          {tab === "requests" && (
            <div className="border border-border rounded-sm bg-card p-6">
              <div className="flex items-center justify-between mb-4 gap-2">
                <div className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest">{tr("cdReqTitle")}</div>
                <button onClick={() => setReqFormOpen((o) => !o)} className="gold-gradient text-[hsl(28,20%,7%)] px-3 py-1.5 text-[10px] font-montserrat font-bold rounded-sm flex items-center gap-1">
                  <Icon name={reqFormOpen ? "X" : "Plus"} size={12} />{reqFormOpen ? tr("cancel") : tr("reqNew")}
                </button>
              </div>

              {reqFormOpen && (
                <div className="border border-gold/30 rounded-sm bg-secondary/40 p-4 mb-5 space-y-3">
                  <p className="text-[11px] text-muted-foreground flex items-start gap-2"><Icon name="Info" size={14} className="text-gold shrink-0 mt-0.5" />{tr("reqBroadcastHint")}</p>
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wide block mb-1">{tr("reqCategory")}</label>
                    <select value={newReq.category} onChange={(e) => setNewReq({ ...newReq, category: e.target.value })} className="w-full bg-secondary border border-border rounded-sm px-3 py-2 text-sm text-foreground outline-none focus:border-gold">
                      <option value="">{tr("searchAnyCategory")}</option>
                      {serviceCategories.map((c) => <option key={c.id} value={c.id}>{L(c.title, lang)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wide block mb-1">{tr("reqService")}</label>
                    <input value={newReq.service} onChange={(e) => setNewReq({ ...newReq, service: e.target.value })} placeholder={tr("reqServicePh")} className="w-full bg-secondary border border-border rounded-sm px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-gold" />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wide block mb-1">{tr("reqDesc")}</label>
                    <textarea value={newReq.description} onChange={(e) => setNewReq({ ...newReq, description: e.target.value })} rows={3} placeholder={tr("reqDescPh")} className="w-full bg-secondary border border-border rounded-sm px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-gold resize-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-muted-foreground uppercase tracking-wide block mb-1">{tr("reqBudget")}</label>
                      <input value={newReq.budget} onChange={(e) => setNewReq({ ...newReq, budget: e.target.value })} placeholder={tr("reqBudgetPh")} className="w-full bg-secondary border border-border rounded-sm px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-gold" />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground uppercase tracking-wide block mb-1">{tr("reqCity")}</label>
                      <input value={newReq.city} onChange={(e) => setNewReq({ ...newReq, city: e.target.value })} placeholder={tr("reqCityPh")} className="w-full bg-secondary border border-border rounded-sm px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-gold" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-muted-foreground uppercase tracking-wide block mb-1">{tr("reqNeededDate")}</label>
                      <input type="date" value={newReq.neededDate} onChange={(e) => setNewReq({ ...newReq, neededDate: e.target.value })} className="w-full bg-secondary border border-border rounded-sm px-3 py-2 text-sm text-foreground outline-none focus:border-gold" />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground uppercase tracking-wide block mb-1">{tr("reqNeededTime")}</label>
                      <input type="time" value={newReq.neededTime} onChange={(e) => setNewReq({ ...newReq, neededTime: e.target.value })} className="w-full bg-secondary border border-border rounded-sm px-3 py-2 text-sm text-foreground outline-none focus:border-gold" />
                    </div>
                  </div>
                  <button onClick={createReq} disabled={reqBusy || (!newReq.category && !newReq.service.trim())} className="gold-gradient text-[hsl(28,20%,7%)] px-4 py-2 text-xs font-montserrat font-bold rounded-sm disabled:opacity-50">{reqBusy ? tr("pdSaving") : tr("reqPublish")}</button>
                </div>
              )}

              <div className="space-y-4">
                {myReqs.length === 0 && (
                  <div className="text-xs text-muted-foreground py-10 text-center border border-dashed border-border rounded-sm">{tr("reqEmpty")}</div>
                )}
                {myReqs.map((r) => {
                  const cat = serviceCategories.find((c) => c.id === r.category);
                  const assigned = r.status === "assigned";
                  const completed = r.status === "completed";
                  const statusKey = completed ? "reqStatusDone" : assigned ? "reqStatusAssigned" : "reqStatusOpen";
                  return (
                    <div key={r.id} className="border border-border rounded-sm p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-9 h-9 gold-gradient rounded flex items-center justify-center shrink-0">
                          <Icon name={cat?.icon || "FileText"} fallback="FileText" size={15} className="text-[hsl(28,20%,7%)]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-montserrat font-semibold text-sm text-foreground">{r.service || (cat ? L(cat.title, lang) : tr("reqService"))}</div>
                          <div className="text-[11px] text-muted-foreground">{cat ? L(cat.title, lang) : ""}{r.budget ? ` · ${r.budget}` : ""}{r.city ? ` · ${r.city}` : ""}</div>
                        </div>
                        <span className={`tag-security shrink-0 ${completed ? "text-muted-foreground border-border" : assigned ? "text-green-400 border-green-500/40" : "text-gold border-gold/40"}`}>{tr(statusKey)}</span>
                      </div>
                      {r.description && <p className="text-xs text-muted-foreground mb-3">{r.description}</p>}

                      {/* Статистика по задаче: просмотры специалистами и отклики */}
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground bg-secondary/50 border border-border rounded-sm px-2.5 py-1">
                          <Icon name="Eye" size={13} className="text-gold" />
                          {tr("reqViews")}: <span className="text-foreground font-semibold">{r.views ?? 0}</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground bg-secondary/50 border border-border rounded-sm px-2.5 py-1">
                          <Icon name="MessageSquareReply" size={13} className="text-gold" />
                          {tr("reqResponses")}: <span className="text-foreground font-semibold">{r.responses.length}</span>
                        </span>
                        {(r.neededDate || r.neededTime) && (
                          <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground bg-secondary/50 border border-gold/30 rounded-sm px-2.5 py-1">
                            <Icon name="CalendarClock" size={13} className="text-gold" />
                            {tr("reqNeededWhen")}: <span className="text-foreground font-semibold">{[r.neededDate ? new Date(r.neededDate).toLocaleDateString(lang === "ru" ? "ru-RU" : "en-US") : "", r.neededTime || ""].filter(Boolean).join(" ")}</span>
                          </span>
                        )}
                        {r.createdAt && (
                          <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground bg-secondary/50 border border-border rounded-sm px-2.5 py-1">
                            <Icon name="Clock" size={13} className="text-gold" />
                            {new Date(r.createdAt).toLocaleDateString(lang === "ru" ? "ru-RU" : "en-US")}
                          </span>
                        )}
                      </div>

                      {!completed && (
                        <div className="flex justify-end gap-2 mb-3">
                          {r.canReview && r.chosenProvider && (
                            <button onClick={() => setReviewModal({ requestId: r.id, providerSlug: r.chosenProvider })} className="inline-flex items-center gap-1.5 gold-gradient text-[hsl(28,20%,7%)] text-[11px] font-montserrat font-bold px-3 py-1.5 rounded-sm hover:opacity-90 transition-opacity">
                              <Icon name="Star" size={13} />{tr("reqLeaveReview")}
                            </button>
                          )}
                          <button onClick={() => completeReq(r.id)} className="inline-flex items-center gap-1.5 border border-border text-muted-foreground text-[11px] font-montserrat font-semibold px-3 py-1.5 rounded-sm hover:border-green-500/50 hover:text-green-400 transition-all">
                            <Icon name="CircleCheckBig" size={13} />{tr("reqComplete")}
                          </button>
                        </div>
                      )}
                      {r.providerMarkedDone && !r.canReview && (
                        <div className="flex items-center gap-1.5 text-[11px] text-green-400 mb-3">
                          <Icon name="CheckCircle2" size={13} />{tr("reqReviewSent")}
                        </div>
                      )}

                      <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">{tr("reqResponses")} ({r.responses.length})</div>
                      {r.responses.length === 0 ? (
                        <div className="text-[11px] text-muted-foreground italic">{tr("reqNoResponses")}</div>
                      ) : (
                        <div className="space-y-2">
                          {r.responses.map((resp) => (
                            <div key={resp.providerSlug} className={`flex items-start gap-3 p-3 border rounded-sm ${resp.status === "accepted" ? "border-green-500/50 bg-green-500/[0.05]" : "border-border"}`}>
                              <div className="flex-1 min-w-0">
                                <div className="font-montserrat font-semibold text-sm text-foreground">{shortName(resp.providerName) || resp.providerSlug}</div>
                                {resp.message && <div className="text-xs text-muted-foreground mt-0.5">{resp.message}</div>}
                                {resp.price && <div className="text-xs text-gold font-semibold mt-1">{resp.price}</div>}
                              </div>
                              {assigned ? (
                                resp.status === "accepted"
                                  ? <span className="tag-security shrink-0 text-green-400 border-green-500/40">{tr("reqChosen")}</span>
                                  : <span className="tag-security shrink-0 text-muted-foreground border-border">{tr("reqDeclined")}</span>
                              ) : (
                                <button onClick={() => chooseProvider(r.id, resp.providerSlug)} className="gold-gradient text-[hsl(28,20%,7%)] text-[11px] font-montserrat font-bold px-3 py-1.5 rounded-sm shrink-0 hover:opacity-90">{tr("reqChoose")}</button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === "favorites" && (() => {
            const favProviders = providers.filter((p) => favorites.includes(p.slug));
            if (favProviders.length === 0) {
              return (
                <div className="border border-dashed border-border rounded-sm bg-card/50 py-16 flex flex-col items-center gap-3 text-center">
                  <Icon name="HeartOff" size={40} className="text-muted-foreground/30" />
                  <span className="text-sm text-muted-foreground max-w-xs">{tr("favEmpty")}</span>
                  <button onClick={() => setActive("specialists")} className="gold-gradient text-[hsl(28,20%,7%)] text-xs font-montserrat font-bold px-4 py-2 rounded-sm mt-1">{tr("heroClientCta2")}</button>
                </div>
              );
            }
            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {favProviders.map((s) => (
                  <div key={s.slug} className="border border-border rounded-sm bg-card p-5 card-lift">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-11 h-11 rounded-sm overflow-hidden shrink-0">
                        <img src={resolveAvatar(s.img, s.gender)} alt={L(s.name, lang)} loading="lazy" className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-montserrat font-bold text-sm text-foreground truncate">{L(s.name, lang)}</div>
                        <div className="text-xs text-gold truncate">{L(s.title, lang)}</div>
                      </div>
                      <button onClick={() => removeFavorite(s.slug)} aria-label={tr("favRemove")} className="ml-auto shrink-0 text-gold hover:text-destructive transition-colors">
                        <Icon name="Heart" size={16} className="fill-current" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mb-4">
                      <StarRating rating={s.rating} />
                      <span className="text-xs text-muted-foreground">{s.rating} ({s.reviews})</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setActive("specialists")} className="flex-1 gold-gradient text-[hsl(28,20%,7%)] text-xs font-montserrat font-bold py-2 rounded-sm hover:opacity-90 transition-opacity">{tr("cdViewProfile")}</button>
                      <button onClick={() => removeFavorite(s.slug)} className="border border-border text-muted-foreground text-xs font-montserrat font-semibold px-3 py-2 rounded-sm hover:border-destructive hover:text-destructive transition-all">{tr("cdRemove")}</button>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}

          {tab === "settings" && (
            <div className="space-y-5">
              <SessionsLog />
              <div className="border border-border rounded-sm bg-card p-6">
                <div className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest mb-4 flex items-center gap-2"><Icon name="Bell" size={14} className="text-gold" />{tr("setNotifTitle")}</div>
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-sm font-montserrat font-semibold text-foreground">{tr("notifEmailDup")}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{notifEmail ? tr("notifEmailOn") : tr("notifEmailOff")}</div>
                  </div>
                  <button onClick={toggleNotifEmail} role="switch" aria-checked={notifEmail} className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${notifEmail ? "bg-gold" : "bg-secondary border border-border"}`}>
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${notifEmail ? "start-[22px]" : "start-0.5"}`} />
                  </button>
                </div>
              </div>

              <div className="border border-border rounded-sm bg-card p-6">
                <div className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest mb-4 flex items-center gap-2"><Icon name="MessageCircle" size={14} className="text-gold" />{tr("setContactTitle")}</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {([{ v: "chat", k: "setContactChat" as const, i: "MessageSquare" }, { v: "phone", k: "setContactPhone" as const, i: "Phone" }, { v: "email", k: "setContactEmail" as const, i: "Mail" }, { v: "messenger", k: "setContactMessenger" as const, i: "Send" }]).map((c) => (
                    <button key={c.v} onClick={() => savePrefContact(c.v)} className={`flex flex-col items-center gap-1.5 py-3 text-xs font-montserrat font-semibold rounded-sm border transition-all ${prefContact === c.v ? "border-gold text-gold bg-gold/10" : "border-border text-muted-foreground hover:text-foreground"}`}>
                      <Icon name={c.i} size={16} />{tr(c.k)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border border-border rounded-sm bg-card p-6">
                <div className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest mb-1 flex items-center gap-2"><Icon name="Moon" size={14} className="text-gold" />{tr("setQuietTitle")}</div>
                <p className="text-xs text-muted-foreground mb-4">{tr("setQuietHint")}</p>
                <div className="grid grid-cols-2 gap-4 max-w-sm">
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wide block mb-1">{tr("setQuietFrom")}</label>
                    <input type="time" value={quietStart} onChange={(e) => saveQuiet(e.target.value, quietEnd)} className="w-full bg-secondary border border-border rounded-sm px-3 py-2 text-sm text-foreground outline-none focus:border-gold" />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wide block mb-1">{tr("setQuietTo")}</label>
                    <input type="time" value={quietEnd} onChange={(e) => saveQuiet(quietStart, e.target.value)} className="w-full bg-secondary border border-border rounded-sm px-3 py-2 text-sm text-foreground outline-none focus:border-gold" />
                  </div>
                </div>
                {(quietStart || quietEnd) && (
                  <button onClick={() => saveQuiet("", "")} className="mt-3 text-[11px] text-muted-foreground hover:text-gold font-montserrat font-semibold">{tr("setQuietClear")}</button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {reviewModal && (
        <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setReviewModal(null)}>
          <div className="bg-card border border-gold/40 rounded-sm max-w-md w-full p-8 security-glow" onClick={(e) => e.stopPropagation()}>
            <div className="w-14 h-14 gold-gradient rounded-sm flex items-center justify-center mx-auto mb-5 glow-gold-sm">
              <Icon name="Star" size={26} className="text-[hsl(28,20%,7%)]" />
            </div>
            <h3 className="font-montserrat font-bold text-lg text-foreground mb-2 text-center">{tr("reviewModalTitle")}</h3>
            <p className="text-sm text-muted-foreground mb-5 text-center">{tr("reviewModalHint")}</p>
            <div className="flex items-center justify-center gap-1.5 mb-5">
              {[1, 2, 3, 4, 5].map((i) => (
                <button key={i} onClick={() => setReviewRating(i)} className="p-1">
                  <Icon
                    name="Star"
                    size={32}
                    className={`transition-colors ${i <= reviewRating ? "text-gold fill-gold" : "text-muted-foreground"}`}
                  />
                </button>
              ))}
            </div>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={3}
              placeholder={tr("reviewModalPh")}
              className="w-full bg-secondary border border-border rounded-sm px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-gold transition-colors resize-none mb-4"
            />
            <div className="flex gap-2">
              <button onClick={() => setReviewModal(null)} className="flex-1 border border-border text-muted-foreground py-3 text-sm font-montserrat font-semibold rounded-sm hover:border-destructive hover:text-destructive transition-all">
                {tr("cancel")}
              </button>
              <button onClick={submitReview} disabled={reviewBusy} className="flex-1 gold-gradient text-[hsl(28,20%,7%)] py-3 text-sm font-montserrat font-bold rounded-sm hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2">
                {reviewBusy ? <Icon name="Loader" size={16} className="animate-spin" /> : <Icon name="Send" size={16} />}
                {tr("reviewModalSubmit")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}