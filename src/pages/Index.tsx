import { useState } from "react";
import Icon from "@/components/ui/icon";
import { useLang, t, LANGS, type Lang } from "@/lib/i18n";
import { dataExtra } from "@/lib/i18n-extra";
import { downloadReceipt } from "@/lib/receipt";
import { useGeo, haversineKm } from "@/lib/geo";
import func2url from "../../backend/func2url.json";

const HERO_IMAGE = "https://cdn.poehali.dev/projects/cdac7d00-bd0a-4bb7-a1b1-237a7708c061/files/e0e84afb-8e88-40ff-81b2-c3597f9a8371.jpg";
const POLYGRAPH_IMAGE = "https://cdn.poehali.dev/projects/cdac7d00-bd0a-4bb7-a1b1-237a7708c061/files/c211bedb-fcf6-49e0-abb2-ad98fcf0bdac.jpg";
const DETECTIVE_IMAGE = "https://cdn.poehali.dev/projects/cdac7d00-bd0a-4bb7-a1b1-237a7708c061/files/b893f56c-cd01-49d7-b962-7f78f87ace2c.jpg";
const GUARDS_IMAGE = "https://cdn.poehali.dev/projects/cdac7d00-bd0a-4bb7-a1b1-237a7708c061/files/0b2c5db2-c85b-4009-99db-6b023ed84bf5.jpg";
const PROVIDER_EMAIL = "a.morozov@securenet.ru";

type Section = "home" | "profile" | "cases" | "services" | "courses" | "guards" | "chat" | "forum" | "contacts" | "policy" | "pricing" | "dashboard";
type Role = "client" | "provider";

type NavItem = { id: Section; key: keyof typeof t; icon: string };

const CLIENT_NAV: NavItem[] = [
  { id: "home", key: "navHome", icon: "Home" },
  { id: "services", key: "navServices", icon: "Briefcase" },
  { id: "profile", key: "navProfile", icon: "User" },
  { id: "guards", key: "navGuards", icon: "ShieldCheck" },
  { id: "dashboard", key: "navDashboard", icon: "LayoutDashboard" },
  { id: "contacts", key: "navContacts", icon: "Phone" },
];

const PROVIDER_NAV: NavItem[] = [
  { id: "home", key: "navHome", icon: "Home" },
  { id: "pricing", key: "navPricing", icon: "Wallet" },
  { id: "courses", key: "navCourses", icon: "GraduationCap" },
  { id: "chat", key: "navChat", icon: "MessageSquare" },
  { id: "forum", key: "navForum", icon: "MessagesSquare" },
  { id: "dashboard", key: "navDashboard", icon: "LayoutDashboard" },
  { id: "contacts", key: "navContacts", icon: "Phone" },
];

