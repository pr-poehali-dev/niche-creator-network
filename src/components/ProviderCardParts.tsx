// Компоненты карточки специалиста: просмотр документа, отметка о занятости,
// кнопки связи и блок верификации. Вынесены из Index.tsx (3064 строки) —
// монолит целиком попадал в главный бандл при любом маршруте, даже если
// человек открывал только политику конфиденциальности.
// Эти четыре компонента нужны и каталогу, и профилю, поэтому лежат
// отдельно: иначе при разделении они бы дублировались в обеих частях.
import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { useLang } from "@/lib/i18n";
import { isQuietNow, providerLocalTime, type Provider } from "@/lib/providers";
import { isImageUrl } from "@/lib/shared";

export function Lightbox({ src, title, onClose }: { src: string; title?: string; onClose: () => void }) {
  const { tr } = useLang();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 animate-fade-in overflow-y-auto overscroll-contain" onClick={onClose}>
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
      <button onClick={onClose} className="tap-target absolute top-4 end-4 z-20 text-muted-foreground hover:text-foreground transition-colors" aria-label={tr("lightboxClose")}>
        <Icon name="X" size={26} />
      </button>
    </div>
  );
}

export function AvailabilityNote({ p }: { p: Provider }) {
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

export function ContactButtons({ p, onChat, compact, onRequireAuth }: { p: Provider; onChat: () => void; compact?: boolean; onRequireAuth?: () => void }) {
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
          className="w-full gold-gradient text-[hsl(28,20%,7%)] text-xs font-montserrat font-bold px-3 py-2 rounded-sm transition-all"
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
          className="w-full gold-gradient text-[hsl(28,20%,7%)] text-xs font-montserrat font-bold px-3 py-2 rounded-sm transition-all"
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

export function VerificationBlock({ v }: { v: NonNullable<Provider["verification"]> }) {
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
