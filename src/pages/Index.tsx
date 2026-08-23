import { useState, useEffect, useRef, useMemo, lazy, Suspense } from "react";
import Icon from "@/components/ui/icon";
import { useLang, t, LANGS, type Lang } from "@/lib/i18n";
import { useGeo } from "@/lib/geo";
import { useProviders, isLicensed, isQuietNow, isPremium, providerLocalTime, type Provider } from "@/lib/providers";
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
import LocationAutocomplete, { type LocationSuggestion } from "@/components/LocationAutocomplete";
import { serviceCategories, services } from "@/lib/servicesCatalog";
import { StarRating } from "@/components/SharedControls";
const AdminPanel = lazy(() => import("@/components/AdminPanel"));
const ClientDashboard = lazy(() => import("@/components/ClientDashboard"));
const ProviderDashboard = lazy(() => import("@/components/ProviderDashboard"));
// Разделы, которые открывают редко и не с первого экрана: грузим по требованию,
// чтобы главная страница стартовала быстрее.
const PricingSection = lazy(() => import("@/components/Pricing").then((m) => ({ default: m.PricingSection })));
const MobileAppSection = lazy(() => import("@/components/InfoSections").then((m) => ({ default: m.MobileAppSection })));
const AboutSection = lazy(() => import("@/components/InfoSections").then((m) => ({ default: m.AboutSection })));
const BlogSection = lazy(() => import("@/components/InfoSections").then((m) => ({ default: m.BlogSection })));
const SecurityPolicySection = lazy(() => import("@/components/InfoSections").then((m) => ({ default: m.SecurityPolicySection })));
const ForumSection = lazy(() => import("@/components/CommunicationSections").then((m) => ({ default: m.ForumSection })));
const ContactsSection = lazy(() => import("@/components/CommunicationSections").then((m) => ({ default: m.ContactsSection })));
import { TrustBadges, MinimalHome, FaqAccordion } from "@/components/LandingSections";
import AuthModal from "@/components/AuthModal";
import { InstallPromptBanner, HowItWorksSection } from "@/components/InfoSections";
import { ReviewsList, ReportModal } from "@/components/ReviewsAndReports";
import { DirectChatSection, ChatSection } from "@/components/CommunicationSections";
import func2url from "../../backend/func2url.json";

import {
  HERO_IMAGE, POLYGRAPH_IMAGE, DETECTIVE_IMAGE, GUARDS_IMAGE,
  CLIENT_NAV, PROVIDER_NAV, GUEST_NAV,
  L, resolveAvatar, isImageUrl,
  type Section, type Role,
} from "@/lib/shared";
import { useTilt3D, useFavorites } from "@/hooks/useAppHooks";

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

function Lightbox({ src, title, onClose }: { src: string; title?: string; onClose: () => void }) {
  const { tr } = useLang();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-background/90 backdrop-blur-sm" />
      <div className="relative z-10 max-w-3xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {title && <div className="text-sm font-montserrat font-semibold text-foreground mb-3 text-center">{title}</div>}
        <img src={src} alt={title || ""} className="max-w-full max-h-[78vh] object-contain rounded-sm border border-gold/30 mx-auto" />
        <div className="flex items-center justify-center gap-3 mt-4">
          <a href={src} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-montserrat font-semibold text-gold hover:underline">
            <Icon name="ExternalLink" size={14} />{tr("lightboxOpenNewTab")}
          </a>
          <button aria-label="Закрыть" onClick={onClose} className="inline-flex items-center gap-1.5 border border-border text-muted-foreground text-xs font-montserrat font-semibold px-4 py-2 rounded-sm hover:border-gold hover:text-gold transition-all">
            <Icon name="X" size={14} />{tr("lightboxClose")}
          </button>
        </div>
      </div>
      <button onClick={onClose} className="absolute top-4 end-4 z-20 text-muted-foreground hover:text-foreground transition-colors" aria-label={tr("lightboxClose")}>
        <Icon name="X" size={26} />
      </button>
    </div>
  );
}

function AvailabilityNote({ p }: { p: Provider }) {
  const { tr } = useLang();
  const localTime = providerLocalTime(p);
  if (p.alwaysAvailable) {
    return (
      <div className="flex items-center gap-1.5 mb-3 text-[11px] text-green-400 font-montserrat font-semibold">
        <Icon name="Clock" size={12} />{tr("availAlways")}
        {localTime && <span className="text-muted-foreground font-normal">· {tr("availLocalTime")} {localTime}</span>}
      </div>
    );
  }
  if (!p.quietStart || !p.quietEnd) return null;
  const quiet = isQuietNow(p);
  return (
    <div className={`flex items-center gap-1.5 mb-3 text-[11px] font-montserrat font-semibold ${quiet ? "text-muted-foreground/70" : "text-foreground"}`}>
      <Icon name={quiet ? "Moon" : "Clock"} size={12} className={quiet ? "" : "text-gold"} />
      {quiet ? tr("availSleeping") : `${tr("availCallFrom")} ${p.quietEnd}–${p.quietStart}`}
      {localTime && <span className="text-muted-foreground font-normal">· {localTime}</span>}
    </div>
  );
}

