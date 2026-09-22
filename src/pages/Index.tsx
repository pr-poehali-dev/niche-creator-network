import { useState, useEffect, useRef, useMemo, lazy, Suspense } from "react";
import Icon from "@/components/ui/icon";
import { useLang, t, LANGS, type Lang } from "@/lib/i18n";
import { useGeo } from "@/lib/geo";
import { useProviders, type Provider } from "@/lib/providers";
import { LEGAL_DOCS } from "@/lib/legalDocs";
import { useAuth } from "@/lib/auth";
import { authHeaders } from "@/lib/authToken";
import { trackGoal, GOALS } from "@/lib/analytics";
import { useRevealOnScroll } from "@/hooks/useRevealOnScroll";
import { CLIENT_REVIEWS } from "@/lib/clientReviews";
import { useAutoTranslate } from "@/lib/autotranslate";
import Reveal from "@/components/Reveal";
import Brand from "@/components/Brand";
import ShareButtons from "@/components/ShareButtons";
import UrgencyBanner from "@/components/UrgencyBanner";
import NotificationBell from "@/components/NotificationBell";
import { applySeo, catSeo } from "@/lib/seoMeta";
const AdminPanel = lazy(() => import("@/components/AdminPanel"));
const ClientDashboard = lazy(() => import("@/components/ClientDashboard"));
const ProviderDashboard = lazy(() => import("@/components/ProviderDashboard"));
const ResumeSearch = lazy(() => import("@/components/ResumeSearch"));
// Разделы, которые открывают редко и не с первого экрана: грузим по требованию,
// чтобы главная страница стартовала быстрее.
const PricingSection = lazy(() => import("@/components/Pricing").then((m) => ({ default: m.PricingSection })));
const MobileAppSection = lazy(() => import("@/components/InfoSections").then((m) => ({ default: m.MobileAppSection })));
const AboutSection = lazy(() => import("@/components/InfoSections").then((m) => ({ default: m.AboutSection })));
const BlogSection = lazy(() => import("@/components/InfoSections").then((m) => ({ default: m.BlogSection })));
const SecurityPolicySection = lazy(() => import("@/components/InfoSections").then((m) => ({ default: m.SecurityPolicySection })));
const ContactsSection = lazy(() => import("@/components/CommunicationSections").then((m) => ({ default: m.ContactsSection })));
import { TrustBadges, MinimalHome } from "@/components/LandingSections";
const AuthModal = lazy(() => import("@/components/AuthModal"));
const InstallPromptBanner = lazy(() => import("@/components/InstallPromptBanner"));
// Чат, отзывы и «как это работает» не нужны на первом экране: раньше они
// грузились вместе с главной и утяжеляли её почти на треть. Теперь
// подгружаются в момент открытия — сайт быстрее стартует на телефоне.
const HowItWorksSection = lazy(() => import("@/components/InfoSections").then((m) => ({ default: m.HowItWorksSection })));
// Каталог грузится по требованию: большинство посетителей открывают
// главную и уходят, им незачем скачивать поиск, фильтры и карточки.
const CasesSection = lazy(() => import("@/components/CatalogSections").then((m) => ({ default: m.CasesSection })));
const SpecialistsListSection = lazy(() => import("@/components/CatalogSections").then((m) => ({ default: m.SpecialistsListSection })));
const ClientServices = lazy(() => import("@/components/CatalogSections").then((m) => ({ default: m.ClientServices })));
const ServicesSection = lazy(() => import("@/components/CatalogSections").then((m) => ({ default: m.ServicesSection })));
const CoursesSection = lazy(() => import("@/components/CatalogSections").then((m) => ({ default: m.CoursesSection })));
const GuardsSection = lazy(() => import("@/components/CatalogSections").then((m) => ({ default: m.GuardsSection })));
const SpecialistProfileSection = lazy(() => import("@/components/ProfileSections").then((m) => ({ default: m.SpecialistProfileSection })));
const ProfileSection = lazy(() => import("@/components/ProfileSections").then((m) => ({ default: m.ProfileSection })));
const LegalDocSection = lazy(() => import("@/components/LegalSections").then((m) => ({ default: m.LegalDocSection })));

const DirectChatSection = lazy(() => import("@/components/CommunicationSections").then((m) => ({ default: m.DirectChatSection })));
const ChatSection = lazy(() => import("@/components/CommunicationSections").then((m) => ({ default: m.ChatSection })));
import func2url from "../../backend/func2url.json";

import {
  HERO_IMAGE, POLYGRAPH_IMAGE, DETECTIVE_IMAGE, HERO_BG, GUARDS_BG,
  CLIENT_NAV, PROVIDER_NAV, GUEST_NAV,
  type Section, type Role,
} from "@/lib/shared";

// Заглушка на время подгрузки раздела: мягкая, без резких спиннеров.
function SectionLoader() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-24 flex flex-col items-center justify-center gap-4">
      <div className="w-10 h-10 rounded-full border-2 border-gold/30 border-t-gold animate-spin" />
      <div className="h-3 w-40 rounded-full bg-secondary animate-pulse" />
      <div className="h-3 w-24 rounded-full bg-secondary/60 animate-pulse" />
    </div>
  );
}


