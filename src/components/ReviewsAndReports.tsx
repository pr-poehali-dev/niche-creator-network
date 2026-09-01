import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { useLang, t } from "@/lib/i18n";
import { authHeaders } from "@/lib/authToken";
import { StarRating } from "@/components/SharedControls";
import func2url from "../../backend/func2url.json";

export function ReviewsList({ targetType, targetId }: { targetType: "provider" | "client"; targetId: string }) {
  const { tr } = useLang();
  const [reviews, setReviews] = useState<{ authorName: string; rating: number; text: string; createdAt: string | null }[] | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(`${func2url["reviews"]}?targetType=${targetType}&targetId=${encodeURIComponent(targetId)}`)
      .then((r) => r.json())
      .then((d) => { if (alive && Array.isArray(d.reviews)) setReviews(d.reviews); })
      .catch(() => { if (alive) setReviews([]); });
    return () => { alive = false; };
  }, [targetType, targetId]);

  if (reviews === null) return null;
  if (reviews.length === 0) {
    return <div className="text-xs text-muted-foreground italic py-4 text-center">{tr("profileNoReviews")}</div>;
  }
  return (
    <div className="space-y-3">
      {reviews.map((r, i) => (
        <div key={i} className="border border-border rounded-sm bg-card p-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-montserrat font-semibold text-sm text-foreground">{r.authorName || tr("profileAnonymous")}</span>
            <StarRating rating={r.rating} />
          </div>
          {r.text && <p className="text-xs text-muted-foreground leading-relaxed">{r.text}</p>}
        </div>
      ))}
    </div>
  );
}

// Модалка жалобы: переиспользуется в профиле специалиста и личных сообщениях.
// Отправляет жалобу в backend complaints, модерация — у администратора.
const REPORT_REASONS = ["spam", "scam", "illegal", "harassment", "fake_profile", "other"] as const;
export function ReportModal({ targetType, targetId, onClose }: { targetType: "provider" | "client" | "message"; targetId: string; onClose: () => void }) {
  const { tr } = useLang();
  const [reason, setReason] = useState<typeof REPORT_REASONS[number]>("other");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      const res = await fetch(func2url["complaints"], {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ action: "create", targetType, targetId, reason, details }),
      });
      if (res.ok) setDone(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-destructive/40 rounded-sm max-w-md w-full p-8 security-glow" onClick={(e) => e.stopPropagation()}>
        {done ? (
          <div className="text-center">
            <div className="w-14 h-14 bg-green-500/10 border border-green-500/40 rounded-sm flex items-center justify-center mx-auto mb-5">
              <Icon name="CheckCircle2" size={26} className="text-green-400" />
            </div>
            <h3 className="font-montserrat font-bold text-lg text-foreground mb-2">{tr("reportSentTitle")}</h3>
            <p className="text-sm text-muted-foreground mb-6">{tr("reportSentText")}</p>
            <button onClick={onClose} className="w-full border border-border text-foreground py-3 text-sm font-montserrat font-semibold rounded-sm hover:border-gold hover:text-gold transition-all">
              {tr("close")}
            </button>
          </div>
        ) : (
          <>
            <div className="w-14 h-14 bg-destructive/10 border border-destructive/40 rounded-sm flex items-center justify-center mx-auto mb-5">
              <Icon name="Flag" size={26} className="text-destructive" />
            </div>
            <h3 className="font-montserrat font-bold text-lg text-foreground mb-2 text-center">{tr("reportModalTitle")}</h3>
            <p className="text-sm text-muted-foreground mb-5 text-center">{tr("reportModalHint")}</p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {REPORT_REASONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setReason(r)}
                  className={`px-3 py-2 text-xs font-montserrat font-semibold rounded-sm border transition-colors ${reason === r ? "border-destructive text-destructive bg-destructive/10" : "border-border text-muted-foreground hover:text-foreground"}`}
                >
                  {tr(`reportReason_${r}` as keyof typeof t)}
                </button>
              ))}
            </div>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
              placeholder={tr("reportModalPh")}
              className="w-full bg-secondary border border-border rounded-sm px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-gold transition-colors resize-none mb-4"
            />
            <div className="flex gap-2">
              <button onClick={onClose} className="flex-1 border border-border text-muted-foreground py-3 text-sm font-montserrat font-semibold rounded-sm hover:border-gold hover:text-gold transition-all">
                {tr("cancel")}
              </button>
              <button onClick={submit} disabled={busy} className="flex-1 bg-destructive text-white py-3 text-sm font-montserrat font-bold rounded-sm hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2">
                {busy ? <Icon name="Loader" size={16} className="animate-spin" /> : <Icon name="Send" size={16} />}
                {tr("reportModalSubmit")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Профиль КОНКРЕТНОГО специалиста (для клиента). Показывает данные выбранного