function ContactButtons({ p, onChat, compact, onRequireAuth }: { p: Provider; onChat: () => void; compact?: boolean; onRequireAuth?: () => void }) {
  const { tr } = useLang();
  const c = p.contacts;
  // Витринный образец: кнопок связи не показываем совсем. Человек в трудной
  // ситуации не должен писать несуществующему специалисту и ждать ответа —
  // вместо этого сразу предлагаем оставить заявку живым исполнителям.
  if (p.isDemo) {
    return (
      <div className="border border-border bg-background rounded-sm p-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-1.5 text-xs font-montserrat font-semibold text-foreground mb-1">
          <Icon name="Info" size={13} className="text-muted-foreground" />
          {tr("demoNoticeTitle")}
        </div>
        {!compact && <p className="text-[11px] text-muted-foreground mb-2 leading-snug">{tr("demoNoticeText")}</p>}
        <button
          onClick={() => window.dispatchEvent(new Event("shchit:new-request"))}
          className="w-full gold-gradient text-[hsl(28,20%,7%)] text-xs font-montserrat font-bold px-3 py-2 rounded-sm hover:opacity-90 transition-all"
        >
          {tr("demoNoticeBtn")}
        </button>
      </div>
    );
  }
  // Гость: контакты скрыты сервером. Показываем понятное объяснение и вход,
  // чтобы человек не решил, что специалист без связи.
  if (!c && p.contactsLocked) {
    return (
      <div className="border border-gold/30 bg-gold/5 rounded-sm p-3 text-center" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-center gap-1.5 text-xs font-montserrat font-semibold text-gold mb-1">
          <Icon name="Lock" size={13} />{tr("contactsLockedTitle")}
        </div>
        {!compact && <p className="text-[11px] text-muted-foreground mb-2 leading-snug">{tr("contactsLockedNote")}</p>}
        <button
          onClick={() => (onRequireAuth ? onRequireAuth() : window.dispatchEvent(new Event("shchit:require-auth")))}
          className="w-full gold-gradient text-[hsl(28,20%,7%)] text-xs font-montserrat font-bold px-3 py-2 rounded-sm hover:opacity-90 transition-all"
        >
          {tr("contactsLockedBtn")}
        </button>
      </div>
    );
  }
  if (!c) return null;
  const size = compact ? 14 : 16;
  const btn = "flex items-center justify-center gap-1.5 rounded-sm font-montserrat font-semibold transition-all";
  const pad = compact ? "px-2.5 py-2 text-[11px]" : "px-3 py-2.5 text-xs";
  const quiet = isQuietNow(p);
  return (
    <div className={`grid ${compact ? "grid-cols-4" : "grid-cols-2"} gap-2`} onClick={(e) => e.stopPropagation()}>
      {c.phone && (
        quiet ? (
          <div className={`${btn} ${pad} border border-border text-muted-foreground/60 cursor-not-allowed`} title={tr("quietHoursTip")} aria-disabled="true">
            <Icon name="PhoneOff" size={size} />{!compact && tr("quietHoursBtn")}
          </div>
        ) : (
          <a href={`tel:${c.phone}`} className={`${btn} ${pad} gold-gradient text-[hsl(28,20%,7%)] hover:opacity-90`} aria-label={tr("contactCall")}>
            <Icon name="Phone" size={size} />{!compact && tr("contactCall")}
          </a>
        )
      )}
      <button onClick={onChat} className={`${btn} ${pad} border border-gold text-gold hover:bg-gold hover:text-[hsl(28,20%,7%)]`} aria-label={tr("contactChat")}>
        <Icon name="MessageCircle" size={size} />{!compact && tr("contactChat")}
      </button>
      {c.whatsapp && (
        <a href={`https://wa.me/${c.whatsapp.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" className={`${btn} ${pad} border border-border text-foreground hover:border-green-500 hover:text-green-400`} aria-label="WhatsApp">
          <Icon name="MessageSquare" size={size} />{!compact && tr("contactWhatsApp")}
        </a>
      )}
      {c.telegram && (
        <a href={`https://t.me/${c.telegram.replace(/^@/, "")}`} target="_blank" rel="noopener noreferrer" className={`${btn} ${pad} border border-border text-foreground hover:border-blue-500 hover:text-blue-400`} aria-label="Telegram">
          <Icon name="Send" size={size} />{!compact && tr("contactTelegram")}
        </a>
      )}
    </div>
  );
}

function VerificationBlock({ v }: { v: NonNullable<Provider["verification"]> }) {
  const { tr } = useLang();
  const [lightbox, setLightbox] = useState<{ src: string; title?: string } | null>(null);
  const licenses = v.licenses && v.licenses.length ? v.licenses : (v.license ? [v.license] : []);
  const documents = v.documents || [];
  const hasAny = v.fullName || v.legalStatus || licenses.length || v.registry || documents.length || v.bio;
  if (!hasAny) return null;
  const statusLabel = v.legalStatus === "self" ? tr("pdVfStatusSelf") : v.legalStatus === "ip" ? tr("pdVfStatusIp") : v.legalStatus === "company" ? tr("pdVfStatusCompany") : v.legalStatus;
  const rows = [
    v.fullName ? { icon: "User", label: tr("verifyName"), value: v.fullName } : null,
    v.legalStatus ? { icon: "Briefcase", label: tr("verifyStatus"), value: statusLabel } : null,
    v.registry ? { icon: "Hash", label: tr("verifyRegistry"), value: v.registry } : null,
  ].filter(Boolean) as { icon: string; label: string; value: string }[];
  return (
    <div className="space-y-4">
      {v.bio && (
        <div className="border border-border rounded-sm bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Icon name="UserRound" size={15} className="text-gold" />
            <div className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest">{tr("verifyBio")}</div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">{v.bio}</p>
        </div>
      )}
      <div className="border border-gold/30 rounded-sm bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Icon name="BadgeCheck" size={15} className="text-gold" />
          <div className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest">{tr("verifyBlockTitle")}</div>
        </div>
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.label} className="flex items-start gap-2">
              <Icon name={r.icon} size={13} className="text-gold mt-0.5 shrink-0" />
              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{r.label}</div>
                <div className="text-xs text-foreground font-montserrat font-medium">{r.value}</div>
              </div>
            </div>
          ))}
          {licenses.length > 0 && (
            <div className="flex items-start gap-2">
              <Icon name="FileBadge" size={13} className="text-gold mt-0.5 shrink-0" />
              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{tr("verifyLicense")}</div>
                <div className="space-y-1 mt-0.5">
                  {licenses.map((lic, i) => {
                    const licText = typeof lic === "string"
                      ? lic
                      : [lic.number, lic.date, lic.authority].filter(Boolean).join(" · ");
                    return (
                      <div key={i} className="text-xs text-foreground font-montserrat font-medium">{licText}</div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          {documents.length > 0 && (
            <div className="flex items-start gap-2">
              <Icon name="FileText" size={13} className="text-gold mt-0.5 shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1.5">{tr("verifyDocuments")}</div>
                <div className="flex flex-wrap gap-2">
                  {documents.map((d, i) => (
                    isImageUrl(d.url) ? (
                      <button key={i} onClick={() => setLightbox({ src: d.url as string, title: d.title })} title={d.title || tr("docOpen")} className="group/doc relative w-16 h-16 rounded-sm overflow-hidden border border-border hover:border-gold transition-colors">
                        <img src={d.url} alt={d.title || ""} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                        <span className="absolute inset-0 bg-background/60 opacity-0 group-hover/doc:opacity-100 transition-opacity flex items-center justify-center">
                          <Icon name="ZoomIn" size={16} className="text-gold" />
                        </span>
                      </button>
                    ) : d.url ? (
                      <a key={i} href={d.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] text-foreground bg-secondary border border-border rounded-sm px-2 py-1 hover:border-gold hover:text-gold transition-colors self-start">
                        <Icon name="FileText" size={11} className="text-gold" />{d.title || tr("docOpen")}
                        <Icon name="ExternalLink" size={10} className="opacity-60" />
                      </a>
                    ) : (
                      <span key={i} className="inline-flex items-center gap-1 text-[11px] text-foreground bg-secondary border border-border rounded-sm px-2 py-1 self-start">
                        <Icon name="Paperclip" size={11} className="text-gold" />{d.title}
                      </span>
                    )
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {lightbox && <Lightbox src={lightbox.src} title={lightbox.title} onClose={() => setLightbox(null)} />}
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

const specialists = [
  {
    name: { ru: "Александр Морозов", en: "Alexander Morozov" },
    title: { ru: "Полиграфолог", en: "Polygraph examiner" },
    rating: 4.9,
    reviews: 134,
    cases: 312,
    experience: 12,
    city: { ru: "Москва", en: "Moscow" },
    lat: 55.7558,
    lon: 37.6173,
    price: { ru: "от 8 000 ₽", en: "from $90" },
    verified: true,
    tags: [
      { ru: "Полиграф", en: "Polygraph" },
      { ru: "HR-проверки", en: "HR screening" },
      { ru: "Корпоративная безопасность", en: "Corporate security" },
    ],
    img: DETECTIVE_IMAGE,
  },
  {
    name: { ru: "Елена Власова", en: "Elena Vlasova" },
    title: { ru: "Частный детектив", en: "Private investigator" },
    rating: 4.8,
    reviews: 87,
    cases: 198,
    experience: 9,
    city: { ru: "Лондон", en: "London" },
    lat: 51.5074,
    lon: -0.1278,
    price: { ru: "от 12 000 ₽", en: "from $140" },
    verified: true,
    tags: [
      { ru: "Розыск", en: "Tracing" },
      { ru: "Наружное наблюдение", en: "Surveillance" },
      { ru: "Сбор доказательств", en: "Evidence gathering" },
    ],
    img: HERO_IMAGE,
  },
  {
    name: { ru: "Игорь Семёнов", en: "Igor Semenov" },
    title: { ru: "Специалист по TSCM", en: "TSCM specialist" },
    rating: 5.0,
    reviews: 62,
    cases: 145,
    experience: 15,
    city: { ru: "Дубай", en: "Dubai" },
    lat: 25.2048,
    lon: 55.2708,
    price: { ru: "от 25 000 ₽", en: "from $280" },
    verified: true,
    tags: [
      { ru: "Поиск жучков", en: "Bug sweeping" },
      { ru: "Контрразведка", en: "Counterintelligence" },
      { ru: "Защита переговоров", en: "Meeting protection" },
    ],
    img: POLYGRAPH_IMAGE,
  },
];

const guards = [
  {
    name: { ru: "ЧОО «Легион Секьюрити»", en: "Legion Security Ltd." },
    type: { ru: "Физическая охрана · Москва", en: "Physical security · Moscow" },
    rating: 4.9,
    reviews: 210,
    employees: 480,
    objects: 320,
    founded: 2008,
    price: { ru: "от 180 ₽/час", en: "from $2/hour" },
    tags: [
      { ru: "Охрана объектов", en: "Site guarding" },
      { ru: "Пультовая охрана", en: "Alarm monitoring" },
      { ru: "Инкассация", en: "Cash-in-transit" },
    ],
    img: GUARDS_IMAGE,
  },
  {
    name: { ru: "Global Shield Group", en: "Global Shield Group" },
    type: { ru: "Личная охрана · Дубай", en: "Close protection · Dubai" },
    rating: 5.0,
    reviews: 96,
    employees: 260,
    objects: 140,
    founded: 2012,
    price: { ru: "от 9 000 ₽/смена", en: "from $100/shift" },
    tags: [
      { ru: "Телохранители", en: "Bodyguards" },
      { ru: "VIP-сопровождение", en: "VIP escort" },
      { ru: "Анализ угроз", en: "Threat analysis" },
    ],
    img: HERO_IMAGE,
  },
  {
    name: { ru: "Sentinel Protective Services", en: "Sentinel Protective Services" },
    type: { ru: "Корпоративная охрана · Лондон", en: "Corporate security · London" },
    rating: 4.8,
    reviews: 154,
    employees: 620,
    objects: 410,
    founded: 2005,
    price: { ru: "от 220 ₽/час", en: "from $2.5/hour" },
    tags: [
      { ru: "Бизнес-центры", en: "Business centres" },
      { ru: "Видеонаблюдение", en: "CCTV monitoring" },
      { ru: "Контроль доступа", en: "Access control" },
    ],
    img: GUARDS_IMAGE,
  },
];

const guardServices = [
  { icon: "Building2", title: { ru: "Охрана объектов", en: "Site security" }, desc: { ru: "Круглосуточная физическая охрана офисов, складов, ТЦ и промышленных объектов", en: "24/7 physical security for offices, warehouses, malls and industrial sites" } },
  { icon: "UserCog", title: { ru: "Личная охрана", en: "Close protection" }, desc: { ru: "Профессиональные телохранители и VIP-сопровождение для руководителей и публичных персон", en: "Professional bodyguards and VIP escort for executives and public figures" } },
  { icon: "Radio", title: { ru: "Пультовая охрана", en: "Alarm monitoring" }, desc: { ru: "Мониторинг сигнализации с выездом групп быстрого реагирования", en: "Alarm monitoring with rapid response team dispatch" } },
  { icon: "Video", title: { ru: "Видеонаблюдение", en: "Video surveillance" }, desc: { ru: "Проектирование, монтаж и обслуживание систем видеонаблюдения и контроля доступа", en: "Design, installation and maintenance of CCTV and access control systems" } },
];

const SECTION_CRUMB: Record<Section, keyof typeof t> = {
  home: "crumbHome",
  profile: "crumbProfile",
  specialists: "specialists",
  cases: "crumbCases",
  services: "crumbServices",
  courses: "crumbCourses",
  guards: "crumbGuards",
  chat: "crumbChat",
  forum: "crumbForum",
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

const cases = [
  {
    title: { ru: "Корпоративный шпионаж: обнаружение прослушки в переговорной", en: "Corporate espionage: bugs found in a boardroom" },
    category: { ru: "TSCM", en: "TSCM" },
    date: { ru: "март 2024", en: "March 2024" },
    views: 1240,
    likes: 87,
    summary: { ru: "В ходе плановой проверки переговорной комнаты крупного холдинга были обнаружены 3 замаскированных устройства...", en: "During a routine sweep of a large holding's boardroom, 3 concealed devices were discovered..." },
    author: { ru: "И. Семёнов", en: "I. Semenov" },
  },
  {
    title: { ru: "Верификация кандидата на должность финансового директора", en: "Vetting a candidate for a CFO position" },
    category: { ru: "Полиграф", en: "Polygraph" },
    date: { ru: "февраль 2024", en: "February 2024" },
    views: 890,
    likes: 64,
    summary: { ru: "Проведена комплексная психофизиологическая экспертиза кандидата с применением компьютерного полиграфа...", en: "A comprehensive psychophysiological examination of the candidate was conducted using a computer polygraph..." },
    author: { ru: "А. Морозов", en: "A. Morozov" },
  },
  {
    title: { ru: "Розыск пропавшего без вести лица: методика и результат", en: "Tracing a missing person: method and result" },
    category: { ru: "Детективная деятельность", en: "Investigation" },
    date: { ru: "январь 2024", en: "January 2024" },
    views: 2100,
    likes: 142,
    summary: { ru: "Успешное завершение розыскного дела за 11 суток. Применение OSINT-методов и агентурных источников...", en: "A search case successfully closed in 11 days using OSINT methods and human sources..." },
    author: { ru: "Е. Власова", en: "E. Vlasova" },
  },
];




// Публичные разделы, которые можно открыть напрямую по ссылке ?section=xxx.
// Это делает ссылки на блог/о нас/тарифы «рабочими» для SEO и шаринга.
const PUBLIC_URL_SECTIONS: Section[] = [
  "blog", "about", "pricing", "mobileapp", "policy", "privacy", "terms",
  "agreement", "offer", "consent", "contacts",
  // Каталог, услуги и «как это работает» — самые ценные страницы для поиска
  // и для ссылок из соцсетей. Без них человек по ссылке попадал на главную
  // и должен был искать раздел заново.
  "specialists", "services", "howitworks", "courses", "guards", "cases",
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
    <div className="fixed inset-x-0 bottom-0 z-[90] p-3 sm:p-4 pointer-events-none">
      <div role="region" aria-label={tr("cookieTitle")} className="max-w-md ms-auto me-0 bg-card/95 backdrop-blur-md border border-border rounded-sm shadow-2xl p-3.5 sm:p-4 flex flex-col gap-2.5 pointer-events-auto">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <Icon name="Cookie" size={20} className="text-gold shrink-0 mt-0.5" />
          <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed line-clamp-3 sm:line-clamp-none">
            {tr("cookieText")}{" "}
            <button onClick={() => go("privacy")} className="text-gold hover:underline font-semibold whitespace-nowrap">{tr("cookieMore")}</button>
          </p>
        </div>
        <div className="flex items-center gap-2 justify-end">
          <button onClick={() => decide("essential")} className="text-muted-foreground hover:text-foreground text-xs font-montserrat font-semibold px-3 py-2 rounded-sm transition-colors">{tr("cookieDecline")}</button>
          <button onClick={() => decide("accepted")} className="gold-gradient text-[hsl(28,20%,7%)] text-xs font-montserrat font-bold px-5 py-2 rounded-sm hover:opacity-90 transition-opacity">{tr("cookieAccept")}</button>
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
  const LOCKED_SECTIONS: Section[] = ["chat", "forum", "courses", "services", "cases", "guards"];

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
      if (active === "profile" && selectedProvider) return <SpecialistProfileSection provider={selectedProvider} onBack={goBack} openChat={openChat} />;
      return <MinimalHome onCabinet={() => setAuthOpen(true)} onPolicy={() => go("policy")} />;
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
      case "courses": return <CoursesSection />;
      case "guards": return <GuardsSection />;
      case "chat": return chatTarget
        ? <DirectChatSection target={chatTarget} chatInput={chatInput} setChatInput={setChatInput} onBack={goBack} />
        : (role === "client" ? <HomeSection setActive={go} role={role} openChat={openChat} /> : <ChatSection chatInput={chatInput} setChatInput={setChatInput} />);
      case "forum": return role === "client" ? <HomeSection setActive={go} role={role} openChat={openChat} /> : <ForumSection />;
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
          <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-center gap-2 sm:gap-3">
            <Icon name="ShieldCheck" size={14} className="text-gold shrink-0" />
            <span className="text-[11px] sm:text-xs font-montserrat font-semibold text-foreground truncate">{tr("secBanner")}</span>
            <span className="hidden md:inline text-[11px] text-muted-foreground truncate">· {tr("secBannerSub")}</span>
            <button
              onClick={() => go("policy")}
              className="hidden sm:inline-flex items-center gap-1 text-[11px] font-montserrat font-bold text-gold hover:underline shrink-0"
            >
              {tr("secReadPolicy")}
              <Icon name="ArrowRight" size={11} />
            </button>
            <button
              onClick={() => setSecBannerOpen(false)}
              className="absolute end-3 text-muted-foreground hover:text-foreground transition-colors"
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

          <nav className="hidden lg:flex items-center gap-5 mx-4 flex-1 justify-center min-w-0">
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
                <NotificationBell />
                {user?.isAdmin && (
                  <button onClick={() => go("admin")} className={`hidden sm:flex items-center gap-1.5 px-2.5 py-2 text-sm font-montserrat font-bold rounded-sm transition-all border shrink-0 whitespace-nowrap relative ${active === "admin" ? "border-gold text-gold bg-gold/10" : "border-border text-muted-foreground hover:border-gold hover:text-gold"}`} aria-label={tr("adminPanelTitle")}>
                    <Icon name="ShieldCheck" size={15} />
                    <span className="hidden xl:inline">{tr("adminPanelTitle")}</span>
                    {newComplaintsBadge > 0 && (
                      <span className="absolute -top-1.5 -end-1.5 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-white text-[10px] font-bold flex items-center justify-center">{newComplaintsBadge}</span>
                    )}
                  </button>
                )}
                <button onClick={() => go("dashboard")} className="hidden sm:flex items-center gap-1.5 gold-gradient text-[hsl(28,20%,7%)] px-3 py-2 text-sm font-montserrat font-bold rounded-sm hover:opacity-90 transition-opacity shrink-0 whitespace-nowrap">
                  <Icon name="LayoutDashboard" size={15} />
                  {tr("authCabinet")}
                </button>
                <button onClick={handleLogout} className="hidden sm:flex items-center justify-center border border-border text-muted-foreground w-9 h-9 rounded-sm hover:border-destructive hover:text-destructive transition-all shrink-0" aria-label={tr("dashLogout")}>
                  <Icon name="LogOut" size={15} />
                </button>
              </>
            ) : (
              <button onClick={openCabinet} className="hidden sm:flex items-center gap-1.5 gold-gradient text-[hsl(28,20%,7%)] px-3 py-2 text-sm font-montserrat font-bold rounded-sm hover:opacity-90 transition-opacity shrink-0 whitespace-nowrap">
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
                  <button onClick={() => go("dashboard")} className="w-full gold-gradient text-[hsl(28,20%,7%)] py-3 text-sm font-montserrat font-bold rounded-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                    <Icon name="LayoutDashboard" size={16} />
                    {tr("authCabinet")}
                  </button>
                  <button aria-label="Выйти" onClick={handleLogout} className="w-full border border-border text-muted-foreground py-3 text-sm font-montserrat font-semibold rounded-sm hover:border-destructive hover:text-destructive transition-all flex items-center justify-center gap-2">
                    <Icon name="LogOut" size={16} />
                    {tr("dashLogout")}
                  </button>
                </>
              ) : (
                <button onClick={openCabinet} className="w-full gold-gradient text-[hsl(28,20%,7%)] py-3 text-sm font-montserrat font-bold rounded-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
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
                ["navForum", "forum"],
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
        <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setRegGateOpen(false)}>
          <div className="bg-card border border-gold/40 rounded-sm max-w-md w-full p-8 text-center security-glow" onClick={(e) => e.stopPropagation()}>
            <div className="w-14 h-14 gold-gradient rounded-sm flex items-center justify-center mx-auto mb-5 glow-gold-sm">
              <Icon name="UserCheck" size={26} className="text-[hsl(28,20%,7%)]" />
            </div>
            <h3 className="font-montserrat font-bold text-lg text-foreground mb-2">{tr("regRequiredTitle")}</h3>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{tr("regRequiredText")}</p>
            <div className="flex flex-col gap-2">
              <button onClick={() => { setRegGateOpen(false); go("dashboard"); }} className="gold-gradient text-[hsl(28,20%,7%)] px-6 py-3 text-sm font-montserrat font-bold rounded-sm hover:opacity-90 transition-opacity">
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
        <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setPaywallOpen(false)}>
          <div className="bg-card border border-gold/40 rounded-sm max-w-md w-full p-8 text-center security-glow" onClick={(e) => e.stopPropagation()}>
            <div className="w-14 h-14 gold-gradient rounded-sm flex items-center justify-center mx-auto mb-5 glow-gold-sm">
              <Icon name="Lock" size={26} className="text-[hsl(28,20%,7%)]" />
            </div>
            <h2 className="font-montserrat font-extrabold text-xl text-foreground mb-2">{tr("paywallTitle")}</h2>
            <p className="text-sm text-muted-foreground mb-6">{tr("paywallText")}</p>
            <button onClick={() => { setPaywallOpen(false); setActive("dashboard"); window.scrollTo({ top: 0 }); }} className="w-full gold-gradient text-[hsl(28,20%,7%)] py-3 font-montserrat font-bold text-sm rounded-sm hover:opacity-90 transition-opacity mb-2">
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
          <img src={isClient ? HERO_IMAGE : GUARDS_IMAGE} alt="Security" decoding="async" className="w-full h-full object-cover opacity-25" />
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
                className="shine-on-hover gold-gradient text-[hsl(28,20%,7%)] px-6 sm:px-9 py-3.5 sm:py-4 font-montserrat font-extrabold text-sm sm:text-base tracking-wide hover:opacity-90 transition-opacity rounded-sm glow-gold-sm flex items-center gap-2.5"
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
                className="absolute top-3 end-3 text-muted-foreground hover:text-foreground transition-colors"
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
                className="shrink-0 gold-gradient text-[hsl(28,20%,7%)] px-6 py-3 font-montserrat font-bold text-sm rounded-sm hover:opacity-90 transition-opacity inline-flex items-center gap-2 whitespace-nowrap"
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
              <button onClick={() => setActive("dashboard")} className="shine-on-hover gold-gradient text-[hsl(28,20%,7%)] px-8 py-3.5 font-montserrat font-bold text-sm rounded-sm hover:opacity-90 transition-opacity glow-gold-sm inline-flex items-center gap-2">
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
                <button onClick={() => setActive("forum")} className="shine-on-hover gold-gradient text-[hsl(28,20%,7%)] px-10 py-4 font-montserrat font-bold text-sm tracking-wide hover:opacity-90 transition-opacity rounded-sm glow-gold-sm">
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
function SpecialistProfileSection({ provider: p, onBack, openChat }: { provider: Provider; onBack: () => void; openChat: (t: { name: string; title: string; avatar?: string | null }) => void }) {
  const { lang, tr } = useLang();
  const tags = lang === "ru" ? p.tags.ru : p.tags.en;
  const licensed = isLicensed(p);
  const v = p.verification;
  const bio = v?.bio ? v.bio : "";
  const [reportOpen, setReportOpen] = useState(false);
  const licenseNo = v?.license || (Array.isArray(v?.licenses) && v?.licenses.length
    ? (typeof v.licenses[0] === "string" ? v.licenses[0] : v.licenses[0]?.number)
    : "");
  const hasDocs = !!v && ((Array.isArray(v.licenses) && v.licenses.length > 0) || (Array.isArray(v.documents) && v.documents.length > 0));

  // Строка статуса проверки. Формулировка меняется вместе со значком:
  // раньше рядом с «крестиком» стояло «Личность подтверждена» — фраза
  // утверждала обратное тому, что показывал значок, и читатель терялся.
  const checkRow = (ok: boolean, labelOk: string, labelNo: string) => (
    <div className="flex items-center gap-2 text-sm">
      <Icon
        name={ok ? "CircleCheck" : "Circle"}
        size={16}
        className={ok ? "text-green-400 shrink-0" : "text-muted-foreground/40 shrink-0"}
      />
      <span className={ok ? "text-foreground" : "text-muted-foreground"}>{ok ? labelOk : labelNo}</span>
    </div>
  );

  // Пара «подпись — значение» для блока информации.
  const infoRow = (icon: string, label: string, value: string) => (
    <div className="flex items-center gap-3 py-2.5 border-b border-border last:border-0">
      <Icon name={icon} size={16} className="text-gold shrink-0" />
      <span className="text-xs text-muted-foreground w-28 shrink-0">{label}</span>
      <span className="text-sm text-foreground font-medium">{value}</span>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <div className="tag-security inline-block">{tr("profileSection")}</div>
        <div className="flex items-center gap-3">
          <button onClick={() => setReportOpen(true)} className="text-xs text-muted-foreground hover:text-destructive transition-colors font-montserrat flex items-center gap-1">
            <Icon name="Flag" size={13} />{tr("reportBtn")}
          </button>
          <button aria-label="Назад" onClick={onBack} className="text-xs text-muted-foreground hover:text-gold transition-colors font-montserrat flex items-center gap-1">
            <Icon name="ArrowLeft" size={13} />{tr("back")}
          </button>
        </div>
      </div>

      {reportOpen && <ReportModal targetType="provider" targetId={p.slug} onClose={() => setReportOpen(false)} />}

      {/* Шапка: одно фото среднего размера + основные данные */}
      <div className="border border-border rounded-sm bg-card p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="w-full sm:w-56 shrink-0">
            <div className="relative rounded-sm overflow-hidden border border-border aspect-[4/5] bg-secondary">
              <img src={resolveAvatar(p.img, p.gender)} alt={L(p.name, lang)} loading="lazy" className="w-full h-full object-cover" />
              {p.isPseudonym && (
                <div className="absolute top-2 start-2 flex items-center gap-1 bg-card/90 backdrop-blur-sm border border-border px-2 py-1 rounded-sm">
                  <Icon name="VenetianMask" size={11} className="text-muted-foreground" />
                  <span className="text-[10px] font-montserrat font-semibold text-muted-foreground">{tr("aliasBadge")}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h1 className="font-montserrat font-bold text-2xl text-foreground">{L(p.name, lang)}</h1>
              {p.verified && (
                <span className="flex items-center gap-1 bg-green-500/10 border border-green-500/40 px-2 py-0.5 rounded-sm">
                  <Icon name="BadgeCheck" size={13} className="text-green-400" />
                  <span className="text-[10px] font-montserrat font-semibold text-green-400">{tr("verifyDocsConfirmed")}</span>
                </span>
              )}
              {licensed && (
                <span className="badge-scan flex items-center gap-1 bg-gold/10 border border-gold/40 px-2 py-0.5 rounded-sm">
                  <Icon name="BadgeCheck" size={13} className="text-gold relative z-10" />
                  <span className="text-[10px] font-montserrat font-semibold text-gold relative z-10">{tr("licenseBadge")}</span>
                </span>
              )}
            </div>
            {/* Опыт не дублируем: он уже показан строкой ниже, рядом с городом
                и возрастом. Раньше «12 лет» стояло дважды на одном экране. */}
            <div className="text-gold text-sm font-montserrat font-medium mb-3">
              {L(p.title, lang) || tr("titleNotSet")}
            </div>
            {/* Рейтинг — только когда он на чём-то основан. У демо-анкеты
                честно говорим, что оценки условные. */}
            <div className="flex items-center gap-2 mb-4">
              {p.isDemo ? (
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Icon name="Info" size={13} className="text-gold/70" />
                  {tr("demoRatingNote")}
                </span>
              ) : p.reviews > 0 ? (
                <>
                  <StarRating rating={p.rating} />
                  <span className="text-xs text-muted-foreground">{p.rating} ({p.reviews} {tr("profileReviewsCount")})</span>
                </>
              ) : (
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Icon name="Sparkles" size={13} className="text-gold/60" />
                  {tr("noReviewsYet")}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-4">
              <span className="flex items-center gap-1"><Icon name="MapPin" size={13} className="text-gold" />{p.country ? `${L(p.country, lang)}, ` : ""}{L(p.city, lang)}</span>
              {p.age != null && <span className="flex items-center gap-1"><Icon name="User" size={13} className="text-gold" />{p.age} {tr("yearsOld")}</span>}
              <span className="flex items-center gap-1"><Icon name="Award" size={13} className="text-gold" />{p.experience} {tr("yearsShort")}</span>
            </div>
            <div className="border border-gold/30 rounded-sm bg-background px-4 py-3 inline-flex items-center gap-3">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{tr("cost")}</span>
              <span className="font-montserrat font-bold text-lg text-gold">{L(p.price, lang)}</span>
            </div>
          </div>
        </div>
        {p.isPseudonym && (
          <div className="mt-4 flex items-center gap-2 text-[11px] text-muted-foreground bg-secondary/50 border border-border rounded-sm px-3 py-2">
            <Icon name="Info" size={13} className="shrink-0" />{tr("profileAliasNote")}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* О специалисте */}
          {bio && (
            <div className="border border-border rounded-sm bg-card p-6">
              <h3 className="font-montserrat font-bold text-sm text-foreground mb-3 flex items-center gap-2"><Icon name="UserRound" size={15} className="text-gold" />{tr("profileAbout")}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{bio}</p>
            </div>
          )}

          {/* Информация */}
          <div className="border border-border rounded-sm bg-card p-6">
            <h3 className="font-montserrat font-bold text-sm text-foreground mb-3 flex items-center gap-2"><Icon name="IdCard" size={15} className="text-gold" />{tr("profileInfo")}</h3>
            <div>
              {p.country && infoRow("Globe", tr("profileCountry"), L(p.country, lang))}
              {infoRow("MapPin", tr("profileCity"), L(p.city, lang))}
              {p.age != null && infoRow("User", tr("profileAge"), `${p.age} ${tr("yearsOld")}`)}
              {infoRow("Award", tr("profileExperienceLabel"), `${p.experience} ${tr("yearsShort")}`)}
              {v?.legalStatus && infoRow("Building2", tr("profileLegalStatus"), v.legalStatus)}
              {licenseNo && infoRow("FileBadge", tr("profileLicenseNumber"), String(licenseNo))}
            </div>
          </div>

          {/* Специализация */}
          <div className="border border-border rounded-sm bg-card p-6">
            <h3 className="font-montserrat font-bold text-sm text-foreground mb-4 flex items-center gap-2"><Icon name="Tag" size={15} className="text-gold" />{tr("profileSpecialization")}</h3>
            <div className="flex flex-wrap gap-2">
              {tags.map((tg) => (<span key={tg} className="chip">{tg}</span>))}
            </div>
          </div>

          {/* Счётчики. Показываем только заполненные значения: блок из трёх
              нулей у новой анкеты выглядел как «специалист ничего не сделал».
              У демо-анкеты цифры условные, поэтому блок целиком скрыт. */}
          {!p.isDemo && (p.experience > 0 || p.cases > 0 || p.reviews > 0) && (
            <div className="grid grid-cols-3 gap-4">
              {[
                { n: p.experience, l: "yearsShort" as const, icon: "Award" },
                { n: p.cases, l: "profileCasesCount" as const, icon: "FolderCheck" },
                { n: p.reviews, l: "profileReviewsCount" as const, icon: "Star" },
              ]
                .filter((s) => s.n > 0)
                .map((s) => (
                  <div key={s.l} className="border border-border rounded-sm bg-card p-4 text-center">
                    <Icon name={s.icon} size={18} className="text-gold mx-auto mb-2" />
                    <div className="font-montserrat font-extrabold text-xl text-foreground">{s.n}</div>
                    <div className="text-[11px] text-muted-foreground">{tr(s.l)}</div>
                  </div>
                ))}
            </div>
          )}

          <div className="border border-border rounded-sm bg-card p-6">
            <h3 className="font-montserrat font-bold text-sm text-foreground mb-4 flex items-center gap-2"><Icon name="MessageSquareText" size={15} className="text-gold" />{tr("profileReviewsTitle")}</h3>
            <ReviewsList targetType="provider" targetId={p.slug} />
          </div>
        </div>

        <div className="space-y-5">
          {/* Проверка и верификация */}
          <div className="border border-border rounded-sm bg-card p-5">
            <h3 className="font-montserrat font-bold text-sm text-foreground mb-4 flex items-center gap-2"><Icon name="ShieldCheck" size={15} className="text-gold" />{tr("profileVerification")}</h3>
            <div className="space-y-2.5">
              {checkRow(!!p.verified, tr("profileVerifiedIdentity"), tr("profileIdentityPending"))}
              {checkRow(licensed, tr("profileLicenseChecked"), tr("profileLicensePending"))}
              {checkRow(hasDocs, tr("profileDocsConfirmed"), tr("profileDocsPending"))}
            </div>
          </div>

          {/* Контакты */}
          <div className="border border-gold/30 rounded-sm bg-card p-5 security-glow">
            <AvailabilityNote p={p} />
            <div className="mt-3">
              <ContactButtons p={p} onChat={() => openChat({ name: L(p.name, lang), title: L(p.title, lang), avatar: p.img })} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileSection({ setActive, openChat }: { setActive: (s: Section) => void; openChat: (t: { name: string; title: string; avatar?: string | null }) => void }) {
  const { lang, tr } = useLang();
  const [activeTab, setActiveTab] = useState<"cases" | "services" | "reviews">("cases");
  const { providers } = useProviders();
  const provider = providers.find((p) => p.active);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <div className="tag-security inline-block">{tr("profileSection")}</div>
        <button onClick={() => setActive("home")} className="text-xs text-muted-foreground hover:text-gold transition-colors font-montserrat flex items-center gap-1">
          <Icon name="ArrowLeft" size={13} />
          {tr("back")}
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-5">
          <div className="border border-border rounded-sm bg-card overflow-hidden">
            <div className="h-36 overflow-hidden relative">
              <img src={DETECTIVE_IMAGE} alt="Профиль" loading="lazy" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
            </div>
            <div className="p-5 -mt-8 relative">
              <div className="w-16 h-16 rounded-sm border-2 border-gold overflow-hidden mb-3">
                <img src={DETECTIVE_IMAGE} alt="Аватар" loading="lazy" className="w-full h-full object-cover" />
              </div>
              <div className="flex items-center gap-2 mb-1">
                <div className="font-montserrat font-bold text-lg text-foreground">{L(specialists[0].name, lang)}</div>
                {provider && isLicensed(provider) && (
                  <span className="flex items-center gap-1 bg-gold/10 border border-gold/40 px-2 py-0.5 rounded-sm" title={tr("licenseBadge")}>
                    <Icon name="BadgeCheck" size={13} className="text-gold" />
                    <span className="text-[10px] font-montserrat font-semibold text-gold">{tr("licenseBadge")}</span>
                  </span>
                )}
              </div>
              <div className="text-gold text-xs font-montserrat font-medium mb-1">{L(specialists[0].title, lang)} · 12 {tr("yearsShort")}</div>
              <div className="text-xs text-muted-foreground mb-4">{L(specialists[0].city, lang)}</div>
              <div className="flex items-center gap-2 mb-4">
                <StarRating rating={4.9} />
                <span className="text-xs text-muted-foreground">4.9 (134 отзыва)</span>
              </div>
              <div className="divider-gold mb-4" />
              <div className="grid grid-cols-3 text-center gap-2 mb-4">
                <div><div className="stat-number stat-appear text-xl" data-reveal-delay={0}>312</div><div className="text-[10px] text-muted-foreground">{tr("casesCount")}</div></div>
                <div><div className="stat-number stat-appear text-xl" data-reveal-delay={90}>134</div><div className="text-[10px] text-muted-foreground">{tr("reviewsCount")}</div></div>
                <div><div className="stat-number stat-appear text-xl" data-reveal-delay={180}>98%</div><div className="text-[10px] text-muted-foreground">{tr("success")}</div></div>
              </div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-montserrat font-semibold mb-2">{tr("contactTitle")}</div>
              {provider && <AvailabilityNote p={provider} />}
              {provider && <ContactButtons p={provider} onChat={() => openChat({ name: L(provider.name, lang), title: L(provider.title, lang), avatar: provider.img })} />}
              <button className="w-full mt-2 border border-border text-muted-foreground py-2.5 text-xs font-montserrat font-semibold rounded-sm hover:border-gold hover:text-gold transition-all">{tr("orderService")}</button>
            </div>
          </div>

          <div className="border border-border rounded-sm bg-card p-5">
            <div className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest mb-4">{tr("specialization")}</div>
            {[
              { ru: "Компьютерная полиграфология", en: "Computer polygraphy" },
              { ru: "HR-проверки персонала", en: "HR staff screening" },
              { ru: "Корпоративная безопасность", en: "Corporate security" },
              { ru: "Психофизиологическая экспертиза", en: "Psychophysiological examination" },
              { ru: "Работа с ложными воспоминаниями", en: "Handling false memories" },
            ].map((skill) => (
              <div key={skill.en} className="flex items-center gap-2 py-2 border-b border-border last:border-0">
                <div className="w-1.5 h-1.5 rounded-full bg-gold" />
                <span className="text-xs text-muted-foreground">{L(skill, lang)}</span>
              </div>
            ))}
          </div>

          <div className="border border-border rounded-sm bg-card p-5">
            <div className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest mb-4">{tr("certificates")}</div>
            {[
              { title: { ru: "AAPP Certified Polygraphist", en: "AAPP Certified Polygraphist" }, year: "2021" },
              { title: { ru: "Частный детектив РФ", en: "Licensed PI" }, year: "2018" },
            ].map((c) => (
              <div key={c.title.en} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-2">
                  <Icon name="Award" size={12} className="text-gold" />
                  <span className="text-xs text-muted-foreground">{L(c.title, lang)}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">{c.year}</span>
              </div>
            ))}
          </div>

          {provider?.verification && <VerificationBlock v={provider.verification} />}
        </div>

        <div className="lg:col-span-2 space-y-5">
          <div className="border border-border rounded-sm bg-card p-6">
            <div className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest mb-3">{tr("aboutSpecialist")}</div>
            <p className="text-sm text-muted-foreground leading-relaxed">{tr("aboutText")}</p>
          </div>

          <div className="border border-border rounded-sm bg-card">
            <div className="flex border-b border-border">
              {(["cases", "services", "reviews"] as const).map((t) => {
                const labels = { cases: tr("tabCases") + " (28)", services: tr("tabServices") + " (5)", reviews: tr("tabReviews") + " (134)" };
                return (
                  <button key={t} onClick={() => setActiveTab(t)}
                    className={`flex-1 py-3.5 text-xs font-montserrat font-semibold tracking-wide uppercase transition-colors ${activeTab === t ? "text-gold border-b-2 border-gold -mb-px" : "text-muted-foreground"}`}>
                    {labels[t]}
                  </button>
                );
              })}
            </div>
            <div className="p-5">
              {activeTab === "cases" && (
                <div className="space-y-3">
                  {cases.slice(0, 2).map((c) => (
                    <div key={c.title.en} className="p-4 border border-border rounded-sm card-lift cursor-pointer">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="font-montserrat font-semibold text-sm text-foreground">{L(c.title, lang)}</div>
                        <span className="tag-security whitespace-nowrap shrink-0">{L(c.category, lang)}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">{L(c.summary, lang)}</div>
                      <div className="flex items-center gap-4 mt-3">
                        <span className="text-[10px] text-muted-foreground">{L(c.date, lang)}</span>
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><Icon name="Eye" size={10} />{c.views}</span>
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><Icon name="Heart" size={10} />{c.likes}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {activeTab === "services" && (
                <div className="space-y-3">
                  {(() => {
                    const sel = provider?.verification?.services;
                    if (Array.isArray(sel) && sel.length) {
                      return sel
                        .map((it) => ({ s: services.find((x) => x.title.en === it.key), price: it.price || "" }))
                        .filter((x): x is { s: typeof services[number]; price: string } => !!x.s);
                    }
                    return services.slice(0, 3).map((s) => ({ s, price: "" }));
                  })().map(({ s, price }) => (
                    <div key={s.title.en} className="flex items-center gap-4 p-4 border border-border rounded-sm card-lift cursor-pointer">
                      <div className="w-9 h-9 gold-gradient rounded flex items-center justify-center shrink-0">
                        <Icon name={s.icon} size={15} className="text-[hsl(28,20%,7%)]" />
                      </div>
                      <div className="flex-1">
                        <div className="font-montserrat font-semibold text-sm text-foreground">{L(s.title, lang)}</div>
                        <div className="text-xs text-muted-foreground">{L(s.desc, lang).slice(0, 60)}...</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-montserrat font-bold text-gold">{price ? `${tr("priceFrom")} ${price}` : L(s.price, lang)}</div>
                        <div className="text-[10px] text-muted-foreground">{L(s.time, lang)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {activeTab === "reviews" && (
                <div className="space-y-4">
                  {[
                    { name: { ru: "ООО «АльфаТех»", en: "AlphaTech LLC" }, rating: 5, text: { ru: "Провёл полный HR-скрининг нашей команды (18 человек). Профессионально, дискретно, в срок. Нашли двух проблемных кандидатов.", en: "Ran a full HR screening of our team (18 people). Professional, discreet, on time. Found two problem candidates." }, date: { ru: "2 недели назад", en: "2 weeks ago" } },
                    { name: { ru: "Иван К.", en: "Ivan K." }, rating: 5, text: { ru: "Проверка предполагаемой утечки данных. Чёткая работа, понятный отчёт. Рекомендую коллегам.", en: "Investigation of a suspected data leak. Clear work, a readable report. Recommend to colleagues." }, date: { ru: "1 месяц назад", en: "1 month ago" } },
                    { name: { ru: "ЧОП «Легион»", en: "Legion PSC" }, rating: 4, text: { ru: "Регулярно пользуемся услугами при отборе персонала. Надёжный специалист.", en: "We regularly use the services for staff recruitment. A reliable specialist." }, date: { ru: "2 месяца назад", en: "2 months ago" } },
                  ].map((r) => (
                    <div key={r.name.en} className="p-4 border border-border rounded-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-montserrat font-semibold text-sm text-foreground">{L(r.name, lang)}</div>
                        <div className="flex items-center gap-2">
                          <StarRating rating={r.rating} />
                          <span className="text-[10px] text-muted-foreground">{L(r.date, lang)}</span>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">{L(r.text, lang)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CasesSection() {
  const { lang, tr } = useLang();
  const [filter, setFilter] = useState("All");
  const cats = [
    { ru: "Все", en: "All" },
    { ru: "Полиграф", en: "Polygraph" },
    { ru: "TSCM", en: "TSCM" },
    { ru: "Детективная деятельность", en: "Investigation" },
    { ru: "Корпоративная безопасность", en: "Corporate security" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="tag-security mb-3 inline-block">{tr("knowledgeBase")}</div>
          <h2 className="font-montserrat font-bold text-3xl text-foreground">{tr("proCases")}</h2>
        </div>
        <button className="gold-gradient text-[hsl(28,20%,7%)] px-5 py-2.5 text-xs font-montserrat font-bold rounded-sm self-start md:self-auto">
          {tr("publishCase")}
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        {cats.map((c) => (
          <button key={c.en} onClick={() => setFilter(c.en)}
            className={`px-4 py-1.5 text-xs font-montserrat font-semibold rounded-sm border transition-all ${filter === c.en ? "border-gold bg-gold/10 text-gold" : "border-border text-muted-foreground hover:border-gold/40"}`}>
            {L(c, lang)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4 stagger">
          {cases.map((c) => (
            <div key={c.title.en} className="border border-border rounded-sm bg-card p-6 card-lift shine-on-hover cursor-pointer">
              <div className="flex items-start gap-3 mb-3">
                <span className="chip">{L(c.category, lang)}</span>
                <span className="text-[10px] text-muted-foreground ml-auto">{L(c.date, lang)}</span>
              </div>
              <h3 className="font-montserrat font-bold text-base text-foreground mb-2 leading-snug">{L(c.title, lang)}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">{L(c.summary, lang)}</p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 gold-gradient rounded-sm flex items-center justify-center">
                    <Icon name="User" size={10} className="text-[hsl(28,20%,7%)]" />
                  </div>
                  <span className="text-xs text-muted-foreground">{L(c.author, lang)}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto"><Icon name="Eye" size={12} /><span>{c.views}</span></div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground"><Icon name="Heart" size={12} /><span>{c.likes}</span></div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground"><Icon name="MessageSquare" size={12} /><span>12</span></div>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-5">
          <div className="border border-border rounded-sm bg-card p-5">
            <div className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest mb-4">{tr("topAuthors")}</div>
            {specialists.map((s, i) => (
              <div key={s.name.en} className="flex items-center gap-3 py-2.5 border-b border-border last:border-0">
                <div className="font-montserrat font-bold text-xs text-gold w-4">{i + 1}</div>
                <div className="w-7 h-7 rounded-sm overflow-hidden">
                  <img src={s.img} alt={L(s.name, lang)} loading="lazy" className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="text-xs font-montserrat font-semibold text-foreground">{L(s.name, lang)}</div>
                  <div className="text-[10px] text-muted-foreground">{s.cases} {tr("navCases")}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="border border-border rounded-sm bg-card p-5">
            <div className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest mb-4">{tr("popularTags")}</div>
            <div className="flex flex-wrap gap-2">
              {(["popTag1", "popTag2", "popTag3", "popTag4", "popTag5", "popTag6", "popTag7", "popTag8"] as const).map((k) => (
                <span key={k} className="tag-security cursor-pointer hover:bg-gold/10 transition-colors">{tr(k)}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProviderResultCard({ p, onOpen }: { p: Provider; onOpen: () => void }) {
  const { lang, tr } = useLang();
  const { isFavorite, toggleFavorite } = useFavorites();
  const fav = isFavorite(p.slug);
  const tags = lang === "ru" ? p.tags.ru : p.tags.en;
  const premium = isPremium(p);
  const tiltRef = useTilt3D<HTMLDivElement>();
  return (
    <div
      ref={tiltRef}
      onClick={onOpen}
      className={`card-lift shine-on-hover rounded-sm overflow-hidden cursor-pointer group flex flex-col relative ${premium ? "border-2 border-gold security-glow ambient-gold bg-card" : "border border-border bg-card"}`}
    >
      {premium && (
        <div className="absolute top-0 inset-x-0 z-20 gold-gradient text-[hsl(28,20%,7%)] text-[10px] font-montserrat font-extrabold tracking-widest uppercase text-center py-1 flex items-center justify-center gap-1">
          <Icon name="Crown" size={11} />{tr("premiumBadge")}
        </div>
      )}
      <button
        onClick={(e) => { e.stopPropagation(); toggleFavorite(p.slug); }}
        aria-label={tr(fav ? "favRemove" : "favAdd")}
        className={`absolute z-20 end-3 ${premium ? "top-9" : "top-3"} w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm border transition-colors ${fav ? "bg-gold/90 border-gold text-[hsl(28,20%,7%)]" : "bg-card/80 border-border text-muted-foreground hover:text-gold hover:border-gold"}`}
      >
        <Icon name="Heart" size={15} className={fav ? "fill-current" : ""} />
      </button>
      <div className={`h-48 overflow-hidden relative ${premium ? "mt-6" : ""}`}>
        <img src={resolveAvatar(p.img, p.gender)} alt={L(p.name, lang)} loading="lazy" decoding="async" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
        {p.isPseudonym && (
          <div className="absolute top-3 start-3 flex items-center gap-1 bg-card/90 backdrop-blur-sm border border-border px-2 py-1 rounded-sm">
            <Icon name="VenetianMask" size={11} className="text-muted-foreground" />
            <span className="text-[10px] font-montserrat font-semibold text-muted-foreground">{tr("aliasBadge")}</span>
          </div>
        )}
        {/* Пометка образца намеренно заметная: рядом показан рейтинг «4.9 (134)»,
            которого в базе отзывов не существует. Тихая серая плашка терялась
            среди золотых звёзд, и карточка читалась как реальный специалист. */}
        {p.isDemo && (
          <div className="absolute top-3 start-3 z-20 flex items-center gap-1.5 bg-background/95 backdrop-blur-sm border border-gold/50 px-2.5 py-1 rounded-full">
            <Icon name="Info" size={11} className="text-gold" />
            <span className="text-[10px] font-montserrat font-bold text-gold uppercase tracking-wider">{tr("demoBadge")}</span>
          </div>
        )}
        {isLicensed(p) && (
          <div className="badge-scan absolute top-3 end-3 flex items-center gap-1 bg-card/90 backdrop-blur-sm border border-gold/40 px-2 py-1 rounded-sm">
            <Icon name="BadgeCheck" size={12} className="text-gold relative z-10" />
            <span className="text-[10px] font-montserrat font-semibold text-gold relative z-10">{tr("licenseBadge")}</span>
          </div>
        )}
        <div className="absolute bottom-3 start-4 end-4">
          <div className="font-montserrat font-bold text-base text-foreground">{L(p.name, lang)}</div>
          {/* «· 0 лет» у новой анкеты выглядело как отсутствие опыта вообще.
              Пока специалист не заполнил профиль — просто не показываем. */}
          <div className="text-xs text-gold font-montserrat font-medium flex items-center gap-2 flex-wrap">
            {L(p.title, lang) || tr("titleNotSet")}
            {p.experience > 0 && (
              <span className="text-muted-foreground">· {p.experience} {tr("yearsShort")}</span>
            )}
          </div>
        </div>
      </div>
      <div className="p-5 flex flex-col flex-1">
        {/* Рейтинг показываем ТОЛЬКО при наличии реальных отзывов.
            Раньше пустая анкета выглядела как «5 звёзд (0)» — пять золотых
            звёзд у специалиста, которого никто не оценивал, вводят в
            заблуждение и обесценивают оценки тех, у кого отзывы настоящие. */}
        <div className="flex items-center gap-3 mb-4 min-h-[20px]">
          {p.isDemo ? (
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Icon name="Info" size={12} className="text-gold/70" />
              {tr("demoRatingNote")}
            </span>
          ) : p.reviews > 0 ? (
            <>
              <StarRating rating={p.rating} />
              <span className="text-xs text-muted-foreground">{p.rating} ({p.reviews})</span>
            </>
          ) : (
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Icon name="Sparkles" size={12} className="text-gold/60" />
              {tr("noReviewsYet")}
            </span>
          )}
          {(p.city?.ru || p.city?.en) && (
            <span className="text-xs text-muted-foreground ms-auto flex items-center gap-1">
              <Icon name="MapPin" size={11} />{L(p.city, lang)}
            </span>
          )}
        </div>
        {p.country && (p.country.ru || p.country.en) && (
          <div className="text-[11px] text-muted-foreground mb-3 flex items-center gap-1"><Icon name="Globe" size={11} className="text-gold" />{L(p.country, lang)}</div>
        )}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {tags.slice(0, 4).map((tg) => (<span key={tg} className="chip">{tg}</span>))}
        </div>
        <div className="divider-gold mb-4" />
        <div className="flex items-center justify-between mt-auto gap-3">
          <div className="min-w-0">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{tr("cost")}</div>
            <div className="font-montserrat font-bold text-sm text-gold truncate">
              {L(p.price, lang) || tr("priceOnRequest")}
            </div>
          </div>
          <span className="text-xs font-montserrat font-semibold text-gold flex items-center gap-1 group-hover:gap-2 transition-all">{tr("openProfile")}<Icon name="ArrowRight" size={13} /></span>
        </div>
      </div>
    </div>
  );
}

function SearchSection({ setActive, initialCategory = "", initialService = "", openSpecialist }: { setActive: (s: Section) => void; initialCategory?: string; initialService?: string; openSpecialist?: (p: Provider) => void }) {
  const { lang, tr } = useLang();
  const { providers, failed } = useProviders();
  const [query, setQuery] = useState(initialService);
  const [category, setCategory] = useState(initialCategory);
  const [licensedOnly, setLicensedOnly] = useState(false);
  const [cityInput, setCityInput] = useState("");
  const [countryInput, setCountryInput] = useState("");
  // Запоминаем выбранную подсказку города, чтобы знать её страну для fallback-поиска
  // «в этом городе никого нет — покажем специалистов по всей стране».
  const [citySuggestion, setCitySuggestion] = useState<LocationSuggestion | null>(null);

  const matchesText = (p: Provider, q: string) => {
    if (!q.trim()) return true;
    const tags = (lang === "ru" ? p.tags.ru : p.tags.en).map((t) => t.toLowerCase());
    const title = L(p.title, lang).toLowerCase();
    const name = L(p.name, lang).toLowerCase();
    const cityName = L(p.city, lang).toLowerCase();
    const ql = q.toLowerCase();
    return title.includes(ql) || name.includes(ql) || cityName.includes(ql) || tags.some((t) => t.includes(ql) || ql.includes(t));
  };

  const matchesCategory = (p: Provider) => {
    if (!category) return true;
    const catServices = services.filter((s) => s.cat === category);
    return catServices.some((s) => matchesText(p, L(s.title, lang)));
  };

  const baseFilter = (p: Provider) => {
    if (!p.active) return false;
    if (licensedOnly && !isLicensed(p)) return false;
    if (!matchesCategory(p)) return false;
    if (!matchesText(p, query)) return false;
    return true;
  };

  const city = cityInput.trim().toLowerCase();
  const country = countryInput.trim().toLowerCase();

  // Строгие результаты — с учётом города и страны, как ввёл клиент.
  const strictResults = providers
    .filter((p) => {
      if (!baseFilter(p)) return false;
      if (city && !L(p.city, lang).toLowerCase().includes(city)) return false;
      if (country && !L(p.country || { ru: "", en: "" }, lang).toLowerCase().includes(country)) return false;
      return true;
    })
    .sort((a, b) => b.rating - a.rating);

  // Fallback: если в выбранном городе никого нет, но известна страна
  // (из явного поля «Страна» или из подсказки выбранного города) —
  // показываем проверенных специалистов по всей стране.
  const fallbackCountry = country || (citySuggestion?.country || "").toLowerCase();
  const showFallback = city && strictResults.length === 0 && !!fallbackCountry;
  const fallbackResults = showFallback
    ? providers
        .filter((p) => {
          if (!baseFilter(p)) return false;
          const pCountry = L(p.country || { ru: "", en: "" }, lang).toLowerCase();
          if (!pCountry) return false;
          return pCountry.includes(fallbackCountry) || fallbackCountry.includes(pCountry);
        })
        .sort((a, b) => b.rating - a.rating)
    : [];

  const results = showFallback ? fallbackResults : strictResults;

  const hasFilters = !!(query.trim() || category || licensedOnly || cityInput.trim() || countryInput.trim());
  const reset = () => { setQuery(""); setCategory(""); setLicensedOnly(false); setCityInput(""); setCountryInput(""); setCitySuggestion(null); };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="mb-6">
        <div className="tag-security mb-3 inline-block">{tr("searchTag")}</div>
        <h2 className="font-montserrat font-bold text-3xl text-foreground mb-2">{tr("searchTitle")}</h2>
        <p className="text-muted-foreground text-sm">{tr("searchSubtitle")}</p>
      </div>

      {/* Город и страна — клиент вводит вручную, с подсказками городов, областей/штатов и стран. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <LocationAutocomplete
          value={cityInput}
          onChange={(v) => { setCityInput(v); setCitySuggestion(null); }}
          onSelect={(s) => { setCityInput(s.name); setCitySuggestion(s); }}
          placeholder={tr("searchCityPh")}
          icon="MapPin"
          lang={lang}
          field="city"
        />
        <LocationAutocomplete
          value={countryInput}
          onChange={setCountryInput}
          onSelect={(s) => setCountryInput(s.name)}
          placeholder={tr("searchCountryPh")}
          icon="Globe"
          lang={lang}
          field="country"
        />
      </div>

      {showFallback && (
        <div className="flex items-start gap-2 mb-4 border border-gold/30 bg-gold/5 rounded-sm px-3 py-2.5 text-xs text-muted-foreground">
          <Icon name="Info" size={14} className="text-gold shrink-0 mt-0.5" />
          <span>{tr("searchFallbackCountry")}</span>
        </div>
      )}

      <div className="flex items-center gap-3 border-2 border-border focus-within:border-gold bg-card rounded-sm px-4 mb-5 transition-colors">
        <Icon name="Search" size={20} className="text-gold shrink-0" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={tr("searchSimplePh")}
          className="flex-1 bg-transparent py-4 text-base text-foreground placeholder:text-muted-foreground outline-none"
        />
        {query && <button onClick={() => setQuery("")} aria-label={tr("clearSearch")} className="text-muted-foreground hover:text-foreground shrink-0"><Icon name="X" size={18} /></button>}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={() => setCategory("")} className={`px-4 py-2 text-xs font-montserrat font-semibold rounded-sm border transition-colors flex items-center gap-1.5 ${category === "" ? "gold-gradient text-[hsl(28,20%,7%)] border-transparent" : "border-gold/50 text-gold hover:bg-gold/10"}`}>
            {tr("searchAnyCategory")}
        </button>
        {serviceCategories.map((c) => (
          <button key={c.id} onClick={() => setCategory(c.id === category ? "" : c.id)} className={`px-4 py-2 text-xs font-montserrat font-semibold rounded-sm border transition-colors flex items-center gap-1.5 ${category === c.id ? "gold-gradient text-[hsl(28,20%,7%)] border-transparent" : "border-border text-muted-foreground hover:text-gold hover:border-gold/50"}`}>
            <Icon name={c.icon} fallback="Shield" size={13} />{L(c.title, lang)}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <button
          onClick={() => setLicensedOnly((v) => !v)}
          className={`flex items-center gap-2 rounded-sm px-3 py-2 text-xs font-montserrat font-semibold border transition-all ${licensedOnly ? "bg-gold/15 border-gold/50 text-gold" : "border-border bg-card text-muted-foreground hover:border-gold hover:text-gold"}`}
        >
          <Icon name={licensedOnly ? "BadgeCheck" : "Badge"} size={14} />
          {tr("searchFLicensed")}
        </button>
        {hasFilters && (
          <button aria-label="Закрыть" onClick={reset} className="text-xs font-montserrat font-semibold text-muted-foreground hover:text-gold flex items-center gap-1.5"><Icon name="X" size={13} />{tr("searchReset")}</button>
        )}
        <span className="text-xs text-muted-foreground ms-auto">{tr("searchFound")}: <span className="text-gold font-bold">{results.length}</span></span>
      </div>

      {failed ? (
        /* Каталог не загрузился — честно объясняем причину и даём действие.
           Пустой экран человек читает как «здесь никого нет». */
        <div className="border border-dashed border-gold/40 rounded-sm bg-card/50 py-16 flex flex-col items-center gap-3 text-center px-6">
          <Icon name="CloudOff" size={40} className="text-gold/50" />
          <span className="text-sm text-foreground font-montserrat font-semibold">{tr("loadFailedTitle")}</span>
          <span className="text-xs text-muted-foreground max-w-md">{tr("loadFailedText")}</span>
          <button onClick={() => window.location.reload()} className="mt-1 text-xs font-montserrat font-semibold text-gold hover:underline">
            {tr("loadFailedRetry")}
          </button>
        </div>
      ) : results.length === 0 ? (
        <div className="border border-dashed border-border rounded-sm bg-card/50 py-16 flex flex-col items-center gap-3 text-center">
          <Icon name="SearchX" size={40} className="text-muted-foreground/30" />
          <span className="text-sm text-muted-foreground">{tr("filterNoResults")}</span>
          {hasFilters && <button onClick={reset} className="text-xs font-montserrat font-semibold text-gold hover:underline">{tr("searchReset")}</button>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 stagger">
          {results.map((p) => (
            <ProviderResultCard key={p.slug} p={p} onOpen={() => (openSpecialist ? openSpecialist(p) : setActive("profile"))} />
          ))}
        </div>
      )}
    </div>
  );
}

function SpecialistsListSection({ setActive, openSpecialist }: { setActive: (s: Section) => void; openSpecialist?: (p: Provider) => void }) {
  const { tr } = useLang();
  const { providers } = useProviders();
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const list = providers
    .filter((p) => p.active)
    .filter((p) => !verifiedOnly || isLicensed(p));

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="mb-6">
        <div className="tag-security mb-3 inline-block">{tr("specialists")}</div>
        <h2 className="font-montserrat font-bold text-3xl text-foreground mb-2">{tr("allSpecialistsTitle")}</h2>
        <p className="text-muted-foreground text-sm">{tr("allSpecialistsSub")}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <button
          onClick={() => setVerifiedOnly((v) => !v)}
          className={`flex items-center gap-2 text-xs font-montserrat font-semibold rounded-sm px-3 py-2 border transition-all ${verifiedOnly ? "bg-green-500/15 border-green-500/40 text-green-400" : "bg-card border-border text-muted-foreground hover:border-gold hover:text-foreground"}`}
        >
          <Icon name={verifiedOnly ? "ShieldCheck" : "Shield"} size={14} />
          {tr("filterVerifiedOnly")}
        </button>
        <button
          onClick={() => setActive("services")}
          className="flex items-center gap-2 text-xs font-montserrat font-semibold rounded-sm px-3 py-2 border border-border bg-card text-muted-foreground hover:border-gold hover:text-gold transition-all"
        >
          <Icon name="Search" size={14} />
          {tr("heroClientCta1")}
        </button>
        <span className="text-xs text-muted-foreground ms-auto">{tr("searchFound")}: <span className="text-gold font-bold">{list.length}</span></span>
      </div>

      {list.length === 0 ? (
        <div className="border border-dashed border-border rounded-sm bg-card/50 py-16 flex flex-col items-center gap-3 text-center">
          <Icon name="SearchX" size={40} className="text-muted-foreground/30" />
          <span className="text-sm text-muted-foreground">{tr("filterNoResults")}</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 stagger">
          {list.map((p) => (
            <ProviderResultCard key={p.slug} p={p} onOpen={() => (openSpecialist ? openSpecialist(p) : setActive("profile"))} />
          ))}
        </div>
      )}
    </div>
  );
}

function ClientServices({ setActive, openSpecialist }: { setActive: (s: Section) => void; openSpecialist?: (p: Provider) => void }) {
  const [mode, setMode] = useState<"catalog" | "search">("catalog");
  const [prefillCat, setPrefillCat] = useState("");
  const { tr } = useLang();

  if (mode === "search") {
    return (
      <div>
        <div className="max-w-7xl mx-auto px-4 pt-6">
          <button
            onClick={() => setMode("catalog")}
            className="inline-flex items-center gap-1.5 text-xs font-montserrat font-semibold text-muted-foreground hover:text-gold transition-colors"
          >
            <Icon name="ArrowLeft" size={14} />{tr("catBackToCatalog")}
          </button>
        </div>
        <SearchSection setActive={setActive} initialCategory={prefillCat} openSpecialist={openSpecialist} />
      </div>
    );
  }

  return (
    <ServicesSection
      onOrder={(catId) => { setPrefillCat(catId); setMode("search"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
    />
  );
}

function ServicesSection({ onOrder }: { onOrder?: (categoryId: string, serviceTitleEn?: string) => void } = {}) {
  const { lang, tr } = useLang();
  const { servicePrices } = useProviders();
  const [query, setQuery] = useState("");
  const [openCat, setOpenCat] = useState("");
  const [openService, setOpenService] = useState<string | null>(null);
  const priceFor = (s: { title: { en: string }; price: { ru: string; en: string } }) =>
    servicePrices[s.title.en] ? `${tr("priceFrom")} ${servicePrices[s.title.en]}` : L(s.price, lang);

  const q = query.trim().toLowerCase();
  const filtered = services.filter((s) => {
    if (q && !L(s.title, lang).toLowerCase().includes(q) && !L(s.desc, lang).toLowerCase().includes(q)) return false;
    return true;
  });
  const shownCats = serviceCategories.filter((c) => filtered.some((s) => s.cat === c.id));

  // При поиске текстом сразу разворачиваем категории, где есть совпадения.
  const catIsOpen = (catId: string) => (q ? filtered.some((s) => s.cat === catId) : openCat === catId);
  const toggleCat = (catId: string) => { setOpenCat((cur) => (cur === catId ? "" : catId)); setOpenService(null); };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8">
        <div className="tag-security mb-3 inline-block">{tr("catalog")}</div>
        <h2 className="font-montserrat font-bold text-3xl text-foreground mb-2">{tr("servicesTitle")}</h2>
        <p className="text-muted-foreground text-sm">{tr("servicesDesc")}</p>
      </div>

      <div className="flex gap-3 mb-8">
        <div className="flex-1 flex items-center gap-3 border border-border bg-card rounded-sm px-4">
          <Icon name="Search" size={16} className="text-muted-foreground" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={tr("searchServices")} className="flex-1 bg-transparent py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none" />
          {query && <button onClick={() => setQuery("")} aria-label={tr("clearSearch")} className="text-muted-foreground hover:text-foreground"><Icon name="X" size={15} /></button>}
        </div>
      </div>

      {shownCats.length === 0 && (
        <div className="text-center text-muted-foreground text-sm py-16 border border-dashed border-border rounded-sm">{tr("searchNoResults")}</div>
      )}

      {/* Вертикальный список категорий-глав: клик раскрывает специальности внутри. */}
      <div className="space-y-3">
        {shownCats.map((cat) => {
          const catServices = filtered.filter((s) => s.cat === cat.id);
          const isOpen = catIsOpen(cat.id);
          return (
            <div key={cat.id} className="border border-border rounded-sm bg-card overflow-hidden">
              <button
                onClick={() => toggleCat(cat.id)}
                className="w-full flex items-center gap-4 p-4 sm:p-5 text-start hover:bg-secondary/40 transition-colors"
              >
                <div className="w-11 h-11 sm:w-12 sm:h-12 gold-gradient rounded flex items-center justify-center shrink-0">
                  <Icon name={cat.icon} fallback="Shield" size={22} className="text-[hsl(28,20%,7%)]" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-montserrat font-bold text-sm sm:text-base text-foreground leading-tight">{L(cat.title, lang)}</h3>
                  <div className="mt-1 text-[11px] sm:text-xs text-muted-foreground">{catServices.length} {tr("catSpecialties")}</div>
                </div>
                <Icon name={isOpen ? "ChevronUp" : "ChevronDown"} size={18} className="text-muted-foreground shrink-0" />
              </button>

              {isOpen && (
                <div className="border-t border-border divide-y divide-border animate-fade-in">
                  {catServices.map((s) => {
                    const serviceOpen = openService === s.title.en;
                    return (
                      <div key={s.title.en}>
                        <button
                          onClick={() => setOpenService((cur) => (cur === s.title.en ? null : s.title.en))}
                          className="w-full flex items-center gap-3 px-4 sm:px-5 py-3.5 text-start hover:bg-secondary/30 transition-colors"
                        >
                          <Icon name={s.icon} fallback="ShieldCheck" size={17} className="text-gold shrink-0" />
                          <span className="flex-1 min-w-0 text-xs sm:text-sm font-montserrat font-semibold text-foreground">{L(s.title, lang)}</span>
                          <span className="text-xs font-montserrat font-bold text-gold shrink-0">{priceFor(s)}</span>
                          <Icon name={serviceOpen ? "ChevronUp" : "ChevronRight"} size={15} className="text-muted-foreground shrink-0" />
                        </button>
                        {serviceOpen && (
                          <div className="px-4 sm:px-5 pb-4 pt-1 bg-secondary/20 animate-fade-in">
                            <p className="text-xs text-muted-foreground leading-relaxed mb-3">{L(s.desc, lang)}</p>
                            <div className="flex items-center justify-between gap-3">
                              <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                                <Icon name="Clock" size={11} />{L(s.time, lang)}
                              </div>
                              {onOrder && (
                                <button
                                  onClick={() => onOrder(s.cat, s.title.en)}
                                  className="border border-gold text-gold text-xs font-montserrat font-semibold px-4 py-2 hover:bg-gold hover:text-[hsl(28,20%,7%)] transition-all rounded-sm inline-flex items-center gap-1.5 shrink-0"
                                >
                                  {tr("catFindSpecialist")}<Icon name="ArrowRight" size={13} />
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-10 border border-gold/30 rounded-sm bg-card p-6 flex flex-col md:flex-row items-start md:items-center gap-4">
        <div className="w-10 h-10 gold-gradient rounded flex items-center justify-center shrink-0">
          <Icon name="HandCoins" size={18} className="text-[hsl(28,20%,7%)]" />
        </div>
        <div>
          <div className="font-montserrat font-semibold text-sm text-foreground mb-1">{tr("noCommissionTitle")}</div>
          <div className="text-xs text-muted-foreground">{tr("noCommissionDesc")}</div>
        </div>
      </div>
    </div>
  );
}

function CoursesSection() {
  const { tr } = useLang();
  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="mb-6">
        <div className="tag-security mb-3 inline-block">{tr("education")}</div>
        <h2 className="font-montserrat font-bold text-3xl text-foreground mb-2">{tr("coursesTitle")}</h2>
        <p className="text-muted-foreground text-sm">{tr("coursesDesc")}</p>
      </div>

      <div className="relative overflow-hidden rounded-sm border border-gold/30 glass-card ambient-gold p-10 md:p-16 text-center">
        <div className="absolute inset-0 grid-line-bg opacity-30" />
        <div className="relative z-10 max-w-xl mx-auto">
          <div className="inline-flex items-center gap-2 mb-6">
            <span className="badge-pro">{tr("coursesSoonBadge")}</span>
          </div>
          <div className="w-16 h-16 gold-gradient rounded-full flex items-center justify-center mx-auto mb-6 glow-gold-sm">
            <Icon name="GraduationCap" size={30} className="text-[hsl(28,20%,7%)]" />
          </div>
          <h3 className="font-montserrat font-extrabold text-2xl md:text-3xl text-foreground mb-4">{tr("coursesSoonTitle")}</h3>
          <p className="text-muted-foreground text-sm md:text-base leading-relaxed mb-8">{tr("coursesSoonText")}</p>
          <div className="flex items-center justify-center gap-2 text-xs text-gold font-montserrat font-semibold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-gold" />
            </span>
            {tr("coursesSoonBadge")}
          </div>
        </div>
      </div>
    </div>
  );
}

function GuardsSection() {
  const { lang, tr } = useLang();
  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="mb-10">
        <div className="tag-security mb-3 inline-block">{tr("guardsTag")}</div>
        <h2 className="font-montserrat font-bold text-3xl text-foreground mb-2">{tr("guardsTitle")}</h2>
        <p className="text-muted-foreground text-sm">{tr("guardsDesc")}</p>
      </div>

      <div className="flex gap-3 mb-10">
        <div className="flex-1 flex items-center gap-3 border border-border bg-card rounded-sm px-4">
          <Icon name="Search" size={16} className="text-muted-foreground" />
          <input placeholder={tr("searchGuards")} className="flex-1 bg-transparent py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none" />
        </div>
        <button className="gold-gradient text-[hsl(28,20%,7%)] px-6 py-3 text-xs font-montserrat font-bold rounded-sm">{tr("search")}</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 stagger">
        {guards.map((g) => (
          <div key={g.name.en} className="card-lift shine-on-hover border border-border rounded-sm bg-card overflow-hidden cursor-pointer group">
            <div className="h-48 overflow-hidden relative">
              <img src={g.img} alt={L(g.name, lang)} loading="lazy" decoding="async" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
              <div className="absolute top-3 end-3 flex items-center gap-1 bg-card/90 backdrop-blur-sm border border-gold/40 px-2 py-1 rounded-sm">
                <Icon name="BadgeCheck" size={12} className="text-gold" />
                <span className="text-[10px] font-montserrat font-semibold text-gold">{tr("licensed")}</span>
              </div>
              <div className="absolute bottom-3 start-4 end-4">
                <div className="font-montserrat font-bold text-base text-foreground">{L(g.name, lang)}</div>
                <div className="text-xs text-gold font-montserrat font-medium">{L(g.type, lang)}</div>
              </div>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <StarRating rating={g.rating} />
                <span className="text-xs text-muted-foreground">{g.rating} ({g.reviews})</span>
              </div>
              <div className="flex items-center gap-3 mb-4 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><Icon name="Users" size={11} />{g.employees} {tr("employees")}</span>
                <span className="flex items-center gap-1"><Icon name="Building2" size={11} />{g.objects} {tr("objects")}</span>
                <span className="flex items-center gap-1"><Icon name="Calendar" size={11} />{tr("founded")} {g.founded}</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {g.tags.map((tag) => (
                  <span key={tag.en} className="chip">{L(tag, lang)}</span>
                ))}
              </div>
              <div className="divider-gold mb-4" />
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{tr("cost")}</div>
                  <div className="font-montserrat font-bold text-sm text-gold">{L(g.price, lang)}</div>
                </div>
                <button className="border border-gold text-gold text-xs font-montserrat font-semibold px-4 py-2 hover:bg-gold hover:text-[hsl(28,20%,7%)] transition-all rounded-sm">
                  {tr("requestQuote")}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-14">
        <h3 className="font-montserrat font-bold text-2xl text-foreground mb-6">{tr("guardServices")}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {guardServices.map((x) => (
            <div key={x.title.en} className="group border border-border rounded-sm bg-card p-6 card-lift shine-on-hover cursor-default">
              <div className="w-11 h-11 icon-tile rounded-full flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110">
                <Icon name={x.icon} size={19} className="text-gold" />
              </div>
              <div className="font-montserrat font-bold text-sm text-foreground mb-2">{L(x.title, lang)}</div>
              <div className="text-xs text-muted-foreground leading-relaxed">{L(x.desc, lang)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

type LegalKey = keyof typeof t;
type LegalDoc = {
  icon: string;
  tag: LegalKey;
  title: LegalKey;
  intro: LegalKey;
  sections: { title: LegalKey; text: LegalKey }[];
};

const LEGAL_DOCS: Record<"privacy" | "consent" | "terms" | "agreement" | "offer", LegalDoc> = {
  privacy: {
    icon: "ShieldCheck",
    tag: "lglTag",
    title: "fPrivacy",
    intro: "privIntro",
    sections: [
      { title: "priv1Title", text: "priv1Text" },
      { title: "priv2Title", text: "priv2Text" },
      { title: "priv3Title", text: "priv3Text" },
      { title: "priv4Title", text: "priv4Text" },
      { title: "priv5Title", text: "priv5Text" },
      { title: "priv6Title", text: "priv6Text" },
      { title: "priv7Title", text: "priv7Text" },
      { title: "priv8Title", text: "priv8Text" },
      { title: "priv9Title", text: "priv9Text" },
    ],
  },
  consent: {
    icon: "FileCheck2",
    tag: "lglTag",
    title: "fConsent",
    intro: "consentDocIntro",
    sections: [
      { title: "consent1Title", text: "consent1Text" },
      { title: "consent2Title", text: "consent2Text" },
      { title: "consent3Title", text: "consent3Text" },
      { title: "consent4Title", text: "consent4Text" },
      { title: "consent5Title", text: "consent5Text" },
      { title: "consent6Title", text: "consent6Text" },
      { title: "consent7Title", text: "consent7Text" },
    ],
  },
  terms: {
    icon: "FileText",
    tag: "lglTag",
    title: "fTerms",
    intro: "termsIntro",
    sections: [
      { title: "terms1Title", text: "terms1Text" },
      { title: "terms2Title", text: "terms2Text" },
      { title: "terms3Title", text: "terms3Text" },
      { title: "terms4Title", text: "terms4Text" },
      { title: "terms5Title", text: "terms5Text" },
      { title: "terms6Title", text: "terms6Text" },
      { title: "terms7Title", text: "terms7Text" },
    ],
  },
  agreement: {
    icon: "Handshake",
    tag: "lglTag",
    title: "fAgreement",
    intro: "agrIntro",
    sections: [
      { title: "agr1Title", text: "agr1Text" },
      { title: "agr2Title", text: "agr2Text" },
      { title: "agr3Title", text: "agr3Text" },
      { title: "agr4Title", text: "agr4Text" },
      { title: "agr5Title", text: "agr5Text" },
      { title: "agr6Title", text: "agr6Text" },
    ],
  },
  offer: {
    icon: "Wallet",
    tag: "lglTag",
    title: "fOffer",
    intro: "offerIntro",
    sections: [
      { title: "offer1Title", text: "offer1Text" },
      { title: "offer2Title", text: "offer2Text" },
      { title: "offer3Title", text: "offer3Text" },
      { title: "offer4Title", text: "offer4Text" },
      { title: "offer5Title", text: "offer5Text" },
      { title: "offer6Title", text: "offer6Text" },
      { title: "offer7Title", text: "offer7Text" },
    ],
  },
};

function LegalDocSection({ doc, setActive, showFaq }: { doc: LegalDoc; setActive: (s: Section) => void; showFaq?: boolean }) {
  const { tr } = useLang();
  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="border border-gold/30 rounded-sm glass-card p-8 md:p-10 mb-8 relative overflow-hidden security-glow ambient-gold">
        <div className="absolute inset-0 grid-line-bg opacity-30" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
          <div className="w-16 h-16 gold-gradient rounded-full flex items-center justify-center shrink-0 glow-gold-sm">
            <Icon name={doc.icon} fallback="FileText" size={30} className="text-[hsl(28,20%,7%)]" />
          </div>
          <div>
            <div className="tag-security mb-3 inline-block">{tr(doc.tag)}</div>
            <h1 className="font-montserrat font-extrabold text-3xl md:text-4xl text-foreground mb-2">{tr(doc.title)}</h1>
            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Icon name="Calendar" size={12} className="text-gold" />
              {tr("polUpdated")}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1 order-2 lg:order-1">
          <div className="lg:sticky lg:top-24 border border-border rounded-sm bg-card p-5">
            <div className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest mb-4">{tr("polNav")}</div>
            {doc.sections.map((s, i) => (
              <a key={s.title} href={`#lgl-${i}`} className="flex items-center gap-2 py-2 border-b border-border last:border-0 cursor-pointer group">
                <span className="font-montserrat font-bold text-[10px] text-gold w-4">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-xs text-muted-foreground group-hover:text-gold transition-colors">{tr(s.title).replace(/^\d+\.\s*/, "")}</span>
              </a>
            ))}
          </div>
        </aside>

        <div className="lg:col-span-3 order-1 lg:order-2">
          <div className="border border-border rounded-sm bg-card p-6 md:p-8 mb-6">
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{tr(doc.intro)}</p>
          </div>

          <div className="space-y-5 stagger">
            {doc.sections.map((s, i) => (
              <div key={s.title} id={`lgl-${i}`} className="border border-border rounded-sm bg-card p-6 md:p-7 card-lift scroll-mt-24">
                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 gold-gradient rounded flex items-center justify-center shrink-0 glow-gold-sm">
                    <span className="font-montserrat font-extrabold text-sm text-[hsl(28,20%,7%)]">{String(i + 1).padStart(2, "0")}</span>
                  </div>
                  <div>
                    <h2 className="font-montserrat font-bold text-base text-foreground mb-2">{tr(s.title)}</h2>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{tr(s.text)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {showFaq && (
            <FaqAccordion
              tag={tr("privFaqTag")}
              title={tr("privFaqTitle")}
              items={[
                { q: "privFaq1Q", a: "privFaq1A" },
                { q: "privFaq2Q", a: "privFaq2A" },
                { q: "privFaq3Q", a: "privFaq3A" },
                { q: "privFaq4Q", a: "privFaq4A" },
                { q: "privFaq5Q", a: "privFaq5A" },
              ]}
            />
          )}

          <div className="mt-8 border border-gold/30 rounded-sm bg-card p-6">
            <div className="flex items-center gap-2 mb-3">
              <Icon name="Building2" size={16} className="text-gold shrink-0" />
              <h2 className="font-montserrat font-bold text-sm text-foreground uppercase tracking-widest">{tr("reqTitle")}</h2>
            </div>
            <div className="text-xs text-muted-foreground leading-relaxed space-y-1">
              <div className="font-semibold text-foreground">{tr("reqName")}</div>
              <div>{tr("reqOgrnip")} · {tr("reqInn")}</div>
              <div>{tr("reqAddress")}</div>
              <div>{tr("reqTaxOffice")}</div>
            </div>
          </div>

          <div className="mt-6 border border-border rounded-sm bg-card/60 p-5 flex items-start gap-3">
            <Icon name="Info" size={16} className="text-gold mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">{tr("lglDisclaimer")}</p>
          </div>

          <div className="mt-6 border border-gold/30 rounded-sm glass-card p-8 text-center security-glow">
            <Icon name="LifeBuoy" size={32} className="text-gold mx-auto mb-4" />
            <h2 className="font-montserrat font-bold text-xl text-foreground mb-2">{tr("polContactTitle")}</h2>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto mb-6">{tr("polContactText")}</p>
            <button
              onClick={() => setActive("contacts")}
              className="gold-gradient text-[hsl(28,20%,7%)] px-8 py-3 font-montserrat font-bold text-sm rounded-sm hover:opacity-90 transition-opacity"
            >
              {tr("polContactBtn")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}