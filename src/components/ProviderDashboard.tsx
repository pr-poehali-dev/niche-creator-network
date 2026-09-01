import { useState, useEffect, useCallback, useRef } from "react";
import Icon from "@/components/ui/icon";
import SessionsLog from "@/components/SessionsLog";
import { useLang } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { authHeaders } from "@/lib/authToken";
import { downloadReceipt } from "@/lib/receipt";
import { trackGoal, GOALS } from "@/lib/analytics";
import { AvatarUploader, DocFileButton } from "@/components/SharedControls";
import { serviceCategories, services } from "@/lib/servicesCatalog";
import { L, resolveAvatar, shortName, type Section, type LS } from "@/lib/shared";
import func2url from "../../backend/func2url.json";

type LicenseEntry = { number: string; date: string; authority: string };

export default function ProviderDashboard({ setActive, openChat, initialTab }: { setActive: (s: Section) => void; openChat?: (t: { name: string; title: string; avatar?: string | null; pairKey?: string }) => void; initialTab?: "stats" | "plan" | "cases" | "requests" | "contacts" | "friends" }) {
  const { lang, tr } = useLang();
  const { logout, logoutAll, user } = useAuth();
  const slug = user ? `provider-${user.id}` : "morozov";
  const handleLogout = async () => { await logout(); setActive("home"); window.scrollTo({ top: 0 }); };
  // Завершение сеансов на всех устройствах — с подтверждением, так как
  // действие затрагивает и другие устройства пользователя.
  const handleLogoutAll = async () => {
    if (!window.confirm(tr("dashLogoutAllConfirm"))) return;
    await logoutAll();
    setActive("home");
    window.scrollTo({ top: 0 });
  };
  // Вкладка "verify" объединена со "stats" в единый раздел "Профиль и статистика" —
  // верификация, документы и метрики теперь показываются вместе, без переключения.
  const [tab, setTab] = useState<"stats" | "plan" | "cases" | "requests" | "contacts" | "friends">(initialTab || "requests");

  type DashCase = { title: LS; category: LS; views: number; published: boolean };
  const [myCases, setMyCases] = useState<DashCase[]>([]);
  const [caseFormOpen, setCaseFormOpen] = useState(false);
  const [caseTitle, setCaseTitle] = useState("");
  const [caseCategory, setCaseCategory] = useState("");

  const saveCases = async (next: DashCase[]) => {
    try {
      await fetch(func2url["provider-cases"], {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          cases: next.map((c) => ({
            title: c.title.ru || c.title.en,
            category: c.category.ru || c.category.en,
            views: c.views,
            published: c.published,
          })),
        }),
      });
    } catch {
      /* игнорируем сетевую ошибку — данные останутся в форме */
    }
  };

  const addCase = () => {
    const title = caseTitle.trim();
    if (!title) return;
    const catTitle = caseCategory.trim() || tr("pdCaseDefaultCat");
    const next: DashCase[] = [{ title: { ru: title, en: title }, category: { ru: catTitle, en: catTitle }, views: 0, published: false }, ...myCases];
    setMyCases(next);
    saveCases(next);
    setCaseTitle("");
    setCaseCategory("");
    setCaseFormOpen(false);
  };

  const removeCase = (index: number) => {
    const next = myCases.filter((_, i) => i !== index);
    setMyCases(next);
    saveCases(next);
  };

  const toggleCasePublished = (index: number) => {
    const next = myCases.map((c, i) => (i === index ? { ...c, published: !c.published } : c));
    setMyCases(next);
    saveCases(next);
  };

  const tabs = [
    { id: "stats" as const, key: "pdTab1" as const, icon: "ChartNoAxesColumn" },
    { id: "plan" as const, key: "pdTab2" as const, icon: "Wallet" },
    { id: "cases" as const, key: "pdTab3" as const, icon: "FolderOpen" },
    { id: "requests" as const, key: "pdTab4" as const, icon: "Inbox" },
    { id: "friends" as const, key: "pdTabFriends" as const, icon: "Users" },
    { id: "contacts" as const, key: "pdTabContacts" as const, icon: "Contact" },
  ];
  const [paywallOpen, setPaywallOpen] = useState(false);

  const [contacts, setContacts] = useState({ phone: "", email: "", whatsapp: "", telegram: "", website: "", vk: "", instagram: "", linkedin: "" });
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const saveContacts = async () => {
    setSaveState("saving");
    try {
      const res = await fetch(func2url["save-contacts"], {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ ...contacts }),
      });
      setSaveState(res.ok ? "saved" : "error");
    } catch {
      setSaveState("error");
    }
  };

  const [vf, setVf] = useState({
    fullName: "", registry: "",
    legalStatus: "ip",
    verificationCountry: "RU",
    showLegalStatus: true, showLicense: true,
    pseudonym: "", usePseudonym: false,
    gender: "m" as "m" | "f", age: "" as string,
    licenses: [{ number: "", date: "", authority: "" }] as LicenseEntry[],
    documents: [] as { title: string; url: string }[],
    bio: "",
    showBio: true, showAge: true, showDocuments: true,
    timezone: "", alwaysAvailable: false, quietStart: "23:00", quietEnd: "08:00",
  });
  const [vfState, setVfState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [sub, setSub] = useState<{ plan: string; active: boolean; until: string | null } | null>(null);
  const [payHistory, setPayHistory] = useState<{ date: string; plan: string; period: string; amount: number; currency: string; status: string; paymentId: string }[] | null>(null);
  const [payTotalRub, setPayTotalRub] = useState(0);
  // Просмотры анкеты: реальные цифры из базы, а не заглушки-прочерки.
  const [stats, setStats] = useState<{ views7: number; views30: number; daily: { date: string; count: number }[] } | null>(null);
  const [myServices, setMyServices] = useState<{ key: string; price: string }[]>([]);
  const [svcPickerOpen, setSvcPickerOpen] = useState(false);
  const [svcSaveState, setSvcSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  // Данные верификации блокируются от правок после первого сохранения ФИО и реквизитов —
  // дальше изменить их можно только через поддержку (та же логика, что у клиента).
  const [vfLocked, setVfLocked] = useState(false);

  // Админ в редакторе имеет полный доступ — как будто оплатил тариф и прошёл верификацию.
  const locked = sub !== null && !sub.active && !user?.isAdmin;
  const ALLOWED_WHEN_LOCKED = ["stats", "plan"];

  useEffect(() => {
    if (locked && !ALLOWED_WHEN_LOCKED.includes(tab)) setTab("stats");
  }, [locked]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTab = (id: typeof tab) => {
    if (locked && !ALLOWED_WHEN_LOCKED.includes(id)) { setPaywallOpen(true); return; }
    setTab(id);
  };

  useEffect(() => {
    fetch(func2url["profile-stats"], { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d && typeof d.views7 === "number") setStats(d); })
      .catch(() => { /* статистика необязательна */ });
  }, []);

  useEffect(() => {
    fetch(func2url["provider-cases"], { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.cases)) {
          setMyCases(d.cases.map((c: { title?: string; category?: string; views?: number; published?: boolean }) => ({
            title: { ru: c.title || "", en: c.title || "" },
            category: { ru: c.category || "", en: c.category || "" },
            views: Number(c.views) || 0,
            published: !!c.published,
          })));
        }
      })
      .catch(() => {});
  }, [slug]);

  useEffect(() => {
    fetch(func2url["save-verification"], { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => {
        const v = d.verification;
        if (!v) return;
        setSub({ plan: v.plan || "start", active: !!v.subscriptionActive, until: v.subscriptionUntil || null });
        if (Array.isArray(v.services)) {
          setMyServices(v.services.map((s: unknown) => typeof s === "string" ? { key: s, price: "" } : { key: (s as { key: string }).key, price: (s as { price?: string }).price || "" }));
        }
        // Форма верификации уже была заполнена и сохранена ранее (флаг из БД) —
        // блокируем юр.статус, лицензии и документы от дальнейших правок (только поддержка).
        if (v.submitted) setVfLocked(true);
        setVf({
          fullName: v.fullName || "", registry: v.registry || "",
          legalStatus: v.legalStatus || "ip",
          verificationCountry: v.verificationCountry || "RU",
          showLegalStatus: !!v.showLegalStatus, showLicense: !!v.showLicense,
          pseudonym: v.pseudonym || "", usePseudonym: !!v.usePseudonym,
          gender: v.gender === "f" ? "f" : "m", age: v.age != null ? String(v.age) : "",
          licenses: Array.isArray(v.licenses) && v.licenses.length
            ? v.licenses.map((l: unknown) => typeof l === "string"
                ? { number: l, date: "", authority: "" }
                : { number: (l as LicenseEntry).number || "", date: (l as LicenseEntry).date || "", authority: (l as LicenseEntry).authority || "" })
            : [{ number: "", date: "", authority: "" }],
          documents: Array.isArray(v.documents) ? v.documents : [],
          bio: v.bio || "",
          showBio: !!v.showBio, showAge: !!v.showAge, showDocuments: !!v.showDocuments,
          timezone: v.timezone || "", alwaysAvailable: !!v.alwaysAvailable,
          quietStart: v.quietStart || "23:00", quietEnd: v.quietEnd || "08:00",
        });
        if (v.avatarUrl) setAvatarUrl(v.avatarUrl);
        if (v.contacts) {
          setContacts((prev) => ({
            ...prev,
            phone: v.contacts.phone || "",
            email: v.contacts.email || "",
            whatsapp: v.contacts.whatsapp || "",
            telegram: v.contacts.telegram || "",
            website: v.contacts.website || "",
          }));
        }
      })
      .catch(() => {});
  }, [slug]);

  useEffect(() => {
    if (tab !== "plan" || payHistory !== null) return;
    fetch(func2url["save-verification"] + "?action=payments", { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => {
        setPayHistory(Array.isArray(d.payments) ? d.payments : []);
        setPayTotalRub(d.totalRub || 0);
      })
      .catch(() => setPayHistory([]));
  }, [tab, payHistory]);

  const saveVerification = async () => {
    setVfState("saving");
    try {
      const payload = { ...vf, licenses: vf.licenses.filter((l) => l.number.trim()), age: vf.age ? parseInt(vf.age) : null };
      const res = await fetch(func2url["save-verification"], {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ ...payload, services: myServices }),
      });
      setVfState(res.ok ? "saved" : "error");
    } catch {
      setVfState("error");
    }
  };

  const saveServices = async (next: { key: string; price: string }[]) => {
    setSvcSaveState("saving");
    try {
      const payload = { ...vf, licenses: vf.licenses.filter((l) => l.number.trim()), age: vf.age ? parseInt(vf.age) : null };
      const res = await fetch(func2url["save-verification"], {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ slug, ...payload, services: next }),
      });
      setSvcSaveState(res.ok ? "saved" : "error");
      if (res.ok) setTimeout(() => setSvcSaveState("idle"), 2000);
    } catch {
      setSvcSaveState("error");
    }
  };

  const svcSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleServiceSave = (next: { key: string; price: string }[]) => {
    if (svcSaveTimer.current) clearTimeout(svcSaveTimer.current);
    svcSaveTimer.current = setTimeout(() => saveServices(next), 700);
  };

  const toggleService = (key: string) => {
    setMyServices((prev) => {
      const next = prev.some((s) => s.key === key) ? prev.filter((s) => s.key !== key) : [...prev, { key, price: "" }];
      saveServices(next);
      return next;
    });
  };

  const setServicePrice = (key: string, price: string) => {
    setMyServices((prev) => {
      const next = prev.map((s) => (s.key === key ? { ...s, price } : s));
      scheduleServiceSave(next);
      return next;
    });
  };

  type ProvReq = { id: number; clientName: string; category: string; service: string; description: string; budget: string; city: string; createdAt: string | null; myResponse: { message: string; price: string; status: string } | null };
  type MyTask = { id: number; clientName: string; category: string; service: string; description: string; budget: string; city: string; status: string; createdAt: string | null; providerMarkedDone: boolean };
  const [incoming, setIncoming] = useState<ProvReq[]>([]);
  const [myTasks, setMyTasks] = useState<MyTask[]>([]);
  const [respDraft, setRespDraft] = useState<Record<number, { message: string; price: string }>>({});
  const [respOpen, setRespOpen] = useState<number | null>(null);
  const [markingDone, setMarkingDone] = useState<number | null>(null);

  const myCatIds = Array.from(new Set(myServices.map((ms) => services.find((s) => s.title.en === ms.key)?.cat).filter(Boolean)));

  const loadIncoming = useCallback(() => {
    fetch(`${func2url["requests"]}?view=provider`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d.requests)) setIncoming(d.requests); })
      .catch(() => {});
  }, []);

  const loadMyTasks = useCallback(() => {
    fetch(`${func2url["requests"]}?view=mine`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d.requests)) setMyTasks(d.requests); })
      .catch(() => {});
  }, []);

  useEffect(() => { loadIncoming(); loadMyTasks(); }, [loadIncoming, loadMyTasks]);

  const sendResponse = async (requestId: number) => {
    const draft = respDraft[requestId] || { message: "", price: "" };
    await fetch(func2url["requests"], {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ action: "respond", requestId, providerName: vf.usePseudonym && vf.pseudonym ? vf.pseudonym : (vf.fullName || user?.name || ""), message: draft.message, price: draft.price }),
    });
    trackGoal(GOALS.respondRequest);
    setRespOpen(null);
    loadIncoming();
  };

  const markTaskDone = async (requestId: number) => {
    setMarkingDone(requestId);
    try {
      await fetch(func2url["requests"], {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ action: "provider_done", requestId }),
      });
      loadMyTasks();
    } finally {
      setMarkingDone(null);
    }
  };

  const visibleIncoming = incoming.filter((r) => myCatIds.length === 0 || myCatIds.includes(r.category) || !r.category);

  // Система «друзей»: поиск специалиста по его уникальному публичному ID,
  // отправка/приём заявок в друзья, список друзей — используется для личных чатов.
  type FriendItem = { friendshipId: number; userId: number; pairKey: string; provider: { slug: string; name: { ru: string; en: string }; title: { ru: string; en: string }; avatar: string | null; rating: number; verified: boolean } | null };
  type FriendReq = { requestId: number; userId: number; provider: FriendItem["provider"]; createdAt: string | null };
  const [friendsList, setFriendsList] = useState<FriendItem[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendReq[]>([]);
  // Список переписок с последним сообщением и счётчиком непрочитанных.
  type Dialog = { userId: number; pairKey: string; name: LS | null; title: LS | null; avatar: string | null; lastText: string; lastFromMe: boolean; lastAt: string | null; unread: number };
  const [dialogs, setDialogs] = useState<Dialog[]>([]);
  const [searchPublicId, setSearchPublicId] = useState("");
  // Поиск коллег теперь по имени, специализации или номеру — результатов может
  // быть несколько, поэтому храним список, а не одну карточку.
  type FoundPerson = { userId: number; publicId: number; role: string; name: string; provider: FriendItem["provider"]; friendStatus: string; incoming?: boolean };
  const [searchResults, setSearchResults] = useState<FoundPerson[] | null>(null);
  const [friendBusy, setFriendBusy] = useState(false);

  const loadFriends = useCallback(() => {
    fetch(func2url["friends"], { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d.friends)) setFriendsList(d.friends); })
      .catch(() => {});
    fetch(`${func2url["friends"]}?action=requests`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d.requests)) setFriendRequests(d.requests); })
      .catch(() => {});
    fetch(`${func2url["messages"]}?kind=dialogs`, { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d && Array.isArray(d.dialogs)) setDialogs(d.dialogs); })
      .catch(() => {});
  }, []);

  useEffect(() => { loadFriends(); }, [loadFriends]);

  const searchFriendById = async () => {
    const q = searchPublicId.trim();
    if (q.length < 2) return;
    setFriendBusy(true);
    try {
      const res = await fetch(`${func2url["friends"]}?action=search&q=${encodeURIComponent(q)}`, { headers: authHeaders() });
      const d = await res.json();
      setSearchResults(Array.isArray(d.results) ? d.results : []);
    } catch {
      setSearchResults([]);
    } finally {
      setFriendBusy(false);
    }
  };

  const sendFriendRequest = async (targetUserId: number) => {
    setFriendBusy(true);
    try {
      await fetch(func2url["friends"], {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ action: "request", targetUserId }),
      });
      // Карточку не убираем — помечаем «заявка отправлена», чтобы человек
      // видел результат действия и мог продолжить искать дальше.
      setSearchResults((prev) => prev ? prev.map((p) => p.userId === targetUserId ? { ...p, friendStatus: "pending" } : p) : prev);
      loadFriends();
    } finally {
      setFriendBusy(false);
    }
  };

  // Удаление из друзей: без него связь нельзя разорвать, а вместе с ней
  // закрывается и доступ к личной переписке с этим человеком.
  const removeFriend = async (friendUserId: number) => {
    if (!window.confirm(tr("pdRemoveFriendConfirm"))) return;
    await fetch(func2url["friends"], {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ action: "remove", friendUserId }),
    }).catch(() => {});
    loadFriends();
  };

  const respondFriendRequest = async (requestId: number, accept: boolean) => {
    await fetch(func2url["friends"], {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ action: accept ? "accept" : "decline", requestId }),
    });
    loadFriends();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Header card */}
      <div className="border border-gold/30 rounded-sm glass-card p-6 md:p-8 mb-6 flex flex-col sm:flex-row sm:items-center gap-5 security-glow">
        <div className="w-16 h-16 rounded-sm overflow-hidden border-2 border-gold shrink-0">
          <img src={resolveAvatar(avatarUrl, vf.gender)} alt="avatar" loading="lazy" decoding="async" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1">
          <div className="text-xs text-muted-foreground font-montserrat mb-1">{tr("dashWelcome")},</div>
          <div className="font-montserrat font-extrabold text-2xl text-foreground flex items-center gap-2">
            {(vf.usePseudonym && vf.pseudonym ? vf.pseudonym : (vf.fullName || user?.name || ""))}
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

      {locked && (
        <div className="border border-gold/40 rounded-sm bg-gold/10 p-4 mb-6 flex flex-col sm:flex-row sm:items-center gap-3">
          <Icon name="Lock" size={18} className="text-gold shrink-0" />
          <div className="flex-1">
            <div className="font-montserrat font-bold text-sm text-foreground">{tr("paywallTitle")}</div>
            <div className="text-xs text-muted-foreground">{tr("paywallText")}</div>
          </div>
          <button onClick={() => setTab("plan")} className="shrink-0 gold-gradient text-[hsl(28,20%,7%)] px-5 py-2.5 text-xs font-montserrat font-bold rounded-sm hover:opacity-90 transition-opacity">
            {tr("paywallBtn")}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <aside className="lg:col-span-1">
          <div className="border border-border rounded-sm bg-card p-2 lg:sticky lg:top-24 flex lg:flex-col gap-1 overflow-x-auto">
            {tabs.map((tb) => {
              const tabLocked = locked && !ALLOWED_WHEN_LOCKED.includes(tb.id);
              return (
                <button key={tb.id} onClick={() => handleTab(tb.id)}
                  className={`flex items-center gap-2.5 px-4 py-3 rounded-sm text-xs font-montserrat font-semibold whitespace-nowrap transition-colors text-left ${tab === tb.id ? "gold-gradient text-[hsl(28,20%,7%)]" : tabLocked ? "text-muted-foreground/50 hover:bg-secondary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}>
                  <Icon name={tabLocked ? "Lock" : tb.icon} fallback="LayoutDashboard" size={15} />
                  {tr(tb.key)}
                  {/* Счётчик заявок и непрочитанных сообщений: иначе входящее
                      легко не заметить, вкладка выглядит одинаково. */}
                  {tb.id === "friends" && friendRequests.length + dialogs.reduce((s, d) => s + d.unread, 0) > 0 && (
                    <span className={`ms-auto text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center ${tab === "friends" ? "bg-[hsl(28,20%,7%)] text-gold" : "bg-gold text-[hsl(28,20%,7%)]"}`}>
                      {friendRequests.length + dialogs.reduce((s, d) => s + d.unread, 0)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </aside>

        <div className="lg:col-span-3 space-y-5">
          {tab === "stats" && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { n: stats ? String(stats.views30) : "—", l: "pdStatViews" as const, icon: "Eye", period: "pdThisMonth" as const },
                  { n: stats ? String(stats.views7) : "—", l: "pdStatViews7" as const, icon: "TrendingUp", period: "pdThisWeek" as const },
                  { n: String(incoming.length), l: "pdStatRequests" as const, icon: "Inbox", period: "pdThisMonth" as const },
                  { n: String(myCases.length), l: "pdStatCases" as const, icon: "Briefcase", period: "pdAllTime" as const },
                ].map((s) => (
                  <div key={s.l} className="border border-border rounded-sm bg-card p-5">
                    <div className="flex items-center justify-between mb-2">
                      <Icon name={s.icon} size={15} className="text-gold" />
                      <span className="text-[10px] text-muted-foreground">{tr(s.period)}</span>
                    </div>
                    <div className="stat-number text-2xl mb-1">{s.n}</div>
                    <div className="text-[10px] text-muted-foreground">{tr(s.l)}</div>
                  </div>
                ))}
              </div>
              {/* График просмотров за неделю. Показываем, только когда просмотры
                  действительно были: пустой график хуже, чем его отсутствие. */}
              {stats && stats.views7 > 0 && (
                <div className="border border-border rounded-sm bg-card p-6">
                  <div className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest mb-4">{tr("pdViewsChart")}</div>
                  <div className="flex items-end gap-1.5 h-24">
                    {stats.daily.map((d) => {
                      const max = Math.max(...stats.daily.map((x) => x.count), 1);
                      return (
                        <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5">
                          <div className="w-full gold-gradient rounded-t-sm min-h-[3px]" style={{ height: `${(d.count / max) * 100}%` }} title={`${d.date}: ${d.count}`} />
                          <span className="text-[9px] text-muted-foreground">{d.date.slice(8)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {stats && stats.views30 === 0 && (
                <div className="flex items-start gap-2.5 border border-border rounded-sm bg-card p-5 text-xs text-muted-foreground leading-relaxed">
                  <Icon name="Info" size={15} className="text-gold shrink-0 mt-0.5" />
                  <span>{tr("pdStatsEmpty")}</span>
                </div>
              )}
              <div className="border border-border rounded-sm bg-card p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest">{tr("pdProfileFill")}</span>
                  <span className="text-sm font-montserrat font-bold text-gold">85%</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full gold-gradient rounded-full" style={{ width: "85%" }} />
                </div>
                <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
                  <Icon name="ShieldCheck" size={14} className="text-green-400" />
                  {tr("pdVerified")}
                </div>
              </div>
            </>
          )}

          {tab === "plan" && (
            <>
              {(() => {
                const planName = ({ start: "planStartName", pro: "planProName", premium: "planPremiumName", enterprise: "planEntName" } as const)[(sub?.plan || "start")] || "planStartName";
                const planPrice = ({ start: "planStartPrice", pro: "planProPrice", premium: "planPremiumPrice", enterprise: "planEntPrice" } as const)[(sub?.plan || "start")] || "planStartPrice";
                const active = sub?.active ?? false;
                const untilDate = sub?.until ? new Date(sub.until) : null;
                const untilStr = untilDate ? untilDate.toLocaleDateString(lang === "ru" ? "ru-RU" : "en-US", { day: "numeric", month: "long", year: "numeric" }) : null;
                const daysLeft = untilDate ? Math.ceil((untilDate.getTime() - Date.now()) / 86400000) : null;
                const expiringSoon = active && daysLeft !== null && daysLeft >= 0 && daysLeft <= 7;
                return (
                  <div className={`border rounded-sm glass-card p-6 ${active ? "border-gold/30 security-glow" : "border-border"}`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest">{tr("pdCurrentPlan")}</div>
                      <span className={`text-xs font-montserrat font-semibold px-3 py-1 rounded-sm ${active ? "bg-green-500/15 text-green-400" : "bg-secondary text-muted-foreground"}`}>{active ? tr("pdActive") : tr("pdInactive")}</span>
                    </div>
                    <div className="flex items-end gap-2 mb-3 flex-wrap">
                      {sub?.plan === "premium" && <Icon name="Crown" size={20} className="text-gold mb-1" />}
                      <span className="font-montserrat font-extrabold text-2xl text-foreground">{tr(planName)}</span>
                      <span className="font-montserrat font-bold text-lg text-gold">{tr(planPrice)}{tr("perMonth")}</span>
                    </div>
                    {active && untilStr ? (
                      <div className="mb-5 space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Icon name="CalendarCheck" size={15} className="text-gold shrink-0" />
                          <span className="text-muted-foreground">{tr("pdPaidUntil")}:</span>
                          <span className="font-montserrat font-bold text-foreground">{untilStr}</span>
                        </div>
                        {daysLeft !== null && daysLeft >= 0 && (
                          <div className={`inline-flex items-center gap-1.5 text-xs font-montserrat font-semibold px-2.5 py-1 rounded-sm ${expiringSoon ? "bg-destructive/15 text-destructive" : "bg-secondary text-muted-foreground"}`}>
                            <Icon name={expiringSoon ? "TriangleAlert" : "Clock"} size={12} />
                            {daysLeft === 0 ? tr("pdExpiresToday") : `${tr("pdDaysLeft")}: ${daysLeft}`}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-5">
                        <Icon name="CircleAlert" size={14} className="text-muted-foreground shrink-0" />
                        {tr("pdNoSub")}
                      </div>
                    )}
                    <button onClick={() => setActive("pricing")} className="gold-gradient text-[hsl(28,20%,7%)] px-6 py-2.5 text-xs font-montserrat font-bold rounded-sm hover:opacity-90 transition-opacity">{active ? tr("pdChangePlan") : tr("choosePlan")}</button>
                  </div>
                );
              })()}

              {sub?.plan !== "premium" && (
              <div className="relative overflow-hidden border-2 border-gold/50 rounded-sm glass-card ambient-gold p-6 security-glow">
                <div className="absolute inset-0 grid-line-bg opacity-30" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon name="Crown" size={18} className="text-gold" />
                    <span className="font-montserrat font-extrabold text-lg gold-text-gradient">{tr("planPremiumName")}</span>
                    <span className="ms-auto text-[10px] font-montserrat font-bold px-2 py-0.5 rounded-sm bg-gold/15 text-gold uppercase tracking-widest">{tr("pdPremiumWhatFor")}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-5">{tr("premiumValueNote")}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                    {([
                      { icon: "Crown", t: "featPremiumCard" as const, d: "pdPremB1" as const },
                      { icon: "ArrowUpToLine", t: "featPremiumTop" as const, d: "pdPremB2" as const },
                      { icon: "BadgeCheck", t: "featBadge" as const, d: "pdPremB4" as const },
                    ]).map((b) => (
                      <div key={b.t} className="flex items-start gap-3 border border-gold/20 rounded-sm bg-gold/[0.04] p-3">
                        <div className="w-8 h-8 gold-gradient rounded flex items-center justify-center shrink-0">
                          <Icon name={b.icon} fallback="Sparkles" size={15} className="text-[hsl(28,20%,7%)]" />
                        </div>
                        <div>
                          <div className="font-montserrat font-bold text-xs text-foreground">{tr(b.t)}</div>
                          <div className="text-[11px] text-muted-foreground leading-snug mt-0.5">{tr(b.d)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setActive("pricing")} className="gold-gradient text-[hsl(28,20%,7%)] px-6 py-2.5 text-xs font-montserrat font-bold rounded-sm hover:opacity-90 transition-opacity glow-gold-sm inline-flex items-center gap-2">
                    <Icon name="Crown" size={14} />{tr("pdUpgradePremium")}
                  </button>
                </div>
              </div>
              )}

              <div className="border border-border rounded-sm bg-card p-6 space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">{tr("pdPaymentMethod")}</span>
                  <span className="text-sm font-montserrat font-semibold text-foreground flex items-center gap-2"><Icon name="CreditCard" size={15} className="text-gold" /> •••• 4242</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-muted-foreground">{tr("pdAutoRenew")}</span>
                  <span className="text-xs font-montserrat font-semibold px-3 py-1 rounded-sm bg-gold/15 text-gold">{tr("cdEnabled")}</span>
                </div>
              </div>

              <div className="border border-border rounded-sm bg-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest">{tr("pdHistoryTitle")}</div>
                  {payTotalRub > 0 && (
                    <div className="text-xs text-muted-foreground">{tr("pdHistTotal")}: <span className="font-montserrat font-bold text-gold">{payTotalRub.toLocaleString("ru-RU")} ₽</span></div>
                  )}
                </div>
                {payHistory === null ? (
                  <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground"><Icon name="Loader" size={16} className="animate-spin" />{tr("pdHistLoading")}</div>
                ) : payHistory.length === 0 ? (
                  <div className="flex flex-col items-center text-center py-10 text-muted-foreground">
                    <Icon name="ReceiptText" size={26} className="mb-2 text-muted-foreground/50" />
                    <div className="text-sm">{tr("pdHistEmpty")}</div>
                  </div>
                ) : (
                <>
                <div className="hidden sm:grid grid-cols-[1fr_1fr_auto_auto_auto] gap-3 px-3 pb-2 mb-1 border-b border-border text-[10px] font-montserrat font-semibold text-muted-foreground uppercase tracking-widest">
                  <span>{tr("pdHistDate")}</span>
                  <span>{tr("pdHistPlan")}</span>
                  <span className="text-right">{tr("pdHistAmount")}</span>
                  <span className="text-center">{tr("pdHistStatus")}</span>
                  <span className="text-right">{tr("pdHistReceipt")}</span>
                </div>
                <div className="space-y-1">
                  {payHistory.map((row, i) => {
                    const planKey = ({ start: "planStartName", pro: "planProName", premium: "planPremiumName", enterprise: "planEntName" } as const)[row.plan] || "planProName";
                    let amountStr: string;
                    if (row.currency === "RUB") {
                      amountStr = `${Math.round(row.amount).toLocaleString("ru-RU")} ₽`;
                    } else {
                      try {
                        amountStr = new Intl.NumberFormat(lang === "ru" ? "ru-RU" : "en-US", { style: "currency", currency: row.currency, maximumFractionDigits: 2 }).format(row.amount);
                      } catch {
                        amountStr = `${Math.round(row.amount).toLocaleString("ru-RU")} ${row.currency || ""}`.trim();
                      }
                    }
                    const periodStr = tr(row.period === "year" ? "payOneYear" : "payOneMonth");
                    const st = { paid: { key: "pdHistPaid" as const, cls: "text-green-400 border-green-500/40" }, pending: { key: "pdHistPending" as const, cls: "text-gold border-gold/40" }, failed: { key: "pdHistFailed" as const, cls: "text-destructive border-destructive/40" } }[row.status] || { key: "pdHistPaid" as const, cls: "text-green-400 border-green-500/40" };
                    return (
                      <div key={row.paymentId || i} className="grid grid-cols-2 sm:grid-cols-[1fr_1fr_auto_auto_auto] gap-2 sm:gap-3 items-center px-3 py-3 rounded-sm hover:bg-secondary transition-colors text-xs">
                        <span className="text-muted-foreground">{row.date}</span>
                        <span className="font-montserrat font-semibold text-foreground">{tr(planKey)}</span>
                        <span className="font-montserrat font-bold text-gold sm:text-right">{amountStr}</span>
                        <span className="sm:text-center"><span className={`tag-security ${st.cls}`}>{tr(st.key)}</span></span>
                        <span className="sm:text-right">
                          {row.status === "paid" ? (
                            <button
                              onClick={() => downloadReceipt({
                                receiptNo: (row.paymentId || "SN-" + (i + 1)).slice(0, 16).toUpperCase(),
                                date: row.date,
                                plan: tr(planKey),
                                period: periodStr,
                                amount: amountStr,
                                payer: vf.fullName || "",
                                method: tr("payCard"),
                                lang: (lang === "ru" ? "ru" : "en") as "ru" | "en",
                              })}
                              className="inline-flex items-center gap-1 text-muted-foreground hover:text-gold transition-colors font-montserrat font-semibold"
                            >
                              <Icon name="Download" size={13} /> <span className="hidden lg:inline">{tr("pdHistDownload")}</span>
                            </button>
                          ) : (
                            <span className="text-muted-foreground/40">—</span>
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
                </>
                )}
              </div>
            </>
          )}

          {tab === "cases" && (
            <>
              <div className="border border-border rounded-sm bg-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest">{tr("pdMyCases")}</div>
                  <button onClick={() => setCaseFormOpen((o) => !o)} className="gold-gradient text-[hsl(28,20%,7%)] px-3 py-1.5 text-[10px] font-montserrat font-bold rounded-sm flex items-center gap-1">
                    <Icon name={caseFormOpen ? "X" : "Plus"} size={12} />{caseFormOpen ? tr("cancel") : tr("pdAddCase")}
                  </button>
                </div>
                {caseFormOpen && (
                  <div className="border border-gold/30 rounded-sm bg-secondary/40 p-4 mb-4 space-y-3">
                    <div>
                      <label className="text-[10px] text-muted-foreground uppercase tracking-wide block mb-1">{tr("pdCaseTitle")}</label>
                      <input value={caseTitle} onChange={(e) => setCaseTitle(e.target.value)} placeholder={tr("pdCaseTitlePh")} className="w-full bg-secondary border border-border rounded-sm px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-gold" />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground uppercase tracking-wide block mb-1">{tr("pdCaseCat")}</label>
                      <select value={caseCategory} onChange={(e) => setCaseCategory(e.target.value)} className="w-full bg-secondary border border-border rounded-sm px-3 py-2 text-sm text-foreground outline-none focus:border-gold">
                        <option value="">{tr("pdCaseDefaultCat")}</option>
                        {serviceCategories.map((c) => <option key={c.id} value={L(c.title, lang)}>{L(c.title, lang)}</option>)}
                      </select>
                    </div>
                    <button onClick={addCase} disabled={!caseTitle.trim()} className="gold-gradient text-[hsl(28,20%,7%)] px-4 py-2 text-xs font-montserrat font-bold rounded-sm disabled:opacity-50">{tr("pdCaseSave")}</button>
                  </div>
                )}
                <div className="space-y-3">
                  {myCases.map((c, i) => (
                    <div key={`${c.title.en}-${i}`} className="flex items-center gap-3 p-3 border border-border rounded-sm">
                      <div className="w-8 h-8 gold-gradient rounded flex items-center justify-center shrink-0">
                        <Icon name="FolderOpen" size={14} className="text-[hsl(28,20%,7%)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-montserrat font-semibold text-sm text-foreground truncate">{L(c.title, lang)}</div>
                        <div className="text-[10px] text-muted-foreground">{c.views} · {L(c.category, lang)}</div>
                      </div>
                      <button onClick={() => toggleCasePublished(i)} title={tr(c.published ? "pdUnpublish" : "pdPublish")} className={`tag-security shrink-0 cursor-pointer transition-colors hover:opacity-80 ${c.published ? "text-green-400 border-green-500/40" : "text-yellow-500 border-yellow-600/40"}`}>{tr(c.published ? "pdPublished" : "pdDraft")}</button>
                      <button onClick={() => removeCase(i)} title={tr("remove")} className="shrink-0 w-7 h-7 flex items-center justify-center rounded-sm border border-border text-muted-foreground hover:border-destructive hover:text-destructive transition-colors">
                        <Icon name="Trash2" size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border border-border rounded-sm bg-card p-6">
                <div className="flex items-center justify-between mb-1 gap-2">
                  <div className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest">{tr("pdMyServices")}</div>
                  <div className="flex items-center gap-2">
                    {svcSaveState === "saving" && <Icon name="Loader" size={13} className="animate-spin text-muted-foreground" />}
                    {svcSaveState === "saved" && <span className="text-[10px] text-green-400 flex items-center gap-1"><Icon name="Check" size={12} />{tr("pdSaved")}</span>}
                    <button onClick={() => setSvcPickerOpen((o) => !o)} className="gold-gradient text-[hsl(28,20%,7%)] px-3 py-1.5 text-[10px] font-montserrat font-bold rounded-sm flex items-center gap-1">
                      <Icon name={svcPickerOpen ? "Check" : "Plus"} size={12} />{svcPickerOpen ? tr("pdDone") : tr("pdManageServices")}
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground mb-4">{tr("pdServicesHint")}</p>

                {!svcPickerOpen && (
                  <div className="space-y-3">
                    {myServices.length === 0 && (
                      <div className="text-xs text-muted-foreground py-6 text-center border border-dashed border-border rounded-sm">{tr("pdNoServices")}</div>
                    )}
                    {myServices.map((ms) => {
                      const s = services.find((x) => x.title.en === ms.key);
                      if (!s) return null;
                      return (
                        <div key={ms.key} className="flex items-center gap-3 p-3 border border-border rounded-sm">
                          <div className="w-8 h-8 gold-gradient rounded flex items-center justify-center shrink-0">
                            <Icon name={s.icon} size={14} className="text-[hsl(28,20%,7%)]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-montserrat font-semibold text-sm text-foreground truncate">{L(s.title, lang)}</div>
                            <div className="text-[10px] text-muted-foreground truncate">{L(serviceCategories.find((c) => c.id === s.cat)?.title || { ru: "", en: "" }, lang)}</div>
                          </div>
                          <span className="font-montserrat font-bold text-sm text-gold shrink-0">{ms.price ? `${tr("priceFrom")} ${ms.price}` : tr("priceNotSet")}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {svcPickerOpen && (
                  <div className="space-y-5">
                    <div className="text-[11px] text-muted-foreground bg-secondary/50 border border-border rounded-sm p-3 flex items-start gap-2">
                      <Icon name="Info" size={14} className="text-gold shrink-0 mt-0.5" />
                      {tr("pdPriceHint")}
                    </div>
                    {serviceCategories.map((cat) => (
                      <div key={cat.id}>
                        <div className="flex items-center gap-2 mb-2">
                          <Icon name={cat.icon} fallback="Shield" size={14} className="text-gold" />
                          <div className="text-[11px] font-montserrat font-bold text-foreground uppercase tracking-wider">{L(cat.title, lang)}</div>
                        </div>
                        <div className="space-y-1.5">
                          {services.filter((s) => s.cat === cat.id).map((s) => {
                            const sel = myServices.find((x) => x.key === s.title.en);
                            const on = !!sel;
                            return (
                              <div key={s.title.en} className={`border rounded-sm transition-colors ${on ? "border-gold/60 bg-gold/[0.06]" : "border-border"}`}>
                                <button onClick={() => toggleService(s.title.en)} className="w-full flex items-center gap-3 p-2.5 text-left">
                                  <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border ${on ? "gold-gradient border-transparent" : "border-border"}`}>
                                    {on && <Icon name="Check" size={13} className="text-[hsl(28,20%,7%)]" />}
                                  </div>
                                  <Icon name={s.icon} size={15} className={on ? "text-gold" : "text-muted-foreground"} />
                                  <span className={`flex-1 text-sm font-montserrat ${on ? "text-foreground font-semibold" : "text-muted-foreground"}`}>{L(s.title, lang)}</span>
                                </button>
                                {on && (
                                  <div className="flex items-center gap-2 px-2.5 pb-2.5 pt-0">
                                    <span className="text-[11px] text-muted-foreground shrink-0">{tr("priceFrom")}</span>
                                    <input
                                      value={sel?.price || ""}
                                      onChange={(e) => setServicePrice(s.title.en, e.target.value)}
                                      inputMode="numeric"
                                      placeholder={tr("pricePlaceholder")}
                                      className="flex-1 bg-secondary border border-border rounded-sm px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-gold"
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {tab === "requests" && myTasks.filter((t) => t.status === "assigned" || t.status === "completed").length > 0 && (
            <div className="border border-border rounded-sm bg-card p-6">
              <div className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest mb-1">{tr("pdMyTasksTitle")}</div>
              <p className="text-[11px] text-muted-foreground mb-4">{tr("pdMyTasksHint")}</p>
              <div className="space-y-3">
                {myTasks.filter((t) => t.status === "assigned" || t.status === "completed").map((t) => (
                  <div key={t.id} className="p-4 border border-border rounded-sm">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0">
                        <div className="font-montserrat font-bold text-sm text-foreground">{shortName(t.clientName) || tr("pdReqClient")}</div>
                        <div className="text-xs text-muted-foreground">{t.service || "—"}</div>
                      </div>
                      {t.providerMarkedDone ? (
                        <span className="tag-security shrink-0 text-green-400 border-green-500/40">{tr("pdTaskDoneBadge")}</span>
                      ) : (
                        <span className="tag-security shrink-0 text-gold border-gold/40">{tr("reqChosen")}</span>
                      )}
                    </div>
                    {t.budget && <div className="text-xs text-muted-foreground mb-3">{tr("pdReqBudget")}: <span className="text-gold font-semibold">{t.budget}</span></div>}
                    {!t.providerMarkedDone && (
                      <button
                        onClick={() => markTaskDone(t.id)}
                        disabled={markingDone === t.id}
                        className="w-full gold-gradient text-[hsl(28,20%,7%)] text-xs font-montserrat font-bold py-2 rounded-sm hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-1.5"
                      >
                        {markingDone === t.id ? <Icon name="Loader" size={14} className="animate-spin" /> : <Icon name="CheckCircle2" size={14} />}
                        {tr("pdMarkDone")}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "requests" && (
            <div className="border border-border rounded-sm bg-card p-6">
              <div className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest mb-1">{tr("pdReqTitle")}</div>
              <p className="text-[11px] text-muted-foreground mb-4">{tr("pdReqHint")}</p>
              <div className="space-y-3">
                {visibleIncoming.length === 0 && (
                  <div className="text-xs text-muted-foreground py-10 text-center border border-dashed border-border rounded-sm">{tr("pdReqEmpty")}</div>
                )}
                {visibleIncoming.map((r) => {
                  const cat = serviceCategories.find((c) => c.id === r.category);
                  const responded = !!r.myResponse;
                  const accepted = r.myResponse?.status === "accepted";
                  const declined = r.myResponse?.status === "declined";
                  const draft = respDraft[r.id] || { message: "", price: "" };
                  return (
                    <div key={r.id} className="p-4 border border-border rounded-sm">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="min-w-0">
                          <div className="font-montserrat font-bold text-sm text-foreground">{shortName(r.clientName) || tr("pdReqClient")}</div>
                          <div className="text-xs text-muted-foreground">{tr("pdReqService")}: {r.service || (cat ? L(cat.title, lang) : "—")}</div>
                          {cat && <div className="text-[10px] text-muted-foreground mt-0.5">{L(cat.title, lang)}</div>}
                        </div>
                        {accepted ? <span className="tag-security shrink-0 text-green-400 border-green-500/40">{tr("reqChosen")}</span>
                          : declined ? <span className="tag-security shrink-0 text-muted-foreground border-border">{tr("reqDeclined")}</span>
                          : responded ? <span className="tag-security shrink-0 text-gold border-gold/40">{tr("pdResponded")}</span>
                          : <span className="tag-security shrink-0 text-blue-400 border-blue-500/40">{tr("cdStatusNew")}</span>}
                      </div>
                      {r.description && <p className="text-xs text-muted-foreground mb-2">{r.description}</p>}
                      <div className="flex items-center gap-4 mb-3 flex-wrap">
                        {r.budget && <span className="text-xs text-muted-foreground">{tr("pdReqBudget")}: <span className="text-gold font-semibold">{r.budget}</span></span>}
                        {r.city && <span className="text-xs text-muted-foreground">{r.city}</span>}
                      </div>

                      {responded && r.myResponse && (
                        <div className="text-[11px] text-muted-foreground border-t border-border pt-2 mb-2">
                          {tr("pdYourOffer")}: {r.myResponse.price && <span className="text-gold font-semibold">{r.myResponse.price}</span>} {r.myResponse.message}
                        </div>
                      )}

                      {!accepted && !declined && (
                        respOpen === r.id ? (
                          <div className="space-y-2">
                            <input value={draft.price} onChange={(e) => setRespDraft({ ...respDraft, [r.id]: { ...draft, price: e.target.value } })} placeholder={tr("pdOfferPrice")} className="w-full bg-secondary border border-border rounded-sm px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-gold" />
                            <textarea value={draft.message} onChange={(e) => setRespDraft({ ...respDraft, [r.id]: { ...draft, message: e.target.value } })} rows={2} placeholder={tr("pdOfferMsg")} className="w-full bg-secondary border border-border rounded-sm px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-gold resize-none" />
                            <div className="flex gap-2">
                              <button onClick={() => sendResponse(r.id)} className="flex-1 gold-gradient text-[hsl(28,20%,7%)] text-xs font-montserrat font-bold py-2 rounded-sm hover:opacity-90">{tr("pdSendOffer")}</button>
                              <button onClick={() => setRespOpen(null)} className="border border-border text-muted-foreground text-xs font-montserrat font-semibold px-4 py-2 rounded-sm">{tr("cancel")}</button>
                            </div>
                          </div>
                        ) : (
                          <button onClick={() => setRespOpen(r.id)} className="w-full gold-gradient text-[hsl(28,20%,7%)] text-xs font-montserrat font-bold py-2 rounded-sm hover:opacity-90 transition-opacity">{responded ? tr("pdEditOffer") : tr("pdRespond")}</button>
                        )
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === "stats" && (
            <div className="border border-border rounded-sm bg-card p-6 space-y-5">
              <div>
                <div className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest mb-1">{tr("pdVerifyTitle")}</div>
                <p className="text-xs text-muted-foreground leading-relaxed">{tr("pdVerifyHint")}</p>
              </div>

              {vfLocked && (
                <div className="flex items-start gap-2.5 border border-gold/30 rounded-sm bg-gold/5 px-3 py-2.5">
                  <Icon name="Lock" size={15} className="text-gold shrink-0 mt-0.5" />
                  <div className="text-[11px] text-muted-foreground leading-relaxed">
                    {tr("cdProfileLocked")}{" "}
                    <a href="https://poehali.dev/help" target="_blank" rel="noreferrer" className="text-gold hover:underline font-semibold">{tr("cdContactSupport")}</a>
                  </div>
                </div>
              )}

              {/* Avatar upload */}
              <AvatarUploader current={avatarUrl} gender={vf.gender} role="provider" recordId={slug} onUploaded={setAvatarUrl} />

              {/* Gender + Age */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-montserrat font-semibold text-foreground block mb-2">{tr("pdVfGender")}</label>
                  <div className="grid grid-cols-2 gap-2">
                    {([{ v: "m", k: "pdVfGenderM" as const }, { v: "f", k: "pdVfGenderF" as const }]).map((g) => (
                      <button key={g.v} onClick={() => { setVf({ ...vf, gender: g.v as "m" | "f" }); setVfState("idle"); }}
                        className={`py-2.5 text-xs font-montserrat font-semibold rounded-sm border transition-all ${vf.gender === g.v ? "border-gold text-gold bg-gold/10" : "border-border text-muted-foreground hover:text-foreground"}`}>
                        {tr(g.k)}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-montserrat font-semibold text-foreground">{tr("pdVfAge")}</label>
                    <button onClick={() => setVf({ ...vf, showAge: !vf.showAge })}
                      className={`flex items-center gap-1 text-[10px] font-montserrat font-bold px-2 py-1 rounded-sm transition-colors ${vf.showAge ? "bg-gold/15 text-gold" : "bg-secondary text-muted-foreground"}`}>
                      <Icon name={vf.showAge ? "Eye" : "EyeOff"} size={12} />
                      {tr(vf.showAge ? "pdVfShow" : "pdVfHidden")}
                    </button>
                  </div>
                  <input type="number" min={18} max={100} value={vf.age} onChange={(e) => { setVf({ ...vf, age: e.target.value }); setVfState("idle"); }} placeholder={tr("pdVfAge")} className="w-full bg-secondary border border-border rounded-sm px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-gold transition-colors" />
                </div>
              </div>
              <div className="divider-gold" />

              {/* Pseudonym */}
              <div className="border border-border rounded-sm bg-secondary/40 p-4 space-y-3">
                <div>
                  <label className="text-xs font-montserrat font-semibold text-foreground flex items-center gap-1.5 mb-1"><Icon name="VenetianMask" size={13} className="text-gold" />{tr("pdVfPseudonym")}</label>
                  <p className="text-[11px] text-muted-foreground mb-2">{tr("pdVfPseudonymHint")}</p>
                  <input value={vf.pseudonym} onChange={(e) => { setVf({ ...vf, pseudonym: e.target.value }); setVfState("idle"); }} placeholder={tr("pdVfPseudonym")} className="w-full bg-secondary border border-border rounded-sm px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-gold transition-colors" />
                </div>
                <button
                  onClick={() => { setVf({ ...vf, usePseudonym: !vf.usePseudonym }); setVfState("idle"); }}
                  role="switch"
                  aria-checked={vf.usePseudonym}
                  className="flex items-center justify-between w-full"
                >
                  <span className="text-xs text-foreground">{tr("pdVfUsePseudonym")}</span>
                  <span className={`relative w-10 h-5 rounded-full transition-colors ${vf.usePseudonym ? "bg-gold" : "bg-border"}`}>
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-card transition-all ${vf.usePseudonym ? "start-5" : "start-0.5"}`} />
                  </span>
                </button>
              </div>

              {/* Страна верификации — определяет, какой документ ожидается ниже
                  (лицензия ЧОП для РФ, State license для США, номер лицензии ЕС,
                  для остальных стран — свободный ввод + ссылка в поддержку). */}
              <div>
                <label className="text-xs font-montserrat font-semibold text-foreground block mb-2">{tr("pdVfCountry")}</label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {([
                    { v: "RU", k: "pdVfCountryRU" as const },
                    { v: "US", k: "pdVfCountryUS" as const },
                    { v: "EU", k: "pdVfCountryEU" as const },
                    { v: "OTHER", k: "pdVfCountryOther" as const },
                  ]).map((c) => (
                    <button
                      key={c.v}
                      disabled={vfLocked}
                      onClick={() => { setVf({ ...vf, verificationCountry: c.v }); setVfState("idle"); }}
                      className={`py-2.5 text-xs font-montserrat font-semibold rounded-sm border transition-all disabled:opacity-60 disabled:cursor-not-allowed ${vf.verificationCountry === c.v ? "border-gold text-gold bg-gold/10" : "border-border text-muted-foreground hover:text-foreground"}`}
                    >
                      {tr(c.k)}
                    </button>
                  ))}
                </div>
                {vf.verificationCountry === "OTHER" && (
                  <div className="flex items-start gap-2 text-[11px] text-muted-foreground bg-secondary/50 border border-border rounded-sm px-3 py-2">
                    <Icon name="Info" size={13} className="shrink-0 mt-0.5" />
                    <span>
                      {tr("pdVfCountryOtherHint")}{" "}
                      <a href="https://poehali.dev/help" target="_blank" rel="noreferrer" className="text-gold hover:underline font-semibold">{tr("cdContactSupport")}</a>
                    </span>
                  </div>
                )}
              </div>

              {/* Legal status (with visibility toggle) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-montserrat font-semibold text-foreground">{tr("pdVfStatus")}</label>
                  <button
                    onClick={() => setVf({ ...vf, showLegalStatus: !vf.showLegalStatus })}
                    className={`flex items-center gap-1 text-[10px] font-montserrat font-bold px-2 py-1 rounded-sm transition-colors ${vf.showLegalStatus ? "bg-gold/15 text-gold" : "bg-secondary text-muted-foreground"}`}
                  >
                    <Icon name={vf.showLegalStatus ? "Eye" : "EyeOff"} size={12} />
                    {tr(vf.showLegalStatus ? "pdVfShow" : "pdVfHidden")}
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { v: "self", k: "pdVfStatusSelf" as const },
                    { v: "ip", k: "pdVfStatusIp" as const },
                    { v: "company", k: "pdVfStatusCompany" as const },
                  ]).map((s) => (
                    <button
                      key={s.v}
                      disabled={vfLocked}
                      onClick={() => { setVf({ ...vf, legalStatus: s.v }); setVfState("idle"); }}
                      className={`py-2.5 text-xs font-montserrat font-semibold rounded-sm border transition-all disabled:opacity-60 disabled:cursor-not-allowed ${vf.legalStatus === s.v ? "border-gold text-gold bg-gold/10" : "border-border text-muted-foreground hover:text-foreground"}`}
                    >
                      {tr(s.k)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Licenses — multiple (with visibility toggle) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-montserrat font-semibold text-foreground">{tr("pdVfLicenses")}</label>
                  <button
                    onClick={() => setVf({ ...vf, showLicense: !vf.showLicense })}
                    className={`flex items-center gap-1 text-[10px] font-montserrat font-bold px-2 py-1 rounded-sm transition-colors ${vf.showLicense ? "bg-gold/15 text-gold" : "bg-secondary text-muted-foreground"}`}
                  >
                    <Icon name={vf.showLicense ? "Eye" : "EyeOff"} size={12} />
                    {tr(vf.showLicense ? "pdVfShow" : "pdVfHidden")}
                  </button>
                </div>
                <div className="space-y-3">
                  {vf.licenses.map((lic, i) => (
                    <div key={i} className="border border-border rounded-sm p-3 bg-secondary/40 space-y-2 relative">
                      {vf.licenses.length > 1 && !vfLocked && (
                        <button onClick={() => { setVf({ ...vf, licenses: vf.licenses.filter((_, idx) => idx !== i) }); setVfState("idle"); }} className="absolute top-2 end-2 px-2 py-1 border border-border rounded-sm text-muted-foreground hover:border-destructive hover:text-destructive transition-colors bg-card" aria-label={tr("remove")}>
                          <Icon name="Trash2" size={13} />
                        </button>
                      )}
                      <input value={lic.number} readOnly={vfLocked} onChange={(e) => { const arr = [...vf.licenses]; arr[i] = { ...arr[i], number: e.target.value }; setVf({ ...vf, licenses: arr }); setVfState("idle"); }} placeholder={tr(vf.verificationCountry === "US" ? "pdVfLicensePhUS" : vf.verificationCountry === "EU" ? "pdVfLicensePhEU" : vf.verificationCountry === "OTHER" ? "pdVfLicensePhOther" : "pdVfLicensePh")} className="w-full bg-secondary border border-border rounded-sm px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-gold transition-colors read-only:opacity-70 read-only:cursor-not-allowed" />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-montserrat font-bold text-muted-foreground uppercase tracking-widest block mb-1">{tr("pdVfLicenseDate")}</label>
                          <input type="date" value={lic.date} readOnly={vfLocked} onChange={(e) => { const arr = [...vf.licenses]; arr[i] = { ...arr[i], date: e.target.value }; setVf({ ...vf, licenses: arr }); setVfState("idle"); }} className="w-full bg-secondary border border-border rounded-sm px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold transition-colors read-only:opacity-70 read-only:cursor-not-allowed" />
                        </div>
                        <div>
                          <label className="text-[10px] font-montserrat font-bold text-muted-foreground uppercase tracking-widest block mb-1">{tr("pdVfLicenseAuthority")}</label>
                          <input value={lic.authority} readOnly={vfLocked} onChange={(e) => { const arr = [...vf.licenses]; arr[i] = { ...arr[i], authority: e.target.value }; setVf({ ...vf, licenses: arr }); setVfState("idle"); }} placeholder={tr("pdVfLicenseAuthorityPh")} className="w-full bg-secondary border border-border rounded-sm px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-gold transition-colors read-only:opacity-70 read-only:cursor-not-allowed" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground leading-relaxed">{tr("pdVfPurposeLicense")}</p>
                {!vfLocked && (
                  <button onClick={() => { setVf({ ...vf, licenses: [...vf.licenses, { number: "", date: "", authority: "" }] }); setVfState("idle"); }} className="mt-2 inline-flex items-center gap-1.5 text-xs font-montserrat font-semibold text-gold hover:underline">
                    <Icon name="Plus" size={13} />{tr("pdVfAddLicense")}
                  </button>
                )}
              </div>

              {/* Documents — diplomas, certificates */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-montserrat font-semibold text-foreground">{tr("pdVfDocuments")}</label>
                  <button
                    onClick={() => setVf({ ...vf, showDocuments: !vf.showDocuments })}
                    className={`flex items-center gap-1 text-[10px] font-montserrat font-bold px-2 py-1 rounded-sm transition-colors ${vf.showDocuments ? "bg-gold/15 text-gold" : "bg-secondary text-muted-foreground"}`}
                  >
                    <Icon name={vf.showDocuments ? "Eye" : "EyeOff"} size={12} />
                    {tr(vf.showDocuments ? "pdVfShow" : "pdVfHidden")}
                  </button>
                </div>
                <div className="space-y-3">
                  {vf.documents.map((doc, i) => (
                    <div key={i} className="border border-border rounded-sm bg-secondary/30 p-3">
                      <div className="flex gap-2">
                        <input value={doc.title} readOnly={vfLocked} onChange={(e) => { const arr = [...vf.documents]; arr[i] = { ...arr[i], title: e.target.value }; setVf({ ...vf, documents: arr }); setVfState("idle"); }} placeholder={tr("pdVfDocTitlePh")} className="flex-1 min-w-0 bg-secondary border border-border rounded-sm px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-gold transition-colors read-only:opacity-70 read-only:cursor-not-allowed" />
                        {!vfLocked && (
                          <button onClick={() => { setVf({ ...vf, documents: vf.documents.filter((_, idx) => idx !== i) }); setVfState("idle"); }} className="shrink-0 px-3 border border-border rounded-sm text-muted-foreground hover:border-destructive hover:text-destructive transition-colors" aria-label={tr("remove")}>
                            <Icon name="Trash2" size={14} />
                          </button>
                        )}
                      </div>
                      {!vfLocked && <DocFileButton slug={slug} url={doc.url || ""} onUploaded={(u) => { const arr = [...vf.documents]; arr[i] = { ...arr[i], url: u }; setVf({ ...vf, documents: arr }); setVfState("idle"); }} />}
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground leading-relaxed">{tr("pdVfPurposeDocs")}</p>
                {!vfLocked && (
                  <button onClick={() => { setVf({ ...vf, documents: [...vf.documents, { title: "", url: "" }] }); setVfState("idle"); }} className="mt-2 inline-flex items-center gap-1.5 text-xs font-montserrat font-semibold text-gold hover:underline">
                    <Icon name="Plus" size={13} />{tr("pdVfAddDocument")}
                  </button>
                )}
              </div>

              {/* Bio */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-montserrat font-semibold text-foreground">{tr("pdVfBio")}</label>
                  <button
                    onClick={() => setVf({ ...vf, showBio: !vf.showBio })}
                    className={`flex items-center gap-1 text-[10px] font-montserrat font-bold px-2 py-1 rounded-sm transition-colors ${vf.showBio ? "bg-gold/15 text-gold" : "bg-secondary text-muted-foreground"}`}
                  >
                    <Icon name={vf.showBio ? "Eye" : "EyeOff"} size={12} />
                    {tr(vf.showBio ? "pdVfShow" : "pdVfHidden")}
                  </button>
                </div>
                <textarea value={vf.bio} onChange={(e) => { setVf({ ...vf, bio: e.target.value }); setVfState("idle"); }} placeholder={tr("pdVfBioPh")} rows={4} className="w-full bg-secondary border border-border rounded-sm px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-gold transition-colors resize-none" />
              </div>

              <div className="border border-border rounded-sm bg-secondary/40 p-4 space-y-4">
                <div>
                  <label className="text-xs font-montserrat font-semibold text-foreground flex items-center gap-1.5 mb-1"><Icon name="Clock" size={13} className="text-gold" />{tr("pdAvailTitle")}</label>
                  <p className="text-[11px] text-muted-foreground">{tr("pdAvailHint")}</p>
                </div>
                <button
                  onClick={() => { setVf({ ...vf, alwaysAvailable: !vf.alwaysAvailable }); setVfState("idle"); }}
                  role="switch"
                  aria-checked={vf.alwaysAvailable}
                  className="flex items-center justify-between w-full"
                >
                  <span className="text-xs text-foreground">{tr("pdAvailAlways")}</span>
                  <span className={`relative w-10 h-5 rounded-full transition-colors ${vf.alwaysAvailable ? "bg-gold" : "bg-border"}`}>
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-card transition-all ${vf.alwaysAvailable ? "start-[22px]" : "start-0.5"}`} />
                  </span>
                </button>
                {!vf.alwaysAvailable && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-montserrat font-semibold text-muted-foreground block mb-1.5">{tr("pdQuietFrom")}</label>
                      <input type="time" value={vf.quietStart} onChange={(e) => { setVf({ ...vf, quietStart: e.target.value }); setVfState("idle"); }} className="w-full bg-secondary border border-border rounded-sm px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold transition-colors" />
                    </div>
                    <div>
                      <label className="text-[11px] font-montserrat font-semibold text-muted-foreground block mb-1.5">{tr("pdQuietTo")}</label>
                      <input type="time" value={vf.quietEnd} onChange={(e) => { setVf({ ...vf, quietEnd: e.target.value }); setVfState("idle"); }} className="w-full bg-secondary border border-border rounded-sm px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold transition-colors" />
                    </div>
                  </div>
                )}
                <div>
                  <label className="text-[11px] font-montserrat font-semibold text-muted-foreground block mb-1.5">{tr("pdTimezone")}</label>
                  <select value={vf.timezone} onChange={(e) => { setVf({ ...vf, timezone: e.target.value }); setVfState("idle"); }} className="w-full bg-secondary border border-border rounded-sm px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold transition-colors">
                    <option value="">{tr("pdTimezoneAuto")}</option>
                    {["Europe/Kaliningrad","Europe/Moscow","Europe/Samara","Asia/Yekaterinburg","Asia/Omsk","Asia/Krasnoyarsk","Asia/Irkutsk","Asia/Yakutsk","Asia/Vladivostok","Asia/Magadan","Asia/Kamchatka","Europe/Kyiv","Europe/Minsk","Asia/Almaty","Europe/London","Europe/Berlin","America/New_York","America/Los_Angeles","Asia/Dubai"].map((z) => (
                      <option key={z} value={z}>{z}</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-muted-foreground/70 mt-1.5">{tr("pdTimezoneNote")}</p>
                </div>
              </div>

              {vfState === "saved" && <div className="flex items-center gap-2 text-sm text-green-400"><Icon name="CheckCircle2" size={16} />{tr("pdVfSaved")}</div>}
              {vfState === "error" && <div className="flex items-center gap-2 text-sm text-destructive"><Icon name="CircleAlert" size={16} />{tr("pdVfSaveErr")}</div>}
              <button onClick={saveVerification} disabled={vfState === "saving"} className="w-full gold-gradient text-[hsl(28,20%,7%)] py-3 text-sm font-montserrat font-bold rounded-sm hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2">
                {vfState === "saving" ? <Icon name="Loader" size={16} className="animate-spin" /> : <Icon name="Save" size={16} />}
                {tr("dashSave")}
              </button>
            </div>
          )}

          {tab === "friends" && (
            <div className="space-y-6">
              <div className="border border-gold/30 rounded-sm glass-card p-6">
                <div className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest mb-1">{tr("pdMyIdTitle")}</div>
                <p className="text-[11px] text-muted-foreground mb-3">{tr("pdMyIdHint")}</p>
                <div className="inline-flex items-center gap-2 border border-gold/40 rounded-sm bg-background px-4 py-2.5">
                  <Icon name="IdCard" size={16} className="text-gold" />
                  <span className="font-montserrat font-bold text-lg text-gold">{user?.publicId ?? "—"}</span>
                </div>
              </div>

              <div className="border border-border rounded-sm bg-card p-6">
                <div className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest mb-1">{tr("pdFindFriendTitle")}</div>
                <p className="text-[11px] text-muted-foreground mb-4">{tr("pdFindFriendHint")}</p>
                <div className="flex gap-2 mb-4">
                  <input
                    value={searchPublicId}
                    onChange={(e) => setSearchPublicId(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && searchPublicId.trim().length >= 2 && !friendBusy) searchFriendById(); }}
                    placeholder={tr("pdFindFriendPh")}
                    className="flex-1 bg-secondary border border-border rounded-sm px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-gold transition-colors"
                  />
                  <button aria-label={tr("pdFindFriendBtn")} onClick={searchFriendById} disabled={friendBusy || searchPublicId.trim().length < 2} className="gold-gradient text-[hsl(28,20%,7%)] px-5 py-2.5 text-xs font-montserrat font-bold rounded-sm disabled:opacity-50 flex items-center gap-1.5">
                    <Icon name={friendBusy ? "Loader" : "Search"} size={14} className={friendBusy ? "animate-spin" : ""} />{tr("pdFindFriendBtn")}
                  </button>
                </div>

                {searchResults !== null && searchResults.length === 0 && (
                  <div className="text-xs text-muted-foreground italic">{tr("pdFriendNotFound")}</div>
                )}
                {searchResults !== null && searchResults.length > 0 && (
                  <div className="space-y-2.5">
                    {searchResults.map((p) => (
                      <div key={p.userId} className="flex items-center gap-3 p-3 border border-border rounded-sm hover:border-gold/40 transition-colors">
                        <div className="w-10 h-10 rounded-sm overflow-hidden gold-gradient flex items-center justify-center shrink-0">
                          {p.provider?.avatar ? <img src={p.provider.avatar} alt="" loading="lazy" className="w-full h-full object-cover" /> : <Icon name="User" size={18} className="text-[hsl(28,20%,7%)]" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-montserrat font-semibold text-foreground truncate flex items-center gap-1.5">
                            {p.provider ? L(p.provider.name, lang) : p.name}
                            {p.provider?.verified && <Icon name="BadgeCheck" size={13} className="text-gold shrink-0" />}
                          </div>
                          {p.provider && <div className="text-[11px] text-muted-foreground truncate">{L(p.provider.title, lang)}</div>}
                          <div className="text-[10px] text-muted-foreground/70">ID {p.publicId}</div>
                        </div>
                        {p.friendStatus === "accepted" ? (
                          <span className="tag-security shrink-0 text-green-400 border-green-500/40">{tr("pdAlreadyFriends")}</span>
                        ) : p.friendStatus === "pending" ? (
                          <span className="tag-security shrink-0 text-gold border-gold/40">{tr(p.incoming ? "pdReqIncoming" : "pdRequestPending")}</span>
                        ) : (
                          <button onClick={() => sendFriendRequest(p.userId)} disabled={friendBusy} className="gold-gradient text-[hsl(28,20%,7%)] text-xs font-montserrat font-bold px-3 py-1.5 rounded-sm shrink-0 hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5">
                            <Icon name="UserPlus" size={13} />{tr("pdAddFriend")}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {friendRequests.length > 0 && (
                <div className="border border-border rounded-sm bg-card p-6">
                  <div className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest mb-4">{tr("pdIncomingRequests")}</div>
                  <div className="space-y-3">
                    {friendRequests.map((r) => (
                      <div key={r.requestId} className="flex items-center gap-3 p-3 border border-border rounded-sm">
                        <div className="w-10 h-10 rounded-sm overflow-hidden gold-gradient flex items-center justify-center shrink-0">
                          {r.provider?.avatar ? <img src={r.provider.avatar} alt="" className="w-full h-full object-cover" /> : <Icon name="User" size={18} className="text-[hsl(28,20%,7%)]" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-montserrat font-semibold text-foreground truncate">{r.provider ? L(r.provider.name, lang) : `#${r.userId}`}</div>
                        </div>
                        <button onClick={() => respondFriendRequest(r.requestId, true)} className="gold-gradient text-[hsl(28,20%,7%)] text-xs font-montserrat font-bold px-3 py-1.5 rounded-sm shrink-0 hover:opacity-90">{tr("pdAccept")}</button>
                        <button onClick={() => respondFriendRequest(r.requestId, false)} className="border border-border text-muted-foreground text-xs font-montserrat font-semibold px-3 py-1.5 rounded-sm shrink-0">{tr("pdDecline")}</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Список переписок: показываем только когда общение уже началось —
                  пустой блок над списком друзей был бы шумом. */}
              {dialogs.some((d) => d.lastAt) && (
                <div className="border border-border rounded-sm bg-card p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest">{tr("pdDialogs")}</span>
                    {dialogs.reduce((s, d) => s + d.unread, 0) > 0 && (
                      <span className="text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1.5 flex items-center justify-center bg-gold text-[hsl(28,20%,7%)]">
                        {dialogs.reduce((s, d) => s + d.unread, 0)}
                      </span>
                    )}
                  </div>
                  <div className="space-y-2.5">
                    {dialogs.filter((d) => d.lastAt).map((d) => (
                      <button
                        key={d.pairKey}
                        onClick={() => openChat?.({ name: d.name ? L(d.name, lang) : `#${d.userId}`, title: d.title ? L(d.title, lang) : "", avatar: d.avatar, pairKey: d.pairKey })}
                        className={`w-full flex items-center gap-3 p-3 border rounded-sm text-left transition-colors ${d.unread > 0 ? "border-gold/40 bg-gold/[0.04]" : "border-border hover:border-gold/30"}`}
                      >
                        <div className="w-10 h-10 rounded-sm overflow-hidden gold-gradient flex items-center justify-center shrink-0">
                          {d.avatar ? <img src={d.avatar} alt="" loading="lazy" className="w-full h-full object-cover" /> : <Icon name="User" size={18} className="text-[hsl(28,20%,7%)]" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm font-montserrat truncate ${d.unread > 0 ? "font-bold text-foreground" : "font-semibold text-foreground"}`}>
                            {d.name ? L(d.name, lang) : `#${d.userId}`}
                          </div>
                          <div className={`text-[11px] truncate ${d.unread > 0 ? "text-foreground/80" : "text-muted-foreground"}`}>
                            {d.lastFromMe && <span className="text-muted-foreground">{tr("pdDialogYou")} </span>}
                            {d.lastText}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className="text-[10px] text-muted-foreground">
                            {d.lastAt ? new Date(d.lastAt).toLocaleDateString(lang === "ru" ? "ru-RU" : "en-US", { day: "numeric", month: "short" }) : ""}
                          </span>
                          {d.unread > 0 && (
                            <span className="text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1.5 flex items-center justify-center bg-gold text-[hsl(28,20%,7%)]">
                              {d.unread}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="border border-border rounded-sm bg-card p-6">
                <div className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest mb-4">{tr("pdMyFriends")}</div>
                {friendsList.length === 0 ? (
                  <div className="text-xs text-muted-foreground py-6 text-center border border-dashed border-border rounded-sm">{tr("pdNoFriends")}</div>
                ) : (
                  <div className="space-y-3">
                    {friendsList.map((f) => (
                      <div key={f.friendshipId} className="flex items-center gap-3 p-3 border border-border rounded-sm">
                        <div className="w-10 h-10 rounded-sm overflow-hidden gold-gradient flex items-center justify-center shrink-0">
                          {f.provider?.avatar ? <img src={f.provider.avatar} alt="" className="w-full h-full object-cover" /> : <Icon name="User" size={18} className="text-[hsl(28,20%,7%)]" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-montserrat font-semibold text-foreground truncate">{f.provider ? L(f.provider.name, lang) : `#${f.userId}`}</div>
                          {f.provider && <div className="text-[11px] text-muted-foreground truncate">{L(f.provider.title, lang)}</div>}
                        </div>
                        {openChat && (
                          <button
                            onClick={() => openChat({ name: f.provider ? L(f.provider.name, lang) : `#${f.userId}`, title: f.provider ? L(f.provider.title, lang) : "", avatar: f.provider?.avatar || null, pairKey: f.pairKey })}
                            className="border border-gold/40 text-gold text-xs font-montserrat font-semibold px-3 py-1.5 rounded-sm shrink-0 hover:bg-gold/10 flex items-center gap-1.5"
                          >
                            <Icon name="MessageSquare" size={13} />{tr("pdMessage")}
                          </button>
                        )}
                        <button
                          onClick={() => removeFriend(f.userId)}
                          aria-label={tr("pdRemoveFriend")}
                          title={tr("pdRemoveFriend")}
                          className="text-muted-foreground hover:text-destructive transition-colors shrink-0 p-1.5"
                        >
                          <Icon name="UserMinus" size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === "contacts" && (
            <div className="space-y-5">
              <SessionsLog />
            <div className="border border-border rounded-sm bg-card p-6 space-y-5">
              <div>
                <div className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest mb-1">{tr("pdContactsTitle")}</div>
                <p className="text-xs text-muted-foreground leading-relaxed">{tr("pdContactsHint")}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {([
                  { key: "phone", label: "pdFieldPhone", icon: "Phone", ph: "+7 999 000-00-00", type: "tel" },
                  { key: "email", label: "pdFieldEmail", icon: "Mail", ph: "you@email.com", type: "email" },
                  { key: "whatsapp", label: "pdFieldWhatsApp", icon: "MessageSquare", ph: "+7 999 000-00-00", type: "tel" },
                  { key: "telegram", label: "pdFieldTelegram", icon: "Send", ph: "username", type: "text" },
                ] as const).map((f) => (
                  <div key={f.key}>
                    <label className="text-xs font-montserrat font-semibold text-foreground flex items-center gap-1.5 mb-2">
                      <Icon name={f.icon} size={13} className="text-gold" />
                      {tr(f.label)}
                    </label>
                    <input
                      type={f.type}
                      value={contacts[f.key]}
                      onChange={(e) => { setContacts({ ...contacts, [f.key]: e.target.value }); setSaveState("idle"); }}
                      placeholder={f.ph}
                      className="w-full bg-secondary border border-border rounded-sm px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-gold transition-colors"
                    />
                  </div>
                ))}
              </div>

              <div className="divider-gold" />
              <div className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest">{tr("pdSocialTitle")}</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {([
                  { key: "website", label: "pdFieldWebsite", icon: "Globe", ph: "https://..." },
                  { key: "vk", label: "VK" as const, icon: "Share2", ph: "vk.com/..." },
                  { key: "instagram", label: "Instagram" as const, icon: "Instagram", ph: "instagram.com/..." },
                  { key: "linkedin", label: "LinkedIn" as const, icon: "Linkedin", ph: "linkedin.com/in/..." },
                ] as const).map((f) => (
                  <div key={f.key}>
                    <label className="text-xs font-montserrat font-semibold text-foreground flex items-center gap-1.5 mb-2">
                      <Icon name={f.icon} size={13} className="text-gold" />
                      {f.label === "pdFieldWebsite" ? tr("pdFieldWebsite") : f.label}
                    </label>
                    <input
                      type="url"
                      value={contacts[f.key as keyof typeof contacts]}
                      onChange={(e) => { setContacts({ ...contacts, [f.key]: e.target.value }); setSaveState("idle"); }}
                      placeholder={f.ph}
                      className="w-full bg-secondary border border-border rounded-sm px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-gold transition-colors"
                    />
                  </div>
                ))}
              </div>

              {saveState === "saved" && (
                <div className="flex items-center gap-2 text-sm text-green-400"><Icon name="CheckCircle2" size={16} />{tr("pdContactsSaved")}</div>
              )}
              {saveState === "error" && (
                <div className="flex items-center gap-2 text-sm text-destructive"><Icon name="CircleAlert" size={16} />{tr("pdContactsSaveErr")}</div>
              )}
              <button
                onClick={saveContacts}
                disabled={saveState === "saving"}
                className="w-full gold-gradient text-[hsl(28,20%,7%)] py-3 text-sm font-montserrat font-bold rounded-sm hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {saveState === "saving" ? <Icon name="Loader" size={16} className="animate-spin" /> : <Icon name="Save" size={16} />}
                {tr("dashSave")}
              </button>
            </div>
            </div>
          )}
        </div>
      </div>

      {paywallOpen && (
        <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setPaywallOpen(false)}>
          <div className="bg-card border border-gold/40 rounded-sm max-w-md w-full p-8 text-center security-glow" onClick={(e) => e.stopPropagation()}>
            <div className="w-14 h-14 gold-gradient rounded-sm flex items-center justify-center mx-auto mb-5 glow-gold-sm">
              <Icon name="Lock" size={26} className="text-[hsl(28,20%,7%)]" />
            </div>
            <h2 className="font-montserrat font-extrabold text-xl text-foreground mb-2">{tr("paywallTitle")}</h2>
            <p className="text-sm text-muted-foreground mb-6">{tr("paywallText")}</p>
            <button onClick={() => { setPaywallOpen(false); setTab("plan"); }} className="w-full gold-gradient text-[hsl(28,20%,7%)] py-3 font-montserrat font-bold text-sm rounded-sm hover:opacity-90 transition-opacity mb-2">
              {tr("paywallBtn")}
            </button>
            <button onClick={() => setPaywallOpen(false)} className="w-full text-xs text-muted-foreground hover:text-foreground py-2 font-montserrat font-semibold">
              {tr("cancel")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}