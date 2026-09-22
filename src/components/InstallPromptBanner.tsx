import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { useLang } from "@/lib/i18n";
import { type Section } from "@/lib/shared";

// Баннер «установить на телефон» вынесен из InfoSections в отдельный файл.
// Раньше ради него в главный бандл затягивался весь модуль информационных
// страниц — вместе с блогом, автопереводом и SEO-утилитами, — и пять
// ленивых загрузок (блог, о нас, политика, как это работает, приложение)
// обнулялись: код уже был скачан на первом экране.
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

function InstallPromptBanner({ setActive }: { setActive: (s: Section) => void }) {
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
        <div className="w-11 h-11 icon-tile flex items-center justify-center shrink-0">
          <Icon name="Smartphone" size={22} className="text-gold" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-montserrat font-bold text-sm text-foreground leading-tight">{tr("installBannerTitle")}</div>
          <div className="text-[11px] text-muted-foreground leading-snug mt-0.5">{tr("installBannerText")}</div>
        </div>
        <div className="flex flex-col gap-1.5 shrink-0">
          <button
            onClick={install}
            className="gold-gradient text-[hsl(28,20%,7%)] px-3.5 py-2 font-montserrat font-bold text-xs rounded-sm whitespace-nowrap"
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

export default InstallPromptBanner;
