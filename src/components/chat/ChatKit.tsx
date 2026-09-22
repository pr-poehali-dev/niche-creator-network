import { useState, useRef, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { useLang } from "@/lib/i18n";
import { authHeaders } from "@/lib/authToken";
import func2url from "../../../backend/func2url.json";

export type Attachment = { type: "image" | "file"; url: string; name: string; ext?: string; size?: number };
export type GeoPoint = { lat: number; lon: number; label?: string };

/** Часто используемые смайлики. Полноценный каталог тут лишний:
 *  в деловой переписке берут два десятка, остальное — шум. */
const EMOJI_GROUPS: { icon: string; list: string[] }[] = [
  { icon: "Smile", list: ["😀", "😃", "😄", "😁", "😉", "🙂", "😊", "😎", "🤝", "👍", "👌", "🙏", "💪", "👏", "🤔", "😐", "😕", "😢", "😮", "😅"] },
  { icon: "Briefcase", list: ["📌", "📎", "📁", "📄", "📷", "🎥", "🔍", "🕵️", "🛡️", "🔒", "🔑", "⚠️", "✅", "❌", "⏰", "📅", "📞", "✉️", "📍", "🚗"] },
  { icon: "Heart", list: ["❤️", "🔥", "⭐", "✨", "💯", "🎯", "🏆", "🎉", "☕", "💡", "📈", "⚡", "🌍", "🏢", "💼", "🤙", "✊", "🫡", "🙌", "👀"] },
];

/** Сжимаем фото прямо в браузере: снимок с телефона весит 5–10 МБ,
 *  а по сети такой файл не пройдёт и ждать его никто не будет. */
async function compressImage(file: File): Promise<{ base64: string; ext: string }> {
  const MAX_SIDE = 1600;
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) {
    const raw = await fileToBase64(file);
    return { base64: raw, ext: extOf(file.name) };
  }
  let { width, height } = bitmap;
  if (Math.max(width, height) > MAX_SIDE) {
    const k = MAX_SIDE / Math.max(width, height);
    width = Math.round(width * k);
    height = Math.round(height * k);
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return { base64: await fileToBase64(file), ext: extOf(file.name) };
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();
  // Понижаем качество, пока не уложимся в лимит передачи.
  for (const q of [0.82, 0.7, 0.55, 0.4]) {
    const dataUrl = canvas.toDataURL("image/jpeg", q);
    const body = dataUrl.split(",")[1] || "";
    if (body.length < 2_200_000) return { base64: body, ext: "jpg" };
  }
  return { base64: canvas.toDataURL("image/jpeg", 0.35).split(",")[1] || "", ext: "jpg" };
}

function extOf(name: string) {
  return (name.split(".").pop() || "").toLowerCase();
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1] || "");
    r.onerror = () => reject(new Error("read"));
    r.readAsDataURL(file);
  });
}

export function humanSize(bytes?: number) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

