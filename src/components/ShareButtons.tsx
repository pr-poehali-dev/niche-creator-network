import { useState } from "react";
import Icon from "@/components/ui/icon";
import { useLang } from "@/lib/i18n";

/**
 * Блок кнопок «Поделиться» для вирального распространения сайта.
 * На мобильных использует нативное системное меню «Поделиться» (Web Share API),
 * плюс явные ссылки на Telegram, WhatsApp, VK и копирование ссылки.
 */
export default function ShareButtons({ className = "" }: { className?: string }) {
  const { tr } = useLang();
  const [copied, setCopied] = useState(false);

  const url = typeof window !== "undefined" ? window.location.origin + "/" : "https://shieldpspl.ru/";
  const text = tr("shareText");

  const nativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: text, text, url });
      } catch {
        // Пользователь отменил шаринг — ничего не делаем.
      }
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Буфер обмена недоступен — молча игнорируем.
    }
  };

  const enc = encodeURIComponent;
  const links: { name: string; icon: string; href: string }[] = [
    { name: "Telegram", icon: "Send", href: `https://t.me/share/url?url=${enc(url)}&text=${enc(text)}` },
    { name: "WhatsApp", icon: "MessageCircle", href: `https://wa.me/?text=${enc(text + " " + url)}` },
    { name: "VK", icon: "Share2", href: `https://vk.com/share.php?url=${enc(url)}&title=${enc(text)}` },
  ];

  const hasNative = typeof navigator !== "undefined" && !!navigator.share;

  return (
    <div className={className}>
      <div className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest mb-3">{tr("shareTitle")}</div>
      <div className="flex items-center gap-2 flex-wrap">
        {hasNative && (
          <button
            type="button"
            onClick={nativeShare}
            className="inline-flex items-center gap-1.5 border border-gold/40 text-gold px-3 py-2 rounded-sm text-xs font-montserrat font-semibold hover:bg-gold hover:text-[hsl(220,20%,6%)] transition-all"
            aria-label={tr("shareTitle")}
          >
            <Icon name="Share2" size={14} />
            {tr("shareTitle")}
          </button>
        )}
        {links.map((l) => (
          <a
            key={l.name}
            href={l.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-9 h-9 border border-border rounded-sm text-muted-foreground hover:border-gold hover:text-gold transition-all"
            aria-label={l.name}
          >
            <Icon name={l.icon} size={15} />
          </a>
        ))}
        <button
          type="button"
          onClick={copyLink}
          className="inline-flex items-center justify-center w-9 h-9 border border-border rounded-sm text-muted-foreground hover:border-gold hover:text-gold transition-all"
          aria-label={tr("shareCopied")}
        >
          <Icon name={copied ? "Check" : "Link"} size={15} className={copied ? "text-green-400" : ""} />
        </button>
        {copied && <span className="text-[11px] text-green-400 font-montserrat">{tr("shareCopied")}</span>}
      </div>
    </div>
  );
}
