import { useState } from "react";
import Icon from "@/components/ui/icon";
import { useLang } from "@/lib/i18n";
import { authHeaders } from "@/lib/authToken";
import { resolveAvatar, isImageUrl } from "@/lib/shared";
import func2url from "../../backend/func2url.json";

export function DocFileButton({ slug, url, onUploaded }: { slug: string; url: string; onUploaded: (url: string) => void }) {
  const { tr } = useLang();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(false);

  const pick = (file: File) => {
    setErr(false);
    if (file.size > 10 * 1024 * 1024) { setErr(true); return; }
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = String(reader.result || "");
      const ext = (file.name.split(".").pop() || "pdf").toLowerCase();
      setBusy(true);
      try {
        const res = await fetch(func2url["upload-document"], {
          method: "POST",
          headers: authHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({ slug, fileBase64: base64, ext }),
        });
        const data = await res.json();
        if (res.ok && data.url) onUploaded(data.url);
        else setErr(true);
      } catch {
        setErr(true);
      } finally {
        setBusy(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex items-center gap-2 mt-1.5 ms-1">
      <label className="inline-flex items-center gap-1.5 cursor-pointer text-[11px] font-montserrat font-semibold text-gold hover:underline">
        {busy ? <Icon name="Loader" size={12} className="animate-spin" /> : <Icon name={url ? "FileCheck2" : "Paperclip"} size={12} />}
        {tr(busy ? "pdVfDocUploading" : url ? "pdVfDocReplace" : "pdVfDocAttach")}
        <input type="file" accept=".pdf,image/png,image/jpeg,image/webp" className="hidden" disabled={busy} onChange={(e) => { const f = e.target.files?.[0]; if (f) pick(f); }} />
      </label>
      {url && isImageUrl(url) && (
        <a href={url} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-sm overflow-hidden border border-border hover:border-gold transition-colors shrink-0">
          <img src={url} alt="Загруженный документ" loading="lazy" decoding="async" className="w-full h-full object-cover" />
        </a>
      )}
      {url && <a href={url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-green-400 inline-flex items-center gap-1"><Icon name="Check" size={11} />{tr("pdVfDocAttached")}</a>}
      {!url && !busy && <span className="text-[10px] text-muted-foreground">{tr("pdVfDocHint")}</span>}
      {err && <span className="text-[11px] text-destructive">{tr("pdVfDocError")}</span>}
    </div>
  );
}

export function AvatarUploader({ current, gender, role, recordId, onUploaded }: { current: string | null; gender: string; role: "provider" | "client"; recordId: string; onUploaded: (url: string) => void }) {
  const { tr } = useLang();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(false);

  const pick = (file: File) => {
    setErr(false);
    if (file.size > 5 * 1024 * 1024) { setErr(true); return; }
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = String(reader.result || "");
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      setBusy(true);
      try {
        const res = await fetch(func2url["upload-avatar"], {
          method: "POST",
          headers: authHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({ role, id: recordId, imageBase64: base64, ext }),
        });
        const data = await res.json();
        if (res.ok && data.url) onUploaded(data.url);
        else setErr(true);
      } catch {
        setErr(true);
      } finally {
        setBusy(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex items-center gap-4">
      <div className="w-20 h-20 rounded-sm overflow-hidden border-2 border-gold shrink-0 bg-secondary">
        <img src={resolveAvatar(current, gender, role)} alt="avatar" loading="lazy" decoding="async" className="w-full h-full object-cover" />
      </div>
      <div className="flex-1">
        <div className="text-xs font-montserrat font-semibold text-foreground mb-1">{tr("avatarTitle")}</div>
        <p className="text-[11px] text-muted-foreground mb-2">{tr("avatarHint")}</p>
        <label className="inline-flex items-center gap-1.5 cursor-pointer border border-gold text-gold text-xs font-montserrat font-semibold px-3 py-2 rounded-sm hover:bg-gold hover:text-[hsl(28,20%,7%)] transition-all">
          {busy ? <Icon name="Loader" size={14} className="animate-spin" /> : <Icon name="Upload" size={14} />}
          {tr(busy ? "avatarUploading" : "avatarUpload")}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            disabled={busy}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) pick(f); }}
          />
        </label>
        {current && current.trim() && (
          <button onClick={() => onUploaded("")} className="ml-2 text-[11px] text-muted-foreground hover:text-destructive transition-colors">{tr("avatarRemove")}</button>
        )}
        {err && <div className="text-[11px] text-destructive mt-1">{tr("avatarError")}</div>}
      </div>
    </div>
  );
}

export function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Icon
          key={i}
          name="Star"
          size={12}
          className={i <= Math.floor(rating) ? "text-gold fill-gold" : "text-muted-foreground"}
        />
      ))}
    </div>
  );
}
