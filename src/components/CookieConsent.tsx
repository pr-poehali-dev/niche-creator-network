import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { useLang } from "@/lib/i18n";

const STORAGE_KEY = "shchit_cookie_consent";

export default function CookieConsent({ onPolicy }: { onPolicy?: () => void }) {
  const { tr } = useLang();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      const t = setTimeout(() => setVisible(true), 700);
      return () => clearTimeout(t);
    }
  }, []);

  const choose = (value: "all" | "essential") => {
    localStorage.setItem(STORAGE_KEY, value);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[90] p-3 sm:p-4 animate-fade-in">
      <div className="max-w-3xl mx-auto bg-card border border-gold/30 rounded-sm shadow-2xl security-glow p-5 sm:p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 gold-gradient rounded flex items-center justify-center shrink-0">
            <Icon name="Cookie" fallback="ShieldCheck" size={18} className="text-[hsl(220,20%,6%)]" />
          </div>
          <div>
            <div className="font-montserrat font-bold text-sm text-foreground mb-1">{tr("cookieTitle")}</div>
            <p className="text-xs text-muted-foreground leading-relaxed">{tr("cookieText")}</p>
            {onPolicy && (
              <button onClick={onPolicy} className="inline-flex items-center gap-1 text-xs text-gold hover:underline mt-2 font-medium">
                <Icon name="ExternalLink" size={12} />
                {tr("cookieMore")}
              </button>
            )}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
          <button
            onClick={() => choose("essential")}
            className="order-2 sm:order-1 border border-border text-muted-foreground px-5 py-2.5 text-xs font-montserrat font-semibold rounded-sm hover:border-gold hover:text-gold transition-all"
          >
            {tr("cookieEssential")}
          </button>
          <button
            onClick={() => choose("all")}
            className="order-1 sm:order-2 gold-gradient text-[hsl(220,20%,6%)] px-6 py-2.5 text-xs font-montserrat font-bold rounded-sm hover:opacity-90 transition-opacity"
          >
            {tr("cookieAccept")}
          </button>
        </div>
      </div>
    </div>
  );
}
