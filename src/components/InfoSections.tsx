import { useState, useEffect, useRef, useMemo } from "react";
import Icon from "@/components/ui/icon";
import { useLang, t } from "@/lib/i18n";
import { trackGoal, GOALS } from "@/lib/analytics";
import ShareButtons from "@/components/ShareButtons";
import { type BlogPost } from "@/lib/blog";
import { useAutoTranslate } from "@/lib/autotranslate";
import { type Section } from "@/lib/shared";

type MobilePlatform = "ios" | "android" | "desktop";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function detectMobilePlatform(): MobilePlatform {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent || "";
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && typeof document !== "undefined" && "ontouchend" in document);
  if (isIOS) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "desktop";
}

const INSTALL_DISMISS_KEY = "shchit_install_dismissed";

export function InstallPromptBanner({ setActive }: { setActive: (s: Section) => void }) {
  const { tr } = useLang();
  const [visible, setVisible] = useState(false);
  const [, setPlatform] = useState<MobilePlatform>("desktop");
  const [installEvt, setInstallEvt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const p = detectMobilePlatform();
    setPlatform(p);
    // Показываем только на телефонах
    if (p === "desktop") return;
    // Уже установлено (открыто как приложение) — не показываем
    const standalone = window.matchMedia?.("(display-mode: standalone)").matches
      || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone) return;
    // Пользователь ранее закрыл приглашение — не надоедаем 14 дней
    const dismissed = Number(localStorage.getItem(INSTALL_DISMISS_KEY) || 0);
    if (dismissed && Date.now() - dismissed < 14 * 24 * 60 * 60 * 1000) return;

    const onPrompt = (e: Event) => { e.preventDefault(); setInstallEvt(e as BeforeInstallPromptEvent); };
    const onInstalled = () => setVisible(false);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    // Появляемся мягко, спустя несколько секунд после захода
    const timer = setTimeout(() => setVisible(true), 3500);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = () => {
    localStorage.setItem(INSTALL_DISMISS_KEY, String(Date.now()));
    setVisible(false);
  };

  const install = async () => {
    if (installEvt) {
      installEvt.prompt();
      await installEvt.userChoice;
      setInstallEvt(null);
      setVisible(false);
      return;
    }
    // Safari/iOS и прочие — ведём на страницу с пошаговой инструкцией
    dismiss();
    setActive("mobileapp");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-[70] p-3 sm:hidden animate-rise" role="dialog" aria-label={tr("maTitle")}>
      <div className="max-w-md mx-auto bg-card border border-gold/40 rounded-lg shadow-2xl security-glow p-4 flex items-center gap-3">
        <div className="w-11 h-11 gold-gradient rounded-lg flex items-center justify-center shrink-0 glow-gold-sm">
          <Icon name="Smartphone" size={22} className="text-[hsl(28,20%,7%)]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-montserrat font-bold text-sm text-foreground leading-tight">{tr("installBannerTitle")}</div>
          <div className="text-[11px] text-muted-foreground leading-snug mt-0.5">{tr("installBannerText")}</div>
        </div>
        <div className="flex flex-col gap-1.5 shrink-0">
          <button
            onClick={install}
            className="gold-gradient text-[hsl(28,20%,7%)] px-3.5 py-2 font-montserrat font-bold text-xs rounded-sm hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            {tr("installBannerBtn")}
          </button>
          <button
            onClick={dismiss}
            className="text-[10px] text-muted-foreground hover:text-foreground font-montserrat font-semibold"
          >
            {tr("installBannerLater")}
          </button>
        </div>
      </div>
    </div>
  );
}