function LangSwitcher({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  const [open, setOpen] = useState(false);
  const current = LANGS.find((l) => l.code === lang) ?? LANGS[0];
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="flex items-center gap-1.5 border border-border rounded-sm px-2.5 py-1.5 text-xs font-montserrat font-bold text-foreground hover:border-gold transition-colors"
      >
        <Icon name="Globe" size={14} className="text-gold" />
        <span className="uppercase">{current.code}</span>
        <Icon name="ChevronDown" size={12} className="text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute end-0 mt-1 z-50 min-w-[160px] border border-border rounded-sm bg-card shadow-lg overflow-hidden animate-fade-in">
          {LANGS.map((l) => (
            <button
              key={l.code}
              onClick={() => { setLang(l.code); setOpen(false); }}
              className={`w-full flex items-center justify-between gap-3 px-3 py-2 text-xs font-montserrat text-start transition-colors ${l.code === lang ? "bg-gold text-[hsl(28,20%,7%)] font-bold" : "text-foreground hover:bg-secondary"}`}
            >
              <span>{l.label}</span>
              <span className="uppercase opacity-60">{l.code}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Демо-список выдуманных специалистов удалён: он подставлял чужие имена,
// рейтинги и «312 кейсов» в профиль реального человека.


// Список выдуманных охранных компаний удалён: показываем только реальные,
// прошедшие проверку документов.



const SECTION_CRUMB: Record<Section, keyof typeof t> = {
  home: "crumbHome",
  profile: "crumbProfile",
  specialists: "specialists",
  cases: "crumbCases",
  services: "crumbServices",
  resumes: "navResumes",
  courses: "crumbCourses",
  guards: "crumbGuards",
  chat: "crumbChat",
  community: "crumbCommunity",
  contacts: "crumbContacts",
  policy: "crumbPolicy",
  pricing: "crumbPricing",
  dashboard: "crumbDashboard",
  privacy: "fPrivacy",
  terms: "fTerms",
  agreement: "fAgreement",
  offer: "fOffer",
  consent: "fConsent",
  admin: "adminPanelTitle",
  about: "aboutPageTitle",
  mobileapp: "maTitle",
  blog: "blogTitle",
  howitworks: "hiwTitle",
};





// Публичные разделы, которые можно открыть напрямую по ссылке ?section=xxx.
// Это делает ссылки на блог/о нас/тарифы «рабочими» для SEO и шаринга.
const PUBLIC_URL_SECTIONS: Section[] = [
  "blog", "about", "pricing", "mobileapp", "policy", "privacy", "terms",
  "agreement", "offer", "consent", "contacts",
  // Каталог, услуги и «как это работает» — самые ценные страницы для поиска
  // и для ссылок из соцсетей. Без них человек по ссылке попадал на главную
  // и должен был искать раздел заново.
  "specialists", "services", "howitworks", "courses", "guards", "cases",
  // База резюме: ссылку на неё отправляют работодателям напрямую, поэтому
  // она должна открываться по прямому адресу, а не терять человека на главной.
  "resumes",
];

function getInitialSection(): Section {
  if (typeof window === "undefined") return "home";
  try {
    const s = new URLSearchParams(window.location.search).get("section") as Section | null;
    if (s && PUBLIC_URL_SECTIONS.includes(s)) return s;
  } catch {
    // URLSearchParams недоступен — открываем главную.
  }
  return "home";
}

const COOKIE_CONSENT_KEY = "shchit_cookie_consent";
// Баннер согласия на cookie (152-ФЗ / GDPR). Появляется один раз до выбора.
function CookieBanner({ go }: { go: (s: Section) => void }) {
  const { tr } = useLang();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    try { if (!localStorage.getItem(COOKIE_CONSENT_KEY)) setVisible(true); } catch { setVisible(true); }
  }, []);
  const decide = (value: "accepted" | "essential") => {
    try { localStorage.setItem(COOKIE_CONSENT_KEY, value); } catch { /* noop */ }
    if (value === "accepted") {
      try { (window as unknown as { __shchitInitMetrika?: () => void }).__shchitInitMetrika?.(); } catch { /* noop */ }
    }
    setVisible(false);
  };
  if (!visible) return null;
  return (
    /* Баннер прижат к углу и компактен: согласие на cookie — формальность,
       он не должен закрывать первый экран и мешать читать предложение. */
    <div className="fixed inset-x-0 bottom-0 z-[90] p-2 sm:p-4 pointer-events-none">
      <div role="region" aria-label={tr("cookieTitle")} className="max-w-md ms-auto me-0 bg-card/95 backdrop-blur-md border border-border rounded-sm shadow-2xl p-3 sm:p-4 flex flex-col gap-2 pointer-events-auto">
        {/* На телефоне — одна строка и кнопки рядом. Согласие на cookie
            это формальность, а баннер закрывал главную кнопку первого
            экрана: человек не мог начать, не разобравшись с ним.
            На широком экране места хватает — там текст полный. */}
        <div className="flex items-center gap-2.5 min-w-0">
          <Icon name="Cookie" size={16} className="text-gold shrink-0 hidden sm:block" />
          <p className="text-[11px] sm:text-xs text-muted-foreground leading-snug flex-1 min-w-0 line-clamp-1 sm:line-clamp-none">
            {tr("cookieText")}{" "}
            <button onClick={() => go("privacy")} className="text-gold hover:underline font-semibold whitespace-nowrap">{tr("cookieMore")}</button>
          </p>
          {/* min-h-[44px] — минимальная зона касания пальцем (стандарт Apple
              и Google). Сам баннер от этого не растёт: кнопки и так стоят
              в одну строку с текстом, а промахи по ним исчезают. */}
          <div className="flex items-center gap-1 shrink-0 sm:hidden -my-1">
            <button onClick={() => decide("essential")} aria-label={tr("cookieDecline")} className="text-muted-foreground hover:text-foreground text-[11px] font-montserrat font-semibold px-2.5 min-h-[44px] rounded-sm transition-colors">{tr("cookieDeclineShort")}</button>
            <button onClick={() => decide("accepted")} className="gold-gradient text-[hsl(28,20%,7%)] text-[11px] font-montserrat font-bold px-4 min-h-[44px] rounded-sm">{tr("cookieAccept")}</button>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 justify-end">
          <button onClick={() => decide("essential")} className="text-muted-foreground hover:text-foreground text-xs font-montserrat font-semibold px-3 py-2 rounded-sm transition-colors">{tr("cookieDecline")}</button>
          <button onClick={() => decide("accepted")} className="gold-gradient text-[hsl(28,20%,7%)] text-xs font-montserrat font-bold px-5 py-2 rounded-sm">{tr("cookieAccept")}</button>
        </div>
      </div>
    </div>
  );
}

export default function Index() {
  const { lang, setLang, tr, applyGeoLang } = useLang();
  const { user, isAuthed, logout } = useAuth();
  const [active, setActive] = useState<Section>(getInitialSection);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");

  // Счётчик новых жалоб для администратора — показывается бейджем на кнопке
  // «Админ-панель» в шапке, чтобы жалобы не оставались незамеченными.
  const [newComplaintsBadge, setNewComplaintsBadge] = useState(0);
  useEffect(() => {
    if (!user?.isAdmin) return;
    const loadBadge = () => {
      // Не долбим сервер, когда браузер уже знает, что сети нет: иначе
      // при обрыве связи каждую минуту копится ошибка в логах.
      if (typeof navigator !== "undefined" && navigator.onLine === false) return;
      fetch(func2url["complaints"], { headers: authHeaders() })
        .then((r) => r.json())
        .then((d) => { if (Array.isArray(d.complaints)) setNewComplaintsBadge(d.complaints.filter((c: { status: string }) => c.status === "new").length); })
        .catch(() => {});
    };
    loadBadge();
    const iv = setInterval(loadBadge, 60000);
    return () => clearInterval(iv);
  }, [user?.isAdmin]);
  const [chatTarget, setChatTarget] = useState<{ name: string; title: string; avatar?: string | null; pairKey?: string } | null>(null);
  const [secBannerOpen, setSecBannerOpen] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);
  // Мягкое появление цифр статистики при прокрутке (чистый CSS + наблюдатель).
  useRevealOnScroll();
  // Секции главной проявляются по мере прокрутки. Тот же механизм, что у
  // цифр, — без сторонних библиотек и без влияния на скорость загрузки.
  useRevealOnScroll(".section-reveal");
  // Переход к форме заявки из карточки-образца: гостю сначала предлагаем войти,
  // авторизованному клиенту сразу открываем создание задачи.
  useEffect(() => {
    const openRequest = () => {
      if (!user) {
        setAuthOpen(true);
        return;
      }
      try { sessionStorage.setItem("open_new_task", "1"); } catch { /* noop */ }
      setActive("dashboard");
    };
    window.addEventListener("shchit:new-request", openRequest);
    return () => window.removeEventListener("shchit:new-request", openRequest);
  }, [user]);
  // Открытие окна входа из любой карточки специалиста (кнопка «Войти и увидеть
  // контакты»). Событие вместо передачи колбэка через всю цепочку компонентов.
  useEffect(() => {
    const openAuth = () => setAuthOpen(true);
    window.addEventListener("shchit:require-auth", openAuth);
    return () => window.removeEventListener("shchit:require-auth", openAuth);
  }, []);
  // Мета-теги под каждый раздел. Раньше в HTML был жёстко прописан
  // canonical на главную — для поисковика это прямое указание «все адреса
  // сайта суть одна страница, склей их». Блог, тарифы и каталог просто не
  // попадали в индекс как самостоятельные страницы. Теперь при переходе
  // подставляются свой адрес, заголовок и описание.
  useEffect(() => {
    const cat = typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("cat")
      : null;
    if (active === "services" && cat) applySeo("services", catSeo(cat));
    else applySeo(active as string);
  }, [active]);

  const { geo } = useGeo();
  const historyRef = useRef<{ section: Section; provider: Provider | null }[]>([{ section: active, provider: null }]);

  // Компактная mobile-app-like шапка: сжимается при скролле вниз (как в нативных приложениях).
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const role: Role = user?.role === "provider" ? "provider" : "client";

  const [subActive, setSubActive] = useState<boolean | null>(null);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const providerSlug = user ? `provider-${user.id}` : "";
  const isProvider = isAuthed && role === "provider" && !user?.isAdmin;
  const isLocked = isProvider && subActive === false;

  // Выбранный специалист для просмотра его профиля клиентом (не демо-профиль).
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  // Открытие профиля по прямой ссылке ?section=profile&id=slug.
  // Каталог грузится асинхронно, поэтому ждём его и лишь затем выбираем анкету.
  const { providers: allProviders } = useProviders();
  const deepLinkDone = useRef(false);
  useEffect(() => {
    if (deepLinkDone.current || allProviders.length === 0) return;
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("section") !== "profile") return;
      const slug = params.get("id");
      if (!slug) return;
      const found = allProviders.find((pr) => pr.slug === slug && pr.active);
      if (found) {
        deepLinkDone.current = true;
        setSelectedProvider(found);
        setActive("profile");
      }
    } catch {
      // URLSearchParams недоступен — просто остаёмся на текущем разделе.
    }
  }, [allProviders]);
  // Завершил ли клиент регистрацию (заполнен профиль: имя + телефон).
  const [clientProfileComplete, setClientProfileComplete] = useState(false);
  // Модалка-подсказка «завершите регистрацию».
  const [regGateOpen, setRegGateOpen] = useState(false);

  const isClientRole = isAuthed && role === "client";

  // Подгружаем профиль клиента, чтобы знать, завершена ли регистрация.
  // Админ считается полностью верифицированным всегда (полный доступ в редакторе).
  useEffect(() => {
    if (!isClientRole) { setClientProfileComplete(false); return; }
    if (user?.isAdmin) { setClientProfileComplete(true); return; }
    let alive = true;
    fetch(func2url["clients"], { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        const c = d.client || {};
        setClientProfileComplete(!!(c.fullName && String(c.fullName).trim() && c.phone && String(c.phone).trim()));
      })
      .catch(() => { if (alive) setClientProfileComplete(false); });
    return () => { alive = false; };
  }, [isClientRole, user?.id, user?.isAdmin]);

  // Разделы, закрытые для исполнителя без оплаченного тарифа
  // Разделы, закрытые специалисту без подписки. Каталог услуг, кейсы,
  // охранные предприятия и курсы отсюда убраны намеренно: эти страницы
  // открыты любому гостю, и человек, который зарегистрировался и ждёт
  // оплаты, видел МЕНЬШЕ случайного посетителя — регистрация выглядела
  // наказанием. Закрываем только то, что действительно входит в подписку:
  // общение с клиентами и профессиональное сообщество.
  const LOCKED_SECTIONS: Section[] = ["chat", "community"];

  useEffect(() => {
    if (!isProvider || !providerSlug) { setSubActive(null); return; }
    let alive = true;
    fetch(func2url["save-verification"], { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => { if (alive) setSubActive(!!(d.verification && d.verification.subscriptionActive)); })
      .catch(() => { if (alive) setSubActive(false); });
    return () => { alive = false; };
  }, [isProvider, providerSlug]);

  useEffect(() => {
    // Реагируем только на смену страны; applyGeoLang стабильна по смыслу
    // и намеренно не включена в зависимости, чтобы не пере-срабатывать.
    if (geo?.countryCode) applyGeoLang(geo.countryCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geo?.countryCode]);

  useEffect(() => {
    // Гостю доступны публичные разделы (блог, о нас, тарифы и т.п.) — их не сбрасываем,
    // чтобы работали прямые ссылки для SEO и шаринга. Остальное возвращаем на главную.
    if (!isAuthed) setActive((cur) => (PUBLIC_URL_SECTIONS.includes(cur) ? cur : "home"));
  }, [isAuthed]);

  const NAV_ITEMS = isAuthed ? (role === "client" ? CLIENT_NAV : PROVIDER_NAV) : GUEST_NAV;

  const go = (s: Section, opts?: { provider?: Provider | null; replace?: boolean }) => {
    if (isLocked && LOCKED_SECTIONS.includes(s)) {
      setPaywallOpen(true);
      setMobileMenuOpen(false);
      return;
    }
    const provider = opts?.provider ?? null;
    // Адрес страницы отражает, что человек смотрит: раздел и, для профиля,
    // конкретного специалиста. Так ссылку можно отправить клиенту, и она
    // откроет нужную анкету, а не главную. Раньше адрес не менялся вовсе.
    const buildUrl = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        if (s === "profile" && provider?.slug) {
          params.set("section", "profile");
          params.set("id", provider.slug);
        } else if (PUBLIC_URL_SECTIONS.includes(s)) {
          params.set("section", s);
          params.delete("id");
        } else {
          params.delete("section");
          params.delete("id");
        }
        const q = params.toString();
        return window.location.pathname + (q ? `?${q}` : "");
      } catch {
        return window.location.pathname + window.location.search;
      }
    };
    if (opts?.replace) {
      historyRef.current[historyRef.current.length - 1] = { section: s, provider };
      try { window.history.replaceState({ navIndex: historyRef.current.length - 1 }, "", buildUrl()); } catch { /* noop */ }
    } else {
      historyRef.current.push({ section: s, provider });
      try { window.history.pushState({ navIndex: historyRef.current.length - 1 }, "", buildUrl()); } catch { /* noop */ }
    }
    setActive(s);
    if (provider) setSelectedProvider(provider);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goBack = () => {
    if (historyRef.current.length > 1) {
      window.history.back();
    }
  };

  useEffect(() => {
    const onPopState = () => {
      if (historyRef.current.length > 1) {
        historyRef.current.pop();
      }
      const prev = historyRef.current[historyRef.current.length - 1];
      setActive(prev.section);
      setSelectedProvider(prev.provider);
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const openChat = (target: { name: string; title: string; avatar?: string | null; pairKey?: string }) => {
    trackGoal(GOALS.contactProvider);
    setChatTarget(target);
    go("chat");
  };

  // Открытие профиля конкретного специалиста клиентом.
  // Гейт: клиент без завершённой регистрации (имя + телефон) не видит профили.
  // Админ в редакторе всегда имеет полный доступ — как будто прошёл всю верификацию.
  const openSpecialist = (p: Provider) => {
    if (isClientRole && !clientProfileComplete && !user?.isAdmin) {
      setRegGateOpen(true);
      return;
    }
    go("profile", { provider: p });
  };

  const openCabinet = () => {
    setMobileMenuOpen(false);
    if (isAuthed) go("dashboard");
    else setAuthOpen(true);
  };

  const handleLogout = async () => {
    setMobileMenuOpen(false);
    await logout();
    setActive("home");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderSection = () => {
    if (!isAuthed) {
      if (active === "policy") return <SecurityPolicySection setActive={go} />;
      if (active === "privacy" || active === "terms" || active === "agreement" || active === "offer" || active === "consent") return <LegalDocSection doc={LEGAL_DOCS[active]} setActive={go} showFaq={active === "privacy"} />;
      if (active === "pricing") return <PricingSection setActive={go} />;
      if (active === "mobileapp") return <MobileAppSection setActive={go} />;
      if (active === "about") return <AboutSection setActive={go} />;
      if (active === "blog") return <BlogSection setActive={go} />;
      // Каталог и услуги открыты гостю намеренно: это витрина, ради неё
      // и приходят. Контакты специалистов сервер гостю всё равно не отдаёт,
      // поэтому база защищена, а человек видит, за чем регистрироваться.
      // Раньше по ссылке на каталог гость попадал на главную, хотя «хлебные
      // крошки» показывали «Специалисты» — интерфейс вводил в заблуждение.
      if (active === "specialists") return <SpecialistsListSection setActive={go} openSpecialist={openSpecialist} />;
      if (active === "services") return <ClientServices setActive={go} openSpecialist={openSpecialist} />;
      if (active === "howitworks") return <HowItWorksSection setActive={go} />;
      // База резюме показывает гостю приглашение войти, а не пустую главную:
      // по ссылке «ищу сотрудника» должен открываться понятный экран.
      if (active === "resumes") return <ResumeSearch />;
      // Контакты, охранные предприятия, кейсы и курсы — тоже публичные
      // страницы: они есть в меню, в подвале и в карте сайта. Гость по
      // ссылке на них молча получал главную — и человек, и поисковый робот
      // видели дубль вместо обещанной страницы.
      if (active === "contacts") return <ContactsSection />;
      if (active === "guards") return <GuardsSection />;
      if (active === "cases") return <CasesSection />;
      if (active === "courses") return <CoursesSection />;
      if (active === "profile" && selectedProvider) return <SpecialistProfileSection provider={selectedProvider} onBack={goBack} openChat={openChat} />;
      return <MinimalHome onCabinet={() => setAuthOpen(true)} onPolicy={() => go("policy")} onBrowse={() => go("services")} />;
    }
    if (isLocked && LOCKED_SECTIONS.includes(active)) {
      return <ProviderDashboard setActive={go} openChat={openChat} />;
    }
    switch (active) {
      case "home": return <HomeSection setActive={go} role={role} openChat={openChat} />;
      case "profile": return role === "client"
        ? (selectedProvider
            ? <SpecialistProfileSection provider={selectedProvider} onBack={goBack} openChat={openChat} />
            : <SpecialistsListSection setActive={go} openSpecialist={openSpecialist} />)
        : <ProfileSection setActive={go} openChat={openChat} />;
      case "specialists": return <SpecialistsListSection setActive={go} openSpecialist={openSpecialist} />;
      case "cases": return <CasesSection />;
      case "services": return role === "client" ? <ClientServices setActive={go} openSpecialist={openSpecialist} /> : <ServicesSection />;
      // База резюме: доступна работодателям (роль «клиент»). Специалисту
      // искать самого себя незачем — его отправляем в кабинет, где резюме.
      case "resumes": return role === "client"
        ? <ResumeSearch />
        : <ProviderDashboard setActive={go} openChat={openChat} />;
      case "courses": return <CoursesSection />;
      case "guards": return <GuardsSection />;
      case "chat": return chatTarget
        ? <DirectChatSection target={chatTarget} chatInput={chatInput} setChatInput={setChatInput} onBack={goBack} />
        : (role === "client" ? <HomeSection setActive={go} role={role} openChat={openChat} /> : <ChatSection chatInput={chatInput} setChatInput={setChatInput} />);
      // «Сообщество» — это кабинет специалиста, открытый сразу на вкладке
      // с поиском коллег, заявками и списком друзей. Отдельная страница не
      // нужна: всё общение живёт рядом с профилем.
      case "community": return role === "client"
        ? <HomeSection setActive={go} role={role} openChat={openChat} />
        : <ProviderDashboard setActive={go} openChat={openChat} initialTab="friends" />;
      case "contacts": return <ContactsSection />;
      case "policy": return <SecurityPolicySection setActive={go} />;
      case "mobileapp": return <MobileAppSection setActive={go} />;
      case "howitworks": return <HowItWorksSection setActive={go} />;
      case "about": return <AboutSection setActive={go} />;
      case "blog": return <BlogSection setActive={go} />;
      case "pricing": return <PricingSection setActive={go} />;
      case "privacy": case "terms": case "agreement": case "offer": case "consent": return <LegalDocSection doc={LEGAL_DOCS[active]} setActive={go} showFaq={active === "privacy"} />;
      case "dashboard": return role === "client" ? <ClientDashboard setActive={go} /> : <ProviderDashboard setActive={go} openChat={openChat} />;
      case "admin": return user?.isAdmin ? <AdminPanel /> : <HomeSection setActive={go} role={role} openChat={openChat} />;
      default: return <HomeSection setActive={go} role={role} openChat={openChat} />;
    }
  };

  const secBarH = secBannerOpen ? 36 : 0;
  const headerH = scrolled ? 52 : 64;

  return (
    <div className="min-h-screen bg-background font-ibm" style={{ ["--header-h" as string]: `${headerH + secBarH}px` }}>
      {/* Fixed security strip at the very top */}
      {secBannerOpen && (
        <div className="fixed top-0 left-0 right-0 z-[55] h-9 bg-gradient-to-r from-[hsl(220,20%,9%)] via-[hsl(220,18%,12%)] to-[hsl(220,20%,9%)] border-b border-gold/30">
          {/* Три текста в одну строку не помещались: на планшете заголовок
              обрезался многоточием, а крестик стоял поверх ссылки. Теперь
              подпись показываем только на широких экранах, а для крестика
              зарезервировано место — он больше ни на что не наезжает. */}
          <div className="max-w-6xl mx-auto ps-4 pe-10 h-full flex items-center justify-center gap-2 lg:gap-3 min-w-0">
            <Icon name="ShieldCheck" size={14} className="text-gold shrink-0" />
            <span className="text-[11px] sm:text-xs font-montserrat font-semibold text-foreground truncate">{tr("secBanner")}</span>
            <span className="hidden xl:inline text-[11px] text-muted-foreground truncate">· {tr("secBannerSub")}</span>
            <button
              onClick={() => go("policy")}
              className="hidden sm:inline-flex items-center gap-1 text-[11px] font-montserrat font-bold text-gold hover:underline shrink-0"
            >
              {tr("secReadPolicy")}
              <Icon name="ArrowRight" size={11} />
            </button>
            <button
              onClick={() => setSecBannerOpen(false)}
              className="absolute end-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              aria-label="close"
            >
              <Icon name="X" size={15} />
            </button>
          </div>
        </div>
      )}

      <header className="fixed left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm transition-[top,height] duration-300 ease-out" style={{ top: secBarH, height: headerH }}>
        <div className={`max-w-7xl mx-auto px-4 h-full flex items-center justify-between gap-3 transition-[padding] duration-300`}>
          <div className="flex items-center gap-3 shrink-0">
            <div className={`logo-sheen gold-gradient rounded flex items-center justify-center shrink-0 transition-all duration-300 ${scrolled ? "w-6 h-6" : "w-8 h-8"}`}>
              <Icon name="Shield" size={scrolled ? 13 : 16} className="text-[hsl(28,20%,7%)]" />
            </div>
            <div>
              <Brand className={`font-montserrat font-bold tracking-[0.2em] text-foreground transition-all duration-300 ${scrolled ? "text-base" : "text-lg"}`} />
              {!scrolled && (
                <>
                  <div className="hidden md:block lg:hidden xl:block text-[8px] text-muted-foreground font-montserrat tracking-wide uppercase leading-tight whitespace-nowrap">{tr("brandSub1")}</div>
                  <div className="hidden md:block lg:hidden xl:block text-[8px] text-muted-foreground font-montserrat tracking-wide uppercase leading-tight whitespace-nowrap">{tr("brandSub2")}</div>
                </>
              )}
            </div>
          </div>

          {/* Меню было доступно только с 1024px — на планшете человек терял
              навигацию целиком и мог ходить по сайту лишь через подвал.
              Гостю здесь всего три пункта, они спокойно помещаются; отступы
              на планшете чуть плотнее, чтобы ничего не наезжало. */}
          <nav className="hidden md:flex items-center gap-3 lg:gap-5 mx-2 lg:mx-4 flex-1 justify-center min-w-0">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => go(item.id)}
                className={`nav-link text-sm font-montserrat font-medium tracking-wide transition-colors whitespace-nowrap ${active === item.id ? "text-gold active" : "text-muted-foreground hover:text-foreground"}`}
              >
                {tr(item.key)}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <LangSwitcher lang={lang} setLang={setLang} />
            {isAuthed ? (
              <>
                <NotificationBell onOpenMessages={role === "provider" ? () => go("community") : undefined} />
                {user?.isAdmin && (
                  <button onClick={() => go("admin")} className={`hidden sm:flex items-center gap-1.5 px-2.5 py-2 text-sm font-montserrat font-bold rounded-sm transition-all border shrink-0 whitespace-nowrap relative ${active === "admin" ? "border-gold text-gold bg-gold/10" : "border-border text-muted-foreground hover:border-gold hover:text-gold"}`} aria-label={tr("adminPanelTitle")}>
                    <Icon name="ShieldCheck" size={15} />
                    <span className="hidden xl:inline">{tr("adminPanelTitle")}</span>
                    {newComplaintsBadge > 0 && (
                      <span className="absolute -top-1.5 -end-1.5 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-white text-[10px] font-bold flex items-center justify-center">{newComplaintsBadge}</span>
                    )}
                  </button>
                )}
                <button onClick={() => go("dashboard")} className="hidden sm:flex items-center gap-1.5 gold-gradient text-[hsl(28,20%,7%)] px-3 py-2 text-sm font-montserrat font-bold rounded-sm shrink-0 whitespace-nowrap">
                  <Icon name="LayoutDashboard" size={15} />
                  {tr("authCabinet")}
                </button>
                <button onClick={handleLogout} className="hidden sm:flex items-center justify-center border border-border text-muted-foreground w-9 h-9 rounded-sm hover:border-destructive hover:text-destructive transition-all shrink-0" aria-label={tr("dashLogout")}>
                  <Icon name="LogOut" size={15} />
                </button>
              </>
            ) : (
              <button onClick={openCabinet} className="hidden sm:flex items-center gap-1.5 gold-gradient text-[hsl(28,20%,7%)] px-3 py-2 text-sm font-montserrat font-bold rounded-sm shrink-0 whitespace-nowrap">
                <Icon name="LogIn" size={15} />
                {tr("authCabinet")}
              </button>
            )}
            <button className="lg:hidden text-muted-foreground hover:text-foreground transition-colors ms-0.5 shrink-0 p-2 -me-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label={tr(mobileMenuOpen ? "navMenuClose" : "navMenuOpen")}>
              <Icon name={mobileMenuOpen ? "X" : "Menu"} size={22} />
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-border bg-card animate-fade-in">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => go(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-montserrat border-b border-border last:border-0 ${active === item.id ? "text-gold bg-secondary" : "text-muted-foreground"}`}
              >
                <Icon name={item.icon} size={16} />
                {tr(item.key)}
              </button>
            ))}
            <div className="p-3 space-y-2">
              {isAuthed ? (
                <>
                  {user?.isAdmin && (
                    <button onClick={() => go("admin")} className="w-full border border-gold text-gold py-3 text-sm font-montserrat font-bold rounded-sm hover:bg-gold/10 transition-all flex items-center justify-center gap-2">
                      <Icon name="ShieldCheck" size={16} />
                      {tr("adminPanelTitle")}
                      {newComplaintsBadge > 0 && (
                        <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-white text-[10px] font-bold flex items-center justify-center">{newComplaintsBadge}</span>
                      )}
                    </button>
                  )}
                  <button onClick={() => go("dashboard")} className="w-full gold-gradient text-[hsl(28,20%,7%)] py-3 text-sm font-montserrat font-bold rounded-sm flex items-center justify-center gap-2">
                    <Icon name="LayoutDashboard" size={16} />
                    {tr("authCabinet")}
                  </button>
                  <button aria-label="Выйти" onClick={handleLogout} className="w-full border border-border text-muted-foreground py-3 text-sm font-montserrat font-semibold rounded-sm hover:border-destructive hover:text-destructive transition-all flex items-center justify-center gap-2">
                    <Icon name="LogOut" size={16} />
                    {tr("dashLogout")}
                  </button>
                </>
              ) : (
                <button onClick={openCabinet} className="w-full gold-gradient text-[hsl(28,20%,7%)] py-3 text-sm font-montserrat font-bold rounded-sm flex items-center justify-center gap-2">
                  <Icon name="LogIn" size={16} />
                  {tr("authCabinet")}
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {active !== "home" && (
        <div style={{ paddingTop: 64 + secBarH }}>
          <div className="border-b border-border bg-card/40">
            <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-2 text-xs font-montserrat">
              <button onClick={() => go("home")} className="text-muted-foreground hover:text-gold transition-colors flex items-center gap-1">
                <Icon name="Home" size={12} />
                {tr("crumbHome")}
              </button>
              <Icon name="ChevronRight" size={12} className="text-muted-foreground" />
              <span className="text-gold font-medium">{tr(SECTION_CRUMB[active])}</span>
            </div>
          </div>
        </div>
      )}

      <main style={active === "home" ? { paddingTop: 64 + secBarH } : undefined}>
        <div key={active} className="section-transition">
          {/* Кабинеты грузятся отдельным файлом — на время загрузки
              показываем спокойную заглушку, а не пустой экран. */}
          <Suspense fallback={<SectionLoader />}>
            {renderSection()}
          </Suspense>
        </div>
      </main>

      <footer className="border-t border-border bg-card mt-16">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 gold-gradient rounded flex items-center justify-center">
                  <Icon name="Shield" size={12} className="text-[hsl(28,20%,7%)]" />
                </div>
                <Brand className="font-montserrat font-bold text-sm text-foreground tracking-[0.2em]" />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{tr("footerDesc")}</p>
            </div>

            <div>
              <div className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest mb-3">{tr("footerForClients")}</div>
              {([
                ["heroClientCta1", "services"],
                ["specialists", "specialists"],
                // Работодатели ищут не услугу, а сотрудника в штат —
                // без ссылки в подвале они бы не узнали о базе резюме.
                ["navResumes", "resumes"],
                ["navCases", "cases"],
                ["fHowToOrder", "policy"],
                ["fSafetyDeal", "policy"],
                ["navContacts", "contacts"],
              ] as const).map(([l, sec]) => (
                <button key={l} onClick={() => go(sec)} className="block text-xs text-muted-foreground hover:text-gold cursor-pointer transition-colors mb-2 text-left">{tr(l)}</button>
              ))}
            </div>

            <div>
              <div className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest mb-3">{tr("footerForSpecialists")}</div>
              {([
                ["fBecomeProvider", "pricing"],
                ["navPricing", "pricing"],
                ["navCourses", "courses"],
                ["navCommunity", "community"],
                ["navChat", "chat"],
                ["fSpecialistFaq", "policy"],
              ] as const).map(([l, sec]) => (
                <button key={l} onClick={() => go(sec)} className="block text-xs text-muted-foreground hover:text-gold cursor-pointer transition-colors mb-2 text-left">{tr(l)}</button>
              ))}
            </div>

            <div>
              <div className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest mb-3">{tr("footerAboutShchit")}</div>
              {([
                ["fAbout", "about"],
                ["navBlog", "blog"],
                ["navMobileApp", "mobileapp"],
                ["navPolicy", "policy"],
              ] as const).map(([l, sec]) => (
                <button key={l} onClick={() => go(sec)} className="block text-xs text-muted-foreground hover:text-gold cursor-pointer transition-colors mb-2 text-left">{tr(l)}</button>
              ))}
              <div className="divider-gold my-3" />
              {([["fPrivacy", "privacy"], ["fConsent", "consent"], ["fTerms", "terms"], ["fAgreement", "agreement"], ["fOffer", "offer"]] as const).map(([l, sec]) => (
                <button key={l} onClick={() => go(sec)} className="block text-xs text-muted-foreground hover:text-gold cursor-pointer transition-colors mb-2 text-left">{tr(l)}</button>
              ))}
            </div>
          </div>
          <div className="divider-gold mt-8 mb-6" />
          <ShareButtons className="mb-6" />
          <div className="text-[11px] text-muted-foreground/80 leading-relaxed mb-4 space-y-0.5">
            <div className="font-semibold text-muted-foreground">{tr("reqName")}</div>
            <div>{tr("reqOgrnip")} · {tr("reqInn")}</div>
            <div>{tr("reqAddress")}</div>
            <div>{tr("reqTaxOffice")}</div>
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
            <div className="text-xs text-muted-foreground">{tr("rights")}</div>
            <div className="text-xs text-muted-foreground">{tr("forVerified")}</div>
          </div>
          {/* Оговорка о чужих товарных знаках: мы упоминаем платёжные системы
              и мессенджеры, и обязаны указать, что права на них не наши. */}
          <div className="text-[11px] text-muted-foreground/70 leading-relaxed mt-3 pt-3 border-t border-border/50">
            {tr("trademarksNote")}
          </div>
        </div>
      </footer>

      <CookieBanner go={go} />

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} onOpenDoc={(s) => { setAuthOpen(false); go(s); }} />}

      {regGateOpen && (
        <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto overscroll-contain" onClick={() => setRegGateOpen(false)}>
          <div className="bg-card border border-gold/40 rounded-sm max-w-md w-full p-8 text-center security-glow" onClick={(e) => e.stopPropagation()}>
            <div className="w-14 h-14 gold-gradient rounded-sm flex items-center justify-center mx-auto mb-5 glow-gold-sm">
              <Icon name="UserCheck" size={26} className="text-[hsl(28,20%,7%)]" />
            </div>
            <h3 className="font-montserrat font-bold text-lg text-foreground mb-2">{tr("regRequiredTitle")}</h3>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{tr("regRequiredText")}</p>
            <div className="flex flex-col gap-2">
              <button onClick={() => { setRegGateOpen(false); go("dashboard"); }} className="gold-gradient text-[hsl(28,20%,7%)] px-6 py-3 text-sm font-montserrat font-bold rounded-sm">
                {tr("regRequiredBtn")}
              </button>
              <button onClick={() => setRegGateOpen(false)} className="text-xs text-muted-foreground hover:text-foreground font-montserrat py-2">
                {tr("regRequiredCancel")}
              </button>
            </div>
          </div>
        </div>
      )}

      {paywallOpen && (
        <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto overscroll-contain" onClick={() => setPaywallOpen(false)}>
          <div className="bg-card border border-gold/40 rounded-sm max-w-md w-full p-8 text-center security-glow" onClick={(e) => e.stopPropagation()}>
            <div className="w-14 h-14 gold-gradient rounded-sm flex items-center justify-center mx-auto mb-5 glow-gold-sm">
              <Icon name="Lock" size={26} className="text-[hsl(28,20%,7%)]" />
            </div>
            <h2 className="font-montserrat font-extrabold text-xl text-foreground mb-2">{tr("paywallTitle")}</h2>
            <p className="text-sm text-muted-foreground mb-6">{tr("paywallText")}</p>
            <button onClick={() => { setPaywallOpen(false); setActive("dashboard"); window.scrollTo({ top: 0 }); }} className="w-full gold-gradient text-[hsl(28,20%,7%)] py-3 font-montserrat font-bold text-sm rounded-sm mb-2">
              {tr("paywallBtn")}
            </button>
            <button onClick={() => setPaywallOpen(false)} className="w-full text-xs text-muted-foreground hover:text-foreground py-2 font-montserrat font-semibold">
              {tr("cancel")}
            </button>
          </div>
        </div>
      )}

      <InstallPromptBanner setActive={go} />
    </div>
  );
}

const MOBILE_APP_BANNER_KEY = "shchit_mobileapp_banner_dismissed";

// Блок отзывов КЛИЕНТОВ о специалистах платформы (на клиентской главной).
// Тексты двуязычные, для fr/de/ja/ar/he — автоперевод (правило «всё на 7 языков»).
function ClientReviewsSection() {
  const { tr, lang, rtl } = useLang();
  // Мемоизируем массив строк — без этого он пересоздавался бы на каждый рендер
  // и вызывал бесконечный цикл ре-рендеров внутри useAutoTranslate (Maximum update depth exceeded).
  const enStrings = useMemo(() => CLIENT_REVIEWS.flatMap((r) => [r.text.en, r.name.en, r.city.en, r.service.en]), []);
  const { resolve } = useAutoTranslate(enStrings);
  const loc = (v: { ru: string; en: string }) => {
    if (lang === "ru") return v.ru;
    if (lang === "en") return v.en;
    return resolve(v.en);
  };

  const trackRef = useRef<HTMLDivElement | null>(null);
  const [paused, setPaused] = useState(false);

  // Прокрутка карусели на одну карточку в указанную сторону.
  const scrollByCard = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-review-card]");
    const step = card ? card.offsetWidth + 20 : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * step * (rtl ? -1 : 1), behavior: "smooth" });
  };

  // Автопрокрутка карусели; на паузе при наведении/касании и в конце — цикл сначала.
  useEffect(() => {
    if (paused) return;
    const el = trackRef.current;
    if (!el) return;
    const timer = setInterval(() => {
      const card = el.querySelector<HTMLElement>("[data-review-card]");
      const step = card ? card.offsetWidth + 20 : el.clientWidth * 0.8;
      const atEnd = Math.abs(el.scrollLeft) + el.clientWidth >= el.scrollWidth - 8;
      if (atEnd) el.scrollTo({ left: 0, behavior: "smooth" });
      else el.scrollBy({ left: step * (rtl ? -1 : 1), behavior: "smooth" });
    }, 3500);
    return () => clearInterval(timer);
  }, [paused, rtl]);

  return (
    <section className="border-y border-border bg-card py-20 md:py-32 relative overflow-hidden">
      <div className="absolute inset-0 grid-line-bg opacity-50" />
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <Reveal className="text-center mb-14">
          <div className="tag-security mb-3 inline-block">{tr("clientReviewsTag")}</div>
          <h2 className="font-montserrat font-bold text-3xl text-foreground mb-2">{tr("clientReviewsTitle")}</h2>
          <p className="text-muted-foreground text-sm max-w-2xl mx-auto">{tr("clientReviewsSub")}</p>
        </Reveal>

        <div className="relative">
          <div className="hidden md:flex absolute inset-y-0 -start-5 z-20 items-center">
            <button
              onClick={() => scrollByCard(-1)}
              aria-label="prev"
              className="flex w-12 h-12 rounded-full bg-background border border-border items-center justify-center text-muted-foreground hover:text-gold hover:border-gold transition-colors shadow-md"
            >
              <Icon name={rtl ? "ChevronRight" : "ChevronLeft"} size={20} />
            </button>
          </div>
          <div className="hidden md:flex absolute inset-y-0 -end-5 z-20 items-center">
            <button
              onClick={() => scrollByCard(1)}
              aria-label="next"
              className="flex w-12 h-12 rounded-full bg-background border border-border items-center justify-center text-muted-foreground hover:text-gold hover:border-gold transition-colors shadow-md"
            >
              <Icon name={rtl ? "ChevronLeft" : "ChevronRight"} size={20} />
            </button>
          </div>

          {/* Лента карусели — все отзывы в одну строку */}
          <div
            ref={trackRef}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onTouchStart={() => setPaused(true)}
            className="flex gap-5 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4 no-scrollbar"
          >
            {CLIENT_REVIEWS.map((r) => (
              <div
                key={r.id}
                data-review-card
                className="snap-start shrink-0 w-[300px] sm:w-[340px] p-6 border border-border rounded-sm bg-background flex flex-col"
              >
                {/* Это составленные платформой примеры, а не отзывы клиентов,
                    поэтому ни звёзд, ни значка «проверено» здесь быть не должно. */}
                <div className="flex items-center gap-1.5 mb-3">
                  <Icon name="MessageSquareQuote" size={14} className="text-gold/70" />
                  <span className="text-[11px] font-montserrat text-muted-foreground">{tr("clientReviewsDisclaimer")}</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5 flex-1">«{loc(r.text)}»</p>
                <div className="flex items-center gap-3 border-t border-border pt-4">
                  <div className="w-10 h-10 rounded-full gold-gradient flex items-center justify-center shrink-0">
                    <span className="font-montserrat font-bold text-sm text-[hsl(28,20%,7%)]">{loc(r.name).trim().charAt(0)}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="font-montserrat font-bold text-sm text-foreground">
                      {loc(r.name)}
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate">{loc(r.city)} · {loc(r.service)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function HomeSection({ setActive, role }: { setActive: (s: Section) => void; role: Role; openChat?: (t: { name: string; title: string; avatar?: string | null }) => void }) {
  const { tr } = useLang();
  const [appBannerOpen, setAppBannerOpen] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(MOBILE_APP_BANNER_KEY)) setAppBannerOpen(true);
    } catch {
      setAppBannerOpen(true);
    }
  }, []);

  const dismissAppBanner = () => {
    setAppBannerOpen(false);
    try { localStorage.setItem(MOBILE_APP_BANNER_KEY, "1"); } catch { /* noop */ }
  };
  const isClient = role === "client";
  const { providers } = useProviders();
  const activeProvidersCount = providers.filter((p) => p.active !== false).length;
  // Показываем ТОЛЬКО реальное число анкет в каталоге. Раньше здесь стоял
  // «живой» счётчик, который случайно колебался вокруг выдуманного числа —
  // это вводило посетителя в заблуждение и проверялось за минуту.
  const liveCount = activeProvidersCount;

  return (
    <div>
      {/* Баннер скидки на тарифы — только для исполнителей. Клиенту скидка не нужна. */}
      {!isClient && <UrgencyBanner onCta={() => setActive("pricing")} sticky />}
      <section className="relative overflow-hidden grid-line-bg min-h-[92vh] flex items-center vignette">
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/40 z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/60 z-10" />
        <div className="absolute inset-0">
          <img src={isClient ? HERO_BG : GUARDS_BG} alt="" aria-hidden="true" decoding="async" className="w-full h-full object-cover opacity-25" />
        </div>
        <div className="absolute top-1/4 -left-40 w-[500px] h-[500px] rounded-full z-0" style={{ background: "radial-gradient(circle, hsla(43,80%,52%,0.1) 0%, transparent 70%)" }} />
        <div className="aurora-bg z-0" />
        <div className="relative z-20 max-w-7xl mx-auto px-4 py-28 md:py-36">
          <div className="max-w-4xl stagger">
            <div className="flex items-center gap-3 mb-6 flex-wrap">
              <div className="tag-security inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse-gold" />
                {tr(isClient ? "freeForClients" : "providerActiveTag")}
              </div>
              {isClient && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-montserrat">
                  <Icon name="ShieldCheck" size={13} className="text-gold" />
                  {tr("verifyAll")}
                </div>
              )}
            </div>
            {/* Заголовок намеренно разбит на две короткие строки — тогда его
                можно набрать крупно, не рискуя развалом на длинных языках
                (русский и немецкий на ~30% длиннее английского).
                clamp даёт плавный размер: мелкий на телефоне, крупный на
                десктопе, без скачков на промежуточных ширинах. */}
            {isClient ? (
              <h1 className="font-montserrat font-extrabold text-[clamp(2rem,5.2vw,3.9rem)] text-foreground leading-[1.06] mb-7 tracking-[-0.025em]">
                {tr("heroClientTitle1")}<br />
                <span className="gold-text-gradient">{tr("heroClientTitle2")}</span>
              </h1>
            ) : (
              <h1 className="font-montserrat font-extrabold text-[clamp(2rem,5.2vw,3.9rem)] text-foreground leading-[1.06] mb-7 tracking-[-0.025em]">
                <span>{tr("heroProviderTitle1")}</span><br />
                <span className="gold-text-gradient">{tr("heroProviderTitle2")}</span>
              </h1>
            )}
            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed mb-8 max-w-xl">
              {tr(isClient ? "heroClientDesc" : "heroProviderDesc")}
            </p>
            <div className="flex flex-wrap gap-3 items-center">
              <button
                onClick={() => setActive(isClient ? "services" : "dashboard")}
                className="shine-on-hover gold-gradient text-[hsl(28,20%,7%)] px-6 sm:px-9 py-3.5 sm:py-4 font-montserrat font-extrabold text-sm sm:text-base tracking-wide rounded-sm glow-gold-sm flex items-center gap-2.5"
              >
                <Icon name="Search" size={18} />
                {tr(isClient ? "heroClientCta1" : "heroProviderFindOrders")}
                <Icon name="ArrowRight" size={18} />
              </button>
              <button
                onClick={() => {
                  if (isClient) {
                    try { sessionStorage.setItem("open_new_task", "1"); } catch { /* noop */ }
                    setActive("dashboard");
                  } else {
                    setActive("howitworks");
                  }
                }}
                className="border border-gold/60 text-foreground px-7 py-4 font-montserrat font-semibold text-sm tracking-wide hover:border-gold hover:text-gold transition-all rounded-sm flex items-center gap-2"
              >
                <Icon name={isClient ? "ClipboardPlus" : "Compass"} size={18} className="text-gold" />
                {tr(isClient ? "heroClientCta3" : "heroProviderCta2")}
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-4">
              <div className="flex items-center gap-1.5 text-xs text-gold font-montserrat font-semibold">
                <Icon name="Zap" size={13} />
                {tr(isClient ? "heroFast" : "providerGetClients")}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-montserrat">
                <Icon name="ShieldCheck" size={13} className="text-green-400" />
                {tr(isClient ? "riskFreeClient" : "priceKeepAll")}
              </div>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-4 mt-8 flex-wrap">
              <div className="flex -space-x-3">
                {[DETECTIVE_IMAGE, HERO_IMAGE, POLYGRAPH_IMAGE].map((img, i) => (
                  <div key={i} className="w-9 h-9 rounded-full border-2 border-background overflow-hidden">
                    <img src={img} alt="Специалист платформы" loading="lazy" className="w-full h-full object-cover" />
                  </div>
                ))}
                {isClient && liveCount > 3 && (
                  <div className="w-9 h-9 rounded-full border-2 border-background bg-gold flex items-center justify-center text-[10px] font-montserrat font-extrabold text-[hsl(28,20%,7%)]">+{liveCount - 3}</div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <Icon name="ShieldCheck" size={16} className="text-gold" />
                  <span className="text-sm font-montserrat font-bold text-foreground">{tr("heroProofRating")}</span>
                </div>
                <div className="text-[11px] text-muted-foreground font-montserrat">{tr("heroProofReviews")}</div>
              </div>
            </div>

            {/* Счётчик показываем только клиенту и только по фактическому числу
                анкет в каталоге. Специалисту число клиентов не показываем:
                подставлять сюда количество анкет было бы неправдой. */}
            {isClient && liveCount > 0 && (
              <div className="flex items-center gap-2 mt-4 text-xs font-montserrat">
                <Icon name="ShieldCheck" size={13} className="text-gold" />
                <span className="text-foreground font-bold">{liveCount}</span>
                <span className="text-muted-foreground">{tr("liveOnline")}</span>
                <span className="text-muted-foreground/50">·</span>
                <span className="text-muted-foreground">{tr("liveVerified")}</span>
              </div>
            )}

            <div className="flex items-center gap-x-6 gap-y-2 mt-6 flex-wrap">
              {(isClient
                ? [{ icon: "LayoutGrid", t: "heroClientBadgeAll" as const }, { icon: "Wallet", t: "heroNoFeeBig" as const }]
                : [{ icon: "Megaphone", t: "heroProviderBadgeNoAds" as const }, { icon: "Users", t: "heroProviderBadgeCommunity" as const }]
              ).map((b) => (
                <div key={b.t} className="flex items-center gap-2 text-xs text-muted-foreground font-montserrat">
                  <Icon name={b.icon} size={14} className="text-gold" />
                  {tr(b.t)}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 z-20 border-t border-border bg-card/90 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
              {/* Показываем только то, что подтверждается фактами платформы:
                  выдуманные счётчики «1 240+ специалистов» убраны — они
                  вводили в заблуждение и юридически рискованны. */}
              {(isClient
                ? [
                    { n: "100%", l: "statSpecialists" as const },
                    { n: "0%", l: "statCases" as const },
                    { n: "7", l: "statServices" as const },
                    { n: "AES-256", l: "statClients" as const },
                  ]
                : [
                    { n: "0%", l: "statCases" as const },
                    { n: "100%", l: "statProvClients" as const },
                    { n: "7", l: "statProvSearches" as const },
                    { n: "AES-256", l: "statClients" as const },
                  ]
              ).map((s, i) => (
                <div key={s.n} className="py-5 px-6 text-center">
                  <div className="stat-number stat-appear text-2xl mb-1" data-reveal-delay={i * 90}>{s.n}</div>
                  <div className="text-xs text-muted-foreground">{tr(s.l)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <TrustBadges />

      {appBannerOpen && (
        <section className="border-t border-b border-gold/30 bg-card">
          <div className="max-w-7xl mx-auto px-4 py-5">
            <div className="relative flex flex-col sm:flex-row items-center gap-4 sm:gap-5 border border-gold/30 rounded-sm glass-card p-5 sm:p-6 security-glow">
              <button
                onClick={dismissAppBanner}
                className="tap-target absolute top-3 end-3 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="close"
              >
                <Icon name="X" size={16} />
              </button>
              <div className="w-12 h-12 icon-tile rounded-full flex items-center justify-center shrink-0">
                <Icon name="Smartphone" size={22} className="text-gold" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <div className="font-montserrat font-bold text-sm text-foreground mb-0.5">{tr("appBannerTitle")}</div>
                <div className="text-xs text-muted-foreground">{tr("appBannerText")}</div>
              </div>
              <button
                onClick={() => setActive("mobileapp")}
                className="shrink-0 gold-gradient text-[hsl(28,20%,7%)] px-6 py-3 font-montserrat font-bold text-sm rounded-sm inline-flex items-center gap-2 whitespace-nowrap"
              >
                <Icon name="Download" size={16} />
                {tr("appBannerBtn")}
              </button>
            </div>
          </div>
        </section>
      )}

      {!isClient && (
        <section className="border-t border-border bg-card py-20 md:py-28 relative overflow-hidden ambient-gold">
          <div className="max-w-7xl mx-auto px-4 relative z-10">
            <Reveal className="text-center mb-14">
              <div className="tag-security mb-3 inline-block">{tr("bpTag")}</div>
              <h2 className="font-montserrat font-bold text-3xl text-foreground">{tr("bpTitle")}</h2>
            </Reveal>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5 stagger">
              {[
                { n: "01", icon: "UserPlus", title: "bp1Title" as const, desc: "bp1Desc" as const },
                { n: "02", icon: "FileCheck2", title: "bp2Title" as const, desc: "bp2Desc" as const },
                { n: "03", icon: "Wallet", title: "bp3Title" as const, desc: "bp3Desc" as const },
                { n: "04", icon: "TrendingUp", title: "bp4Title" as const, desc: "bp4Desc" as const },
              ].map((step) => (
                <div key={step.n} className="relative p-6 border border-border rounded-sm bg-background card-lift">
                  <div className="font-montserrat font-extrabold text-4xl text-gold/15 absolute top-4 right-5">{step.n}</div>
                  <div className="w-11 h-11 gold-gradient rounded flex items-center justify-center mb-5 glow-gold-sm">
                    <Icon name={step.icon} fallback="Check" size={19} className="text-[hsl(28,20%,7%)]" />
                  </div>
                  <div className="font-montserrat font-bold text-sm text-foreground mb-2">{tr(step.title)}</div>
                  <div className="text-xs text-muted-foreground leading-relaxed">{tr(step.desc)}</div>
                </div>
              ))}
            </div>
            <div className="text-center mt-10">
              <button onClick={() => setActive("dashboard")} className="shine-on-hover gold-gradient text-[hsl(28,20%,7%)] px-8 py-3.5 font-montserrat font-bold text-sm rounded-sm glow-gold-sm inline-flex items-center gap-2">
                <Icon name="Search" size={16} />
                {tr("heroProviderFindOrders")}
              </button>
            </div>
          </div>
        </section>
      )}

      {isClient && (
      <section className="border-t border-border bg-card py-20 md:py-28 relative overflow-hidden ambient-gold">
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <Reveal className="text-center mb-14">
            <div className="tag-security mb-3 inline-block">{tr("process")}</div>
            <h2 className="font-montserrat font-bold text-3xl text-foreground">{tr("howItWorks")}</h2>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 stagger">
            {[
              { n: "01", icon: "ListChecks", title: "cstep1Title" as const, desc: "cstep1Desc" as const },
              { n: "02", icon: "Users", title: "cstep2Title" as const, desc: "cstep2Desc" as const },
              { n: "03", icon: "PhoneCall", title: "cstep3Title" as const, desc: "cstep3Desc" as const },
              { n: "04", icon: "CircleCheckBig", title: "cstep4Title" as const, desc: "cstep4Desc" as const },
            ].map((step) => (
              <div key={step.n} className="relative p-6 border border-border rounded-sm bg-background card-lift">
                <div className="font-montserrat font-extrabold text-4xl text-gold/15 absolute top-4 right-5">{step.n}</div>
                <div className="w-11 h-11 gold-gradient rounded flex items-center justify-center mb-5 glow-gold-sm">
                  <Icon name={step.icon} size={19} className="text-[hsl(28,20%,7%)]" />
                </div>
                <div className="font-montserrat font-bold text-sm text-foreground mb-2">{tr(step.title)}</div>
                <div className="text-xs text-muted-foreground leading-relaxed">{tr(step.desc)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      )}

      <section className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4">
          <Reveal className="text-center mb-12">
            <div className="tag-security mb-3 inline-block">{tr("features")}</div>
            <h2 className="font-montserrat font-bold text-3xl text-foreground">{tr("whyUs")}</h2>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {(isClient
              ? [
                  { icon: "ShieldCheck", title: "cfeat1Title" as const, desc: "cfeat1Desc" as const },
                  { icon: "LayoutGrid", title: "cfeat2Title" as const, desc: "cfeat2Desc" as const },
                  { icon: "PhoneCall", title: "cfeat3Title" as const, desc: "cfeat3Desc" as const },
                  { icon: "Star", title: "cfeat4Title" as const, desc: "cfeat4Desc" as const },
                  { icon: "MapPin", title: "cfeat5Title" as const, desc: "cfeat5Desc" as const },
                  { icon: "Lock", title: "cfeat6Title" as const, desc: "cfeat6Desc" as const },
                ]
              : [
                  { icon: "Megaphone", title: "featPro1Title" as const, desc: "featPro1Desc" as const },
                  { icon: "Wallet", title: "featPro2Title" as const, desc: "featPro2Desc" as const },
                  { icon: "PhoneCall", title: "featPro3Title" as const, desc: "featPro3Desc" as const },
                  { icon: "Users", title: "featPro4Title" as const, desc: "featPro4Desc" as const },
                  { icon: "Star", title: "featPro5Title" as const, desc: "featPro5Desc" as const },
                  { icon: "GraduationCap", title: "featPro6Title" as const, desc: "featPro6Desc" as const },
                ]
            ).map((f) => (
              <div key={f.title} className="group p-6 border border-border rounded-sm bg-card card-lift cursor-default">
                <div className="w-10 h-10 gold-gradient rounded flex items-center justify-center mb-4">
                  <Icon name={f.icon} size={18} className="icon-hover text-[hsl(28,20%,7%)]" />
                </div>
                <div className="font-montserrat font-semibold text-sm text-foreground mb-2">{tr(f.title)}</div>
                <div className="text-xs text-muted-foreground leading-relaxed">{tr(f.desc)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews: клиенту — отзывы клиентов о специалистах; исполнителю — отзыв специалиста о платформе */}
      {isClient ? (
        <ClientReviewsSection />
      ) : (
      <section className="border-y border-border bg-card py-20 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 grid-line-bg opacity-50" />
        <Reveal className="max-w-4xl mx-auto px-4 relative z-10 text-center">
          <Icon name="Quote" size={40} className="text-gold/30 mx-auto mb-6" />
          <p className="font-montserrat font-medium text-xl md:text-2xl text-foreground leading-relaxed mb-8">
            {tr("testimonialText")}
          </p>
          {/* Подписано реальной ролью, без вымышленного имени и без значка
              «проверено»: выдавать сочинённый отзыв за настоящий нельзя. */}
          <div className="flex items-center justify-center gap-3">
            <div className="w-11 h-11 rounded-full gold-gradient flex items-center justify-center shrink-0">
              <Icon name="Shield" size={20} className="text-[hsl(28,20%,7%)]" />
            </div>
            <div className="text-start">
              <div className="font-montserrat font-bold text-sm text-foreground">
                {tr("testimonialAuthor")}
              </div>
            </div>
          </div>
        </Reveal>
      </section>
      )}

      {/* Security / Encryption */}
      <section className="border-t border-border py-24 md:py-36 relative overflow-hidden ambient-gold">
        <div className="absolute inset-0 grid-line-bg opacity-40" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full z-0" style={{ background: "radial-gradient(circle, hsla(43,80%,52%,0.07) 0%, transparent 70%)" }} />
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <Reveal className="text-center mb-14">
            <div className="inline-flex items-center justify-center mb-6">
              <div className="pulse-ring w-16 h-16 gold-gradient rounded-full flex items-center justify-center security-glow">
                <Icon name="ShieldCheck" size={28} className="text-[hsl(28,20%,7%)]" />
              </div>
            </div>
            <div className="tag-security mb-4 inline-block">{tr("secTag")}</div>
            <h2 className="font-montserrat font-extrabold text-3xl md:text-4xl text-foreground mb-4">{tr("secTitle")}</h2>
            <p className="text-muted-foreground text-base leading-relaxed max-w-2xl mx-auto">{tr("secDesc")}</p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 stagger mb-12">
            {[
              { icon: "KeyRound", title: "sec1Title" as const, desc: "sec1Desc" as const },
              { icon: "DatabaseZap", title: "sec2Title" as const, desc: "sec2Desc" as const },
              { icon: "MessageSquareLock", title: "sec3Title" as const, desc: "sec3Desc" as const },
              { icon: "Globe", title: "sec4Title" as const, desc: "sec4Desc" as const },
              { icon: "FileLock2", title: "sec5Title" as const, desc: "sec5Desc" as const },
              { icon: "BadgeCheck", title: "sec6Title" as const, desc: "sec6Desc" as const },
            ].map((f) => (
              <div key={f.title} className="group p-6 border border-border rounded-sm bg-card card-lift shine-on-hover cursor-default">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 gold-gradient rounded flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shrink-0">
                    <Icon name={f.icon} fallback="Lock" size={18} className="text-[hsl(28,20%,7%)]" />
                  </div>
                  <div className="font-montserrat font-bold text-sm text-foreground">{tr(f.title)}</div>
                </div>
                <div className="text-xs text-muted-foreground leading-relaxed">{tr(f.desc)}</div>
              </div>
            ))}
          </div>

          {/* Trust badges + stats */}
          <div className="border border-gold/30 rounded-sm glass-card p-8 security-glow">
            <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
              {(["secBadge1", "secBadge2", "secBadge3", "secBadge4"] as const).map((b) => (
                <div key={b} className="flex items-center gap-2 border border-border bg-background px-4 py-2 rounded-sm">
                  <Icon name="ShieldCheck" size={14} className="text-gold" />
                  <span className="text-xs font-montserrat font-semibold text-foreground">{tr(b)}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">
              {[
                { n: "256-bit", l: "secStat1" as const },
                { n: "0", l: "secStat2" as const },
                { n: "3", l: "secStat3" as const },
              ].map((s, i) => (
                <div key={s.n} className="py-4 sm:py-0 px-6 text-center">
                  <div className="stat-number stat-appear text-3xl mb-1" data-reveal-delay={i * 90}>{s.n}</div>
                  <div className="text-xs text-muted-foreground">{tr(s.l)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center mt-10">
            <button
              onClick={() => setActive("policy")}
              className="inline-flex items-center gap-2 border border-gold text-gold px-8 py-3.5 font-montserrat font-bold text-sm tracking-wide hover:bg-gold hover:text-[hsl(28,20%,7%)] transition-all rounded-sm"
            >
              <Icon name="FileText" size={16} />
              {tr("secReadPolicy")}
            </button>
          </div>
        </div>
      </section>

      {!isClient && (
        <section className="max-w-7xl mx-auto px-4 py-20 md:py-28">
          <div className="border border-gold/30 rounded-sm glass-card p-10 md:p-16 text-center relative overflow-hidden grid-line-bg glow-gold ambient-gold">
            <Reveal className="relative z-10">
              <div className="tag-security mb-4 inline-block">{tr("proAccessTag")}</div>
              <h2 className="font-montserrat font-extrabold text-3xl md:text-4xl text-foreground mb-4">
                {tr("proCtaTitle1")}<br /><span className="gold-text-gradient">{tr("proCtaTitle2")}</span>
              </h2>
              <p className="text-muted-foreground text-sm mb-8 max-w-xl mx-auto">
                {tr("proCtaDesc")}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button onClick={() => setActive("community")} className="shine-on-hover gold-gradient text-[hsl(28,20%,7%)] px-10 py-4 font-montserrat font-bold text-sm tracking-wide rounded-sm glow-gold-sm">
                  {tr("proOpenCommunity")}
                </button>
                <button onClick={() => setActive("contacts")} className="border border-border text-foreground px-8 py-4 font-montserrat font-semibold text-sm hover:border-gold hover:text-gold transition-all rounded-sm">
                  {tr("contactUs")}
                </button>
              </div>
            </Reveal>
          </div>
        </section>
      )}
    </div>
  );
}

// Профиль КОНКРЕТНОГО специалиста (для клиента). Показывает данные выбранного
// специалиста, а не демо-профиль. Открывается только зарегистрированным клиентам.