/** Панель смайликов. */
export function EmojiPicker({ onPick, onClose }: { onPick: (e: string) => void; onClose: () => void }) {
  const [tab, setTab] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const away = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, [onClose]);
  return (
    <div ref={ref} className="absolute bottom-full mb-2 start-0 z-40 w-[268px] border border-border rounded-sm bg-card shadow-2xl p-2 animate-fade-in">
      <div className="flex gap-1 mb-2">
        {EMOJI_GROUPS.map((g, i) => (
          <button key={g.icon} onClick={() => setTab(i)} aria-label={g.icon}
            className={`flex-1 py-1.5 rounded-sm transition-colors ${tab === i ? "bg-gold/15 text-gold" : "text-muted-foreground hover:text-foreground"}`}>
            <Icon name={g.icon} size={15} className="mx-auto" />
          </button>
        ))}
      </div>
      <div className="grid grid-cols-8 gap-0.5 max-h-[168px] overflow-y-auto">
        {EMOJI_GROUPS[tab].list.map((e) => (
          <button key={e} onClick={() => onPick(e)} className="text-lg leading-none py-1.5 rounded-sm hover:bg-secondary transition-colors">
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Показ вложений внутри пузыря сообщения. */
export function AttachmentView({ items, mine }: { items: Attachment[]; mine: boolean }) {
  const [zoom, setZoom] = useState<string | null>(null);
  if (!items?.length) return null;
  const images = items.filter((a) => a.type === "image");
  const files = items.filter((a) => a.type !== "image");
  return (
    <>
      {images.length > 0 && (
        <div className={`grid gap-1 mb-1.5 ${images.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
          {images.map((a) => (
            <button key={a.url} onClick={() => setZoom(a.url)} className="block overflow-hidden rounded-sm">
              <img src={a.url} alt={a.name || "Вложение"} loading="lazy"
                className="w-full max-h-64 object-cover hover:opacity-90 transition-opacity" />
            </button>
          ))}
        </div>
      )}
      {files.map((a) => (
        <a key={a.url} href={a.url} target="_blank" rel="noopener noreferrer"
          className={`flex items-center gap-2.5 rounded-sm px-2.5 py-2 mb-1.5 transition-colors ${mine ? "bg-black/10 hover:bg-black/15" : "bg-background/60 hover:bg-background"}`}>
          <Icon name="FileText" size={18} className={mine ? "text-[hsl(28,20%,7%)]" : "text-gold"} />
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-semibold truncate">{a.name || "Документ"}</span>
            {a.size ? <span className="block text-[10px] opacity-70">{humanSize(a.size)}</span> : null}
          </span>
          <Icon name="Download" size={15} className="opacity-70 shrink-0" />
        </a>
      ))}
      {zoom && (
        <div className="fixed inset-0 z-[95] bg-black/90 flex items-center justify-center p-4 overflow-y-auto overscroll-contain" onClick={() => setZoom(null)}>
          <img src={zoom} alt="" className="max-w-full max-h-full object-contain" />
          <button aria-label="Закрыть" onClick={() => setZoom(null)}
            className="absolute top-4 end-4 text-white/80 hover:text-white">
            <Icon name="X" size={26} />
          </button>
        </div>
      )}
    </>
  );
}

/** Карточка геолокации в сообщении. */
export function GeoView({ geo, mine }: { geo: GeoPoint; mine: boolean }) {
  const { tr } = useLang();
  const map = `https://www.openstreetmap.org/?mlat=${geo.lat}&mlon=${geo.lon}#map=16/${geo.lat}/${geo.lon}`;
  return (
    <a href={map} target="_blank" rel="noopener noreferrer"
      className={`flex items-center gap-2.5 rounded-sm px-2.5 py-2 mb-1.5 transition-colors ${mine ? "bg-black/10 hover:bg-black/15" : "bg-background/60 hover:bg-background"}`}>
      <Icon name="MapPin" size={18} className={mine ? "text-[hsl(28,20%,7%)]" : "text-gold"} />
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-semibold truncate">{geo.label || tr("chatGeoPoint")}</span>
        <span className="block text-[10px] opacity-70">{geo.lat.toFixed(4)}, {geo.lon.toFixed(4)}</span>
      </span>
      <Icon name="ExternalLink" size={14} className="opacity-70 shrink-0" />
    </a>
  );
}

/** Реакции под сообщением. */
export function Reactions({ data, onToggle }: { data: Record<string, number[]>; onToggle: (e: string) => void }) {
  const entries = Object.entries(data || {}).filter(([, users]) => users.length > 0);
  if (!entries.length) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {entries.map(([emoji, users]) => (
        <button key={emoji} onClick={() => onToggle(emoji)}
          className="inline-flex items-center gap-1 text-[11px] bg-secondary border border-border rounded-full px-1.5 py-0.5 hover:border-gold transition-colors">
          <span>{emoji}</span>
          {users.length > 1 && <span className="text-muted-foreground">{users.length}</span>}
        </button>
      ))}
    </div>
  );
}

type ComposerProps = {
  value: string;
  onChange: (v: string) => void;
  onSend: (payload: { text: string; attachments: Attachment[]; geo: GeoPoint | null }) => void | Promise<void>;
  replyTo?: { name: string; text: string } | null;
  onCancelReply?: () => void;
  disabled?: boolean;
};

/** Поле ввода: текст, смайлики, вложения, геолокация. */
export function Composer({ value, onChange, onSend, replyTo, onCancelReply, disabled }: ComposerProps) {
  const { tr } = useLang();
  const [atts, setAtts] = useState<Attachment[]>([]);
  const [geo, setGeo] = useState<GeoPoint | null>(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [geoBusy, setGeoBusy] = useState(false);
  const imgRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  // Поле растёт под текст: длинное сообщение видно целиком,
  // а не одной строкой, как было раньше.
  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, [value]);

  const upload = useCallback(async (files: FileList | null) => {
    if (!files?.length) return;
    setErr("");
    setBusy(true);
    for (const file of Array.from(files).slice(0, 6 - atts.length)) {
      const isImage = file.type.startsWith("image/");
      try {
        const { base64, ext } = isImage
          ? await compressImage(file)
          : { base64: await fileToBase64(file), ext: extOf(file.name) };
        const res = await fetch(func2url["chat-upload"], {
          method: "POST",
          headers: authHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({ fileBase64: base64, ext, name: file.name }),
        });
        const d = await res.json().catch(() => null);
        if (res.ok && d?.url) {
          setAtts((a) => [...a, { type: d.type, url: d.url, name: d.name, ext: d.ext, size: d.size }]);
        } else if (d?.error === "too_large") {
          setErr(tr("chatErrTooLarge"));
        } else if (d?.error === "unsupported_type") {
          setErr(tr("chatErrType"));
        } else {
          setErr(tr("chatErrUpload"));
        }
      } catch {
        setErr(tr("chatErrUpload"));
      }
    }
    setBusy(false);
  }, [atts.length, tr]);

  const askGeo = () => {
    if (!navigator.geolocation) { setErr(tr("chatErrGeo")); return; }
    setGeoBusy(true);
    setErr("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeo({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setGeoBusy(false);
      },
      () => { setErr(tr("chatErrGeo")); setGeoBusy(false); },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  };

  const canSend = !busy && (value.trim().length > 0 || atts.length > 0 || geo !== null);

  const fire = async () => {
    if (!canSend) return;
    await onSend({ text: value, attachments: atts, geo });
    setAtts([]);
    setGeo(null);
    setErr("");
  };

  const btn = "w-9 h-9 flex items-center justify-center rounded-sm text-muted-foreground hover:text-gold hover:bg-secondary transition-colors shrink-0 disabled:opacity-40";

  return (
    <div className="border-t border-border bg-card p-3">
      {replyTo && (
        <div className="flex items-start gap-2 mb-2 border-s-2 border-gold ps-2.5 py-1">
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-semibold text-gold">{replyTo.name}</div>
            <div className="text-[11px] text-muted-foreground truncate">{replyTo.text}</div>
          </div>
          <button aria-label={tr("cancel")} onClick={onCancelReply} className="tap-target text-muted-foreground hover:text-foreground shrink-0">
            <Icon name="X" size={14} />
          </button>
        </div>
      )}

      {(atts.length > 0 || geo) && (
        <div className="flex flex-wrap gap-2 mb-2">
          {atts.map((a) => (
            <div key={a.url} className="relative border border-border rounded-sm bg-secondary overflow-hidden">
              {a.type === "image"
                ? <img src={a.url} alt="" className="w-16 h-16 object-cover" />
                : <div className="w-16 h-16 flex flex-col items-center justify-center gap-1 px-1">
                    <Icon name="FileText" size={18} className="text-gold" />
                    <span className="text-[9px] text-muted-foreground truncate max-w-full">{a.ext?.toUpperCase()}</span>
                  </div>}
              <button aria-label={tr("cancel")} onClick={() => setAtts((x) => x.filter((i) => i.url !== a.url))}
                className="absolute top-0.5 end-0.5 w-5 h-5 rounded-full bg-background/90 text-foreground flex items-center justify-center hover:text-destructive">
                <Icon name="X" size={11} />
              </button>
            </div>
          ))}
          {geo && (
            <div className="relative border border-gold/40 bg-gold/10 rounded-sm px-3 h-16 flex items-center gap-2">
              <Icon name="MapPin" size={16} className="text-gold" />
              <span className="text-[11px] text-foreground">{tr("chatGeoReady")}</span>
              <button aria-label={tr("cancel")} onClick={() => setGeo(null)} className="text-muted-foreground hover:text-destructive">
                <Icon name="X" size={13} />
              </button>
            </div>
          )}
        </div>
      )}

      {err && <div className="text-[11px] text-destructive mb-2 flex items-center gap-1.5"><Icon name="CircleAlert" size={12} />{err}</div>}

      <div className="flex items-end gap-1.5">
        <div className="relative">
          <button aria-label={tr("chatEmoji")} onClick={() => setEmojiOpen((o) => !o)} className={btn}>
            <Icon name="Smile" size={19} />
          </button>
          {emojiOpen && <EmojiPicker onClose={() => setEmojiOpen(false)} onPick={(e) => onChange(value + e)} />}
        </div>

        <button aria-label={tr("chatPhoto")} onClick={() => imgRef.current?.click()} disabled={busy || atts.length >= 6} className={btn}>
          {busy ? <Icon name="Loader" size={18} className="animate-spin" /> : <Icon name="Image" size={19} />}
        </button>
        <button aria-label={tr("chatFile")} onClick={() => docRef.current?.click()} disabled={busy || atts.length >= 6} className={btn}>
          <Icon name="Paperclip" size={19} />
        </button>
        <button aria-label={tr("chatGeo")} onClick={askGeo} disabled={geoBusy} className={btn}>
          {geoBusy ? <Icon name="Loader" size={18} className="animate-spin" /> : <Icon name="MapPin" size={19} />}
        </button>

        <input ref={imgRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple hidden
          onChange={(e) => { upload(e.target.files); e.target.value = ""; }} />
        <input ref={docRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt" multiple hidden
          onChange={(e) => { upload(e.target.files); e.target.value = ""; }} />

        <textarea
          ref={taRef}
          rows={1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            // Enter отправляет, Shift+Enter переносит строку — привычно
            // по любому мессенджеру.
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); fire(); }
          }}
          placeholder={tr("writeMessage")}
          disabled={disabled}
          className="flex-1 resize-none bg-secondary border border-input rounded-sm px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-gold transition-colors leading-snug"
        />

        <button
          onClick={fire}
          disabled={!canSend}
          aria-label={tr("writeMessage")}
          className="w-10 h-10 shrink-0 gold-gradient text-[hsl(28,20%,7%)] rounded-sm flex items-center justify-center disabled:opacity-40"
        >
          <Icon name="Send" size={17} />
        </button>
      </div>
    </div>
  );
}