export function MobileAppSection({ setActive }: { setActive: (s: Section) => void }) {
  const { tr } = useLang();
  const [platform, setPlatform] = useState<MobilePlatform>("desktop");
  const [tab, setTab] = useState<MobilePlatform>("ios");
  const [installEvt, setInstallEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const instrRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const p = detectMobilePlatform();
    setPlatform(p);
    setTab(p === "desktop" ? "android" : p);
    const standalone = window.matchMedia?.("(display-mode: standalone)").matches
      || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setInstalled(!!standalone);
    const onPrompt = (e: Event) => { e.preventDefault(); setInstallEvt(e as BeforeInstallPromptEvent); };
    const onInstalled = () => { setInstalled(true); setInstallEvt(null); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const doInstall = async () => {
    if (installEvt) {
      // Браузер поддерживает установку в один клик (Chrome, Edge, Android)
      installEvt.prompt();
      const res = await installEvt.userChoice;
      if (res?.outcome === "accepted") setInstalled(true);
      setInstallEvt(null);
      return;
    }
    // Браузер без автоустановки (Safari/iOS и др.) — показываем инструкцию для устройства
    setTab(platform === "desktop" ? "android" : platform);
    instrRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const steps: Record<MobilePlatform, { icon: string; title: keyof typeof t; text: keyof typeof t }[]> = {
    ios: [
      { icon: "Compass", title: "maIosS1T", text: "maIosS1D" },
      { icon: "Share", title: "maIosS2T", text: "maIosS2D" },
      { icon: "SquarePlus", title: "maIosS3T", text: "maIosS3D" },
      { icon: "Check", title: "maIosS4T", text: "maIosS4D" },
    ],
    android: [
      { icon: "Chrome", title: "maAndS1T", text: "maAndS1D" },
      { icon: "EllipsisVertical", title: "maAndS2T", text: "maAndS2D" },
      { icon: "Download", title: "maAndS3T", text: "maAndS3D" },
      { icon: "Check", title: "maAndS4T", text: "maAndS4D" },
    ],
    desktop: [
      { icon: "Globe", title: "maDeskS1T", text: "maDeskS1D" },
      { icon: "MonitorDown", title: "maDeskS2T", text: "maDeskS2D" },
      { icon: "Check", title: "maDeskS3T", text: "maDeskS3D" },
    ],
  };

  const tabs: { id: MobilePlatform; icon: string; label: keyof typeof t }[] = [
    { id: "ios", icon: "Apple", label: "maTabIos" },
    { id: "android", icon: "Smartphone", label: "maTabAndroid" },
    { id: "desktop", icon: "Monitor", label: "maTabDesktop" },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="border border-gold/30 rounded-sm glass-card p-8 md:p-10 mb-8 relative overflow-hidden security-glow ambient-gold">
        <div className="absolute inset-0 grid-line-bg opacity-30" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
          <div className="w-16 h-16 gold-gradient rounded-full flex items-center justify-center shrink-0 glow-gold-sm">
            <Icon name="Smartphone" size={30} className="text-[hsl(28,20%,7%)]" />
          </div>
          <div>
            <div className="tag-security mb-3 inline-block">{tr("maTag")}</div>
            <h1 className="font-montserrat font-extrabold text-3xl md:text-4xl text-foreground mb-2">{tr("maTitle")}</h1>
            <p className="text-sm text-muted-foreground max-w-2xl">{tr("maSubtitle")}</p>
          </div>
        </div>
      </div>

      {/* What is it — honest explanation */}
      <div className="border border-gold/40 rounded-sm bg-card p-6 md:p-7 mb-6 flex items-start gap-4">
        <Icon name="Info" size={22} className="text-gold shrink-0 mt-0.5" />
        <div>
          <h2 className="font-montserrat font-bold text-base text-foreground mb-2">{tr("maWhatTitle")}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{tr("maWhatText")}</p>
        </div>
      </div>

      {/* Benefits */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {([["Zap", "maBen1T", "maBen1D"], ["WifiOff", "maBen2T", "maBen2D"], ["ShieldCheck", "maBen3T", "maBen3D"]] as const).map(([ic, tt, dd]) => (
          <div key={tt} className="border border-border rounded-sm bg-card p-5">
            <div className="w-10 h-10 gold-gradient rounded flex items-center justify-center mb-3 glow-gold-sm">
              <Icon name={ic} size={18} className="text-[hsl(28,20%,7%)]" />
            </div>
            <div className="font-montserrat font-bold text-sm text-foreground mb-1">{tr(tt)}</div>
            <div className="text-xs text-muted-foreground leading-relaxed">{tr(dd)}</div>
          </div>
        ))}
      </div>

      {/* One-tap install (if browser supports) */}
      {installed ? (
        <div className="border border-gold/40 rounded-sm glass-card p-6 mb-8 flex items-center gap-4 security-glow">
          <Icon name="CircleCheckBig" size={28} className="text-gold shrink-0" />
          <div>
            <div className="font-montserrat font-bold text-sm text-foreground">{tr("maInstalledTitle")}</div>
            <div className="text-xs text-muted-foreground">{tr("maInstalledText")}</div>
          </div>
        </div>
      ) : (
        <div className="border border-gold/40 rounded-sm glass-card p-6 md:p-8 mb-8 text-center security-glow">
          <Icon name="Download" size={32} className="text-gold mx-auto mb-3" />
          <h2 className="font-montserrat font-bold text-lg md:text-xl text-foreground mb-2">{installEvt ? tr("maQuickTitle") : tr("maQuickTitleManual")}</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-5">{installEvt ? tr("maQuickText") : tr("maQuickTextManual")}</p>
          <button aria-label="Скачать"
            onClick={doInstall}
            className="gold-gradient text-[hsl(28,20%,7%)] px-8 py-3.5 font-montserrat font-bold text-sm rounded-sm hover:opacity-90 transition-opacity inline-flex items-center gap-2 glow-gold-sm"
          >
            <Icon name="Download" size={16} />
            {tr("maQuickBtn")}
          </button>
          {!installEvt && (
            <p className="text-[11px] text-muted-foreground mt-3">{tr("maQuickHint")}</p>
          )}
        </div>
      )}

      {/* Platform tabs */}
      <div className="mb-5" ref={instrRef}>
        <div className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest mb-3">{tr("maInstrTitle")}</div>
        <div className="flex flex-wrap gap-2">
          {tabs.map((tb) => (
            <button
              key={tb.id}
              onClick={() => setTab(tb.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-sm text-sm font-montserrat font-semibold transition-all border ${
                tab === tb.id
                  ? "gold-gradient text-[hsl(28,20%,7%)] border-transparent"
                  : "bg-card text-muted-foreground border-border hover:border-gold hover:text-gold"
              }`}
            >
              <Icon name={tb.icon} fallback="Smartphone" size={16} />
              {tr(tb.label)}
              {platform === tb.id && <span className="text-[10px] opacity-70">· {tr("maYourDevice")}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-4 stagger mb-8">
        {steps[tab].map((s, i) => (
          <div key={s.title} className="border border-border rounded-sm bg-card p-5 md:p-6 flex items-start gap-4 card-hover">
            <div className="flex flex-col items-center shrink-0">
              <div className="w-10 h-10 gold-gradient rounded-full flex items-center justify-center glow-gold-sm">
                <span className="font-montserrat font-bold text-sm text-[hsl(28,20%,7%)]">{i + 1}</span>
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Icon name={s.icon} fallback="ChevronRight" size={16} className="text-gold shrink-0" />
                <h3 className="font-montserrat font-bold text-sm text-foreground">{tr(s.title)}</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{tr(s.text)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* FAQ / stores note */}
      <div className="border border-border rounded-sm bg-card p-6 md:p-7 mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Icon name="HelpCircle" size={18} className="text-gold shrink-0" />
          <h2 className="font-montserrat font-bold text-sm text-foreground uppercase tracking-widest">{tr("maFaqTitle")}</h2>
        </div>
        <div className="space-y-4">
          {([["maFaq1Q", "maFaq1A"], ["maFaq2Q", "maFaq2A"], ["maFaq3Q", "maFaq3A"]] as const).map(([q, a]) => (
            <div key={q}>
              <div className="text-sm font-montserrat font-semibold text-foreground mb-1">{tr(q)}</div>
              <div className="text-xs text-muted-foreground leading-relaxed">{tr(a)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact callout */}
      <div className="border border-gold/30 rounded-sm glass-card p-8 text-center security-glow">
        <Icon name="LifeBuoy" size={32} className="text-gold mx-auto mb-4" />
        <h2 className="font-montserrat font-bold text-xl text-foreground mb-2">{tr("maHelpTitle")}</h2>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto mb-6">{tr("maHelpText")}</p>
        <button
          onClick={() => setActive("contacts")}
          className="gold-gradient text-[hsl(28,20%,7%)] px-8 py-3 font-montserrat font-bold text-sm rounded-sm hover:opacity-90 transition-opacity"
        >
          {tr("maHelpBtn")}
        </button>
      </div>
    </div>
  );
}

export function HowItWorksSection({ setActive }: { setActive: (s: Section) => void }) {
  const { tr } = useLang();
  const steps: { icon: string; title: keyof typeof t; text: keyof typeof t }[] = [
    { icon: "UserCheck", title: "hiwStep1Title", text: "hiwStep1Text" },
    { icon: "Search", title: "hiwStep2Title", text: "hiwStep2Text" },
    { icon: "Inbox", title: "hiwStep3Title", text: "hiwStep3Text" },
    { icon: "HandCoins", title: "hiwStep4Title", text: "hiwStep4Text" },
    { icon: "Star", title: "hiwStep5Title", text: "hiwStep5Text" },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="border border-gold/30 rounded-sm glass-card p-8 md:p-10 mb-8 relative overflow-hidden security-glow ambient-gold">
        <div className="absolute inset-0 grid-line-bg opacity-30" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
          <div className="w-16 h-16 gold-gradient rounded-full flex items-center justify-center shrink-0 glow-gold-sm">
            <Icon name="Compass" size={30} className="text-[hsl(28,20%,7%)]" />
          </div>
          <div>
            <div className="tag-security mb-3 inline-block">{tr("providerActiveTag")}</div>
            <h1 className="font-montserrat font-extrabold text-3xl md:text-4xl text-foreground mb-2">{tr("hiwTitle")}</h1>
            <p className="text-sm text-muted-foreground max-w-2xl">{tr("hiwSubtitle")}</p>
          </div>
        </div>
      </div>

      {/* Ранний доступ: честно объясняет, почему каталог пока небольшой,
          и превращает это в аргумент для специалистов. */}
      <div className="border border-gold/40 rounded-sm bg-gold/5 p-6 md:p-7 mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Icon name="Rocket" size={18} className="text-gold" />
          <h2 className="font-montserrat font-extrabold text-lg text-foreground">{tr("earlyTitle")}</h2>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">{tr("earlyText")}</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          {[
            { icon: "BadgeCheck", t: tr("earlyB1") },
            { icon: "Percent", t: tr("earlyB2") },
            { icon: "Crown", t: tr("earlyB3") },
          ].map((b) => (
            <div key={b.t} className="flex items-start gap-2 border border-border rounded-sm bg-card p-3">
              <Icon name={b.icon} fallback="Check" size={15} className="text-gold shrink-0 mt-0.5" />
              <span className="text-xs text-foreground leading-snug">{b.t}</span>
            </div>
          ))}
        </div>
        <button
          onClick={() => setActive("dashboard")}
          className="gold-gradient text-[hsl(28,20%,7%)] px-6 py-3 text-sm font-montserrat font-bold rounded-sm hover:opacity-90 transition-opacity"
        >
          {tr("earlyBtn")}
        </button>
      </div>

      <div className="space-y-4 mb-8 stagger">
        {steps.map((s) => (
          <div key={s.title} className="flex items-start gap-4 border border-border rounded-sm bg-card p-5 hover:border-gold/40 transition-colors">
            <div className="w-11 h-11 gold-gradient rounded-sm flex items-center justify-center shrink-0 glow-gold-sm">
              <Icon name={s.icon} size={20} className="text-[hsl(28,20%,7%)]" />
            </div>
            <div>
              <h2 className="font-montserrat font-bold text-base text-foreground mb-1.5">{tr(s.title)}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{tr(s.text)}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="border border-gold/30 rounded-sm glass-card p-8 text-center security-glow">
        <Icon name="Rocket" size={32} className="text-gold mx-auto mb-4" />
        <h2 className="font-montserrat font-bold text-xl text-foreground mb-2">{tr("hiwCtaTitle")}</h2>
        <button
          onClick={() => setActive("dashboard")}
          className="gold-gradient text-[hsl(28,20%,7%)] px-8 py-3 font-montserrat font-bold text-sm rounded-sm hover:opacity-90 transition-opacity"
        >
          {tr("hiwCtaBtn")}
        </button>
      </div>
    </div>
  );
}

export function AboutSection({ setActive }: { setActive: (s: Section) => void }) {
  const { tr } = useLang();

  const values = [
    { icon: "ShieldCheck", title: "aboutVal1Title" as const, text: "aboutVal1Text" as const },
    { icon: "Globe", title: "aboutVal2Title" as const, text: "aboutVal2Text" as const },
    { icon: "BadgeCheck", title: "aboutVal3Title" as const, text: "aboutVal3Text" as const },
    { icon: "HandCoins", title: "aboutVal4Title" as const, text: "aboutVal4Text" as const },
  ];

  // Только проверяемые факты о платформе. Выдуманные счётчики убраны:
  // заявлять «1 240+ специалистов», когда их два десятка, — прямой путь
  // к претензии за недостоверную рекламу.
  const stats = [
    { n: "100%", l: "statSpecialists" as const },
    { n: "0%", l: "statCases" as const },
    { n: "7", l: "statServices" as const },
    { n: "AES-256", l: "statClients" as const },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="border border-gold/30 rounded-sm glass-card p-8 md:p-10 mb-8 relative overflow-hidden security-glow ambient-gold">
        <div className="absolute inset-0 grid-line-bg opacity-30" />
        <div className="organic-blob w-72 h-72 -top-16 -end-16 bg-gold" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
          <div className="w-16 h-16 gold-gradient rounded-full flex items-center justify-center shrink-0 glow-gold-sm">
            <Icon name="Shield" size={30} className="text-[hsl(28,20%,7%)]" />
          </div>
          <div>
            <div className="tag-security mb-3 inline-block">{tr("aboutTag")}</div>
            <h1 className="font-montserrat font-extrabold text-3xl md:text-4xl text-foreground mb-2">{tr("aboutPageTitle")}</h1>
            <p className="text-sm text-muted-foreground max-w-2xl">{tr("aboutIntro")}</p>
          </div>
        </div>
      </div>

      {/* Mission */}
      <div className="border border-border rounded-sm bg-card p-6 md:p-8 mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Icon name="Target" size={18} className="text-gold shrink-0" />
          <h2 className="font-montserrat font-bold text-lg text-foreground">{tr("aboutMissionTitle")}</h2>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{tr("aboutMissionText")}</p>
      </div>

      {/* Story */}
      <div className="border border-border rounded-sm bg-card p-6 md:p-8 mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Icon name="BookOpen" size={18} className="text-gold shrink-0" />
          <h2 className="font-montserrat font-bold text-lg text-foreground">{tr("aboutStoryTitle")}</h2>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{tr("aboutStoryText")}</p>
      </div>

      {/* Stats */}
      <div className="border border-gold/30 rounded-sm glass-card p-6 md:p-8 mb-8 security-glow">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
          {stats.map((s, i) => (
            <div key={s.n} className="text-center px-2">
              <div className="stat-number stat-appear text-2xl md:text-3xl mb-1" data-reveal-delay={i * 90}>{s.n}</div>
              <div className="text-xs text-muted-foreground">{tr(s.l)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Trust badges */}
      <div className="mb-8">
        <h2 className="font-montserrat font-bold text-lg text-foreground mb-4 text-center">{tr("aboutTrustTitle")}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {([
            ["BadgeCheck", "aboutTrust1"],
            ["ShieldCheck", "aboutTrust2"],
            ["Globe", "aboutTrust3"],
            ["Lock", "aboutTrust4"],
          ] as const).map(([icon, key]) => (
            <div key={key} className="group border border-border rounded-sm bg-card p-4 flex flex-col items-center text-center gap-2 card-hover card-tilt">
              <Icon name={icon} size={22} className="icon-hover text-gold" />
              <span className="text-xs font-montserrat font-semibold text-foreground leading-snug">{tr(key)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Values */}
      <div className="mb-8">
        <h2 className="font-montserrat font-bold text-lg text-foreground mb-4">{tr("aboutValuesTitle")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 stagger">
          {values.map((v) => (
            <div key={v.title} className="border border-border rounded-sm bg-card p-6 card-hover card-tilt">
              <div className="w-11 h-11 gold-gradient rounded flex items-center justify-center mb-4 glow-gold-sm">
                <Icon name={v.icon} fallback="Check" size={19} className="text-[hsl(28,20%,7%)]" />
              </div>
              <h3 className="font-montserrat font-bold text-sm text-foreground mb-2">{tr(v.title)}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{tr(v.text)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Requisites */}
      <div className="border border-gold/30 rounded-sm bg-card p-6 mb-8">
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

      {/* CTA */}
      <div className="border border-gold/30 rounded-sm glass-card p-8 text-center security-glow">
        <Icon name="LifeBuoy" size={32} className="text-gold mx-auto mb-4" />
        <h2 className="font-montserrat font-bold text-xl text-foreground mb-2">{tr("aboutCtaTitle")}</h2>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto mb-6">{tr("aboutCtaText")}</p>
        <button
          onClick={() => setActive("contacts")}
          className="gold-gradient text-[hsl(28,20%,7%)] px-8 py-3 font-montserrat font-bold text-sm rounded-sm hover:opacity-90 transition-opacity"
        >
          {tr("aboutCtaBtn")}
        </button>
      </div>
    </div>
  );
}

function BlogArticle({ post, setActive, onBack }: { post: BlogPost; setActive: (s: Section) => void; onBack: () => void }) {
  const { tr, lang } = useLang();

  // Собираем все английские строки статьи для автоперевода на fr/de/ja/ar/he.
  // Для ru/en перевод не нужен — берём готовый текст.
  // Мемоизация предотвращает пересоздание массива на каждый рендер (иначе — бесконечный цикл в useAutoTranslate).
  const enStrings: string[] = useMemo(() => [post.title.en, ...post.body.flatMap((b) =>
    b.type === "li" ? b.items.map((it) => it.en) : [b.text.en],
  )], [post]);
  const { resolve } = useAutoTranslate(enStrings);

  // Резолвер текста статьи: ru → русский, en → английский,
  // остальные языки → английский, переведённый на лету.
  const loc = (v: { ru: string; en: string }) => {
    if (lang === "ru") return v.ru;
    if (lang === "en") return v.en;
    return resolve(v.en);
  };

  // SEO для конкретной статьи: заголовок вкладки, meta description и разметка Article.
  // Всё возвращается к исходному состоянию при уходе со статьи.
  useEffect(() => {
    const prevTitle = document.title;
    document.title = loc(post.metaTitle);

    const metaDesc = document.querySelector('meta[name="description"]');
    const prevDesc = metaDesc?.getAttribute("content") || "";
    if (metaDesc) metaDesc.setAttribute("content", loc(post.metaDescription));

    const ld = document.createElement("script");
    ld.type = "application/ld+json";
    ld.setAttribute("data-blog-article", "1");
    ld.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: loc(post.title),
      description: loc(post.metaDescription),
      inLanguage: lang,
      datePublished: post.date,
      author: { "@type": "Organization", name: "ЩИТ" },
      publisher: { "@type": "Organization", name: "ЩИТ", url: "https://shieldpspl.ru/" },
      mainEntityOfPage: "https://shieldpspl.ru/?section=blog",
    });
    document.head.appendChild(ld);

    return () => {
      document.title = prevTitle;
      if (metaDesc) metaDesc.setAttribute("content", prevDesc);
      ld.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post.slug, lang]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <button aria-label="Назад" onClick={onBack} className="inline-flex items-center gap-1.5 text-xs font-montserrat font-semibold text-muted-foreground hover:text-gold transition-colors mb-6">
        <Icon name="ArrowLeft" size={14} />{tr("blogBack")}
      </button>

      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 gold-gradient rounded-sm flex items-center justify-center shrink-0 glow-gold-sm">
          <Icon name={post.icon} fallback="FileText" size={20} className="text-[hsl(28,20%,7%)]" />
        </div>
        <div className="text-[11px] text-muted-foreground font-montserrat">{post.date} · {post.readMin} {tr("blogMinRead")}</div>
      </div>

      <h1 className="font-montserrat font-extrabold text-2xl md:text-3xl text-foreground mb-6 leading-tight">{loc(post.title)}</h1>

      <article className="space-y-4">
        {post.body.map((b, i) => {
          if (b.type === "h") return <h2 key={i} className="font-montserrat font-bold text-lg text-foreground mt-6">{loc(b.text)}</h2>;
          if (b.type === "li") return (
            <ul key={i} className="space-y-2">
              {b.items.map((it, j) => (
                <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground leading-relaxed">
                  <Icon name="Check" size={15} className="text-gold shrink-0 mt-0.5" />
                  <span>{loc(it)}</span>
                </li>
              ))}
            </ul>
          );
          return <p key={i} className="text-sm text-muted-foreground leading-relaxed">{loc(b.text)}</p>;
        })}
      </article>

      {/* Share this article */}
      <div className="border-t border-border mt-10 pt-6">
        <ShareButtons
          shareUrl={`https://shieldpspl.ru/?section=blog&post=${post.slug}`}
          shareText={loc(post.title)}
        />
      </div>

      {/* CTA to catalog */}
      <div className="border border-gold/30 rounded-sm glass-card p-6 md:p-8 mt-10 text-center security-glow">
        <h2 className="font-montserrat font-bold text-lg text-foreground mb-2">{tr("blogCtaTitle")}</h2>
        <p className="text-sm text-muted-foreground mb-5 max-w-xl mx-auto">{tr("blogCtaText")}</p>
        <button onClick={() => setActive("specialists")} className="gold-gradient text-[hsl(28,20%,7%)] px-6 py-3 text-sm font-montserrat font-bold rounded-sm hover:opacity-90 transition-opacity inline-flex items-center gap-2">
          <Icon name="Search" size={16} />{tr("blogCtaBtn")}
        </button>
      </div>
    </div>
  );
}

function getInitialBlogSlug(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const slug = new URLSearchParams(window.location.search).get("post");
    // Лёгкая проверка формата slug — без загрузки тяжёлого массива статей.
    if (slug && /^[a-z0-9-]{3,80}$/.test(slug)) return slug;
  } catch {
    // URLSearchParams недоступен — открываем список статей.
  }
  return null;
}

export function BlogSection({ setActive }: { setActive: (s: Section) => void }) {
  const { tr, lang } = useLang();
  const [openSlug, setOpenSlug] = useState<string | null>(getInitialBlogSlug);
  const [tab, setTab] = useState<"client" | "provider">("client");
  // Статьи блога (~97 КБ) грузятся отдельным чанком только при открытии раздела.
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  useEffect(() => {
    let alive = true;
    import("@/lib/blog").then((m) => {
      if (!alive) return;
      setPosts(m.BLOG_POSTS);
      // Если открыта конкретная статья — подставляем её вкладку аудитории.
      const cur = new URLSearchParams(window.location.search).get("post");
      const found = cur ? m.BLOG_POSTS.find((p) => p.slug === cur) : null;
      if (found) setTab(found.audience);
      setLoadingPosts(false);
    }).catch(() => { if (alive) setLoadingPosts(false); });
    return () => { alive = false; };
  }, []);

  // Автоперевод заголовков и анонсов списка статей на fr/de/ja/ar/he.
  // Хук вызывается до любых ранних return, чтобы не нарушать правила хуков.
  // Мемоизация предотвращает пересоздание массива на каждый рендер (иначе — бесконечный цикл в useAutoTranslate).
  const listStrings: string[] = useMemo(() => posts.flatMap((p) => [p.title.en, p.excerpt.en]), [posts]);
  const { resolve } = useAutoTranslate(listStrings);
  const loc = (v: { ru: string; en: string }) => {
    if (lang === "ru") return v.ru;
    if (lang === "en") return v.en;
    return resolve(v.en);
  };

  useEffect(() => { trackGoal(GOALS.openBlog); }, []);

  if (loadingPosts) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-24 flex flex-col items-center gap-3 text-muted-foreground">
        <Icon name="Loader" size={28} className="animate-spin text-gold" />
        <span className="text-sm">{tr("loading")}</span>
      </div>
    );
  }

  const openPost = posts.find((p) => p.slug === openSlug) || null;

  if (openPost) {
    return <BlogArticle post={openPost} setActive={setActive} onBack={() => { setOpenSlug(null); window.scrollTo({ top: 0 }); }} />;
  }

  const visiblePosts = posts.filter((p) => p.audience === tab);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="border border-gold/30 rounded-sm glass-card p-8 md:p-10 mb-8 relative overflow-hidden security-glow ambient-gold">
        <div className="absolute inset-0 grid-line-bg opacity-30" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
          <div className="w-16 h-16 gold-gradient rounded-full flex items-center justify-center shrink-0 glow-gold-sm">
            <Icon name="BookOpen" size={30} className="text-[hsl(28,20%,7%)]" />
          </div>
          <div>
            <div className="tag-security mb-3 inline-block">{tr("blogTag")}</div>
            <h1 className="font-montserrat font-extrabold text-3xl md:text-4xl text-foreground mb-2">{tr("blogTitle")}</h1>
            <p className="text-sm text-muted-foreground max-w-2xl">{tr("blogIntro")}</p>
          </div>
        </div>
      </div>

      {/* Audience tabs */}
      <div className="flex items-center gap-2 mb-6">
        {([["client", "blogTabClients"], ["provider", "blogTabProviders"]] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-xs font-montserrat font-bold rounded-sm border transition-all ${tab === key ? "gold-gradient text-[hsl(28,20%,7%)] border-transparent" : "border-border text-muted-foreground hover:border-gold hover:text-gold"}`}
          >
            {tr(label)}
          </button>
        ))}
      </div>

      {/* Articles grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {visiblePosts.map((post) => (
          <button
            key={post.slug}
            onClick={() => { setOpenSlug(post.slug); window.scrollTo({ top: 0 }); }}
            className="group text-left border border-border rounded-sm bg-card p-6 hover:border-gold/50 transition-all card-hover card-tilt"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 gold-gradient rounded-sm flex items-center justify-center shrink-0">
                <Icon name={post.icon} fallback="FileText" size={20} className="icon-hover text-[hsl(28,20%,7%)]" />
              </div>
              <div className="text-[11px] text-muted-foreground font-montserrat">{post.readMin} {tr("blogMinRead")}</div>
            </div>
            <h2 className="font-montserrat font-bold text-base text-foreground mb-2 leading-snug">{loc(post.title)}</h2>
            <p className="text-xs text-muted-foreground leading-relaxed mb-4">{loc(post.excerpt)}</p>
            <span className="inline-flex items-center gap-1.5 text-xs font-montserrat font-semibold text-gold">
              {tr("blogReadMore")}<Icon name="ArrowRight" size={13} className="group-hover:translate-x-0.5 transition-transform" />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function SecurityPolicySection({ setActive }: { setActive: (s: Section) => void }) {
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
            <Icon name="ShieldCheck" size={30} className="text-[hsl(28,20%,7%)]" />
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
                    <Icon name={s.icon} fallback="Lock" size={19} className="text-[hsl(28,20%,7%)]" />
                  </div>
                  <div>
                    <h2 className="font-montserrat font-bold text-base text-foreground mb-2">{tr(s.title)}</h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">{tr(s.text)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Реквизиты оператора */}
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

          {/* Contact callout */}
          <div className="mt-8 border border-gold/30 rounded-sm glass-card p-8 text-center security-glow">
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