type LS = { ru: string; en: string };
const L = (v: LS, lang: Lang) => {
  if (lang === "ru") return v.ru;
  if (lang === "en") return v.en;
  return dataExtra[lang as keyof typeof dataExtra]?.[v.en] ?? v.en;
};

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
        <div className="absolute right-0 mt-1 z-50 min-w-[160px] border border-border rounded-sm bg-card shadow-lg overflow-hidden animate-fade-in">
          {LANGS.map((l) => (
            <button
              key={l.code}
              onClick={() => { setLang(l.code); setOpen(false); }}
              className={`w-full flex items-center justify-between gap-3 px-3 py-2 text-xs font-montserrat text-left transition-colors ${l.code === lang ? "bg-gold text-[hsl(220,20%,6%)] font-bold" : "text-foreground hover:bg-secondary"}`}
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

const services = [
  { icon: "Activity", title: { ru: "Полиграф-проверка", en: "Polygraph examination" }, price: { ru: "от 8 000 ₽", en: "from $90" }, time: { ru: "2–3 часа", en: "2–3 hours" }, desc: { ru: "Психофизиологическое исследование с применением компьютерного полиграфа для HR и корпоративных нужд", en: "Psychophysiological examination with a computer polygraph for HR and corporate needs" } },
  { icon: "Search", title: { ru: "Поиск прослушивающих устройств", en: "Bug detection sweep" }, price: { ru: "от 25 000 ₽", en: "from $280" }, time: { ru: "от 4 часов", en: "from 4 hours" }, desc: { ru: "Профессиональное радиочастотное сканирование помещений, офисов и транспортных средств", en: "Professional RF sweeping of premises, offices and vehicles" } },
  { icon: "Eye", title: { ru: "Наружное наблюдение", en: "Surveillance" }, price: { ru: "от 12 000 ₽/день", en: "from $140/day" }, time: { ru: "от 1 дня", en: "from 1 day" }, desc: { ru: "Профессиональная слежка силами сертифицированных детективов с фото- и видеофиксацией", en: "Professional surveillance by certified investigators with photo and video evidence" } },
  { icon: "FileSearch", title: { ru: "Сбор досье", en: "Background dossier" }, price: { ru: "от 15 000 ₽", en: "from $170" }, time: { ru: "3–7 дней", en: "3–7 days" }, desc: { ru: "Комплексная проверка физических и юридических лиц по открытым и закрытым источникам", en: "Comprehensive checks of individuals and companies via open and closed sources" } },
  { icon: "Shield", title: { ru: "Защита переговоров", en: "Meeting protection" }, price: { ru: "от 30 000 ₽", en: "from $340" }, time: { ru: "под ключ", en: "turnkey" }, desc: { ru: "Обеспечение защищённого периметра для конфиденциальных встреч на вашей или нейтральной территории", en: "A secure perimeter for confidential meetings on your or neutral territory" } },
  { icon: "UserCheck", title: { ru: "HR-безопасность", en: "HR security" }, price: { ru: "от 5 000 ₽", en: "from $60" }, time: { ru: "1–2 дня", en: "1–2 days" }, desc: { ru: "Проверка соискателей, мониторинг персонала, расследование инцидентов внутри компании", en: "Applicant screening, staff monitoring and internal incident investigations" } },
];

const courses = [
  {
    title: { ru: "Основы полиграфологии", en: "Polygraph fundamentals" },
    instructor: { ru: "А. Морозов", en: "A. Morozov" },
    level: { ru: "Начинающий", en: "Beginner" },
    duration: { ru: "32 часа", en: "32 hours" },
    price: { ru: "24 900 ₽", en: "$280" },
    students: 312,
    rating: 4.8,
    img: POLYGRAPH_IMAGE,
  },
  {
    title: { ru: "TSCM: технический поиск средств наблюдения", en: "TSCM: technical surveillance counter-measures" },
    instructor: { ru: "И. Семёнов", en: "I. Semenov" },
    level: { ru: "Продвинутый", en: "Advanced" },
    duration: { ru: "48 часов", en: "48 hours" },
    price: { ru: "49 900 ₽", en: "$560" },
    students: 187,
    rating: 4.9,
    img: HERO_IMAGE,
  },
  {
    title: { ru: "Частная детективная деятельность: с нуля до лицензии", en: "Private investigation: from zero to license" },
    instructor: { ru: "Е. Власова", en: "E. Vlasova" },
    level: { ru: "С нуля", en: "From scratch" },
    duration: { ru: "60 часов", en: "60 hours" },
    price: { ru: "39 900 ₽", en: "$450" },
    students: 248,
    rating: 4.7,
    img: DETECTIVE_IMAGE,
  },
];

const messages = [
  { user: { ru: "А. Морозов", en: "A. Morozov" }, time: "10:42", text: { ru: "Игорь, можете порекомендовать анализатор нелинейностей для работы в полевых условиях?", en: "Igor, can you recommend a non-linear junction detector for field work?" } },
  { user: { ru: "И. Семёнов", en: "I. Semenov" }, time: "10:48", text: { ru: "Рекомендую НЕЛАН-В. Компактный, хорошая чувствительность. Использую его уже 3 года.", en: "I recommend the NELAN-V. Compact, good sensitivity. I've used it for 3 years." } },
  { user: { ru: "Е. Власова", en: "E. Vlasova" }, time: "11:02", text: { ru: "Коллеги, вопрос по документированию. Как оформляете итоговый отчёт при комплексной проверке?", en: "Colleagues, a documentation question. How do you format the final report for a full audit?" } },
  { user: { ru: "А. Морозов", en: "A. Morozov" }, time: "11:15", text: { ru: "Есть готовый шаблон, соответствующий требованиям. Скину в личку.", en: "I have a ready-made compliant template. I'll send it in DM." } },
  { user: { ru: "К. Петров", en: "K. Petrov" }, time: "11:28", text: { ru: "Добрый день всем! Новый участник, специализация — корпоративная разведка и безопасность бизнеса.", en: "Hello everyone! New member here, specializing in corporate intelligence and business security." } },
];

const forumTopics = [
  { title: { ru: "Легитимность OSINT в разных юрисдикциях: что можно, что нельзя", en: "OSINT legality across jurisdictions: what's allowed, what's not" }, replies: 34, views: 1820, hot: true, category: { ru: "Право", en: "Law" } },
  { title: { ru: "Сертификация полиграфологов: какой курс выбрать?", en: "Polygraph certification: which course to choose?" }, replies: 21, views: 940, hot: false, category: { ru: "Обучение", en: "Training" } },
  { title: { ru: "Оборудование для TSCM: рейтинг 2024", en: "TSCM equipment: 2024 ranking" }, replies: 58, views: 3210, hot: true, category: { ru: "Оборудование", en: "Equipment" } },
  { title: { ru: "Работа с корпоративными клиентами: договорная база", en: "Working with corporate clients: contract framework" }, replies: 17, views: 720, hot: false, category: { ru: "Бизнес", en: "Business" } },
  { title: { ru: "Этика частного детектива: сложные случаи", en: "Private investigator ethics: hard cases" }, replies: 43, views: 2100, hot: true, category: { ru: "Практика", en: "Practice" } },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} className={`w-3 h-3 ${i <= Math.floor(rating) ? "text-gold fill-current" : "text-muted-foreground"}`} viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function Index() {
  const { lang, setLang, tr } = useLang();
  const [active, setActive] = useState<Section>("home");
  const [role, setRole] = useState<Role>("client");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [secBannerOpen, setSecBannerOpen] = useState(true);

  const NAV_ITEMS = role === "client" ? CLIENT_NAV : PROVIDER_NAV;

  const go = (s: Section) => {
    setActive(s);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const switchRole = (r: Role) => {
    setRole(r);
    setActive("home");
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderSection = () => {
    switch (active) {
      case "home": return <HomeSection setActive={go} role={role} switchRole={switchRole} />;
      case "profile": return <ProfileSection setActive={go} />;
      case "cases": return <CasesSection />;
      case "services": return <ServicesSection />;
      case "courses": return <CoursesSection />;
      case "guards": return <GuardsSection />;
      case "chat": return <ChatSection chatInput={chatInput} setChatInput={setChatInput} />;
      case "forum": return <ForumSection />;
      case "contacts": return <ContactsSection />;
      case "policy": return <SecurityPolicySection setActive={go} />;
      case "pricing": return <PricingSection setActive={go} />;
      case "dashboard": return role === "client" ? <ClientDashboard setActive={go} /> : <ProviderDashboard setActive={go} />;
      default: return <HomeSection setActive={go} role={role} switchRole={switchRole} />;
    }
  };

  return (
    <div className="min-h-screen bg-background font-ibm">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 gold-gradient rounded flex items-center justify-center">
              <Icon name="Shield" size={16} className="text-[hsl(220,20%,6%)]" />
            </div>
            <div>
              <span className="font-montserrat font-bold text-lg tracking-tight text-foreground">SECURE<span className="text-gold">NET</span></span>
              <div className="text-[9px] text-muted-foreground font-montserrat tracking-widest uppercase leading-none">{tr("brandSub")}</div>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-5">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => go(item.id)}
                className={`nav-link text-sm font-montserrat font-medium tracking-wide transition-colors ${active === item.id ? "text-gold active" : "text-muted-foreground hover:text-foreground"}`}
              >
                {tr(item.key)}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center border border-gold/40 rounded-sm overflow-hidden">
              {(["client", "provider"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => switchRole(r)}
                  className={`px-3 py-1.5 text-xs font-montserrat font-bold transition-colors ${role === r ? "gold-gradient text-[hsl(220,20%,6%)]" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {tr(r === "client" ? "roleClient" : "roleProvider")}
                </button>
              ))}
            </div>
            <LangSwitcher lang={lang} setLang={setLang} />
            <button className="hidden sm:block gold-gradient text-[hsl(220,20%,6%)] px-4 py-2 text-sm font-montserrat font-bold rounded-sm hover:opacity-90 transition-opacity">
              {tr("login")}
            </button>
            <button className="lg:hidden text-muted-foreground" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <Icon name={mobileMenuOpen ? "X" : "Menu"} size={22} />
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-border bg-card animate-fade-in">
            <div className="flex p-3 gap-2 border-b border-border">
              {(["client", "provider"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => switchRole(r)}
                  className={`flex-1 px-3 py-2 text-xs font-montserrat font-bold rounded-sm transition-colors ${role === r ? "gold-gradient text-[hsl(220,20%,6%)]" : "border border-border text-muted-foreground"}`}
                >
                  {tr(r === "client" ? "roleClient" : "roleProvider")}
                </button>
              ))}
            </div>
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => { go(item.id); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-montserrat border-b border-border last:border-0 ${active === item.id ? "text-gold bg-secondary" : "text-muted-foreground"}`}
              >
                <Icon name={item.icon} size={16} />
                {tr(item.key)}
              </button>
            ))}
          </div>
        )}
      </header>

      {active !== "home" && (
        <div className="pt-16">
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

      <main className={active === "home" ? "pt-16" : ""}>
        <div key={active} className="animate-rise">
          {renderSection()}
        </div>
      </main>

      <footer className="border-t border-border bg-card mt-16">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 gold-gradient rounded flex items-center justify-center">
                  <Icon name="Shield" size={12} className="text-[hsl(220,20%,6%)]" />
                </div>
                <span className="font-montserrat font-bold text-sm text-foreground">SECURE<span className="text-gold">NET</span></span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{tr("footerDesc")}</p>
            </div>
            <div>
              <div className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest mb-3">{tr("footerPlatform")}</div>
              {(["fAbout", "fSpecialists", "navCases", "navServices", "navCourses"] as const).map(l => (
                <div key={l} className="text-xs text-muted-foreground hover:text-gold cursor-pointer transition-colors mb-2">{tr(l)}</div>
              ))}
            </div>
            <div>
              <div className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest mb-3">{tr("footerCommunity")}</div>
              {(["navForum", "navChat", "fEvents", "fNews"] as const).map(l => (
                <div key={l} className="text-xs text-muted-foreground hover:text-gold cursor-pointer transition-colors mb-2">{tr(l)}</div>
              ))}
            </div>
            <div>
              <div className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest mb-3">{tr("footerDocs")}</div>
              <button onClick={() => go("policy")} className="flex items-center gap-1.5 text-xs text-gold hover:opacity-80 cursor-pointer transition-colors mb-2 font-medium">
                <Icon name="ShieldCheck" size={12} />
                {tr("navPolicy")}
              </button>
              {(["fPrivacy", "fTerms", "fAgreement", "fOffer"] as const).map(l => (
                <div key={l} className="text-xs text-muted-foreground hover:text-gold cursor-pointer transition-colors mb-2">{tr(l)}</div>
              ))}
            </div>
          </div>
          <div className="divider-gold mt-8 mb-6" />
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
            <div className="text-xs text-muted-foreground">{tr("rights")}</div>
            <div className="text-xs text-muted-foreground">{tr("forVerified")}</div>
          </div>
        </div>
      </footer>

      {secBannerOpen && (
        <div className="fixed bottom-0 left-0 right-0 z-40 animate-fade-in">
          <div className="max-w-7xl mx-auto px-4 pb-4">
            <div className="glass-card border border-gold/40 rounded-sm security-glow flex items-center gap-4 px-5 py-3.5">
              <div className="w-9 h-9 gold-gradient rounded-full flex items-center justify-center shrink-0 glow-gold-sm">
                <Icon name="ShieldCheck" size={18} className="text-[hsl(220,20%,6%)]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-montserrat font-bold text-sm text-foreground leading-tight">{tr("secBanner")}</div>
                <div className="text-xs text-muted-foreground truncate">{tr("secBannerSub")}</div>
              </div>
              <button
                onClick={() => go("policy")}
                className="hidden sm:block shrink-0 gold-gradient text-[hsl(220,20%,6%)] px-4 py-2 text-xs font-montserrat font-bold rounded-sm hover:opacity-90 transition-opacity"
              >
                {tr("secReadPolicy")}
              </button>
              <button
                onClick={() => setSecBannerOpen(false)}
                className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="close"
              >
                <Icon name="X" size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function HomeSection({ setActive, role, switchRole }: { setActive: (s: Section) => void; role: Role; switchRole: (r: Role) => void }) {
  const { lang, tr } = useLang();
  const isClient = role === "client";
  const { geo } = useGeo();

  const sortedSpecialists = (() => {
    if (!geo || geo.lat == null || geo.lon == null) {
      return specialists.map((s) => ({ ...s, distance: null as number | null }));
    }
    return specialists
      .map((s) => ({ ...s, distance: haversineKm(geo.lat as number, geo.lon as number, s.lat, s.lon) }))
      .sort((a, b) => (a.distance ?? 1e9) - (b.distance ?? 1e9));
  })();

  return (
    <div>
      <section className="relative overflow-hidden grid-line-bg min-h-[92vh] flex items-center vignette">
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/40 z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/60 z-10" />
        <div className="absolute inset-0">
          <img src={isClient ? HERO_IMAGE : GUARDS_IMAGE} alt="Security" className="w-full h-full object-cover opacity-25" />
        </div>
        <div className="absolute top-1/4 -left-40 w-[500px] h-[500px] rounded-full z-0" style={{ background: "radial-gradient(circle, hsla(43,80%,52%,0.1) 0%, transparent 70%)" }} />
        <div className="relative z-20 max-w-7xl mx-auto px-4 py-24">
          <div className="max-w-2xl stagger">
            <div className="flex items-center gap-3 mb-6 flex-wrap">
              <div className="tag-security inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse-gold" />
                {tr(isClient ? "freeForClients" : "becomeProvider")}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-montserrat">
                <Icon name="ShieldCheck" size={13} className="text-gold" />
                {tr("verifyAll")}
              </div>
            </div>
            {isClient ? (
              <h1 className="font-montserrat font-extrabold text-5xl md:text-6xl lg:text-7xl text-foreground leading-[0.95] mb-6 tracking-tight">
                {tr("heroClientTitle1")}<br />
                <span className="gold-text-gradient">{tr("heroClientTitle2")}</span><br />
                {tr("heroClientTitle3")}
              </h1>
            ) : (
              <h1 className="font-montserrat font-extrabold text-5xl md:text-6xl lg:text-7xl text-foreground leading-[0.95] mb-6 tracking-tight">
                {tr("heroProviderTitle1")}<br />
                <span className="gold-text-gradient">{tr("heroProviderTitle2")}</span>
              </h1>
            )}
            <p className="text-muted-foreground text-lg leading-relaxed mb-8 max-w-xl">
              {tr(isClient ? "heroClientDesc" : "heroProviderDesc")}
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setActive(isClient ? "services" : "pricing")}
                className="shine-on-hover gold-gradient text-[hsl(220,20%,6%)] px-8 py-3.5 font-montserrat font-bold text-sm tracking-wide hover:opacity-90 transition-opacity rounded-sm glow-gold-sm flex items-center gap-2"
              >
                <Icon name={isClient ? "Search" : "Wallet"} size={16} />
                {tr(isClient ? "heroClientCta1" : "heroProviderCta1")}
              </button>
              <button
                onClick={() => setActive(isClient ? "profile" : "pricing")}
                className="border border-border text-foreground px-8 py-3.5 font-montserrat font-semibold text-sm tracking-wide hover:border-gold hover:text-gold transition-all rounded-sm flex items-center gap-2"
              >
                {tr(isClient ? "heroClientCta2" : "heroProviderCta2")}
                <Icon name="ArrowRight" size={16} />
              </button>
            </div>
            <div className="flex items-center gap-6 mt-10 flex-wrap">
              {(isClient
                ? [{ icon: "Wallet", t: "noFees" as const }, { icon: "BadgeCheck", t: "trust1" as const }, { icon: "Lock", t: "trust2" as const }]
                : [{ icon: "BadgeCheck", t: "trust1" as const }, { icon: "Users", t: "statClients" as const }, { icon: "Scale", t: "trust3" as const }]
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
              {[
                { n: "1 240+", l: "statSpecialists" as const },
                { n: "4 800+", l: "statCases" as const },
                { n: "320+", l: "statServices" as const },
                { n: "98%", l: "statClients" as const },
              ].map((s) => (
                <div key={s.n} className="py-5 px-6 text-center">
                  <div className="stat-number text-2xl mb-1">{s.n}</div>
                  <div className="text-xs text-muted-foreground">{tr(s.l)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {!isClient && (
        <section className="border-t border-border bg-card py-20 relative overflow-hidden ambient-gold">
          <div className="max-w-7xl mx-auto px-4 relative z-10">
            <div className="text-center mb-14">
              <div className="tag-security mb-3 inline-block">{tr("bpTag")}</div>
              <h2 className="font-montserrat font-bold text-3xl text-foreground">{tr("bpTitle")}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5 stagger">
              {[
                { n: "01", icon: "UserPlus", title: "bp1Title" as const, desc: "bp1Desc" as const },
                { n: "02", icon: "FileCheck2", title: "bp2Title" as const, desc: "bp2Desc" as const },
                { n: "03", icon: "Wallet", title: "bp3Title" as const, desc: "bp3Desc" as const },
                { n: "04", icon: "TrendingUp", title: "bp4Title" as const, desc: "bp4Desc" as const },
              ].map((step) => (
                <div key={step.n} className="relative p-6 border border-border rounded-sm bg-background card-hover">
                  <div className="font-montserrat font-extrabold text-4xl text-gold/15 absolute top-4 right-5">{step.n}</div>
                  <div className="w-11 h-11 gold-gradient rounded flex items-center justify-center mb-5 glow-gold-sm">
                    <Icon name={step.icon} fallback="Check" size={19} className="text-[hsl(220,20%,6%)]" />
                  </div>
                  <div className="font-montserrat font-bold text-sm text-foreground mb-2">{tr(step.title)}</div>
                  <div className="text-xs text-muted-foreground leading-relaxed">{tr(step.desc)}</div>
                </div>
              ))}
            </div>
            <div className="text-center mt-10">
              <button onClick={() => setActive("pricing")} className="shine-on-hover gold-gradient text-[hsl(220,20%,6%)] px-8 py-3.5 font-montserrat font-bold text-sm rounded-sm hover:opacity-90 transition-opacity glow-gold-sm inline-flex items-center gap-2">
                <Icon name="Wallet" size={16} />
                {tr("heroProviderCta1")}
              </button>
            </div>
          </div>
        </section>
      )}

      {isClient && (
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="flex items-end justify-between mb-4">
          <div>
            <div className="tag-security mb-3 inline-block">{tr("specialists")}</div>
            <h2 className="font-montserrat font-bold text-3xl text-foreground">{tr("topExperts")}</h2>
          </div>
          <button onClick={() => setActive("profile")} className="text-sm text-gold hover:gap-2 font-montserrat hidden md:flex items-center gap-1 transition-all">
            {tr("allSpecialists")} <Icon name="ArrowRight" size={14} />
          </button>
        </div>
        {geo && geo.city && (
          <div className="flex items-center gap-2 mb-8 text-xs text-muted-foreground bg-card border border-gold/30 rounded-sm px-3 py-2 w-fit">
            <Icon name="MapPin" size={13} className="text-gold" />
            <span>{tr("geoYourLocation")}: <span className="text-foreground font-semibold">{geo.city}{geo.country ? `, ${geo.country}` : ""}</span></span>
            <span className="text-muted-foreground/60">·</span>
            <span className="text-gold">{tr("geoSortNearby")}</span>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 stagger">
          {sortedSpecialists.map((s) => (
            <div key={s.name.en} onClick={() => setActive("profile")} className="card-hover shine-on-hover border border-border rounded-sm bg-card overflow-hidden cursor-pointer group">
              <div className="h-48 overflow-hidden relative">
                <img src={s.img} alt={L(s.name, lang)} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
                {s.verified && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 bg-card/90 backdrop-blur-sm border border-gold/40 px-2 py-1 rounded-sm">
                    <Icon name="BadgeCheck" size={12} className="text-gold" />
                    <span className="text-[10px] font-montserrat font-semibold text-gold">{tr("licensed")}</span>
                  </div>
                )}
                {s.distance != null && s.distance <= 100 && (
                  <div className="absolute top-3 left-3 flex items-center gap-1 bg-gold/90 backdrop-blur-sm px-2 py-1 rounded-sm">
                    <Icon name="Navigation" size={11} className="text-[hsl(220,20%,6%)]" />
                    <span className="text-[10px] font-montserrat font-bold text-[hsl(220,20%,6%)]">{tr("geoNearYou")}</span>
                  </div>
                )}
                <div className="absolute bottom-3 left-4 right-4">
                  <div className="font-montserrat font-bold text-base text-foreground">{L(s.name, lang)}</div>
                  <div className="text-xs text-gold font-montserrat font-medium flex items-center gap-2">
                    {L(s.title, lang)}
                    <span className="text-muted-foreground">· {s.experience} {tr("yearsShort")}</span>
                  </div>
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <StarRating rating={s.rating} />
                  <span className="text-xs text-muted-foreground">{s.rating} ({s.reviews})</span>
                  <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
                    <Icon name="MapPin" size={11} />{L(s.city, lang)}
                    {s.distance != null && <span className="text-gold font-semibold">· {s.distance} {tr("geoKm")}</span>}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {s.tags.map((t) => (
                    <span key={t.en} className="tag-security">{L(t, lang)}</span>
                  ))}
                </div>
                <div className="divider-gold mb-4" />
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{tr("cost")}</div>
                    <div className="font-montserrat font-bold text-sm text-gold">{L(s.price, lang)}</div>
                  </div>
                  <button className="border border-gold text-gold text-xs font-montserrat font-semibold px-4 py-2 hover:bg-gold hover:text-[hsl(220,20%,6%)] transition-all rounded-sm">
                    {tr("profileBtn")}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
      )}

      {isClient && (
      <section className="border-t border-border bg-card py-20 relative overflow-hidden ambient-gold">
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="text-center mb-14">
            <div className="tag-security mb-3 inline-block">{tr("process")}</div>
            <h2 className="font-montserrat font-bold text-3xl text-foreground">{tr("howItWorks")}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5 stagger">
            {[
              { n: "01", icon: "UserPlus", title: "step1Title" as const, desc: "step1Desc" as const },
              { n: "02", icon: "FolderOpen", title: "step2Title" as const, desc: "step2Desc" as const },
              { n: "03", icon: "Handshake", title: "step3Title" as const, desc: "step3Desc" as const },
              { n: "04", icon: "TrendingUp", title: "step4Title" as const, desc: "step4Desc" as const },
            ].map((step) => (
              <div key={step.n} className="relative p-6 border border-border rounded-sm bg-background card-hover">
                <div className="font-montserrat font-extrabold text-4xl text-gold/15 absolute top-4 right-5">{step.n}</div>
                <div className="w-11 h-11 gold-gradient rounded flex items-center justify-center mb-5 glow-gold-sm">
                  <Icon name={step.icon} size={19} className="text-[hsl(220,20%,6%)]" />
                </div>
                <div className="font-montserrat font-bold text-sm text-foreground mb-2">{tr(step.title)}</div>
                <div className="text-xs text-muted-foreground leading-relaxed">{tr(step.desc)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      )}

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="tag-security mb-3 inline-block">{tr("features")}</div>
            <h2 className="font-montserrat font-bold text-3xl text-foreground">{tr("whyUs")}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: "ShieldCheck", title: "feat1Title" as const, desc: "feat1Desc" as const },
              { icon: "Lock", title: "feat2Title" as const, desc: "feat2Desc" as const },
              { icon: "CreditCard", title: "feat3Title" as const, desc: "feat3Desc" as const },
              { icon: "BookOpen", title: "feat4Title" as const, desc: "feat4Desc" as const },
              { icon: "Users", title: "feat5Title" as const, desc: "feat5Desc" as const },
              { icon: "Star", title: "feat6Title" as const, desc: "feat6Desc" as const },
            ].map((f) => (
              <div key={f.title} className="group p-6 border border-border rounded-sm bg-card card-hover cursor-default">
                <div className="w-10 h-10 gold-gradient rounded flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110">
                  <Icon name={f.icon} size={18} className="text-[hsl(220,20%,6%)]" />
                </div>
                <div className="font-montserrat font-semibold text-sm text-foreground mb-2">{tr(f.title)}</div>
                <div className="text-xs text-muted-foreground leading-relaxed">{tr(f.desc)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="border-y border-border bg-card py-20 relative overflow-hidden">
        <div className="absolute inset-0 grid-line-bg opacity-50" />
        <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
          <Icon name="Quote" size={40} className="text-gold/30 mx-auto mb-6" />
          <p className="font-montserrat font-medium text-xl md:text-2xl text-foreground leading-relaxed mb-8">
            {tr("testimonialText")}
          </p>
          <div className="flex items-center justify-center gap-3">
            <div className="w-11 h-11 rounded-sm overflow-hidden border border-gold/40">
              <img src={DETECTIVE_IMAGE} alt="Alexander Morozov" className="w-full h-full object-cover" />
            </div>
            <div className="text-left">
              <div className="font-montserrat font-bold text-sm text-foreground flex items-center gap-1.5">
                {L(specialists[0].name, lang)}
                <Icon name="BadgeCheck" size={14} className="text-gold" />
              </div>
              <div className="text-xs text-muted-foreground">{L(specialists[0].title, lang)} · {specialists[0].experience} {tr("yearsShort")}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Security / Encryption */}
      <section className="border-t border-border py-24 relative overflow-hidden ambient-gold">
        <div className="absolute inset-0 grid-line-bg opacity-40" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full z-0" style={{ background: "radial-gradient(circle, hsla(43,80%,52%,0.07) 0%, transparent 70%)" }} />
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="text-center mb-14">
            <div className="inline-flex items-center justify-center mb-6">
              <div className="pulse-ring w-16 h-16 gold-gradient rounded-full flex items-center justify-center security-glow">
                <Icon name="ShieldCheck" size={28} className="text-[hsl(220,20%,6%)]" />
              </div>
            </div>
            <div className="tag-security mb-4 inline-block">{tr("secTag")}</div>
            <h2 className="font-montserrat font-extrabold text-3xl md:text-4xl text-foreground mb-4">{tr("secTitle")}</h2>
            <p className="text-muted-foreground text-base leading-relaxed max-w-2xl mx-auto">{tr("secDesc")}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 stagger mb-12">
            {[
              { icon: "KeyRound", title: "sec1Title" as const, desc: "sec1Desc" as const },
              { icon: "DatabaseZap", title: "sec2Title" as const, desc: "sec2Desc" as const },
              { icon: "MessageSquareLock", title: "sec3Title" as const, desc: "sec3Desc" as const },
              { icon: "Globe", title: "sec4Title" as const, desc: "sec4Desc" as const },
              { icon: "FileLock2", title: "sec5Title" as const, desc: "sec5Desc" as const },
              { icon: "BadgeCheck", title: "sec6Title" as const, desc: "sec6Desc" as const },
            ].map((f) => (
              <div key={f.title} className="group p-6 border border-border rounded-sm bg-card card-hover shine-on-hover cursor-default">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 gold-gradient rounded flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shrink-0">
                    <Icon name={f.icon} fallback="Lock" size={18} className="text-[hsl(220,20%,6%)]" />
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
                { n: "24/7", l: "secStat3" as const },
              ].map((s) => (
                <div key={s.n} className="py-4 sm:py-0 px-6 text-center">
                  <div className="stat-number text-3xl mb-1">{s.n}</div>
                  <div className="text-xs text-muted-foreground">{tr(s.l)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center mt-10">
            <button
              onClick={() => setActive("policy")}
              className="inline-flex items-center gap-2 border border-gold text-gold px-8 py-3.5 font-montserrat font-bold text-sm tracking-wide hover:bg-gold hover:text-[hsl(220,20%,6%)] transition-all rounded-sm"
            >
              <Icon name="FileText" size={16} />
              {tr("secReadPolicy")}
            </button>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="border border-gold/30 rounded-sm glass-card p-10 md:p-16 text-center relative overflow-hidden grid-line-bg glow-gold ambient-gold">
          <div className="relative z-10">
            <div className="tag-security mb-4 inline-block">{tr("closedAccess")}</div>
            <h2 className="font-montserrat font-extrabold text-3xl md:text-4xl text-foreground mb-4">
              {tr("ctaTitle1")}<br /><span className="gold-text-gradient">{tr("ctaTitle2")}</span>
            </h2>
            <p className="text-muted-foreground text-sm mb-8 max-w-xl mx-auto">
              {tr("ctaDesc")}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button onClick={() => setActive(isClient ? "services" : "pricing")} className="shine-on-hover gold-gradient text-[hsl(220,20%,6%)] px-10 py-4 font-montserrat font-bold text-sm tracking-wide hover:opacity-90 transition-opacity rounded-sm glow-gold-sm">
                {tr(isClient ? "heroClientCta1" : "applyJoin")}
              </button>
              <button onClick={() => setActive("contacts")} className="border border-border text-foreground px-8 py-4 font-montserrat font-semibold text-sm hover:border-gold hover:text-gold transition-all rounded-sm">
                {tr("contactUs")}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function ClientDashboard({ setActive }: { setActive: (s: Section) => void }) {
  const { lang, tr } = useLang();
  const [tab, setTab] = useState<"profile" | "requests" | "favorites" | "settings">("profile");

  const tabs = [
    { id: "profile" as const, key: "cdTab1" as const, icon: "User" },
    { id: "requests" as const, key: "cdTab2" as const, icon: "Inbox" },
    { id: "favorites" as const, key: "cdTab3" as const, icon: "Heart" },
    { id: "settings" as const, key: "cdTab4" as const, icon: "Settings" },
  ];

  const providerReviews = [
    { name: { ru: "А. Морозов", en: "A. Morozov" }, role: { ru: "Полиграфолог", en: "Polygraph examiner" }, rating: 5, text: { ru: "Корректный и пунктуальный клиент. Чёткое ТЗ, оплата без задержек. Рекомендую коллегам.", en: "Correct and punctual client. Clear brief, payment without delays. Recommended." }, date: { ru: "1 неделю назад", en: "1 week ago" }, img: DETECTIVE_IMAGE },
    { name: { ru: "И. Семёнов", en: "I. Semenov" }, role: { ru: "TSCM-специалист", en: "TSCM specialist" }, rating: 5, text: { ru: "Приятно работать — предоставил весь доступ к объекту, не вмешивался в процесс.", en: "A pleasure to work with — provided full site access, didn't interfere with the process." }, date: { ru: "3 недели назад", en: "3 weeks ago" }, img: POLYGRAPH_IMAGE },
    { name: { ru: "Е. Власова", en: "E. Vlasova" }, role: { ru: "Частный детектив", en: "Private investigator" }, rating: 4, text: { ru: "Хорошая коммуникация. В следующий раз желательно более детальное ТЗ заранее.", en: "Good communication. Next time a more detailed brief in advance would help." }, date: { ru: "2 месяца назад", en: "2 months ago" }, img: HERO_IMAGE },
  ];

  const requests = [
    { service: { ru: "Полиграф-проверка персонала", en: "Staff polygraph check" }, provider: { ru: "А. Морозов", en: "A. Morozov" }, date: { ru: "12 июня 2026", en: "Jun 12, 2026" }, status: "active" as const },
    { service: { ru: "Поиск прослушки в офисе", en: "Office bug sweep" }, provider: { ru: "И. Семёнов", en: "I. Semenov" }, date: { ru: "28 мая 2026", en: "May 28, 2026" }, status: "done" as const },
    { service: { ru: "Сбор досье на контрагента", en: "Counterparty dossier" }, provider: { ru: "Е. Власова", en: "E. Vlasova" }, date: { ru: "15 мая 2026", en: "May 15, 2026" }, status: "done" as const },
  ];

  const statusMap = { active: { key: "cdStatusActive" as const, cls: "text-gold border-gold/40" }, done: { key: "cdStatusDone" as const, cls: "text-green-400 border-green-500/40" }, new: { key: "cdStatusNew" as const, cls: "text-blue-400 border-blue-500/40" } };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Header card */}
      <div className="border border-gold/30 rounded-sm glass-card p-6 md:p-8 mb-6 flex flex-col sm:flex-row sm:items-center gap-5 security-glow">
        <div className="w-16 h-16 rounded-sm overflow-hidden border-2 border-gold shrink-0">
          <img src={HERO_IMAGE} alt="avatar" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1">
          <div className="text-xs text-muted-foreground font-montserrat mb-1">{tr("dashWelcome")},</div>
          <div className="font-montserrat font-extrabold text-2xl text-foreground flex items-center gap-2">
            Дмитрий Орлов
            <Icon name="BadgeCheck" size={18} className="text-gold" />
          </div>
          <div className="flex items-center gap-3 mt-2">
            <StarRating rating={4.9} />
            <span className="text-xs text-muted-foreground">4.9 · {tr("dashSince")} 2024</span>
          </div>
        </div>
        <button onClick={() => setActive("home")} className="shrink-0 border border-border text-muted-foreground text-xs font-montserrat font-semibold px-4 py-2 rounded-sm hover:border-gold hover:text-gold transition-all flex items-center gap-1.5">
          <Icon name="LogOut" size={13} />
          {tr("dashLogout")}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Tabs sidebar */}
        <aside className="lg:col-span-1">
          <div className="border border-border rounded-sm bg-card p-2 lg:sticky lg:top-24 flex lg:flex-col gap-1 overflow-x-auto">
            {tabs.map((tb) => (
              <button key={tb.id} onClick={() => setTab(tb.id)}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-sm text-xs font-montserrat font-semibold whitespace-nowrap transition-colors text-left ${tab === tb.id ? "gold-gradient text-[hsl(220,20%,6%)]" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}>
                <Icon name={tb.icon} size={15} />
                {tr(tb.key)}
              </button>
            ))}
          </div>
        </aside>

        {/* Content */}
        <div className="lg:col-span-3 space-y-5">
          {tab === "profile" && (
            <>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { n: "27", l: "cdOrdersDone" as const },
                  { n: "19", l: "cdReviewsCount" as const },
                  { n: "96%", l: "cdResponseRate" as const },
                ].map((s) => (
                  <div key={s.n} className="border border-border rounded-sm bg-card p-5 text-center">
                    <div className="stat-number text-2xl mb-1">{s.n}</div>
                    <div className="text-[10px] text-muted-foreground">{tr(s.l)}</div>
                  </div>
                ))}
              </div>
              <div className="border border-gold/30 rounded-sm bg-card p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Icon name="Award" size={18} className="text-gold" />
                  <div className="font-montserrat font-bold text-sm text-foreground">{tr("cdRatingTitle")}</div>
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="stat-number text-4xl">4.9</span>
                  <StarRating rating={4.9} />
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{tr("cdRatingDesc")}</p>
              </div>
              <div className="border border-border rounded-sm bg-card p-6">
                <div className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest mb-4">{tr("cdReviewsTitle")}</div>
                <div className="space-y-4">
                  {providerReviews.map((r) => (
                    <div key={r.name.en} className="flex gap-3 pb-4 border-b border-border last:border-0 last:pb-0">
                      <div className="w-9 h-9 rounded-sm overflow-hidden shrink-0">
                        <img src={r.img} alt={L(r.name, lang)} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <div>
                            <span className="text-xs font-montserrat font-bold text-foreground">{L(r.name, lang)}</span>
                            <span className="text-[10px] text-gold ml-2">{L(r.role, lang)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <StarRating rating={r.rating} />
                            <span className="text-[10px] text-muted-foreground">{L(r.date, lang)}</span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{L(r.text, lang)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {tab === "requests" && (
            <div className="border border-border rounded-sm bg-card p-6">
              <div className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest mb-4">{tr("cdReqTitle")}</div>
              <div className="space-y-3">
                {requests.map((r) => (
                  <div key={r.service.en} className="flex items-center gap-4 p-4 border border-border rounded-sm hover:border-gold/40 transition-colors">
                    <div className="w-9 h-9 gold-gradient rounded flex items-center justify-center shrink-0">
                      <Icon name="FileText" size={15} className="text-[hsl(220,20%,6%)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-montserrat font-semibold text-sm text-foreground truncate">{L(r.service, lang)}</div>
                      <div className="text-xs text-muted-foreground">{L(r.provider, lang)} · {L(r.date, lang)}</div>
                    </div>
                    <span className={`tag-security shrink-0 ${statusMap[r.status].cls}`}>{tr(statusMap[r.status].key)}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => setActive("services")} className="w-full mt-4 border border-gold text-gold text-xs font-montserrat font-semibold py-2.5 rounded-sm hover:bg-gold hover:text-[hsl(220,20%,6%)] transition-all">
                {tr("cdReqEmpty")}
              </button>
            </div>
          )}

          {tab === "favorites" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {specialists.map((s) => (
                <div key={s.name.en} className="border border-border rounded-sm bg-card p-5 card-hover">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-11 h-11 rounded-sm overflow-hidden shrink-0">
                      <img src={s.img} alt={L(s.name, lang)} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <div className="font-montserrat font-bold text-sm text-foreground">{L(s.name, lang)}</div>
                      <div className="text-xs text-gold">{L(s.title, lang)}</div>
                    </div>
                    <Icon name="Heart" size={16} className="text-gold fill-current ml-auto shrink-0" />
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <StarRating rating={s.rating} />
                    <span className="text-xs text-muted-foreground">{s.rating} ({s.reviews})</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setActive("profile")} className="flex-1 gold-gradient text-[hsl(220,20%,6%)] text-xs font-montserrat font-bold py-2 rounded-sm hover:opacity-90 transition-opacity">{tr("cdViewProfile")}</button>
                    <button className="border border-border text-muted-foreground text-xs font-montserrat font-semibold px-3 py-2 rounded-sm hover:border-destructive hover:text-destructive transition-all">{tr("cdRemove")}</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "settings" && (
            <div className="border border-border rounded-sm bg-card p-6 space-y-5">
              <div className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest">{tr("cdSetTitle")}</div>
              <div>
                <label className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest block mb-2">{tr("cdFullName")}</label>
                <input defaultValue="Дмитрий Орлов" className="w-full bg-secondary border border-border rounded-sm px-4 py-3 text-sm text-foreground outline-none focus:border-gold transition-colors" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest block mb-2">Email</label>
                  <input defaultValue="d.orlov@email.com" className="w-full bg-secondary border border-border rounded-sm px-4 py-3 text-sm text-foreground outline-none focus:border-gold transition-colors" />
                </div>
                <div>
                  <label className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest block mb-2">{tr("cdCity")}</label>
                  <input defaultValue="Москва" className="w-full bg-secondary border border-border rounded-sm px-4 py-3 text-sm text-foreground outline-none focus:border-gold transition-colors" />
                </div>
              </div>
              <div className="divider-gold" />
              {[
                { label: "cdNotifications" as const, on: true },
                { label: "cd2fa" as const, on: false },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between">
                  <span className="text-sm text-foreground">{tr(row.label)}</span>
                  <span className={`text-xs font-montserrat font-semibold px-3 py-1 rounded-sm ${row.on ? "bg-gold/15 text-gold" : "bg-secondary text-muted-foreground"}`}>{tr(row.on ? "cdEnabled" : "cdDisabled")}</span>
                </div>
              ))}
              <button className="w-full gold-gradient text-[hsl(220,20%,6%)] py-3 text-xs font-montserrat font-bold rounded-sm hover:opacity-90 transition-opacity">{tr("dashSave")}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProviderDashboard({ setActive }: { setActive: (s: Section) => void }) {
  const { lang, tr } = useLang();
  const [tab, setTab] = useState<"stats" | "plan" | "cases" | "requests">("stats");

  const tabs = [
    { id: "stats" as const, key: "pdTab1" as const, icon: "ChartNoAxesColumn" },
    { id: "plan" as const, key: "pdTab2" as const, icon: "Wallet" },
    { id: "cases" as const, key: "pdTab3" as const, icon: "FolderOpen" },
    { id: "requests" as const, key: "pdTab4" as const, icon: "Inbox" },
  ];

  const incoming = [
    { client: { ru: "ООО «АльфаТех»", en: "AlphaTech LLC" }, service: { ru: "Полиграф для 12 сотрудников", en: "Polygraph for 12 staff" }, budget: { ru: "от 90 000 ₽", en: "from $1,000" }, date: { ru: "сегодня", en: "today" }, status: "new" as const },
    { client: { ru: "Дмитрий О.", en: "Dmitry O." }, service: { ru: "Проверка кандидата", en: "Candidate check" }, budget: { ru: "8 000 ₽", en: "$90" }, date: { ru: "вчера", en: "yesterday" }, status: "new" as const },
    { client: { ru: "ЧОП «Барьер»", en: "Barrier Security" }, service: { ru: "Аудит безопасности офиса", en: "Office security audit" }, budget: { ru: "45 000 ₽", en: "$520" }, date: { ru: "2 дня назад", en: "2 days ago" }, status: "active" as const },
  ];
  const statusMap = { active: { key: "cdStatusActive" as const, cls: "text-gold border-gold/40" }, new: { key: "cdStatusNew" as const, cls: "text-blue-400 border-blue-500/40" } };

  const emailReceipt = async (row: { date: string; plan: keyof typeof t; amount: string; i: number }) => {
    const email = window.prompt(tr("pdHistEmailPrompt"), "");
    if (!email || !email.includes("@")) return;
    try {
      const res = await fetch(func2url["send-receipt"], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiptNo: "SN-" + row.date.split(".").reverse().join("") + "-" + (row.i + 1),
          date: row.date,
          plan: tr(row.plan),
          period: tr("payOneMonth"),
          amount: row.amount,
          payer: L(specialists[0].name, lang),
          method: tr("payCard") + " •••• 4242",
          lang,
          email,
        }),
      });
      window.alert(res.ok ? `${tr("pdHistEmailSent")} ${email}` : tr("pdHistEmailFail"));
    } catch {
      window.alert(tr("pdHistEmailFail"));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Header card */}
      <div className="border border-gold/30 rounded-sm glass-card p-6 md:p-8 mb-6 flex flex-col sm:flex-row sm:items-center gap-5 security-glow">
        <div className="w-16 h-16 rounded-sm overflow-hidden border-2 border-gold shrink-0">
          <img src={DETECTIVE_IMAGE} alt="avatar" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1">
          <div className="text-xs text-muted-foreground font-montserrat mb-1">{tr("dashWelcome")},</div>
          <div className="font-montserrat font-extrabold text-2xl text-foreground flex items-center gap-2">
            {L(specialists[0].name, lang)}
            <Icon name="BadgeCheck" size={18} className="text-gold" />
          </div>
          <div className="flex items-center gap-3 mt-2">
            <StarRating rating={specialists[0].rating} />
            <span className="text-xs text-muted-foreground">{specialists[0].rating} · {L(specialists[0].title, lang)}</span>
          </div>
        </div>
        <button onClick={() => setActive("home")} className="shrink-0 border border-border text-muted-foreground text-xs font-montserrat font-semibold px-4 py-2 rounded-sm hover:border-gold hover:text-gold transition-all flex items-center gap-1.5">
          <Icon name="LogOut" size={13} />
          {tr("dashLogout")}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <aside className="lg:col-span-1">
          <div className="border border-border rounded-sm bg-card p-2 lg:sticky lg:top-24 flex lg:flex-col gap-1 overflow-x-auto">
            {tabs.map((tb) => (
              <button key={tb.id} onClick={() => setTab(tb.id)}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-sm text-xs font-montserrat font-semibold whitespace-nowrap transition-colors text-left ${tab === tb.id ? "gold-gradient text-[hsl(220,20%,6%)]" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}>
                <Icon name={tb.icon} fallback="LayoutDashboard" size={15} />
                {tr(tb.key)}
              </button>
            ))}
          </div>
        </aside>

        <div className="lg:col-span-3 space-y-5">
          {tab === "stats" && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { n: "2 480", l: "pdStatViews" as const, icon: "Eye" },
                  { n: "34", l: "pdStatRequests" as const, icon: "Inbox" },
                  { n: "4.9", l: "pdStatRating" as const, icon: "Star" },
                  { n: "18%", l: "pdStatConversion" as const, icon: "TrendingUp" },
                ].map((s) => (
                  <div key={s.l} className="border border-border rounded-sm bg-card p-5">
                    <div className="flex items-center justify-between mb-2">
                      <Icon name={s.icon} size={15} className="text-gold" />
                      <span className="text-[10px] text-muted-foreground">{tr("pdThisMonth")}</span>
                    </div>
                    <div className="stat-number text-2xl mb-1">{s.n}</div>
                    <div className="text-[10px] text-muted-foreground">{tr(s.l)}</div>
                  </div>
                ))}
              </div>
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
              <div className="border border-gold/30 rounded-sm glass-card p-6 security-glow">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest">{tr("pdCurrentPlan")}</div>
                  <span className="text-xs font-montserrat font-semibold px-3 py-1 rounded-sm bg-gold/15 text-gold">{tr("pdActive")}</span>
                </div>
                <div className="flex items-end gap-2 mb-1">
                  <span className="font-montserrat font-extrabold text-2xl text-foreground">{tr("planProName")}</span>
                  <span className="font-montserrat font-bold text-lg text-gold">{tr("planProPrice")}{tr("perMonth")}</span>
                </div>
                <div className="text-xs text-muted-foreground mb-5">{tr("pdRenews")}: 13.07.2026</div>
                <button onClick={() => setActive("pricing")} className="gold-gradient text-[hsl(220,20%,6%)] px-6 py-2.5 text-xs font-montserrat font-bold rounded-sm hover:opacity-90 transition-opacity">{tr("pdChangePlan")}</button>
              </div>
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
                  <div className="text-xs text-muted-foreground">{tr("pdHistTotal")}: <span className="font-montserrat font-bold text-gold">14 940 ₽</span></div>
                </div>
                <div className="hidden sm:grid grid-cols-[1fr_1fr_auto_auto_auto] gap-3 px-3 pb-2 mb-1 border-b border-border text-[10px] font-montserrat font-semibold text-muted-foreground uppercase tracking-widest">
                  <span>{tr("pdHistDate")}</span>
                  <span>{tr("pdHistPlan")}</span>
                  <span className="text-right">{tr("pdHistAmount")}</span>
                  <span className="text-center">{tr("pdHistStatus")}</span>
                  <span className="text-right">{tr("pdHistReceipt")}</span>
                </div>
                <div className="space-y-1">
                  {([
                    { date: "13.06.2026", plan: "planProName", amount: "2 490 ₽", status: "paid" },
                    { date: "13.05.2026", plan: "planProName", amount: "2 490 ₽", status: "paid" },
                    { date: "13.04.2026", plan: "planProName", amount: "2 490 ₽", status: "paid" },
                    { date: "13.03.2026", plan: "planStartName", amount: "990 ₽", status: "paid" },
                    { date: "13.02.2026", plan: "planStartName", amount: "990 ₽", status: "failed" },
                  ] as const).map((row, i) => {
                    const st = { paid: { key: "pdHistPaid" as const, cls: "text-green-400 border-green-500/40" }, pending: { key: "pdHistPending" as const, cls: "text-gold border-gold/40" }, failed: { key: "pdHistFailed" as const, cls: "text-destructive border-destructive/40" } }[row.status];
                    return (
                      <div key={i} className="grid grid-cols-2 sm:grid-cols-[1fr_1fr_auto_auto_auto] gap-2 sm:gap-3 items-center px-3 py-3 rounded-sm hover:bg-secondary transition-colors text-xs">
                        <span className="text-muted-foreground">{row.date}</span>
                        <span className="font-montserrat font-semibold text-foreground">{tr(row.plan)}</span>
                        <span className="font-montserrat font-bold text-gold sm:text-right">{row.amount}</span>
                        <span className="sm:text-center"><span className={`tag-security ${st.cls}`}>{tr(st.key)}</span></span>
                        <span className="sm:text-right">
                          {row.status === "paid" ? (
                            <span className="inline-flex items-center gap-3">
                              <button
                                onClick={() => downloadReceipt({
                                  receiptNo: "SN-" + row.date.split(".").reverse().join("") + "-" + (i + 1),
                                  date: row.date,
                                  plan: tr(row.plan),
                                  period: tr("payOneMonth"),
                                  amount: row.amount,
                                  payer: L(specialists[0].name, lang),
                                  method: tr("payCard") + " •••• 4242",
                                  lang,
                                })}
                                className="inline-flex items-center gap-1 text-muted-foreground hover:text-gold transition-colors font-montserrat font-semibold"
                              >
                                <Icon name="Download" size={13} /> <span className="hidden lg:inline">{tr("pdHistDownload")}</span>
                              </button>
                              <button
                                onClick={() => emailReceipt({ date: row.date, plan: row.plan, amount: row.amount, i })}
                                className="inline-flex items-center gap-1 text-muted-foreground hover:text-gold transition-colors font-montserrat font-semibold"
                              >
                                <Icon name="Mail" size={13} /> <span className="hidden lg:inline">{tr("pdHistEmail")}</span>
                              </button>
                            </span>
                          ) : (
                            <span className="text-muted-foreground/40">—</span>
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {tab === "cases" && (
            <>
              <div className="border border-border rounded-sm bg-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest">{tr("pdMyCases")}</div>
                  <button className="gold-gradient text-[hsl(220,20%,6%)] px-3 py-1.5 text-[10px] font-montserrat font-bold rounded-sm">{tr("pdAddCase")}</button>
                </div>
                <div className="space-y-3">
                  {cases.map((c, i) => (
                    <div key={c.title.en} className="flex items-center gap-3 p-3 border border-border rounded-sm">
                      <div className="w-8 h-8 gold-gradient rounded flex items-center justify-center shrink-0">
                        <Icon name="FolderOpen" size={14} className="text-[hsl(220,20%,6%)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-montserrat font-semibold text-sm text-foreground truncate">{L(c.title, lang)}</div>
                        <div className="text-[10px] text-muted-foreground">{c.views} · {L(c.category, lang)}</div>
                      </div>
                      <span className={`tag-security shrink-0 ${i === 0 ? "text-yellow-500 border-yellow-600/40" : "text-green-400 border-green-500/40"}`}>{tr(i === 0 ? "pdDraft" : "pdPublished")}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border border-border rounded-sm bg-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest">{tr("pdMyServices")}</div>
                  <button className="gold-gradient text-[hsl(220,20%,6%)] px-3 py-1.5 text-[10px] font-montserrat font-bold rounded-sm">{tr("pdAddService")}</button>
                </div>
                <div className="space-y-3">
                  {services.slice(0, 3).map((s) => (
                    <div key={s.title.en} className="flex items-center gap-3 p-3 border border-border rounded-sm">
                      <div className="w-8 h-8 gold-gradient rounded flex items-center justify-center shrink-0">
                        <Icon name={s.icon} size={14} className="text-[hsl(220,20%,6%)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-montserrat font-semibold text-sm text-foreground truncate">{L(s.title, lang)}</div>
                      </div>
                      <span className="font-montserrat font-bold text-sm text-gold shrink-0">{L(s.price, lang)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {tab === "requests" && (
            <div className="border border-border rounded-sm bg-card p-6">
              <div className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest mb-4">{tr("pdReqTitle")}</div>
              <div className="space-y-3">
                {incoming.map((r) => (
                  <div key={r.service.en} className="p-4 border border-border rounded-sm hover:border-gold/40 transition-colors">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <div className="font-montserrat font-bold text-sm text-foreground">{L(r.client, lang)}</div>
                        <div className="text-xs text-muted-foreground">{tr("pdReqService")}: {L(r.service, lang)}</div>
                      </div>
                      <span className={`tag-security shrink-0 ${statusMap[r.status].cls}`}>{tr(statusMap[r.status].key)}</span>
                    </div>
                    <div className="flex items-center gap-4 mb-3">
                      <span className="text-xs text-muted-foreground">{tr("pdReqBudget")}: <span className="text-gold font-semibold">{L(r.budget, lang)}</span></span>
                      <span className="text-[10px] text-muted-foreground ml-auto">{L(r.date, lang)}</span>
                    </div>
                    <div className="flex gap-2">
                      <button className="flex-1 gold-gradient text-[hsl(220,20%,6%)] text-xs font-montserrat font-bold py-2 rounded-sm hover:opacity-90 transition-opacity">{tr("pdAccept")}</button>
                      <button className="border border-border text-muted-foreground text-xs font-montserrat font-semibold px-4 py-2 rounded-sm hover:border-destructive hover:text-destructive transition-all">{tr("pdDecline")}</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

type PayPlan = { name: keyof typeof t; price: keyof typeof t };

function PaymentModal({ plan, onClose, defaultEmail = "" }: { plan: PayPlan; onClose: () => void; defaultEmail?: string }) {
  const { lang, tr } = useLang();
  const [method, setMethod] = useState<"card" | "sbp">("card");
  const [status, setStatus] = useState<"form" | "processing" | "success">("form");
  const [email, setEmail] = useState(defaultEmail);
  const [emailState, setEmailState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [autoSent, setAutoSent] = useState(false);

  const receipt = (to?: string) => ({
    receiptNo: "SN-" + new Date().toISOString().slice(0, 10).replace(/-/g, "") + "-" + Math.floor(Math.random() * 900 + 100),
    date: new Date().toLocaleDateString(lang === "ru" ? "ru-RU" : "en-US"),
    plan: tr(plan.name),
    period: tr("payOneMonth"),
    amount: tr(plan.price),
    payer: (to || email) || L(specialists[0].name, lang),
    method: tr(method === "card" ? "payCard" : "paySbp"),
    lang,
  });

  const sendTo = async (to: string) => {
    if (!to || !to.includes("@")) return;
    setEmailState("sending");
    try {
      const res = await fetch(func2url["send-receipt"], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...receipt(to), email: to }),
      });
      setEmailState(res.ok ? "sent" : "error");
    } catch {
      setEmailState("error");
    }
  };

  const pay = () => {
    setStatus("processing");
    setTimeout(() => {
      setStatus("success");
      if (defaultEmail && defaultEmail.includes("@")) {
        setAutoSent(true);
        sendTo(defaultEmail);
      }
    }, 1600);
  };

  const sendEmail = () => sendTo(email);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md border border-gold/40 rounded-sm glass-card security-glow max-h-[90vh] overflow-y-auto">
        {status === "success" ? (
          <div className="p-7">
            <div className="text-center mb-6">
              <div className="w-16 h-16 gold-gradient rounded-full flex items-center justify-center mx-auto mb-5 glow-gold-sm">
                <Icon name="Check" size={32} className="text-[hsl(220,20%,6%)]" />
              </div>
              <h3 className="font-montserrat font-extrabold text-xl text-foreground mb-2">{tr("paySuccess")}</h3>
              <p className="text-sm text-muted-foreground">{tr("paySuccessDesc")}</p>
            </div>

            <div className="border border-border rounded-sm bg-card p-4 mb-4">
              {autoSent && emailState === "sending" ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                  <Icon name="Loader" size={16} className="animate-spin text-gold" />
                  {tr("payAutoSending")}
                </div>
              ) : emailState === "sent" ? (
                <>
                  <div className="flex items-center gap-2 text-sm text-green-400 py-2">
                    <Icon name="MailCheck" size={16} />
                    {autoSent ? `${tr("payAutoSent")} ${email}` : tr("payEmailSent")}
                  </div>
                  <button onClick={() => { setEmail(""); setAutoSent(false); setEmailState("idle"); }} className="text-xs text-gold hover:underline mt-1">
                    {tr("payResend")}
                  </button>
                </>
              ) : (
                <>
                  <label className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest block mb-2">{tr("payEmailLabel")}</label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setEmailState("idle"); }}
                      placeholder={tr("payEmailPlaceholder")}
                      className="flex-1 min-w-0 bg-secondary border border-border rounded-sm px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-gold transition-colors"
                    />
                    <button
                      onClick={sendEmail}
                      disabled={emailState === "sending" || !email.includes("@")}
                      className="shrink-0 gold-gradient text-[hsl(220,20%,6%)] px-4 py-2.5 text-xs font-montserrat font-bold rounded-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {emailState === "sending" ? <Icon name="Loader" size={14} className="animate-spin" /> : <Icon name="Send" size={14} />}
                      <span className="hidden sm:inline">{tr(emailState === "sending" ? "payEmailSending" : "payEmailSend")}</span>
                    </button>
                  </div>
                  {emailState === "error" && <div className="text-xs text-destructive mt-2">{tr("payEmailError")}</div>}
                </>
              )}
            </div>

            <button onClick={() => downloadReceipt(receipt())} className="w-full border border-gold text-gold py-2.5 text-sm font-montserrat font-semibold rounded-sm hover:bg-gold hover:text-[hsl(220,20%,6%)] transition-all flex items-center justify-center gap-2 mb-2.5">
              <Icon name="Download" size={15} />
              {tr("payDownloadPdf")}
            </button>
            <button onClick={onClose} className="w-full gold-gradient text-[hsl(220,20%,6%)] py-3 text-sm font-montserrat font-bold rounded-sm hover:opacity-90 transition-opacity">{tr("payDone")}</button>
          </div>
        ) : (
          <div className="p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="font-montserrat font-bold text-lg text-foreground">{tr("payTitle")}</h3>
                <p className="text-xs text-muted-foreground">{tr("paySubtitle")}</p>
              </div>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors"><Icon name="X" size={20} /></button>
            </div>

            <div className="border border-border rounded-sm bg-card p-4 mb-5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{tr("payPlan")}</span>
                <span className="font-montserrat font-semibold text-foreground">{tr(plan.name)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{tr("payPeriod")}</span>
                <span className="font-montserrat font-semibold text-foreground">{tr("payOneMonth")}</span>
              </div>
              <div className="divider-gold my-1" />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{tr("payAmount")}</span>
                <span className="font-montserrat font-extrabold text-2xl text-gold">{tr(plan.price)}</span>
              </div>
            </div>

            <div className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest mb-2">{tr("payMethod")}</div>
            <div className="grid grid-cols-2 gap-2 mb-5">
              {(["card", "sbp"] as const).map((m) => (
                <button key={m} onClick={() => setMethod(m)}
                  className={`flex items-center justify-center gap-2 py-2.5 text-xs font-montserrat font-semibold rounded-sm border transition-all ${method === m ? "border-gold text-gold bg-gold/10" : "border-border text-muted-foreground hover:text-foreground"}`}>
                  <Icon name={m === "card" ? "CreditCard" : "QrCode"} size={15} />
                  {tr(m === "card" ? "payCard" : "paySbp")}
                </button>
              ))}
            </div>

            {method === "card" ? (
              <div className="space-y-3 mb-5">
                <input placeholder="0000 0000 0000 0000" inputMode="numeric" className="w-full bg-secondary border border-border rounded-sm px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-gold transition-colors" />
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="MM / YY" className="w-full bg-secondary border border-border rounded-sm px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-gold transition-colors" />
                  <input placeholder="CVC" inputMode="numeric" className="w-full bg-secondary border border-border rounded-sm px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-gold transition-colors" />
                </div>
                <input placeholder={tr("payCardName")} className="w-full bg-secondary border border-border rounded-sm px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-gold transition-colors" />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 mb-5 py-4">
                <div className="w-36 h-36 bg-secondary border border-border rounded-sm flex items-center justify-center">
                  <Icon name="QrCode" size={90} className="text-gold" />
                </div>
                <p className="text-xs text-muted-foreground text-center max-w-[220px]">{tr("paySbpHint")}</p>
              </div>
            )}

            <button onClick={pay} disabled={status === "processing"}
              className="w-full gold-gradient text-[hsl(220,20%,6%)] py-3.5 text-sm font-montserrat font-bold rounded-sm hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2">
              {status === "processing" ? (
                <><Icon name="Loader" size={16} className="animate-spin" /> {tr("payProcessing")}</>
              ) : (
                <><Icon name="Lock" size={15} /> {tr("payButton")} {tr(plan.price)}</>
              )}
            </button>
            <div className="flex items-center justify-center gap-1.5 mt-3 text-[10px] text-muted-foreground">
              <Icon name="ShieldCheck" size={12} className="text-gold" />
              {tr("paySecure")}
            </div>
            <div className="text-center text-[10px] text-muted-foreground/70 mt-1">{tr("payDemo")}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function PricingSection({ setActive }: { setActive: (s: Section) => void }) {
  const { tr } = useLang();
  const [payPlan, setPayPlan] = useState<PayPlan | null>(null);
  const plans = [
    {
      name: "planStartName" as const,
      price: "planStartPrice" as const,
      for: "planStartFor" as const,
      featured: false,
      enterprise: false,
      features: ["featProfile", "feat5cases", "featChat"] as const,
      muted: ["featCourses", "featPriority", "featTopPlacement", "featManager"] as const,
    },
    {
      name: "planProName" as const,
      price: "planProPrice" as const,
      for: "planProFor" as const,
      featured: true,
      enterprise: false,
      features: ["featProfile", "feat20cases", "featChat", "featCourses", "featPriority"] as const,
      muted: ["featTopPlacement", "featManager"] as const,
    },
    {
      name: "planPremiumName" as const,
      price: "planPremiumPrice" as const,
      for: "planPremiumFor" as const,
      featured: false,
      enterprise: false,
      features: ["featProfile", "featUnlimCases", "featChat", "featCourses", "featPriority", "featTopPlacement", "featBadge"] as const,
      muted: ["featManager"] as const,
    },
    {
      name: "planEntName" as const,
      price: "planEntPrice" as const,
      for: "planEntFor" as const,
      featured: false,
      enterprise: true,
      features: ["featProfile", "featUnlimCases", "featTopPlacement", "featBadge", "featManager", "featTeam", "featApi"] as const,
      muted: [] as const,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="text-center mb-12">
        <div className="tag-security mb-3 inline-block">{tr("pricingTag")}</div>
        <h1 className="font-montserrat font-extrabold text-3xl md:text-4xl text-foreground mb-3">{tr("pricingTitle")}</h1>
        <p className="text-muted-foreground text-sm max-w-2xl mx-auto">{tr("pricingDesc")}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 stagger">
        {plans.map((p) => (
          <div
            key={p.name}
            className={`relative flex flex-col border rounded-sm bg-card p-6 card-hover ${p.featured ? "border-gold security-glow" : "border-border"}`}
          >
            {p.featured && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 badge-pro whitespace-nowrap">{tr("mostPopular")}</div>
            )}
            <div className="mb-5">
              <div className="font-montserrat font-bold text-lg text-foreground mb-1">{tr(p.name)}</div>
              <div className="text-xs text-muted-foreground">{tr(p.for)}</div>
            </div>
            <div className="mb-6">
              <span className="font-montserrat font-extrabold text-3xl text-gold">{tr(p.price)}</span>
              {!p.enterprise && <span className="text-xs text-muted-foreground ml-1">{tr("perMonth")}</span>}
            </div>
            <div className="divider-gold mb-5" />
            <div className="space-y-2.5 flex-1 mb-6">
              {p.features.map((f) => (
                <div key={f} className="flex items-center gap-2">
                  <Icon name="Check" size={14} className="text-gold shrink-0" />
                  <span className="text-xs text-foreground">{tr(f)}</span>
                </div>
              ))}
              {p.muted.map((f) => (
                <div key={f} className="flex items-center gap-2 opacity-40">
                  <Icon name="X" size={14} className="text-muted-foreground shrink-0" />
                  <span className="text-xs text-muted-foreground line-through">{tr(f)}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => p.enterprise ? setActive("contacts") : setPayPlan({ name: p.name, price: p.price })}
              className={`w-full py-3 text-xs font-montserrat font-bold rounded-sm transition-all ${p.featured ? "gold-gradient text-[hsl(220,20%,6%)] hover:opacity-90 glow-gold-sm" : "border border-gold text-gold hover:bg-gold hover:text-[hsl(220,20%,6%)]"}`}
            >
              {p.enterprise ? tr("contactSales") : tr("choosePlan")}
            </button>
          </div>
        ))}
      </div>

      {payPlan && <PaymentModal plan={payPlan} onClose={() => setPayPlan(null)} defaultEmail={PROVIDER_EMAIL} />}

      {/* Commission note */}
      <div className="mt-10 border border-gold/30 rounded-sm glass-card p-6 flex flex-col md:flex-row items-start md:items-center gap-4 security-glow">
        <div className="w-10 h-10 gold-gradient rounded-full flex items-center justify-center shrink-0 glow-gold-sm">
          <Icon name="Wallet" size={18} className="text-[hsl(220,20%,6%)]" />
        </div>
        <div>
          <div className="font-montserrat font-semibold text-sm text-foreground mb-1">{tr("freeForClients")}</div>
          <div className="text-xs text-muted-foreground">{tr("heroClientDesc")}</div>
        </div>
        <button onClick={() => setActive("contacts")} className="shrink-0 border border-border text-muted-foreground text-xs font-montserrat font-semibold px-4 py-2 hover:border-gold hover:text-gold transition-all rounded-sm ml-auto">
          {tr("contactUs")}
        </button>
      </div>
    </div>
  );
}

function ProfileSection({ setActive }: { setActive: (s: Section) => void }) {
  const { lang, tr } = useLang();
  const [activeTab, setActiveTab] = useState<"cases" | "services" | "reviews">("cases");

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
              <img src={DETECTIVE_IMAGE} alt="Профиль" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
            </div>
            <div className="p-5 -mt-8 relative">
              <div className="w-16 h-16 rounded-sm border-2 border-gold overflow-hidden mb-3">
                <img src={DETECTIVE_IMAGE} alt="Аватар" className="w-full h-full object-cover" />
              </div>
              <div className="flex items-center gap-2 mb-1">
                <div className="font-montserrat font-bold text-lg text-foreground">{L(specialists[0].name, lang)}</div>
                <Icon name="BadgeCheck" size={16} className="text-gold" />
              </div>
              <div className="text-gold text-xs font-montserrat font-medium mb-1">{L(specialists[0].title, lang)} · 12 {tr("yearsShort")}</div>
              <div className="text-xs text-muted-foreground mb-4">{L(specialists[0].city, lang)}</div>
              <div className="flex items-center gap-2 mb-4">
                <StarRating rating={4.9} />
                <span className="text-xs text-muted-foreground">4.9 (134 отзыва)</span>
              </div>
              <div className="divider-gold mb-4" />
              <div className="grid grid-cols-3 text-center gap-2 mb-4">
                <div><div className="stat-number text-xl">312</div><div className="text-[10px] text-muted-foreground">{tr("casesCount")}</div></div>
                <div><div className="stat-number text-xl">134</div><div className="text-[10px] text-muted-foreground">{tr("reviewsCount")}</div></div>
                <div><div className="stat-number text-xl">98%</div><div className="text-[10px] text-muted-foreground">{tr("success")}</div></div>
              </div>
              <button className="w-full gold-gradient text-[hsl(220,20%,6%)] py-2.5 text-xs font-montserrat font-bold rounded-sm hover:opacity-90 transition-opacity">{tr("contactBtn")}</button>
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
              { title: { ru: "Лицензия ФСИН", en: "FSIN License" }, year: "2019" },
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
                    <div key={c.title.en} className="p-4 border border-border rounded-sm hover:border-gold/40 transition-colors cursor-pointer">
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
                  {services.slice(0, 3).map((s) => (
                    <div key={s.title.en} className="flex items-center gap-4 p-4 border border-border rounded-sm hover:border-gold/40 transition-colors cursor-pointer">
                      <div className="w-9 h-9 gold-gradient rounded flex items-center justify-center shrink-0">
                        <Icon name={s.icon} size={15} className="text-[hsl(220,20%,6%)]" />
                      </div>
                      <div className="flex-1">
                        <div className="font-montserrat font-semibold text-sm text-foreground">{L(s.title, lang)}</div>
                        <div className="text-xs text-muted-foreground">{L(s.desc, lang).slice(0, 60)}...</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-montserrat font-bold text-gold">{L(s.price, lang)}</div>
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
        <button className="gold-gradient text-[hsl(220,20%,6%)] px-5 py-2.5 text-xs font-montserrat font-bold rounded-sm self-start md:self-auto">
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
            <div key={c.title.en} className="border border-border rounded-sm bg-card p-6 card-hover shine-on-hover cursor-pointer">
              <div className="flex items-start gap-3 mb-3">
                <span className="tag-security">{L(c.category, lang)}</span>
                <span className="text-[10px] text-muted-foreground ml-auto">{L(c.date, lang)}</span>
              </div>
              <h3 className="font-montserrat font-bold text-base text-foreground mb-2 leading-snug">{L(c.title, lang)}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">{L(c.summary, lang)}</p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 gold-gradient rounded-sm flex items-center justify-center">
                    <Icon name="User" size={10} className="text-[hsl(220,20%,6%)]" />
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
                  <img src={s.img} alt={L(s.name, lang)} className="w-full h-full object-cover" />
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
              {["OSINT", "Полиграф", "TSCM", "HR-безопасность", "Корпоративный шпионаж", "RF-сканирование", "Детектив", "Расследование"].map((t) => (
                <span key={t} className="tag-security cursor-pointer hover:bg-gold/10 transition-colors">{t}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ServicesSection() {
  const { lang, tr } = useLang();
  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="mb-10">
        <div className="tag-security mb-3 inline-block">{tr("catalog")}</div>
        <h2 className="font-montserrat font-bold text-3xl text-foreground mb-2">{tr("servicesTitle")}</h2>
        <p className="text-muted-foreground text-sm">{tr("servicesDesc")}</p>
      </div>

      <div className="flex gap-3 mb-10">
        <div className="flex-1 flex items-center gap-3 border border-border bg-card rounded-sm px-4">
          <Icon name="Search" size={16} className="text-muted-foreground" />
          <input placeholder={tr("searchServices")} className="flex-1 bg-transparent py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none" />
        </div>
        <button className="gold-gradient text-[hsl(220,20%,6%)] px-6 py-3 text-xs font-montserrat font-bold rounded-sm">{tr("search")}</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 stagger">
        {services.map((s) => (
          <div key={s.title.en} className="group border border-border rounded-sm bg-card p-6 card-hover shine-on-hover cursor-pointer">
            <div className="flex items-start justify-between mb-5">
              <div className="w-11 h-11 gold-gradient rounded flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                <Icon name={s.icon} size={20} className="text-[hsl(220,20%,6%)]" />
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Icon name="Star" size={11} className="text-gold fill-current" />
                4.9
              </div>
            </div>
            <h3 className="font-montserrat font-bold text-sm text-foreground mb-2">{L(s.title, lang)}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed mb-5">{L(s.desc, lang)}</p>
            <div className="divider-gold mb-4" />
            <div className="flex items-center justify-between">
              <div>
                <div className="font-montserrat font-extrabold text-base text-gold">{L(s.price, lang)}</div>
                <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Icon name="Clock" size={10} />{L(s.time, lang)}
                </div>
              </div>
              <button className="border border-gold text-gold text-xs font-montserrat font-semibold px-4 py-2 hover:bg-gold hover:text-[hsl(220,20%,6%)] transition-all rounded-sm">{tr("order")}</button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 border border-gold/30 rounded-sm bg-card p-6 flex flex-col md:flex-row items-start md:items-center gap-4">
        <div className="w-10 h-10 gold-gradient rounded flex items-center justify-center shrink-0">
          <Icon name="Percent" size={18} className="text-[hsl(220,20%,6%)]" />
        </div>
        <div>
          <div className="font-montserrat font-semibold text-sm text-foreground mb-1">{tr("commission")}</div>
          <div className="text-xs text-muted-foreground">{tr("commissionDesc")}</div>
        </div>
        <button className="shrink-0 border border-border text-muted-foreground text-xs font-montserrat font-semibold px-4 py-2 hover:border-gold hover:text-gold transition-all rounded-sm ml-auto">{tr("more")}</button>
      </div>
    </div>
  );
}

function CoursesSection() {
  const { lang, tr } = useLang();
  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="mb-10">
        <div className="tag-security mb-3 inline-block">{tr("education")}</div>
        <h2 className="font-montserrat font-bold text-3xl text-foreground mb-2">{tr("coursesTitle")}</h2>
        <p className="text-muted-foreground text-sm">{tr("coursesDesc")}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10 stagger">
        {courses.map((c) => (
          <div key={c.title.en} className="group border border-border rounded-sm bg-card overflow-hidden card-hover shine-on-hover cursor-pointer">
            <div className="h-44 overflow-hidden relative">
              <img src={c.img} alt={L(c.title, lang)} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
              <div className="absolute top-3 left-3"><span className="badge-pro">{L(c.level, lang)}</span></div>
            </div>
            <div className="p-5">
              <h3 className="font-montserrat font-bold text-sm text-foreground mb-2 leading-snug">{L(c.title, lang)}</h3>
              <div className="text-xs text-muted-foreground mb-3">{L(c.instructor, lang)} · {L(c.duration, lang)}</div>
              <div className="flex items-center gap-2 mb-4">
                <StarRating rating={c.rating} />
                <span className="text-xs text-muted-foreground">{c.rating}</span>
                <span className="text-xs text-muted-foreground ml-auto">{c.students} {tr("students")}</span>
              </div>
              <div className="divider-gold mb-4" />
              <div className="flex items-center justify-between">
                <div className="font-montserrat font-extrabold text-lg text-gold">{L(c.price, lang)}</div>
                <button className="gold-gradient text-[hsl(220,20%,6%)] px-4 py-2 text-xs font-montserrat font-bold rounded-sm hover:opacity-90 transition-opacity">{tr("enroll")}</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: "BookOpen", n: "47", l: tr("coursesStat") },
          { icon: "Users", n: "2 800+", l: tr("graduates") },
          { icon: "Award", n: "31", l: tr("instructors") },
          { icon: "Star", n: "4.8", l: tr("avgRating") },
        ].map((s) => (
          <div key={s.l} className="border border-border rounded-sm bg-card p-5 flex items-center gap-4">
            <div className="w-9 h-9 gold-gradient rounded flex items-center justify-center shrink-0">
              <Icon name={s.icon} size={16} className="text-[hsl(220,20%,6%)]" />
            </div>
            <div>
              <div className="stat-number text-xl">{s.n}</div>
              <div className="text-xs text-muted-foreground">{s.l}</div>
            </div>
          </div>
        ))}
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
        <button className="gold-gradient text-[hsl(220,20%,6%)] px-6 py-3 text-xs font-montserrat font-bold rounded-sm">{tr("search")}</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 stagger">
        {guards.map((g) => (
          <div key={g.name.en} className="card-hover shine-on-hover border border-border rounded-sm bg-card overflow-hidden cursor-pointer group">
            <div className="h-48 overflow-hidden relative">
              <img src={g.img} alt={L(g.name, lang)} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
              <div className="absolute top-3 right-3 flex items-center gap-1 bg-card/90 backdrop-blur-sm border border-gold/40 px-2 py-1 rounded-sm">
                <Icon name="BadgeCheck" size={12} className="text-gold" />
                <span className="text-[10px] font-montserrat font-semibold text-gold">{tr("licensed")}</span>
              </div>
              <div className="absolute bottom-3 left-4 right-4">
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
                  <span key={tag.en} className="tag-security">{L(tag, lang)}</span>
                ))}
              </div>
              <div className="divider-gold mb-4" />
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{tr("cost")}</div>
                  <div className="font-montserrat font-bold text-sm text-gold">{L(g.price, lang)}</div>
                </div>
                <button className="border border-gold text-gold text-xs font-montserrat font-semibold px-4 py-2 hover:bg-gold hover:text-[hsl(220,20%,6%)] transition-all rounded-sm">
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
            <div key={x.title.en} className="group border border-border rounded-sm bg-card p-6 card-hover shine-on-hover cursor-default">
              <div className="w-11 h-11 gold-gradient rounded-full flex items-center justify-center mb-4 glow-gold-sm transition-transform duration-300 group-hover:scale-110">
                <Icon name={x.icon} size={19} className="text-[hsl(220,20%,6%)]" />
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

function ChatSection({ chatInput, setChatInput }: { chatInput: string; setChatInput: (v: string) => void }) {
  const { lang, tr } = useLang();
  const rooms = [
    { name: { ru: "Общий чат", en: "General" }, online: 24 },
    { name: { ru: "Полиграфологи", en: "Polygraph examiners" }, online: 8 },
    { name: { ru: "TSCM-специалисты", en: "TSCM specialists" }, online: 5 },
    { name: { ru: "Детективы", en: "Investigators" }, online: 11 },
    { name: { ru: "Новости отрасли", en: "Industry news" }, online: 32 },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="mb-6">
        <div className="tag-security mb-3 inline-block">{tr("community")}</div>
        <h2 className="font-montserrat font-bold text-3xl text-foreground">{tr("proChat")}</h2>
      </div>
      <div className="border border-border rounded-sm bg-card overflow-hidden" style={{ height: "600px" }}>
        <div className="flex h-full">
          <div className="w-56 border-r border-border flex-col hidden md:flex">
            <div className="p-4 border-b border-border">
              <div className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest">{tr("channels")}</div>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin">
              {rooms.map((r, i) => (
                <div key={r.name.en} className={`px-4 py-3 cursor-pointer hover:bg-secondary transition-colors border-b border-border last:border-0 ${i === 0 ? "bg-secondary" : ""}`}>
                  <div className="text-xs font-montserrat font-medium text-foreground mb-1"># {L(r.name, lang)}</div>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    <span className="text-[10px] text-muted-foreground">{r.online} {tr("online")}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b border-border flex items-center gap-3">
              <div className="text-sm font-montserrat font-semibold text-foreground"># {L(rooms[0].name, lang)}</div>
              <div className="flex items-center gap-1 ml-auto">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span className="text-xs text-muted-foreground">24 {tr("online")}</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin">
              {messages.map((m, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-8 h-8 gold-gradient rounded-sm flex items-center justify-center shrink-0 font-montserrat font-bold text-xs text-[hsl(220,20%,6%)]">
                    {L(m.user, lang)[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-montserrat font-semibold text-foreground">{L(m.user, lang)}</span>
                      <span className="text-[10px] text-muted-foreground">{m.time}</span>
                    </div>
                    <div className="text-sm text-muted-foreground leading-relaxed">{L(m.text, lang)}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-border">
              <div className="flex gap-3">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={tr("writeMessage")}
                  className="flex-1 bg-secondary border border-border rounded-sm px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-gold transition-colors"
                />
                <button className="gold-gradient text-[hsl(220,20%,6%)] px-4 py-2.5 rounded-sm hover:opacity-90 transition-opacity">
                  <Icon name="Send" size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ForumSection() {
  const { lang, tr } = useLang();
  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="tag-security mb-3 inline-block">{tr("discussions")}</div>
          <h2 className="font-montserrat font-bold text-3xl text-foreground">{tr("proForum")}</h2>
        </div>
        <button className="gold-gradient text-[hsl(220,20%,6%)] px-5 py-2.5 text-xs font-montserrat font-bold rounded-sm self-start">
          {tr("createTopic")}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-3">
          <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 text-[10px] font-montserrat font-semibold uppercase tracking-widest text-muted-foreground border-b border-border">
            <div className="col-span-7">{tr("topic")}</div>
            <div className="col-span-2 text-center">{tr("replies")}</div>
            <div className="col-span-2 text-center">{tr("views")}</div>
            <div className="col-span-1" />
          </div>
          {forumTopics.map((tp) => (
            <div key={tp.title.en} className="border border-border rounded-sm bg-card p-4 card-hover cursor-pointer">
              <div className="md:grid grid-cols-12 gap-4 items-center">
                <div className="col-span-7">
                  <div className="flex items-center gap-2 mb-1">
                    {tp.hot && <Icon name="Flame" size={12} className="text-orange-400" />}
                    <span className="tag-security">{L(tp.category, lang)}</span>
                  </div>
                  <div className="font-montserrat font-semibold text-sm text-foreground mt-2">{L(tp.title, lang)}</div>
                </div>
                <div className="col-span-2 text-center mt-3 md:mt-0">
                  <div className="text-xs font-montserrat font-bold text-foreground">{tp.replies}</div>
                  <div className="text-[10px] text-muted-foreground">{tr("repliesLower")}</div>
                </div>
                <div className="col-span-2 text-center">
                  <div className="text-xs font-montserrat font-bold text-foreground">{tp.views}</div>
                  <div className="text-[10px] text-muted-foreground">{tr("viewsLower")}</div>
                </div>
                <div className="col-span-1 text-right">
                  <Icon name="ChevronRight" size={14} className="text-muted-foreground ml-auto" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="border border-border rounded-sm bg-card p-5">
            <div className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest mb-4">{tr("statistics")}</div>
            {[{ l: tr("topics"), v: "248" }, { l: tr("answers"), v: "4 120" }, { l: tr("members"), v: "1 240" }].map((s) => (
              <div key={s.l} className="flex justify-between py-2 border-b border-border last:border-0">
                <span className="text-xs text-muted-foreground">{s.l}</span>
                <span className="text-xs font-montserrat font-bold text-gold">{s.v}</span>
              </div>
            ))}
          </div>
          <div className="border border-border rounded-sm bg-card p-5">
            <div className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest mb-4">{tr("sections")}</div>
            {[
              { ru: "Право и лицензирование", en: "Law & licensing" },
              { ru: "Оборудование", en: "Equipment" },
              { ru: "Методики", en: "Methodologies" },
              { ru: "Обучение", en: "Training" },
              { ru: "Бизнес", en: "Business" },
            ].map((r) => (
              <div key={r.en} className="flex items-center gap-2 py-2 border-b border-border last:border-0 cursor-pointer">
                <div className="w-1 h-1 rounded-full bg-gold" />
                <span className="text-xs text-muted-foreground hover:text-gold transition-colors">{L(r, lang)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ContactsSection() {
  const { tr } = useLang();
  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="mb-10">
        <div className="tag-security mb-3 inline-block">{tr("support")}</div>
        <h2 className="font-montserrat font-bold text-3xl text-foreground mb-2">{tr("contactsTitle")}</h2>
        <p className="text-muted-foreground text-sm">{tr("contactsDesc")}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="border border-border rounded-sm bg-card p-8">
          <div className="text-sm font-montserrat font-bold text-foreground mb-6">{tr("writeSupport")}</div>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest block mb-2">{tr("name")}</label>
              <input placeholder={tr("yourName")} className="w-full bg-secondary border border-border rounded-sm px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-gold transition-colors" />
            </div>
            <div>
              <label className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest block mb-2">Email</label>
              <input placeholder="your@email.com" className="w-full bg-secondary border border-border rounded-sm px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-gold transition-colors" />
            </div>
            <div>
              <label className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest block mb-2">{tr("subject")}</label>
              <select className="w-full bg-secondary border border-border rounded-sm px-4 py-3 text-sm text-muted-foreground outline-none focus:border-gold transition-colors">
                <option>{tr("subjVerify")}</option>
                <option>{tr("subjPayment")}</option>
                <option>{tr("subjTech")}</option>
                <option>{tr("subjComplaint")}</option>
                <option>{tr("subjOther")}</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest block mb-2">{tr("message")}</label>
              <textarea rows={4} placeholder={tr("describeQuestion")} className="w-full bg-secondary border border-border rounded-sm px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-gold transition-colors resize-none" />
            </div>
            <button className="w-full gold-gradient text-[hsl(220,20%,6%)] py-3.5 font-montserrat font-bold text-sm rounded-sm hover:opacity-90 transition-opacity">
              {tr("sendMessage")}
            </button>
          </div>
        </div>

        <div className="space-y-5">
          {[
            { icon: "Mail", title: tr("emailSupport"), val: "support@securenet.ru", desc: tr("emailSupportDesc") },
            { icon: "Phone", title: tr("phone"), val: "+7 (495) 123-45-67", desc: tr("phoneDesc") },
            { icon: "MessageSquare", title: "Telegram", val: "@securenet_support", desc: tr("telegramDesc") },
            { icon: "MapPin", title: tr("legalAddress"), val: "125009, Москва, ул. Тверская, д. 1", desc: "ООО «СекьюрНет», ИНН 7701234567" },
          ].map((c) => (
            <div key={c.title} className="border border-border rounded-sm bg-card p-5 flex gap-4 card-hover">
              <div className="w-10 h-10 gold-gradient rounded flex items-center justify-center shrink-0">
                <Icon name={c.icon} size={18} className="text-[hsl(220,20%,6%)]" />
              </div>
              <div>
                <div className="text-xs font-montserrat font-semibold text-muted-foreground uppercase tracking-widest mb-1">{c.title}</div>
                <div className="font-montserrat font-bold text-sm text-foreground mb-0.5">{c.val}</div>
                <div className="text-xs text-muted-foreground">{c.desc}</div>
              </div>
            </div>
          ))}

          <div className="border border-gold/30 rounded-sm bg-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Icon name="Clock" size={14} className="text-gold" />
              <div className="text-xs font-montserrat font-semibold text-gold">{tr("workHours")}</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { d: tr("monFri"), t: "09:00 – 20:00" },
                { d: tr("sat"), t: "10:00 – 16:00" },
                { d: tr("sun"), t: tr("dayOff") },
                { d: tr("holidays"), t: tr("bySchedule") },
              ].map((w) => (
                <div key={w.d}>
                  <div className="text-[10px] text-muted-foreground">{w.d}</div>
                  <div className="text-xs font-montserrat font-semibold text-foreground">{w.t}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SecurityPolicySection({ setActive }: { setActive: (s: Section) => void }) {
  const { tr } = useLang();

  const sections = [
    { icon: "DatabaseZap", title: "pol1Title" as const, text: "pol1Text" as const },
    { icon: "KeyRound", title: "pol2Title" as const, text: "pol2Text" as const },
    { icon: "MessageSquareLock", title: "pol3Title" as const, text: "pol3Text" as const },
    { icon: "Globe", title: "pol4Title" as const, text: "pol4Text" as const },
    { icon: "FileLock2", title: "pol5Title" as const, text: "pol5Text" as const },
    { icon: "BadgeCheck", title: "pol6Title" as const, text: "pol6Text" as const },
    { icon: "Server", title: "pol7Title" as const, text: "pol7Text" as const },
    { icon: "Scale", title: "pol8Title" as const, text: "pol8Text" as const },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="border border-gold/30 rounded-sm glass-card p-8 md:p-10 mb-8 relative overflow-hidden security-glow ambient-gold">
        <div className="absolute inset-0 grid-line-bg opacity-30" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
          <div className="w-16 h-16 gold-gradient rounded-full flex items-center justify-center shrink-0 glow-gold-sm">
            <Icon name="ShieldCheck" size={30} className="text-[hsl(220,20%,6%)]" />
          </div>
          <div>
            <div className="tag-security mb-3 inline-block">{tr("polTag")}</div>
            <h1 className="font-montserrat font-extrabold text-3xl md:text-4xl text-foreground mb-2">{tr("polTitle")}</h1>
            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Icon name="Calendar" size={12} className="text-gold" />
              {tr("polUpdated")}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar contents */}
        <aside className="lg:col-span-1 order-2 lg:order-1">
          <div className="lg:sticky lg:top-24 border border-border rounded-sm bg-card p-5">
            <div className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest mb-4">{tr("polNav")}</div>
            {sections.map((s, i) => (
              <a key={s.title} href={`#pol-${i}`} className="flex items-center gap-2 py-2 border-b border-border last:border-0 cursor-pointer group">
                <span className="font-montserrat font-bold text-[10px] text-gold w-4">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-xs text-muted-foreground group-hover:text-gold transition-colors">{tr(s.title).replace(/^\d+\.\s*/, "")}</span>
              </a>
            ))}
          </div>
        </aside>

        {/* Content */}
        <div className="lg:col-span-3 order-1 lg:order-2">
          <div className="border border-border rounded-sm bg-card p-6 md:p-8 mb-6">
            <p className="text-sm text-muted-foreground leading-relaxed">{tr("polIntro")}</p>
          </div>

          <div className="space-y-5 stagger">
            {sections.map((s, i) => (
              <div key={s.title} id={`pol-${i}`} className="border border-border rounded-sm bg-card p-6 md:p-7 card-hover scroll-mt-24">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 gold-gradient rounded flex items-center justify-center shrink-0 glow-gold-sm">
                    <Icon name={s.icon} fallback="Lock" size={19} className="text-[hsl(220,20%,6%)]" />
                  </div>
                  <div>
                    <h2 className="font-montserrat font-bold text-base text-foreground mb-2">{tr(s.title)}</h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">{tr(s.text)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Contact callout */}
          <div className="mt-8 border border-gold/30 rounded-sm glass-card p-8 text-center security-glow">
            <Icon name="LifeBuoy" size={32} className="text-gold mx-auto mb-4" />
            <h2 className="font-montserrat font-bold text-xl text-foreground mb-2">{tr("polContactTitle")}</h2>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto mb-6">{tr("polContactText")}</p>
            <button
              onClick={() => setActive("contacts")}
              className="gold-gradient text-[hsl(220,20%,6%)] px-8 py-3 font-montserrat font-bold text-sm rounded-sm hover:opacity-90 transition-opacity"
            >
              {tr("polContactBtn")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}