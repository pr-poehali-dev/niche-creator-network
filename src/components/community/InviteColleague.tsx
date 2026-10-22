import { useState } from "react";
import Icon from "@/components/ui/icon";
import { useLang } from "@/lib/i18n";

// «Пригласить коллегу». Сообщество без людей бесполезно, а свои коллеги у
// специалиста уже есть — в телефоне. Личная ссылка делает из каждого
// участника точку роста: от пришедшего по ней автоматически приходит
// заявка в друзья. Принимает её пригласивший — дружба без его согласия
// не возникает, даже если номер в ссылке подставили чужой.
//
// На телефоне основная кнопка открывает системное меню «Поделиться» —
// человек отправляет ссылку туда, где реально общается с коллегами
// (Telegram, WhatsApp). На компьютере — копирует в буфер.
export default function InviteColleague({ publicId }: { publicId?: number | null }) {
  const { tr } = useLang();
  const [copied, setCopied] = useState<"link" | "id" | null>(null);

  if (!publicId) return null;
  const url = `${window.location.origin}/?invite=${publicId}`;
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  const copy = async (what: "link" | "id") => {
    try {
      await navigator.clipboard.writeText(what === "link" ? url : String(publicId));
      setCopied(what);
      setTimeout(() => setCopied(null), 2000);
    } catch { /* буфер недоступен — ссылка видна в поле, её можно выделить */ }
  };

  const share = async () => {
    try {
      await navigator.share({ title: tr("inviteShareTitle"), text: tr("inviteShareText"), url });
    } catch { /* человек закрыл меню — ничего не делаем */ }
  };

  return (
    <section aria-labelledby="invite-title" className="border border-gold/30 rounded-sm glass-card p-4 sm:p-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-full gold-gradient flex items-center justify-center shrink-0">
          <Icon name="UserPlus" size={18} className="text-[hsl(28,20%,7%)]" />
        </div>
        <div className="min-w-0">
          <h3 id="invite-title" className="font-montserrat font-bold text-sm text-foreground">{tr("inviteTitle")}</h3>
          <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">{tr("inviteHint")}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1 min-w-0 flex items-center bg-background border border-border rounded-sm px-3 min-h-[44px]">
          <span className="text-xs text-muted-foreground truncate select-all" aria-label={tr("inviteLinkLabel")}>{url}</span>
        </div>
        {canShare ? (
          <button onClick={share} className="gold-gradient text-[hsl(28,20%,7%)] px-5 min-h-[44px] text-xs font-montserrat font-bold rounded-sm flex items-center justify-center gap-1.5 shrink-0">
            <Icon name="Share2" size={14} />{tr("inviteShare")}
          </button>
        ) : (
          <button onClick={() => copy("link")} className="gold-gradient text-[hsl(28,20%,7%)] px-5 min-h-[44px] text-xs font-montserrat font-bold rounded-sm flex items-center justify-center gap-1.5 shrink-0">
            <Icon name={copied === "link" ? "Check" : "Copy"} size={14} />{tr(copied === "link" ? "inviteCopied" : "inviteCopy")}
          </button>
        )}
      </div>

      {/* Номер остаётся — по нему коллегу находят в поиске, если ссылка
          неудобна (например, продиктовать по телефону). */}
      <div className="flex items-center gap-2 mt-3 text-[11px] text-muted-foreground">
        <Icon name="IdCard" size={13} className="text-gold" />
        <span>{tr("pdMyIdTitle")}:</span>
        <button onClick={() => copy("id")} className="font-montserrat font-bold text-gold tabular-nums hover:underline min-h-[32px] flex items-center gap-1" aria-label={tr("inviteCopyId")}>
          {publicId}
          <Icon name={copied === "id" ? "Check" : "Copy"} size={11} />
        </button>
      </div>
    </section>
  );
}
