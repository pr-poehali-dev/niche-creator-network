import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { useLang, t, LANGS, type Lang } from "@/lib/i18n";
import { dataExtra } from "@/lib/i18n-extra";
import { downloadReceipt } from "@/lib/receipt";
import { useGeo, haversineKm } from "@/lib/geo";
import { useProviders, isLicensed, isQuietNow, isPremium, providerLocalTime, type Provider } from "@/lib/providers";
import { useAuth, type AuthRole } from "@/lib/auth";
import func2url from "../../backend/func2url.json";

const HERO_IMAGE = "https://cdn.poehali.dev/projects/cdac7d00-bd0a-4bb7-a1b1-237a7708c061/files/92040949-913f-4126-80f9-fa681d96ea82.jpg";
const POLYGRAPH_IMAGE = "https://cdn.poehali.dev/projects/cdac7d00-bd0a-4bb7-a1b1-237a7708c061/files/7ad3b230-2fec-4347-a4a7-4c4670578fee.jpg";
const DETECTIVE_IMAGE = "https://cdn.poehali.dev/projects/cdac7d00-bd0a-4bb7-a1b1-237a7708c061/files/fc0c15b9-2bf3-4932-b821-d76b3c5a8c55.jpg";
const GUARDS_IMAGE = "https://cdn.poehali.dev/projects/cdac7d00-bd0a-4bb7-a1b1-237a7708c061/files/3ab23f4f-4190-41a8-a1f3-206d541e0669.jpg";
const SPY_AVATAR_M = "https://cdn.poehali.dev/projects/cdac7d00-bd0a-4bb7-a1b1-237a7708c061/files/61fc9ccd-a5ee-4375-8640-5c890da0df33.jpg";
const SPY_AVATAR_F = "https://cdn.poehali.dev/projects/cdac7d00-bd0a-4bb7-a1b1-237a7708c061/files/b40d29de-2a29-448c-82c8-a2baa711ee57.jpg";
const PROVIDER_EMAIL = "a.morozov@shchit.ru";
const DEMO_CLIENT = {
  name: { ru: "Дмитрий Орлов", en: "Dmitry Orlov" },
  city: { ru: "Москва", en: "Moscow" },
  email: "d.orlov@email.com",
};

type Section = "home" | "profile" | "cases" | "services" | "courses" | "guards" | "chat" | "forum" | "contacts" | "policy" | "pricing" | "dashboard" | "privacy" | "terms" | "agreement" | "offer" | "admin";
type Role = "client" | "provider";

type NavItem = { id: Section; key: keyof typeof t; icon: string };

const CLIENT_NAV: NavItem[] = [
  { id: "home", key: "navHome", icon: "Home" },
  { id: "services", key: "navSearch", icon: "Search" },
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

const spyAvatar = (gender?: string) => (gender === "f" ? SPY_AVATAR_F : SPY_AVATAR_M);
const resolveAvatar = (img: string | null | undefined, gender?: string) => (img && img.trim() ? img : spyAvatar(gender));
const isImageUrl = (url?: string) => !!url && /\.(png|jpe?g|webp|gif)(\?|$)/i.test(url);

function Lightbox({ src, title, onClose }: { src: string; title?: string; onClose: () => void }) {
  const { tr } = useLang();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-background/90 backdrop-blur-sm" />
      <div className="relative z-10 max-w-3xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {title && <div className="text-sm font-montserrat font-semibold text-foreground mb-3 text-center">{title}</div>}
        <img src={src} alt={title || ""} className="max-w-full max-h-[78vh] object-contain rounded-sm border border-gold/30 mx-auto" />
        <div className="flex items-center justify-center gap-3 mt-4">
          <a href={src} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-montserrat font-semibold text-gold hover:underline">
            <Icon name="ExternalLink" size={14} />{tr("lightboxOpenNewTab")}
          </a>
          <button onClick={onClose} className="inline-flex items-center gap-1.5 border border-border text-muted-foreground text-xs font-montserrat font-semibold px-4 py-2 rounded-sm hover:border-gold hover:text-gold transition-all">
            <Icon name="X" size={14} />{tr("lightboxClose")}
          </button>
        </div>
      </div>
      <button onClick={onClose} className="absolute top-4 end-4 z-20 text-muted-foreground hover:text-foreground transition-colors" aria-label={tr("lightboxClose")}>
        <Icon name="X" size={26} />
      </button>
    </div>
  );
}

function AuthModal({ onClose, onOpenDoc }: { onClose: () => void; onOpenDoc: (s: Section) => void }) {
  const { tr, lang } = useLang();
  const { login, verify2fa, resend2fa, register, adminLogin } = useAuth();
  const [mode, setMode] = useState<"login" | "register" | "admin">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<AuthRole>("client");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [twofa, setTwofa] = useState<{ challengeId: string; emailHint: string; sent: boolean } | null>(null);
  const [code, setCode] = useState("");
  const [resent, setResent] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const errText = (code: string) => {
    if (code === "invalid_credentials") return tr("authErrInvalid");
    if (code === "email_exists") return tr("authErrExists");
    if (code === "weak_password") return tr("authErrWeak");
    if (code === "invalid_email") return tr("authErrEmail");
    if (code === "consent") return tr("authErrConsent");
    if (code === "wrong_code") return tr("auth2faWrong");
    if (code === "code_expired") return tr("auth2faExpired");
    if (code === "too_many_attempts") return tr("auth2faTooMany");
    return tr("authErrGeneric");
  };

  const submit = async () => {
    setError("");
    if (mode === "register" && !consent) { setError(errText("consent")); return; }
    setBusy(true);
    const res = mode === "login"
      ? await login(email.trim(), password, lang)
      : mode === "admin"
        ? await adminLogin(password, role)
        : await register(email.trim(), password, role, name.trim());
    setBusy(false);
    if (res.need2fa && res.challengeId) {
      setTwofa({ challengeId: res.challengeId, emailHint: res.emailHint || email, sent: !!res.sent });
      return;
    }
    if (res.ok) onClose();
    else setError(errText(res.error || "error"));
  };

  const submitCode = async () => {
    if (!twofa || code.length !== 6) return;
    setError("");
    setBusy(true);
    const res = await verify2fa(twofa.challengeId, code);
    setBusy(false);
    if (res.ok) onClose();
    else setError(errText(res.error || "error"));
  };

  const doResend = async () => {
    if (!twofa) return;
    setError("");
    const res = await resend2fa(twofa.challengeId, lang);
    if (res.ok && res.challengeId) {
      setTwofa({ ...twofa, challengeId: res.challengeId });
      setResent(true);
      setTimeout(() => setResent(false), 4000);
    }
  };

  if (twofa) {
    return (
      <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
        <div className="absolute inset-0 bg-background/90 backdrop-blur-sm" />
        <div className="relative z-10 w-full max-w-md bg-card border border-gold/40 rounded-sm shadow-2xl security-glow p-7" onClick={(e) => e.stopPropagation()}>
          <button onClick={onClose} className="absolute top-3 end-3 text-muted-foreground hover:text-foreground transition-colors" aria-label={tr("lightboxClose")}>
            <Icon name="X" size={20} />
          </button>
          <div className="w-12 h-12 gold-gradient rounded-full flex items-center justify-center mb-4 glow-gold-sm">
            <Icon name="ShieldCheck" size={22} className="text-[hsl(220,20%,6%)]" />
          </div>
          <h3 className="font-montserrat font-bold text-lg text-foreground mb-1">{tr("auth2faTitle")}</h3>
          <p className="text-xs text-muted-foreground mb-1">{tr("auth2faDesc")} <span className="text-gold font-semibold">{twofa.emailHint}</span></p>
          {!twofa.sent && <p className="text-[11px] text-amber-400 mb-2">{tr("auth2faNotConfigured")}</p>}
          <input
            value={code}
            onChange={(e) => { setCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
            onKeyDown={(e) => { if (e.key === "Enter" && code.length === 6 && !busy) submitCode(); }}
            inputMode="numeric"
            autoFocus
            placeholder="••••••"
            className="w-full bg-secondary border border-border rounded-sm px-4 py-3 text-center text-2xl tracking-[0.5em] font-montserrat font-bold text-foreground placeholder:text-muted-foreground outline-none focus:border-gold transition-colors my-4"
          />
          {error && (
            <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-sm px-3 py-2 mb-3">
              <Icon name="CircleAlert" size={14} className="shrink-0" />{error}
            </div>
          )}
          <button
            onClick={submitCode}
            disabled={busy || code.length !== 6}
            className="w-full gold-gradient text-[hsl(220,20%,6%)] py-3 text-sm font-montserrat font-bold rounded-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {busy ? <Icon name="Loader" size={16} className="animate-spin" /> : <Icon name="LogIn" size={16} />}
            {tr("auth2faConfirm")}
          </button>
          <div className="flex items-center justify-between mt-4 text-xs">
            <button onClick={() => { setTwofa(null); setCode(""); setError(""); }} className="text-muted-foreground hover:text-gold flex items-center gap-1"><Icon name="ArrowLeft" size={13} />{tr("authBackToLogin")}</button>
            <button onClick={doResend} className="text-gold hover:underline font-semibold">{resent ? tr("auth2faResent") : tr("auth2faResend")}</button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "admin") {
    return (
      <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
        <div className="absolute inset-0 bg-background/90 backdrop-blur-sm" />
        <div className="relative z-10 w-full max-w-md bg-card border border-gold/40 rounded-sm shadow-2xl security-glow" onClick={(e) => e.stopPropagation()}>
          <button onClick={onClose} className="absolute top-3 end-3 text-muted-foreground hover:text-foreground transition-colors" aria-label={tr("lightboxClose")}>
            <Icon name="X" size={20} />
          </button>
          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-9 h-9 gold-gradient rounded flex items-center justify-center">
                <Icon name="ShieldCheck" size={17} className="text-[hsl(220,20%,6%)]" />
              </div>
              <span className="font-montserrat font-bold text-base text-foreground">{tr("authAdminTitle")}</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-montserrat font-semibold text-foreground mb-1.5 block">{tr("authAdminViewAs")}</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["client", "provider"] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setRole(r)}
                      className={`py-2.5 text-xs font-montserrat font-bold rounded-sm border transition-all ${role === r ? "border-gold text-gold bg-gold/10" : "border-border text-muted-foreground hover:text-foreground"}`}
                    >
                      {tr(r === "client" ? "roleClient" : "roleProvider")}
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !busy) submit(); }}
                placeholder={tr("authAdminPassword")}
                autoComplete="off"
                autoFocus
                className="w-full bg-secondary border border-border rounded-sm px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-gold transition-colors"
              />

              {error && (
                <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-sm px-3 py-2">
                  <Icon name="CircleAlert" size={14} className="shrink-0" />{error}
                </div>
              )}

              <button
                onClick={submit}
                disabled={busy}
                className="w-full gold-gradient text-[hsl(220,20%,6%)] py-3 text-sm font-montserrat font-bold rounded-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {busy ? <Icon name="Loader" size={16} className="animate-spin" /> : <Icon name="LogIn" size={16} />}
                {busy ? tr("authBusy") : tr("authAdminBtn")}
              </button>
            </div>

            <div className="text-center mt-4">
              <button onClick={() => { setMode("login"); setError(""); setPassword(""); }} className="text-xs text-muted-foreground hover:text-gold transition-colors">
                {tr("authBackToLogin")}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-background/90 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-md bg-card border border-border rounded-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 end-3 text-muted-foreground hover:text-foreground transition-colors" aria-label={tr("lightboxClose")}>
          <Icon name="X" size={20} />
        </button>
        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-9 h-9 gold-gradient rounded flex items-center justify-center">
              <Icon name="Shield" size={17} className="text-[hsl(220,20%,6%)]" />
            </div>
            <span className="font-montserrat font-bold text-lg tracking-[0.2em] text-foreground">Щ<span className="text-gold">ИТ</span></span>
          </div>

          <div className="flex border border-border rounded-sm overflow-hidden mb-6">
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(""); }}
                className={`flex-1 py-2.5 text-sm font-montserrat font-bold transition-colors ${mode === m ? "gold-gradient text-[hsl(220,20%,6%)]" : "text-muted-foreground hover:text-foreground"}`}
              >
                {tr(m === "login" ? "authTabLogin" : "authTabRegister")}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {mode === "register" && (
              <>
                <div>
                  <label className="text-xs font-montserrat font-semibold text-foreground mb-1.5 block">{tr("authRoleQuestion")}</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["client", "provider"] as const).map((r) => (
                      <button
                        key={r}
                        onClick={() => setRole(r)}
                        className={`py-2.5 text-xs font-montserrat font-bold rounded-sm border transition-all ${role === r ? "border-gold text-gold bg-gold/10" : "border-border text-muted-foreground hover:text-foreground"}`}
                      >
                        {tr(r === "client" ? "roleClient" : "roleProvider")}
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={tr("authNamePh")}
                  className="w-full bg-secondary border border-border rounded-sm px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-gold transition-colors"
                />
              </>
            )}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={tr("authEmail")}
              autoComplete="email"
              className="w-full bg-secondary border border-border rounded-sm px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-gold transition-colors"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !busy) submit(); }}
              placeholder={tr("authPassword")}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              className="w-full bg-secondary border border-border rounded-sm px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-gold transition-colors"
            />

            {mode === "register" && (
              <label className="flex items-start gap-2.5 cursor-pointer select-none pt-1">
                <button
                  type="button"
                  onClick={() => setConsent((v) => !v)}
                  className={`mt-0.5 w-5 h-5 shrink-0 rounded-sm border flex items-center justify-center transition-all ${consent ? "gold-gradient border-gold" : "border-border bg-secondary"}`}
                  aria-checked={consent}
                  role="checkbox"
                >
                  {consent && <Icon name="Check" size={13} className="text-[hsl(220,20%,6%)]" />}
                </button>
                <span className="text-[11px] text-muted-foreground leading-relaxed" onClick={() => setConsent((v) => !v)}>
                  {tr("consentIntro")}{" "}
                  {([["consentPrivacy", "privacy"], ["consentTerms", "terms"], ["consentAgreement", "agreement"], ["consentOffer", "offer"]] as const).map(([k, sec], i) => (
                    <span key={k}>
                      {i > 0 && ", "}
                      <button type="button" onClick={(e) => { e.stopPropagation(); onOpenDoc(sec); }} className="text-gold hover:underline">{tr(k)}</button>
                    </span>
                  ))}
                  {" — "}{tr("consentCookie")}
                </span>
              </label>
            )}

            {error && (
              <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-sm px-3 py-2">
                <Icon name="CircleAlert" size={14} className="shrink-0" />{error}
              </div>
            )}

            <button
              onClick={submit}
              disabled={busy}
              className="w-full gold-gradient text-[hsl(220,20%,6%)] py-3 text-sm font-montserrat font-bold rounded-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {busy ? <Icon name="Loader" size={16} className="animate-spin" /> : <Icon name={mode === "login" ? "LogIn" : "UserPlus"} size={16} />}
              {busy ? tr("authBusy") : tr(mode === "login" ? "authLoginBtn" : "authRegisterBtn")}
            </button>
          </div>

          <div className="text-center mt-4 text-xs text-muted-foreground">
            {mode === "login" ? tr("authNoAccount") : tr("authHaveAccount")}{" "}
            <button onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }} className="text-gold font-semibold hover:underline">
              {tr(mode === "login" ? "authToRegister" : "authToLogin")}
            </button>
          </div>

          <div className="flex items-center justify-center gap-1.5 mt-5 text-[11px] text-muted-foreground">
            <Icon name="ShieldCheck" size={12} className="text-gold" />
            {tr("authSecureNote")}
          </div>

          <div className="text-center mt-4 pt-4 border-t border-border">
            <button onClick={() => { setMode("admin"); setError(""); setPassword(""); }} className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground/70 hover:text-gold transition-colors">
              <Icon name="KeyRound" size={12} />
              {tr("authAdminLink")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DocFileButton({ slug, url, onUploaded }: { slug: string; url: string; onUploaded: (url: string) => void }) {
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
          headers: { "Content-Type": "application/json" },
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
          <img src={url} alt="" className="w-full h-full object-cover" />
        </a>
      )}
      {url && <a href={url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-green-400 inline-flex items-center gap-1"><Icon name="Check" size={11} />{tr("pdVfDocAttached")}</a>}
      {!url && !busy && <span className="text-[10px] text-muted-foreground">{tr("pdVfDocHint")}</span>}
      {err && <span className="text-[11px] text-destructive">{tr("pdVfDocError")}</span>}
    </div>
  );
}

function AvatarUploader({ current, gender, role, recordId, onUploaded }: { current: string | null; gender: string; role: "provider" | "client"; recordId: string; onUploaded: (url: string) => void }) {
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
          headers: { "Content-Type": "application/json" },
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
        <img src={resolveAvatar(current, gender)} alt="avatar" className="w-full h-full object-cover" />
      </div>
      <div className="flex-1">
        <div className="text-xs font-montserrat font-semibold text-foreground mb-1">{tr("avatarTitle")}</div>
        <p className="text-[11px] text-muted-foreground mb-2">{tr("avatarHint")}</p>
        <label className="inline-flex items-center gap-1.5 cursor-pointer border border-gold text-gold text-xs font-montserrat font-semibold px-3 py-2 rounded-sm hover:bg-gold hover:text-[hsl(220,20%,6%)] transition-all">
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

function AvailabilityNote({ p }: { p: Provider }) {
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

function ContactButtons({ p, onChat, compact }: { p: Provider; onChat: () => void; compact?: boolean }) {
  const { tr } = useLang();
  const c = p.contacts;
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
          <a href={`tel:${c.phone}`} className={`${btn} ${pad} gold-gradient text-[hsl(220,20%,6%)] hover:opacity-90`} aria-label={tr("contactCall")}>
            <Icon name="Phone" size={size} />{!compact && tr("contactCall")}
          </a>
        )
      )}
      <button onClick={onChat} className={`${btn} ${pad} border border-gold text-gold hover:bg-gold hover:text-[hsl(220,20%,6%)]`} aria-label={tr("contactChat")}>
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

function VerificationBlock({ v }: { v: NonNullable<Provider["verification"]> }) {
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
                  {licenses.map((lic, i) => (
                    <div key={i} className="text-xs text-foreground font-montserrat font-medium">{lic}</div>
                  ))}
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
                        <img src={d.url} alt={d.title || ""} className="w-full h-full object-cover" />
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
        <div className="absolute end-0 mt-1 z-50 min-w-[160px] border border-border rounded-sm bg-card shadow-lg overflow-hidden animate-fade-in">
          {LANGS.map((l) => (
            <button
              key={l.code}
              onClick={() => { setLang(l.code); setOpen(false); }}
              className={`w-full flex items-center justify-between gap-3 px-3 py-2 text-xs font-montserrat text-start transition-colors ${l.code === lang ? "bg-gold text-[hsl(220,20%,6%)] font-bold" : "text-foreground hover:bg-secondary"}`}
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
  privacy: "fPrivacy",
  terms: "fTerms",
  agreement: "fAgreement",
  offer: "fOffer",
  admin: "adminPanelTitle",
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

const serviceCategories = [
  { id: "physical", icon: "ShieldCheck", title: { ru: "Физическая безопасность", en: "Physical security" } },
  { id: "cyber", icon: "Lock", title: { ru: "Информационная и кибербезопасность", en: "Information & cybersecurity" } },
  { id: "economic", icon: "Briefcase", title: { ru: "Экономическая и корпоративная безопасность", en: "Economic & corporate security" } },
  { id: "investigation", icon: "Search", title: { ru: "Расследования и аналитика", en: "Investigations & analytics" } },
  { id: "engineering", icon: "Cpu", title: { ru: "Инженерно-техническая безопасность", en: "Engineering & technical security" } },
  { id: "polygraph", icon: "Activity", title: { ru: "Полиграфология", en: "Polygraph examination" } },
] as const;

const services = [
  // Физическая безопасность
  { cat: "physical", icon: "UserCog", title: { ru: "Телохранитель (личная охрана)", en: "Bodyguard (close protection)" }, price: { ru: "от 9 000 ₽/смена", en: "from $100/shift" }, time: { ru: "по запросу", en: "on request" }, desc: { ru: "Непосредственная защита физического лица — VIP, руководителя, публичной персоны", en: "Direct protection of an individual — a VIP, executive or public figure" } },
  { cat: "physical", icon: "Building2", title: { ru: "Сотрудник службы безопасности / охранник", en: "Security guard" }, price: { ru: "от 180 ₽/час", en: "from $2/hour" }, time: { ru: "24/7", en: "24/7" }, desc: { ru: "Охрана объектов, контроль пропускного режима, патрулирование территории офисов, складов и ТЦ", en: "Site protection, access control and patrolling of offices, warehouses and malls" } },
  { cat: "physical", icon: "ScanLine", title: { ru: "Инспектор по досмотру", en: "Screening inspector" }, price: { ru: "по запросу", en: "on request" }, time: { ru: "сменный график", en: "shift schedule" }, desc: { ru: "Работа на КПП с применением технических средств досмотра — аэропорты, вокзалы, объекты", en: "Checkpoint work with technical screening means — airports, stations and facilities" } },
  { cat: "physical", icon: "Users", title: { ru: "Безопасность массовых мероприятий", en: "Event security specialist" }, price: { ru: "от 15 000 ₽", en: "from $170" }, time: { ru: "под событие", en: "per event" }, desc: { ru: "Порядок и безопасность на концертах, спортивных матчах и фестивалях", en: "Order and safety at concerts, sporting events and festivals" } },
  { cat: "physical", icon: "Dog", title: { ru: "Кинолог", en: "K9 handler" }, price: { ru: "от 12 000 ₽", en: "from $140" }, time: { ru: "по запросу", en: "on request" }, desc: { ru: "Работа со служебными собаками: поиск запрещённых веществ, взрывчатки, задержание нарушителей", en: "Service-dog work: detection of prohibited substances, explosives and apprehension" } },

  // Информационная и кибербезопасность
  { cat: "cyber", icon: "Lock", title: { ru: "Специалист по информационной безопасности", en: "Information security specialist" }, price: { ru: "от 20 000 ₽", en: "from $230" }, time: { ru: "проект", en: "project" }, desc: { ru: "Настройка систем защиты: межсетевых экранов, антивирусов, систем обнаружения вторжений", en: "Setup of protection systems: firewalls, antivirus and intrusion detection" } },
  { cat: "cyber", icon: "Activity", title: { ru: "Аналитик по кибербезопасности (SOC)", en: "Cybersecurity analyst (SOC)" }, price: { ru: "от 25 000 ₽/мес", en: "from $280/mo" }, time: { ru: "24/7 мониторинг", en: "24/7 monitoring" }, desc: { ru: "Мониторинг событий безопасности в реальном времени, выявление аномалий и реагирование на инциденты", en: "Real-time security monitoring, anomaly detection and incident response" } },
  { cat: "cyber", icon: "Bug", title: { ru: "Пентестер / этичный хакер", en: "Penetration tester / ethical hacker" }, price: { ru: "от 40 000 ₽", en: "from $450" }, time: { ru: "от 1 недели", en: "from 1 week" }, desc: { ru: "Санкционированные атаки на системы компании для поиска уязвимостей раньше злоумышленников", en: "Authorized attacks on company systems to find vulnerabilities before attackers do" } },
  { cat: "cyber", icon: "Globe", title: { ru: "OSINT-специалист", en: "OSINT specialist" }, price: { ru: "от 15 000 ₽", en: "from $170" }, time: { ru: "2–5 дней", en: "2–5 days" }, desc: { ru: "Сбор и анализ информации из открытых источников для оценки рисков и проверки контрагентов", en: "Collection and analysis of open-source data for risk assessment and counterparty checks" } },
  { cat: "cyber", icon: "FileSearch", title: { ru: "Форензик-аналитик (цифровая криминалистика)", en: "Digital forensics analyst" }, price: { ru: "от 35 000 ₽", en: "from $400" }, time: { ru: "3–10 дней", en: "3–10 days" }, desc: { ru: "Расследование киберпреступлений, восстановление хронологии событий и сбор цифровых улик", en: "Investigation of cybercrime, event-timeline reconstruction and digital evidence collection" } },
  { cat: "cyber", icon: "ShieldAlert", title: { ru: "DLP-специалист", en: "DLP specialist" }, price: { ru: "от 30 000 ₽", en: "from $340" }, time: { ru: "проект", en: "project" }, desc: { ru: "Управление системами предотвращения утечек конфиденциальной информации (Data Loss Prevention)", en: "Management of Data Loss Prevention systems for confidential information" } },

  // Экономическая и корпоративная безопасность
  { cat: "economic", icon: "Banknote", title: { ru: "Специалист по экономической безопасности", en: "Economic security specialist" }, price: { ru: "от 25 000 ₽", en: "from $280" }, time: { ru: "проект", en: "project" }, desc: { ru: "Предотвращение мошенничества, хищений и коррупции внутри организации", en: "Prevention of fraud, theft and corruption inside the organization" } },
  { cat: "economic", icon: "ClipboardCheck", title: { ru: "Аудитор безопасности бизнес-процессов", en: "Business-process security auditor" }, price: { ru: "от 30 000 ₽", en: "from $340" }, time: { ru: "1–3 недели", en: "1–3 weeks" }, desc: { ru: "Проверка внутренних процедур на слабые места, ведущие к финансовым потерям", en: "Review of internal procedures for weak points leading to financial losses" } },
  { cat: "economic", icon: "TrendingUp", title: { ru: "Менеджер по управлению рисками", en: "Risk manager" }, price: { ru: "от 35 000 ₽", en: "from $400" }, time: { ru: "проект", en: "project" }, desc: { ru: "Идентификация финансовых, операционных и репутационных угроз и стратегии их минимизации", en: "Identification of financial, operational and reputational threats and mitigation strategies" } },

  // Расследования и аналитика
  { cat: "investigation", icon: "Eye", title: { ru: "Частный детектив", en: "Private investigator" }, price: { ru: "от 12 000 ₽/день", en: "from $140/day" }, time: { ru: "от 1 дня", en: "from 1 day" }, desc: { ru: "Сыщицкая деятельность по поручению клиентов: поиск людей, проверка фактов, наблюдение", en: "Investigative work for clients: locating people, fact-checking and surveillance" } },
  { cat: "investigation", icon: "Briefcase", title: { ru: "Корпоративный следователь", en: "Corporate investigator" }, price: { ru: "от 20 000 ₽", en: "from $230" }, time: { ru: "3–10 дней", en: "3–10 days" }, desc: { ru: "Внутренние расследования по фактам мошенничества, краж и нарушения политики компании", en: "Internal investigations of fraud, theft and corporate-policy violations" } },
  { cat: "investigation", icon: "UserSearch", title: { ru: "Профайлер", en: "Profiler" }, price: { ru: "от 18 000 ₽", en: "from $200" }, time: { ru: "по запросу", en: "on request" }, desc: { ru: "Психологический портрет для прогноза поведения — переговоры и оценка благонадёжности", en: "Psychological profiling to predict behavior — negotiations and trustworthiness assessment" } },

  // Инженерно-техническая безопасность
  { cat: "engineering", icon: "Video", title: { ru: "Инженер по системам безопасности", en: "Security systems engineer" }, price: { ru: "от 20 000 ₽", en: "from $230" }, time: { ru: "под ключ", en: "turnkey" }, desc: { ru: "Проектирование, монтаж и обслуживание видеонаблюдения (CCTV), СКУД и сигнализации", en: "Design, installation and maintenance of CCTV, access control and alarm systems" } },
  { cat: "engineering", icon: "RadioTower", title: { ru: "Инженер технической защиты информации", en: "Technical information protection engineer" }, price: { ru: "от 25 000 ₽", en: "from $280" }, time: { ru: "от 4 часов", en: "from 4 hours" }, desc: { ru: "Защита каналов связи от прослушивания, генераторы шума, поиск закладок и экранирование помещений", en: "Protection of comms from eavesdropping, noise generators, bug sweeps and room shielding" } },

  // Полиграфология
  { cat: "polygraph", icon: "Activity", title: { ru: "Полиграфолог", en: "Polygraph examiner" }, price: { ru: "от 8 000 ₽", en: "from $90" }, time: { ru: "2–3 часа", en: "2–3 hours" }, desc: { ru: "Полиграфные проверки для бизнеса и частных лиц: HR, расследования, проверка благонадёжности", en: "Polygraph examinations for business and individuals: HR, investigations and trustworthiness checks" } },
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

type AdminProvider = { slug: string; name: { ru: string; en: string }; legalStatus: string; verified: boolean; licenseVerified: boolean; licenses: string[]; active: boolean; documents: { title: string; url: string }[]; fullName: string; registry: string };

function AdminPanel() {
  const { lang, tr } = useLang();
  const [items, setItems] = useState<AdminProvider[] | null>(null);
  const [error, setError] = useState(false);
  const [savingSlug, setSavingSlug] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  const token = () => localStorage.getItem("shchit_auth_token") || "";

  const load = useCallback(() => {
    setError(false);
    fetch(func2url["admin-providers"], { headers: { "X-Auth-Token": token() } })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setItems(Array.isArray(d.providers) ? d.providers : []))
      .catch(() => { setError(true); setItems([]); });
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = async (p: AdminProvider, field: "licenseVerified" | "verified") => {
    setSavingSlug(p.slug + field);
    try {
      const next = !p[field];
      const res = await fetch(func2url["admin-providers"], {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Auth-Token": token() },
        body: JSON.stringify({ slug: p.slug, [field]: next }),
      });
      if (res.ok) {
        setItems((prev) => (prev || []).map((x) => {
          if (x.slug !== p.slug) return x;
          const upd = { ...x, [field]: next };
          if (field === "verified" && !next) upd.licenseVerified = false;
          return upd;
        }));
      }
    } finally {
      setSavingSlug(null);
    }
  };

  const isOrg = (s: string) => ["ip", "company", "ип", "ооо", "llc"].includes((s || "").toLowerCase());
  const statusLabel = (s: string) => {
    const v = (s || "").toLowerCase();
    if (v === "ip" || v === "ип") return "ИП";
    if (v === "company" || v === "ооо" || v === "llc") return "ООО";
    if (v === "self") return tr("adminStatusSelf");
    return "—";
  };

  const filtered = (items || []).filter((p) => {
    const n = (p.name.ru + " " + p.name.en + " " + p.slug).toLowerCase();
    return n.includes(query.toLowerCase());
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="border border-gold/30 rounded-sm glass-card p-6 md:p-8 mb-6 relative overflow-hidden security-glow">
        <div className="absolute inset-0 grid-line-bg opacity-30" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 gold-gradient rounded-full flex items-center justify-center shrink-0 glow-gold-sm">
            <Icon name="ShieldCheck" size={26} className="text-[hsl(220,20%,6%)]" />
          </div>
          <div>
            <h1 className="font-montserrat font-extrabold text-2xl md:text-3xl text-foreground">{tr("adminPanelTitle")}</h1>
            <p className="text-xs text-muted-foreground mt-1">{tr("adminLicenseHint")}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 flex items-center gap-2 border border-border bg-card rounded-sm px-4">
          <Icon name="Search" size={15} className="text-muted-foreground" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={tr("adminSearch")} className="flex-1 bg-transparent py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none" />
        </div>
        <button onClick={load} className="flex items-center gap-1.5 border border-border text-muted-foreground px-3 py-2.5 text-xs font-montserrat font-semibold rounded-sm hover:border-gold hover:text-gold transition-all">
          <Icon name="RefreshCw" size={14} />{tr("adminRefresh")}
        </button>
      </div>

      {items === null ? (
        <div className="border border-dashed border-border rounded-sm bg-card/50 py-16 flex justify-center"><Icon name="Loader" size={28} className="text-gold animate-spin" /></div>
      ) : error ? (
        <div className="border border-destructive/30 rounded-sm bg-destructive/10 p-4 text-sm text-destructive flex items-center gap-2"><Icon name="CircleAlert" size={16} />{tr("adminError")}</div>
      ) : (
        <div className="border border-border rounded-sm bg-card overflow-hidden">
          {filtered.map((p) => {
            const eligible = p.verified && isOrg(p.legalStatus) && p.licenses.length > 0;
            const docCount = p.documents.length + p.licenses.length;
            const open = openSlug === p.slug;
            return (
              <div key={p.slug} className="border-b border-border last:border-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3.5">
                  <div className="flex-1 min-w-0">
                    <div className="font-montserrat font-semibold text-sm text-foreground truncate">{L(p.name, lang)}</div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-[10px] text-muted-foreground">{p.slug}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-sm ${isOrg(p.legalStatus) ? "bg-gold/10 text-gold" : "bg-secondary text-muted-foreground"}`}>{statusLabel(p.legalStatus)}</span>
                      <span className="text-[10px] text-muted-foreground">· {p.licenses.length} {tr("adminLicensesCount")}</span>
                    </div>
                    {!eligible && (
                      <div className="text-[10px] text-amber-400/80 mt-1 flex items-center gap-1"><Icon name="TriangleAlert" size={10} />{tr("adminNotEligible")}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <button
                      onClick={() => setOpenSlug(open ? null : p.slug)}
                      className={`flex items-center gap-1.5 px-3 py-2 text-xs font-montserrat font-semibold rounded-sm transition-all border ${open ? "border-gold text-gold bg-gold/10" : "border-border text-muted-foreground hover:border-gold hover:text-gold"}`}
                    >
                      <Icon name="FileText" size={14} />
                      {tr("adminDocs")} ({docCount})
                      <Icon name={open ? "ChevronUp" : "ChevronDown"} size={13} />
                    </button>
                    <button
                      onClick={() => toggle(p, "verified")}
                      disabled={savingSlug === p.slug + "verified"}
                      className={`flex items-center gap-1.5 px-3 py-2 text-xs font-montserrat font-bold rounded-sm transition-all disabled:opacity-50 ${p.verified ? "bg-green-500/15 border border-green-500/40 text-green-400" : "border border-border text-muted-foreground hover:border-green-500 hover:text-green-400"}`}
                    >
                      {savingSlug === p.slug + "verified" ? <Icon name="Loader" size={14} className="animate-spin" /> : <Icon name={p.verified ? "ShieldCheck" : "Shield"} size={14} />}
                      {p.verified ? tr("adminVerifyOn") : tr("adminVerifyOff")}
                    </button>
                    <button
                      onClick={() => toggle(p, "licenseVerified")}
                      disabled={savingSlug === p.slug + "licenseVerified"}
                      className={`flex items-center gap-1.5 px-3 py-2 text-xs font-montserrat font-bold rounded-sm transition-all disabled:opacity-50 ${p.licenseVerified ? "gold-gradient text-[hsl(220,20%,6%)]" : "border border-border text-muted-foreground hover:border-gold hover:text-gold"}`}
                    >
                      {savingSlug === p.slug + "licenseVerified" ? <Icon name="Loader" size={14} className="animate-spin" /> : <Icon name={p.licenseVerified ? "BadgeCheck" : "Badge"} size={14} />}
                      {p.licenseVerified ? tr("adminLicenseOn") : tr("adminLicenseOff")}
                    </button>
                  </div>
                </div>
                {open && (
                  <div className="px-4 pb-4 -mt-1 animate-fade-in">
                    <div className="border border-border rounded-sm bg-secondary/40 p-4 space-y-3">
                      {(p.fullName || p.registry) && (
                        <div className="flex flex-wrap gap-x-6 gap-y-1 text-[11px]">
                          {p.fullName && <div><span className="text-muted-foreground">{tr("adminFullName")}: </span><span className="text-foreground font-semibold">{p.fullName}</span></div>}
                          {p.registry && <div><span className="text-muted-foreground">{tr("adminRegistry")}: </span><span className="text-foreground font-semibold">{p.registry}</span></div>}
                        </div>
                      )}
                      <div>
                        <div className="text-[10px] font-montserrat font-bold text-muted-foreground uppercase tracking-widest mb-1.5">{tr("adminLicensesList")}</div>
                        {p.licenses.length ? (
                          <div className="space-y-1">
                            {p.licenses.map((l, i) => (
                              <div key={i} className="flex items-center gap-1.5 text-xs text-foreground"><Icon name="Award" size={13} className="text-gold shrink-0" />{l}</div>
                            ))}
                          </div>
                        ) : <div className="text-xs text-muted-foreground">{tr("adminNoLicenses")}</div>}
                      </div>
                      <div>
                        <div className="text-[10px] font-montserrat font-bold text-muted-foreground uppercase tracking-widest mb-1.5">{tr("adminDocsList")}</div>
                        {p.documents.length ? (
                          <div className="flex flex-wrap gap-2">
                            {p.documents.map((d, i) => (
                              d.url ? (
                                <a key={i} href={d.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-gold border border-gold/30 rounded-sm px-2.5 py-1.5 hover:bg-gold/10 transition-all">
                                  <Icon name="FileText" size={13} />{d.title || tr("adminOpenDoc")}<Icon name="ExternalLink" size={11} />
                                </a>
                              ) : (
                                <span key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground border border-border rounded-sm px-2.5 py-1.5"><Icon name="FileText" size={13} />{d.title}</span>
                              )
                            ))}
                          </div>
                        ) : <div className="text-xs text-muted-foreground">{tr("adminNoDocs")}</div>}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-muted-foreground">{tr("adminEmpty")}</div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Index() {
  const { lang, setLang, tr, applyGeoLang } = useLang();
  const { user, isAuthed, logout } = useAuth();
  const [active, setActive] = useState<Section>("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [secBannerOpen, setSecBannerOpen] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);
  const { geo } = useGeo();

  const role: Role = user?.role === "provider" ? "provider" : "client";

  useEffect(() => {
    if (geo?.countryCode) applyGeoLang(geo.countryCode);
  }, [geo?.countryCode]);

  useEffect(() => {
    if (!isAuthed) setActive("home");
  }, [isAuthed]);

  const NAV_ITEMS = isAuthed ? (role === "client" ? CLIENT_NAV : PROVIDER_NAV) : [];

  const go = (s: Section) => {
    setActive(s);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openCabinet = () => {
    setMobileMenuOpen(false);
    if (isAuthed) go("dashboard");
    else setAuthOpen(true);
  };

  const handleLogout = async () => {
    setMobileMenuOpen(false);
    await logout();
    setActive("home");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderSection = () => {
    if (!isAuthed) {
      if (active === "policy") return <SecurityPolicySection setActive={go} />;
      if (active === "privacy" || active === "terms" || active === "agreement" || active === "offer") return <LegalDocSection doc={LEGAL_DOCS[active]} setActive={go} />;
      if (active === "pricing") return <PricingSection setActive={go} />;
      return <MinimalHome onCabinet={() => setAuthOpen(true)} onPolicy={() => go("policy")} />;
    }
    switch (active) {
      case "home": return <HomeSection setActive={go} role={role} />;
      case "profile": return <ProfileSection setActive={go} />;
      case "cases": return <CasesSection />;
      case "services": return role === "client" ? <SearchSection setActive={go} /> : <ServicesSection />;
      case "courses": return <CoursesSection />;
      case "guards": return <GuardsSection />;
      case "chat": return <ChatSection chatInput={chatInput} setChatInput={setChatInput} />;
      case "forum": return <ForumSection />;
      case "contacts": return <ContactsSection />;
      case "policy": return <SecurityPolicySection setActive={go} />;
      case "pricing": return <PricingSection setActive={go} />;
      case "privacy": case "terms": case "agreement": case "offer": return <LegalDocSection doc={LEGAL_DOCS[active]} setActive={go} />;
      case "dashboard": return role === "client" ? <ClientDashboard setActive={go} /> : <ProviderDashboard setActive={go} />;
      case "admin": return user?.isAdmin ? <AdminPanel /> : <HomeSection setActive={go} role={role} />;
      default: return <HomeSection setActive={go} role={role} />;
    }
  };

  const secBarH = secBannerOpen ? 36 : 0;

  return (
    <div className="min-h-screen bg-background font-ibm">
      {/* Fixed security strip at the very top */}
      {secBannerOpen && (
        <div className="fixed top-0 left-0 right-0 z-[55] h-9 bg-gradient-to-r from-[hsl(220,20%,9%)] via-[hsl(220,18%,12%)] to-[hsl(220,20%,9%)] border-b border-gold/30">
          <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-center gap-2 sm:gap-3">
            <Icon name="ShieldCheck" size={14} className="text-gold shrink-0" />
            <span className="text-[11px] sm:text-xs font-montserrat font-semibold text-foreground truncate">{tr("secBanner")}</span>
            <span className="hidden md:inline text-[11px] text-muted-foreground truncate">· {tr("secBannerSub")}</span>
            <button
              onClick={() => go("policy")}
              className="hidden sm:inline-flex items-center gap-1 text-[11px] font-montserrat font-bold text-gold hover:underline shrink-0"
            >
              {tr("secReadPolicy")}
              <Icon name="ArrowRight" size={11} />
            </button>
            <button
              onClick={() => setSecBannerOpen(false)}
              className="absolute end-3 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="close"
            >
              <Icon name="X" size={15} />
            </button>
          </div>
        </div>
      )}

      <header className="fixed left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm transition-[top]" style={{ top: secBarH }}>
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 gold-gradient rounded flex items-center justify-center">
              <Icon name="Shield" size={16} className="text-[hsl(220,20%,6%)]" />
            </div>
            <div>
              <span className="font-montserrat font-bold text-lg tracking-[0.2em] text-foreground">Щ<span className="text-gold">ИТ</span></span>
              <div className="text-[9px] text-muted-foreground font-montserrat tracking-widest uppercase leading-none">{tr("brandSub")}</div>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-5 mx-4 flex-1 justify-center min-w-0">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => go(item.id)}
                className={`nav-link text-sm font-montserrat font-medium tracking-wide transition-colors whitespace-nowrap ${active === item.id ? "text-gold active" : "text-muted-foreground hover:text-foreground"}`}
              >
                {tr(item.key)}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <LangSwitcher lang={lang} setLang={setLang} />
            {isAuthed ? (
              <>
                {user?.isAdmin && (
                  <button onClick={() => go("admin")} className={`hidden sm:flex items-center gap-1.5 px-2.5 py-2 text-sm font-montserrat font-bold rounded-sm transition-all border shrink-0 whitespace-nowrap ${active === "admin" ? "border-gold text-gold bg-gold/10" : "border-border text-muted-foreground hover:border-gold hover:text-gold"}`} aria-label={tr("adminPanelTitle")}>
                    <Icon name="ShieldCheck" size={15} />
                    <span className="hidden xl:inline">{tr("adminPanelTitle")}</span>
                  </button>
                )}
                <button onClick={() => go("dashboard")} className="hidden sm:flex items-center gap-1.5 gold-gradient text-[hsl(220,20%,6%)] px-3 py-2 text-sm font-montserrat font-bold rounded-sm hover:opacity-90 transition-opacity shrink-0 whitespace-nowrap">
                  <Icon name="LayoutDashboard" size={15} />
                  {tr("authCabinet")}
                </button>
                <button onClick={handleLogout} className="hidden sm:flex items-center justify-center border border-border text-muted-foreground w-9 h-9 rounded-sm hover:border-destructive hover:text-destructive transition-all shrink-0" aria-label={tr("dashLogout")}>
                  <Icon name="LogOut" size={15} />
                </button>
              </>
            ) : (
              <button onClick={openCabinet} className="hidden sm:flex items-center gap-1.5 gold-gradient text-[hsl(220,20%,6%)] px-3 py-2 text-sm font-montserrat font-bold rounded-sm hover:opacity-90 transition-opacity shrink-0 whitespace-nowrap">
                <Icon name="LogIn" size={15} />
                {tr("authCabinet")}
              </button>
            )}
            <button className="lg:hidden text-muted-foreground ms-0.5 shrink-0" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="menu">
              <Icon name={mobileMenuOpen ? "X" : "Menu"} size={22} />
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-border bg-card animate-fade-in">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => go(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-montserrat border-b border-border last:border-0 ${active === item.id ? "text-gold bg-secondary" : "text-muted-foreground"}`}
              >
                <Icon name={item.icon} size={16} />
                {tr(item.key)}
              </button>
            ))}
            <div className="p-3 space-y-2">
              {isAuthed ? (
                <>
                  {user?.isAdmin && (
                    <button onClick={() => go("admin")} className="w-full border border-gold text-gold py-3 text-sm font-montserrat font-bold rounded-sm hover:bg-gold/10 transition-all flex items-center justify-center gap-2">
                      <Icon name="ShieldCheck" size={16} />
                      {tr("adminPanelTitle")}
                    </button>
                  )}
                  <button onClick={() => go("dashboard")} className="w-full gold-gradient text-[hsl(220,20%,6%)] py-3 text-sm font-montserrat font-bold rounded-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                    <Icon name="LayoutDashboard" size={16} />
                    {tr("authCabinet")}
                  </button>
                  <button onClick={handleLogout} className="w-full border border-border text-muted-foreground py-3 text-sm font-montserrat font-semibold rounded-sm hover:border-destructive hover:text-destructive transition-all flex items-center justify-center gap-2">
                    <Icon name="LogOut" size={16} />
                    {tr("dashLogout")}
                  </button>
                </>
              ) : (
                <button onClick={openCabinet} className="w-full gold-gradient text-[hsl(220,20%,6%)] py-3 text-sm font-montserrat font-bold rounded-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                  <Icon name="LogIn" size={16} />
                  {tr("authCabinet")}
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {active !== "home" && (
        <div style={{ paddingTop: 64 + secBarH }}>
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

      <main style={active === "home" ? { paddingTop: 64 + secBarH } : undefined}>
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
                <span className="font-montserrat font-bold text-sm text-foreground tracking-[0.2em]">Щ<span className="text-gold">ИТ</span></span>
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
              {([["fPrivacy", "privacy"], ["fTerms", "terms"], ["fAgreement", "agreement"], ["fOffer", "offer"], ["navPricing", "pricing"]] as const).map(([l, sec]) => (
                <button key={l} onClick={() => go(sec)} className="block text-xs text-muted-foreground hover:text-gold cursor-pointer transition-colors mb-2 text-left">{tr(l)}</button>
              ))}
            </div>
          </div>
          <div className="divider-gold mt-8 mb-6" />
          <div className="text-[11px] text-muted-foreground/80 leading-relaxed mb-4 space-y-0.5">
            <div className="font-semibold text-muted-foreground">{tr("reqName")}</div>
            <div>{tr("reqOgrnip")} · {tr("reqInn")}</div>
            <div>{tr("reqAddress")}</div>
            <div>{tr("reqTaxOffice")}</div>
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
            <div className="text-xs text-muted-foreground">{tr("rights")}</div>
            <div className="text-xs text-muted-foreground">{tr("forVerified")}</div>
          </div>
        </div>
      </footer>

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} onOpenDoc={(s) => { setAuthOpen(false); go(s); }} />}
    </div>
  );
}

function MinimalHome({ onCabinet, onPolicy }: { onCabinet: () => void; onPolicy: () => void }) {
  const { tr } = useLang();
  return (
    <>
      <section className="relative overflow-hidden grid-line-bg vignette w-full flex items-center min-h-[80vh]">
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/60 z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/60 z-10" />
        <div className="absolute inset-0">
          <img src={HERO_IMAGE} alt="Security" className="w-full h-full object-cover opacity-20" />
        </div>
        <div className="absolute top-1/4 -left-40 w-[500px] h-[500px] rounded-full z-0" style={{ background: "radial-gradient(circle, hsla(43,80%,52%,0.1) 0%, transparent 70%)" }} />
        <div className="relative z-20 max-w-5xl mx-auto px-4 py-20 md:py-28">
          <div className="max-w-2xl stagger">
            <div className="tag-security inline-flex items-center gap-1.5 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse-gold" />
              {tr("verifyAll")}
            </div>
            <h1 className="font-montserrat font-extrabold text-4xl md:text-6xl text-foreground leading-[1] mb-6 tracking-tight">
              {tr("promoTitle1")}<br />
              <span className="gold-text-gradient">{tr("promoTitle2")}</span>
            </h1>
            <p className="text-muted-foreground text-base md:text-lg leading-relaxed mb-7 max-w-xl">
              {tr("promoDesc")}
            </p>

            <div className="space-y-2.5 mb-8">
              {(["promoForClients", "promoForProviders"] as const).map((k) => (
                <div key={k} className="flex items-start gap-2.5 text-sm text-foreground">
                  <Icon name="Check" size={17} className="text-gold mt-0.5 shrink-0" />
                  <span>{tr(k)}</span>
                </div>
              ))}
            </div>

            <button
              onClick={onCabinet}
              className="shine-on-hover gold-gradient text-[hsl(220,20%,6%)] px-9 py-4 font-montserrat font-extrabold text-base tracking-wide hover:opacity-90 transition-opacity rounded-sm glow-gold-sm inline-flex items-center gap-2.5"
            >
              <Icon name="LogIn" size={18} />
              {tr("homeOpenCabinet")}
              <Icon name="ArrowRight" size={18} />
            </button>

            <div className="mt-12 border border-gold/30 rounded-sm glass-card p-6 max-w-xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 gold-gradient rounded flex items-center justify-center shrink-0">
                  <Icon name="ShieldCheck" size={17} className="text-[hsl(220,20%,6%)]" />
                </div>
                <span className="font-montserrat font-bold text-base text-foreground">{tr("homeSecTitle")}</span>
              </div>
              <div className="space-y-2.5 mb-4">
                {(["homeSec1", "homeSec2", "homeSec3"] as const).map((k) => (
                  <div key={k} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <Icon name="Lock" size={15} className="text-gold mt-0.5 shrink-0" />
                    <span>{tr(k)}</span>
                  </div>
                ))}
              </div>
              <button onClick={onPolicy} className="inline-flex items-center gap-1.5 text-sm font-montserrat font-semibold text-gold hover:underline">
                {tr("homeReadPolicy")}
                <Icon name="ArrowRight" size={14} />
              </button>
            </div>
          </div>
        </div>
      </section>

      <LandingStats />
      <LandingHowItWorks />
      <LandingValue />
      <LandingServices />
      <LandingTestimonials />
      <LandingFaq />
      <LandingFinalCta onCabinet={onCabinet} />
    </>
  );
}

function LandingFaq() {
  const { tr } = useLang();
  const [open, setOpen] = useState<number | null>(0);
  const faqs = [
    { q: "lpFaq1Q" as const, a: "lpFaq1A" as const },
    { q: "lpFaq2Q" as const, a: "lpFaq2A" as const },
    { q: "lpFaq3Q" as const, a: "lpFaq3A" as const },
    { q: "lpFaq4Q" as const, a: "lpFaq4A" as const },
    { q: "lpFaq5Q" as const, a: "lpFaq5A" as const },
    { q: "lpFaq6Q" as const, a: "lpFaq6A" as const },
  ];
  return (
    <section className="border-t border-border bg-card/30">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <div className="tag-security inline-block mb-3">{tr("lpFaqTag")}</div>
          <h2 className="font-montserrat font-extrabold text-3xl md:text-4xl text-foreground">{tr("lpFaqTitle")}</h2>
        </div>
        <div className="space-y-3">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q} className={`border rounded-sm bg-card overflow-hidden transition-all ${isOpen ? "border-gold/40" : "border-border"}`}>
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-start"
                >
                  <span className="font-montserrat font-semibold text-sm text-foreground">{tr(f.q)}</span>
                  <Icon name={isOpen ? "Minus" : "Plus"} size={17} className={`shrink-0 transition-colors ${isOpen ? "text-gold" : "text-muted-foreground"}`} />
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 -mt-1 animate-fade-in">
                    <p className="text-sm text-muted-foreground leading-relaxed">{tr(f.a)}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function LandingStats() {
  const { tr } = useLang();
  const stats = [
    { value: "1 200+", key: "lpStat1" as const, icon: "Users" },
    { value: "98%", key: "lpStat2" as const, icon: "ThumbsUp" },
    { value: "24/7", key: "lpStat3" as const, icon: "Headset" },
    { value: "15+", key: "lpStat4" as const, icon: "Globe" },
  ];
  return (
    <section className="border-y border-border bg-card/40">
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((s) => (
          <div key={s.key} className="text-center">
            <div className="w-11 h-11 gold-gradient rounded-full flex items-center justify-center mx-auto mb-3 glow-gold-sm">
              <Icon name={s.icon} fallback="Star" size={19} className="text-[hsl(220,20%,6%)]" />
            </div>
            <div className="font-montserrat font-extrabold text-2xl md:text-3xl gold-text-gradient">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{tr(s.key)}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function LandingHowItWorks() {
  const { tr } = useLang();
  const steps = [
    { icon: "Search", title: "lpHow1Title" as const, desc: "lpHow1Desc" as const },
    { icon: "ShieldCheck", title: "lpHow2Title" as const, desc: "lpHow2Desc" as const },
    { icon: "MessageCircle", title: "lpHow3Title" as const, desc: "lpHow3Desc" as const },
    { icon: "CircleCheck", title: "lpHow4Title" as const, desc: "lpHow4Desc" as const },
  ];
  return (
    <section className="max-w-7xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <div className="tag-security inline-block mb-3">{tr("lpHowTag")}</div>
        <h2 className="font-montserrat font-extrabold text-3xl md:text-4xl text-foreground">{tr("lpHowTitle")}</h2>
        <p className="text-muted-foreground text-sm mt-3 max-w-xl mx-auto">{tr("lpHowDesc")}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 stagger">
        {steps.map((s, i) => (
          <div key={s.title} className="relative border border-border rounded-sm bg-card p-6 card-hover">
            <div className="absolute top-4 end-4 font-montserrat font-extrabold text-3xl text-gold/15">{i + 1}</div>
            <div className="w-12 h-12 gold-gradient rounded flex items-center justify-center mb-4 glow-gold-sm">
              <Icon name={s.icon} fallback="Check" size={21} className="text-[hsl(220,20%,6%)]" />
            </div>
            <h3 className="font-montserrat font-bold text-base text-foreground mb-2">{tr(s.title)}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{tr(s.desc)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function LandingValue() {
  const { tr } = useLang();
  const cards = [
    { tag: "lpValClientTag" as const, title: "lpValClientTitle" as const, icon: "UserSearch", items: ["lpValClient1", "lpValClient2", "lpValClient3", "lpValClient4"] as const, accent: false },
    { tag: "lpValProTag" as const, title: "lpValProTitle" as const, icon: "Briefcase", items: ["lpValPro1", "lpValPro2", "lpValPro3", "lpValPro4"] as const, accent: true },
  ];
  return (
    <section className="border-y border-border bg-card/30">
      <div className="max-w-7xl mx-auto px-4 py-16 grid grid-cols-1 md:grid-cols-2 gap-6">
        {cards.map((c) => (
          <div key={c.title} className={`rounded-sm p-7 md:p-8 border ${c.accent ? "border-gold/40 glass-card security-glow" : "border-border bg-card"}`}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 gold-gradient rounded flex items-center justify-center shrink-0">
                <Icon name={c.icon} fallback="User" size={21} className="text-[hsl(220,20%,6%)]" />
              </div>
              <div>
                <div className="text-[10px] font-montserrat font-bold text-gold uppercase tracking-widest">{tr(c.tag)}</div>
                <h3 className="font-montserrat font-extrabold text-xl text-foreground">{tr(c.title)}</h3>
              </div>
            </div>
            <div className="space-y-3">
              {c.items.map((k) => (
                <div key={k} className="flex items-start gap-2.5 text-sm text-foreground">
                  <Icon name="Check" size={16} className="text-gold mt-0.5 shrink-0" />
                  <span>{tr(k)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function LandingServices() {
  const { lang, tr } = useLang();
  return (
    <section className="max-w-7xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <div className="tag-security inline-block mb-3">{tr("lpServicesTag")}</div>
        <h2 className="font-montserrat font-extrabold text-3xl md:text-4xl text-foreground">{tr("lpServicesTitle")}</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
        {services.slice(0, 6).map((s) => (
          <div key={s.title.en} className="group border border-border rounded-sm bg-card p-5 card-hover shine-on-hover">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 gold-gradient rounded flex items-center justify-center shrink-0 transition-transform group-hover:scale-110">
                <Icon name={s.icon} size={18} className="text-[hsl(220,20%,6%)]" />
              </div>
              <h3 className="font-montserrat font-bold text-sm text-foreground">{L(s.title, lang)}</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-2">{L(s.desc, lang)}</p>
            <div className="font-montserrat font-bold text-sm text-gold">{L(s.price, lang)}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function LandingTestimonials() {
  const { lang, tr } = useLang();
  const reviews = [
    { name: { ru: "Дмитрий О.", en: "Dmitry O." }, role: { ru: "Клиент · Москва", en: "Client · Moscow" }, text: { ru: "Нашёл полиграфолога за 10 минут. Проверенный специалист, всё прозрачно — рекомендую.", en: "Found a polygraph examiner in 10 minutes. A verified specialist, fully transparent — highly recommend." } },
    { name: { ru: "Игорь С.", en: "Igor S." }, role: { ru: "Исполнитель · Дубай", en: "Provider · Dubai" }, text: { ru: "Платформа реально приводит клиентов. Никакой комиссии со сделок — только подписка.", en: "The platform really brings in clients. No deal commission — just a subscription." } },
    { name: { ru: "Елена В.", en: "Elena V." }, role: { ru: "Клиент · Лондон", en: "Client · London" }, text: { ru: "Удобно сравнивать кейсы и рейтинги. Защита данных на высоте, общение в закрытом чате.", en: "Convenient to compare cases and ratings. Data protection is top-notch, communication in a private chat." } },
  ];
  return (
    <section className="border-y border-border bg-card/30">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <div className="tag-security inline-block mb-3">{tr("lpRevTag")}</div>
          <h2 className="font-montserrat font-extrabold text-3xl md:text-4xl text-foreground">{tr("lpRevTitle")}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 stagger">
          {reviews.map((r) => (
            <div key={r.name.en} className="border border-border rounded-sm bg-card p-6 card-hover">
              <div className="flex gap-0.5 mb-3">
                {[1, 2, 3, 4, 5].map((i) => <Icon key={i} name="Star" size={14} className="text-gold fill-current" />)}
              </div>
              <p className="text-sm text-foreground leading-relaxed mb-4">«{L(r.text, lang)}»</p>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full gold-gradient flex items-center justify-center text-[hsl(220,20%,6%)] font-montserrat font-bold text-xs">{L(r.name, lang).charAt(0)}</div>
                <div>
                  <div className="font-montserrat font-semibold text-xs text-foreground">{L(r.name, lang)}</div>
                  <div className="text-[10px] text-muted-foreground">{L(r.role, lang)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function LandingFinalCta({ onCabinet }: { onCabinet: () => void }) {
  const { tr } = useLang();
  return (
    <section className="max-w-7xl mx-auto px-4 py-20">
      <div className="relative overflow-hidden rounded-sm border border-gold/40 glass-card security-glow ambient-gold p-10 md:p-14 text-center">
        <div className="absolute inset-0 grid-line-bg opacity-30" />
        <div className="relative z-10">
          <div className="w-16 h-16 gold-gradient rounded-full flex items-center justify-center mx-auto mb-6 glow-gold-sm">
            <Icon name="ShieldCheck" size={30} className="text-[hsl(220,20%,6%)]" />
          </div>
          <h2 className="font-montserrat font-extrabold text-3xl md:text-4xl text-foreground mb-4">{tr("lpCtaTitle")}</h2>
          <p className="text-muted-foreground text-base max-w-xl mx-auto mb-8">{tr("lpCtaDesc")}</p>
          <button
            onClick={onCabinet}
            className="shine-on-hover gold-gradient text-[hsl(220,20%,6%)] px-10 py-4 font-montserrat font-extrabold text-base tracking-wide hover:opacity-90 transition-opacity rounded-sm glow-gold-sm inline-flex items-center gap-2.5"
          >
            <Icon name="UserPlus" size={18} />
            {tr("lpCtaBtn")}
            <Icon name="ArrowRight" size={18} />
          </button>
          <div className="flex items-center justify-center gap-5 mt-6 flex-wrap text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><Icon name="Check" size={13} className="text-gold" />{tr("lpCtaNote1")}</span>
            <span className="flex items-center gap-1.5"><Icon name="Check" size={13} className="text-gold" />{tr("lpCtaNote2")}</span>
            <span className="flex items-center gap-1.5"><Icon name="Check" size={13} className="text-gold" />{tr("lpCtaNote3")}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function HomeSection({ setActive, role }: { setActive: (s: Section) => void; role: Role }) {
  const { lang, tr } = useLang();
  const isClient = role === "client";
  const { geo } = useGeo();
  const { providers } = useProviders();
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const hasVerifiedDocs = (s: Provider) =>
    !!s.verification && (!!s.verification.license || !!s.verification.registry || !!s.verification.fullName);

  const base = providers.length ? providers : [];
  const filtered = verifiedOnly ? base.filter(hasVerifiedDocs) : base;
  const sortedSpecialists = (() => {
    if (!geo || geo.lat == null || geo.lon == null) {
      return filtered.map((s) => ({ ...s, distance: null as number | null }));
    }
    return filtered
      .map((s) => ({
        ...s,
        distance: s.lat != null && s.lon != null
          ? haversineKm(geo.lat as number, geo.lon as number, s.lat, s.lon)
          : null,
      }))
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
            <div className="flex flex-wrap gap-3 items-center">
              <button
                onClick={() => setActive(isClient ? "services" : "pricing")}
                className="shine-on-hover gold-gradient text-[hsl(220,20%,6%)] px-9 py-4 font-montserrat font-extrabold text-base tracking-wide hover:opacity-90 transition-opacity rounded-sm glow-gold-sm flex items-center gap-2.5"
              >
                <Icon name={isClient ? "Search" : "Wallet"} size={18} />
                {tr(isClient ? "heroClientCta1" : "heroProviderCta1")}
                <Icon name="ArrowRight" size={18} />
              </button>
              <button
                onClick={() => setActive(isClient ? "profile" : "pricing")}
                className="border border-border text-foreground px-7 py-4 font-montserrat font-semibold text-sm tracking-wide hover:border-gold hover:text-gold transition-all rounded-sm flex items-center gap-2"
              >
                {tr(isClient ? "heroClientCta2" : "heroProviderCta2")}
              </button>
            </div>
            <div className="flex items-center gap-1.5 mt-3 text-xs text-gold font-montserrat font-semibold">
              <Icon name="Zap" size={13} />
              {tr(isClient ? "heroFast" : "ctaUrgency")}
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-4 mt-8 flex-wrap">
              <div className="flex -space-x-3">
                {[DETECTIVE_IMAGE, HERO_IMAGE, POLYGRAPH_IMAGE].map((img, i) => (
                  <div key={i} className="w-9 h-9 rounded-full border-2 border-background overflow-hidden">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
                <div className="w-9 h-9 rounded-full border-2 border-background bg-gold flex items-center justify-center text-[10px] font-montserrat font-extrabold text-[hsl(220,20%,6%)]">1k+</div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <StarRating rating={5} />
                  <span className="text-sm font-montserrat font-bold text-foreground">4.9</span>
                </div>
                <div className="text-[11px] text-muted-foreground font-montserrat">{tr("heroProofReviews")}</div>
              </div>
            </div>

            <div className="flex items-center gap-x-6 gap-y-2 mt-6 flex-wrap">
              {(isClient
                ? [{ icon: "Wallet", t: "heroNoFeeBig" as const }, { icon: "BadgeCheck", t: "heroGuarantee" as const }]
                : [{ icon: "BadgeCheck", t: "trust1" as const }, { icon: "Users", t: "heroProofTrusted" as const }]
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
        <div className="flex flex-wrap items-center gap-3 mb-8">
          {geo && geo.city && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-card border border-gold/30 rounded-sm px-3 py-2">
              <Icon name="MapPin" size={13} className="text-gold" />
              <span>{tr("geoYourLocation")}: <span className="text-foreground font-semibold">{geo.city}{geo.country ? `, ${geo.country}` : ""}</span></span>
              <span className="text-muted-foreground/60">·</span>
              <span className="text-gold">{tr("geoSortNearby")}</span>
            </div>
          )}
          <button
            onClick={() => setVerifiedOnly((v) => !v)}
            className={`flex items-center gap-2 text-xs font-montserrat font-semibold rounded-sm px-3 py-2 border transition-all ${verifiedOnly ? "bg-green-500/15 border-green-500/40 text-green-400" : "bg-card border-border text-muted-foreground hover:border-gold hover:text-foreground"}`}
          >
            <Icon name={verifiedOnly ? "ShieldCheck" : "Shield"} size={14} />
            {tr("filterVerifiedOnly")}
          </button>
        </div>
        {sortedSpecialists.length === 0 ? (
          <div className="border border-dashed border-border rounded-sm bg-card/50 py-16 flex flex-col items-center gap-3 text-center">
            <Icon name="SearchX" size={40} className="text-muted-foreground/30" />
            <span className="text-sm text-muted-foreground">{tr("filterNoResults")}</span>
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 stagger">
          {sortedSpecialists.map((s) => {
            const tags = lang === "ru" ? s.tags.ru : s.tags.en;
            return s.active ? (
            <div key={s.slug} onClick={() => setActive("profile")} className={`card-hover shine-on-hover rounded-sm overflow-hidden cursor-pointer group flex flex-col relative ${isPremium(s) ? "border-2 border-gold security-glow ambient-gold bg-card" : "border border-border bg-card"}`}>
              {isPremium(s) && (
                <div className="absolute top-0 inset-x-0 z-20 gold-gradient text-[hsl(220,20%,6%)] text-[10px] font-montserrat font-extrabold tracking-widest uppercase text-center py-1 flex items-center justify-center gap-1">
                  <Icon name="Crown" size={11} />{tr("premiumBadge")}
                </div>
              )}
              <div className={`h-48 overflow-hidden relative ${isPremium(s) ? "mt-6" : ""}`}>
                <img src={resolveAvatar(s.img, s.gender)} alt={L(s.name, lang)} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
                {s.isPseudonym && (
                  <div className="absolute top-3 start-3 flex items-center gap-1 bg-card/90 backdrop-blur-sm border border-border px-2 py-1 rounded-sm">
                    <Icon name="VenetianMask" size={11} className="text-muted-foreground" />
                    <span className="text-[10px] font-montserrat font-semibold text-muted-foreground">{tr("aliasBadge")}</span>
                  </div>
                )}
                {isLicensed(s) && (
                  <div className="absolute top-3 end-3 flex items-center gap-1 bg-card/90 backdrop-blur-sm border border-gold/40 px-2 py-1 rounded-sm">
                    <Icon name="BadgeCheck" size={12} className="text-gold" />
                    <span className="text-[10px] font-montserrat font-semibold text-gold">{tr("licenseBadge")}</span>
                  </div>
                )}
                {s.distance != null && s.distance <= 100 && (
                  <div className={`absolute start-3 flex items-center gap-1 bg-gold/90 backdrop-blur-sm px-2 py-1 rounded-sm ${s.isPseudonym ? "top-12" : "top-3"}`}>
                    <Icon name="Navigation" size={11} className="text-[hsl(220,20%,6%)]" />
                    <span className="text-[10px] font-montserrat font-bold text-[hsl(220,20%,6%)]">{tr("geoNearYou")}</span>
                  </div>
                )}
                <div className="absolute bottom-3 start-4 end-4">
                  <div className="font-montserrat font-bold text-base text-foreground">{L(s.name, lang)}</div>
                  <div className="text-xs text-gold font-montserrat font-medium flex items-center gap-2 flex-wrap">
                    {L(s.title, lang)}
                    <span className="text-muted-foreground">· {s.experience} {tr("yearsShort")}</span>
                    {s.age != null && <span className="text-muted-foreground">· {s.age} {tr("yearsOld")}</span>}
                  </div>
                </div>
              </div>
              <div className="p-5 flex flex-col flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <StarRating rating={s.rating} />
                  <span className="text-xs text-muted-foreground">{s.rating} ({s.reviews})</span>
                  <span className="text-xs text-muted-foreground ms-auto flex items-center gap-1">
                    <Icon name="MapPin" size={11} />{L(s.city, lang)}
                    {s.distance != null && <span className="text-gold font-semibold">· {s.distance} {tr("geoKm")}</span>}
                  </span>
                </div>
                {s.verification && ((s.verification.licenses && s.verification.licenses.length > 0) || s.verification.registry || s.verification.fullName) && (
                  <div className="inline-flex items-center gap-1.5 mb-4 px-2.5 py-1.5 rounded-sm bg-green-500/10 border border-green-500/30 w-fit">
                    <Icon name="ShieldCheck" size={13} className="text-green-400" />
                    <span className="text-[11px] font-montserrat font-bold text-green-400">{tr("verifyDocsConfirmed")}</span>
                  </div>
                )}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {tags.map((tg) => (
                    <span key={tg} className="tag-security">{tg}</span>
                  ))}
                </div>
                <div className="divider-gold mb-4" />
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{tr("cost")}</div>
                    <div className="font-montserrat font-bold text-sm text-gold">{L(s.price, lang)}</div>
                  </div>
                </div>
                <AvailabilityNote p={s} />
                <div className="mt-auto">
                  <ContactButtons p={s} onChat={() => setActive("chat")} compact />
                </div>
              </div>
            </div>
          ) : (
            <div key={s.slug} className="border border-dashed border-border rounded-sm bg-card/50 overflow-hidden flex flex-col">
              <div className="h-48 overflow-hidden relative bg-secondary flex items-center justify-center">
                <Icon name="EyeOff" size={44} className="text-muted-foreground/30" />
                <div className="absolute top-3 end-3 flex items-center gap-1 bg-secondary border border-border px-2 py-1 rounded-sm">
                  <Icon name="Lock" size={11} className="text-muted-foreground" />
                  <span className="text-[10px] font-montserrat font-semibold text-muted-foreground">{tr("subInactiveBadge")}</span>
                </div>
              </div>
              <div className="p-5 flex flex-col flex-1">
                <div className="font-montserrat font-bold text-base text-muted-foreground mb-1">{tr("subInactiveTitle")}</div>
                <div className="text-xs text-gold font-montserrat font-medium mb-3">{L(s.title, lang)}</div>
                <p className="text-xs text-muted-foreground leading-relaxed mb-4">{tr("subInactiveDesc")}</p>
                <div className="mt-auto flex items-center gap-2 text-[11px] text-muted-foreground/70 border-t border-border pt-3">
                  <Icon name="Info" size={12} />
                  {tr("subRenewHint")}
                </div>
              </div>
            </div>
          );})}
        </div>
        )}
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
            <div className="text-start">
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
  const { logout } = useAuth();
  const handleLogout = async () => { await logout(); setActive("home"); window.scrollTo({ top: 0 }); };
  const [tab, setTab] = useState<"profile" | "requests" | "favorites" | "settings">("profile");

  const tabs = [
    { id: "profile" as const, key: "cdTab1" as const, icon: "User" },
    { id: "requests" as const, key: "cdTab2" as const, icon: "Inbox" },
    { id: "favorites" as const, key: "cdTab3" as const, icon: "Heart" },
    { id: "settings" as const, key: "cdTab4" as const, icon: "Settings" },
  ];

  const [clientData, setClientData] = useState({ fullName: "", phone: "", email: "", gender: "m" });
  const [clientState, setClientState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [clientAvatar, setClientAvatar] = useState<string>("");

  useEffect(() => {
    fetch(`${func2url["clients"]}?clientId=demo-client`)
      .then((r) => r.json())
      .then((d) => {
        if (d.client) {
          setClientData({ fullName: d.client.fullName || "", phone: d.client.phone || "", email: d.client.email || "", gender: d.client.gender || "m" });
          setClientAvatar(d.client.avatarUrl || "");
        }
      })
      .catch(() => {});
  }, []);

  const saveClient = async () => {
    setClientState("saving");
    try {
      const res = await fetch(func2url["clients"], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: "demo-client", ...clientData }),
      });
      setClientState(res.ok ? "saved" : "error");
    } catch {
      setClientState("error");
    }
  };

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
          <img src={resolveAvatar(clientAvatar, clientData.gender)} alt="avatar" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1">
          <div className="text-xs text-muted-foreground font-montserrat mb-1">{tr("dashWelcome")},</div>
          <div className="font-montserrat font-extrabold text-2xl text-foreground flex items-center gap-2">
            {L(DEMO_CLIENT.name, lang)}
            <Icon name="BadgeCheck" size={18} className="text-gold" />
          </div>
          <div className="flex items-center gap-3 mt-2">
            <StarRating rating={4.9} />
            <span className="text-xs text-muted-foreground">4.9 · {tr("dashSince")} 2024</span>
          </div>
        </div>
        <button onClick={handleLogout} className="shrink-0 border border-border text-muted-foreground text-xs font-montserrat font-semibold px-4 py-2 rounded-sm hover:border-destructive hover:text-destructive transition-all flex items-center gap-1.5">
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
              <div>
                <div className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest mb-1">{tr("cdClientData")}</div>
                <p className="text-xs text-muted-foreground leading-relaxed">{tr("cdClientDataHint")}</p>
              </div>

              <AvatarUploader current={clientAvatar} gender={clientData.gender} role="client" recordId="demo-client" onUploaded={setClientAvatar} />
              <div>
                <label className="text-xs font-montserrat font-semibold text-foreground block mb-2">{tr("genderLabel")}</label>
                <div className="grid grid-cols-2 gap-2 max-w-xs">
                  {([{ v: "m", k: "genderMale" as const }, { v: "f", k: "genderFemale" as const }]).map((g) => (
                    <button key={g.v} onClick={() => { setClientData({ ...clientData, gender: g.v }); setClientState("idle"); }}
                      className={`py-2 text-xs font-montserrat font-semibold rounded-sm border transition-all ${clientData.gender === g.v ? "border-gold text-gold bg-gold/10" : "border-border text-muted-foreground hover:text-foreground"}`}>
                      {tr(g.k)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="divider-gold" />

              <div>
                <label className="text-xs font-montserrat font-semibold text-foreground flex items-center gap-1.5 mb-2"><Icon name="User" size={13} className="text-gold" />{tr("cdClientName")}</label>
                <input value={clientData.fullName} onChange={(e) => { setClientData({ ...clientData, fullName: e.target.value }); setClientState("idle"); }} placeholder={tr("cdClientName")} className="w-full bg-secondary border border-border rounded-sm px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-gold transition-colors" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-montserrat font-semibold text-foreground flex items-center gap-1.5 mb-2"><Icon name="Phone" size={13} className="text-gold" />{tr("cdClientPhone")}</label>
                  <input type="tel" value={clientData.phone} onChange={(e) => { setClientData({ ...clientData, phone: e.target.value }); setClientState("idle"); }} placeholder="+7 999 000-00-00" className="w-full bg-secondary border border-border rounded-sm px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-gold transition-colors" />
                </div>
                <div>
                  <label className="text-xs font-montserrat font-semibold text-foreground flex items-center gap-1.5 mb-2"><Icon name="Mail" size={13} className="text-gold" />Email</label>
                  <input type="email" value={clientData.email} onChange={(e) => { setClientData({ ...clientData, email: e.target.value }); setClientState("idle"); }} placeholder="you@email.com" className="w-full bg-secondary border border-border rounded-sm px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-gold transition-colors" />
                </div>
              </div>
              {clientState === "saved" && <div className="flex items-center gap-2 text-sm text-green-400"><Icon name="CheckCircle2" size={16} />{tr("cdClientSaved")}</div>}
              {clientState === "error" && <div className="flex items-center gap-2 text-sm text-destructive"><Icon name="CircleAlert" size={16} />{tr("cdClientSaveErr")}</div>}
              <button onClick={saveClient} disabled={clientState === "saving"} className="w-full gold-gradient text-[hsl(220,20%,6%)] py-3 text-xs font-montserrat font-bold rounded-sm hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2">
                {clientState === "saving" ? <Icon name="Loader" size={15} className="animate-spin" /> : <Icon name="Save" size={15} />}
                {tr("dashSave")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProviderDashboard({ setActive }: { setActive: (s: Section) => void }) {
  const { lang, tr } = useLang();
  const { logout } = useAuth();
  const handleLogout = async () => { await logout(); setActive("home"); window.scrollTo({ top: 0 }); };
  const [tab, setTab] = useState<"stats" | "plan" | "cases" | "requests" | "contacts" | "verify">("stats");

  const tabs = [
    { id: "stats" as const, key: "pdTab1" as const, icon: "ChartNoAxesColumn" },
    { id: "plan" as const, key: "pdTab2" as const, icon: "Wallet" },
    { id: "cases" as const, key: "pdTab3" as const, icon: "FolderOpen" },
    { id: "requests" as const, key: "pdTab4" as const, icon: "Inbox" },
    { id: "verify" as const, key: "pdTabVerify" as const, icon: "BadgeCheck" },
    { id: "contacts" as const, key: "pdTabContacts" as const, icon: "Contact" },
  ];

  const [contacts, setContacts] = useState({ phone: "", email: "", whatsapp: "", telegram: "", website: "", vk: "", instagram: "", linkedin: "" });
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const saveContacts = async () => {
    setSaveState("saving");
    try {
      const res = await fetch(func2url["save-contacts"], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: "morozov", ...contacts }),
      });
      setSaveState(res.ok ? "saved" : "error");
    } catch {
      setSaveState("error");
    }
  };

  const [vf, setVf] = useState({
    fullName: "", passportNumber: "", legalStatus: "ip", registry: "",
    showFullName: true, showLegalStatus: true, showLicense: true, showRegistry: true,
    pseudonym: "", usePseudonym: false,
    gender: "m" as "m" | "f", age: "" as string,
    licenses: [""] as string[],
    documents: [] as { title: string; url: string }[],
    bio: "",
    showBio: true, showAge: true, showDocuments: true,
    timezone: "", alwaysAvailable: false, quietStart: "23:00", quietEnd: "08:00",
  });
  const [vfState, setVfState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [sub, setSub] = useState<{ plan: string; active: boolean; until: string | null } | null>(null);

  useEffect(() => {
    fetch(`${func2url["save-verification"]}?slug=morozov`)
      .then((r) => r.json())
      .then((d) => {
        const v = d.verification;
        if (!v) return;
        setSub({ plan: v.plan || "start", active: !!v.subscriptionActive, until: v.subscriptionUntil || null });
        setVf({
          fullName: v.fullName || "", passportNumber: v.passportNumber || "", legalStatus: v.legalStatus || "ip",
          registry: v.registry || "",
          showFullName: !!v.showFullName, showLegalStatus: !!v.showLegalStatus, showLicense: !!v.showLicense, showRegistry: !!v.showRegistry,
          pseudonym: v.pseudonym || "", usePseudonym: !!v.usePseudonym,
          gender: v.gender === "f" ? "f" : "m", age: v.age != null ? String(v.age) : "",
          licenses: Array.isArray(v.licenses) && v.licenses.length ? v.licenses : [""],
          documents: Array.isArray(v.documents) ? v.documents : [],
          bio: v.bio || "",
          showBio: !!v.showBio, showAge: !!v.showAge, showDocuments: !!v.showDocuments,
          timezone: v.timezone || "", alwaysAvailable: !!v.alwaysAvailable,
          quietStart: v.quietStart || "23:00", quietEnd: v.quietEnd || "08:00",
        });
        if (v.avatarUrl) setAvatarUrl(v.avatarUrl);
      })
      .catch(() => {});
  }, []);

  const saveVerification = async () => {
    setVfState("saving");
    try {
      const payload = { ...vf, licenses: vf.licenses.filter((l) => l.trim()), age: vf.age ? parseInt(vf.age) : null };
      const res = await fetch(func2url["save-verification"], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: "morozov", ...payload }),
      });
      setVfState(res.ok ? "saved" : "error");
    } catch {
      setVfState("error");
    }
  };

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
        <button onClick={handleLogout} className="shrink-0 border border-border text-muted-foreground text-xs font-montserrat font-semibold px-4 py-2 rounded-sm hover:border-destructive hover:text-destructive transition-all flex items-center gap-1.5">
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
              {(() => {
                const planName = ({ start: "planStartName", pro: "planProName", premium: "planPremiumName", enterprise: "planEntName" } as const)[(sub?.plan || "start")] || "planStartName";
                const planPrice = ({ start: "planStartPrice", pro: "planProPrice", premium: "planPremiumPrice", enterprise: "planEntPrice" } as const)[(sub?.plan || "start")] || "planStartPrice";
                const active = sub?.active ?? false;
                const untilStr = sub?.until ? new Date(sub.until).toLocaleDateString(lang === "ru" ? "ru-RU" : "en-US") : null;
                return (
                  <div className={`border rounded-sm glass-card p-6 ${active ? "border-gold/30 security-glow" : "border-border"}`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest">{tr("pdCurrentPlan")}</div>
                      <span className={`text-xs font-montserrat font-semibold px-3 py-1 rounded-sm ${active ? "bg-green-500/15 text-green-400" : "bg-secondary text-muted-foreground"}`}>{active ? tr("pdActive") : tr("pdInactive")}</span>
                    </div>
                    <div className="flex items-end gap-2 mb-1 flex-wrap">
                      {sub?.plan === "premium" && <Icon name="Crown" size={20} className="text-gold mb-1" />}
                      <span className="font-montserrat font-extrabold text-2xl text-foreground">{tr(planName)}</span>
                      <span className="font-montserrat font-bold text-lg text-gold">{tr(planPrice)}{tr("perMonth")}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mb-5">
                      {active && untilStr ? `${tr("pdRenews")}: ${untilStr}` : (!active ? tr("pdNoSub") : tr("pdActive"))}
                    </div>
                    <button onClick={() => setActive("pricing")} className="gold-gradient text-[hsl(220,20%,6%)] px-6 py-2.5 text-xs font-montserrat font-bold rounded-sm hover:opacity-90 transition-opacity">{active ? tr("pdChangePlan") : tr("choosePlan")}</button>
                  </div>
                );
              })()}

              {sub?.plan !== "premium" && (
              <div className="relative overflow-hidden border-2 border-gold/50 rounded-sm glass-card ambient-gold p-6 security-glow">
                <div className="absolute inset-0 grid-line-bg opacity-30" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon name="Crown" size={18} className="text-gold" />
                    <span className="font-montserrat font-extrabold text-lg gold-text-gradient">{tr("planPremiumName")}</span>
                    <span className="ms-auto text-[10px] font-montserrat font-bold px-2 py-0.5 rounded-sm bg-gold/15 text-gold uppercase tracking-widest">{tr("pdPremiumWhatFor")}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-5">{tr("premiumValueNote")}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                    {([
                      { icon: "Crown", t: "featPremiumCard" as const, d: "pdPremB1" as const },
                      { icon: "ArrowUpToLine", t: "featPremiumTop" as const, d: "pdPremB2" as const },
                      { icon: "ChartNoAxesColumn", t: "featPremiumAnalytics" as const, d: "pdPremB3" as const },
                      { icon: "BadgeCheck", t: "featBadge" as const, d: "pdPremB4" as const },
                    ]).map((b) => (
                      <div key={b.t} className="flex items-start gap-3 border border-gold/20 rounded-sm bg-gold/[0.04] p-3">
                        <div className="w-8 h-8 gold-gradient rounded flex items-center justify-center shrink-0">
                          <Icon name={b.icon} fallback="Sparkles" size={15} className="text-[hsl(220,20%,6%)]" />
                        </div>
                        <div>
                          <div className="font-montserrat font-bold text-xs text-foreground">{tr(b.t)}</div>
                          <div className="text-[11px] text-muted-foreground leading-snug mt-0.5">{tr(b.d)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setActive("pricing")} className="gold-gradient text-[hsl(220,20%,6%)] px-6 py-2.5 text-xs font-montserrat font-bold rounded-sm hover:opacity-90 transition-opacity glow-gold-sm inline-flex items-center gap-2">
                    <Icon name="Crown" size={14} />{tr("pdUpgradePremium")}
                  </button>
                </div>
              </div>
              )}

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

          {tab === "verify" && (
            <div className="border border-border rounded-sm bg-card p-6 space-y-5">
              <div>
                <div className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest mb-1">{tr("pdVerifyTitle")}</div>
                <p className="text-xs text-muted-foreground leading-relaxed">{tr("pdVerifyHint")}</p>
              </div>

              {/* Avatar upload */}
              <AvatarUploader current={avatarUrl} gender={vf.gender} role="provider" recordId="morozov" onUploaded={setAvatarUrl} />

              {/* Gender + Age */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-montserrat font-semibold text-foreground block mb-2">{tr("pdVfGender")}</label>
                  <div className="grid grid-cols-2 gap-2">
                    {([{ v: "m", k: "pdVfGenderM" as const }, { v: "f", k: "pdVfGenderF" as const }]).map((g) => (
                      <button key={g.v} onClick={() => { setVf({ ...vf, gender: g.v as "m" | "f" }); setVfState("idle"); }}
                        className={`py-2.5 text-xs font-montserrat font-semibold rounded-sm border transition-all ${vf.gender === g.v ? "border-gold text-gold bg-gold/10" : "border-border text-muted-foreground hover:text-foreground"}`}>
                        {tr(g.k)}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-montserrat font-semibold text-foreground">{tr("pdVfAge")}</label>
                    <button onClick={() => setVf({ ...vf, showAge: !vf.showAge })}
                      className={`flex items-center gap-1 text-[10px] font-montserrat font-bold px-2 py-1 rounded-sm transition-colors ${vf.showAge ? "bg-gold/15 text-gold" : "bg-secondary text-muted-foreground"}`}>
                      <Icon name={vf.showAge ? "Eye" : "EyeOff"} size={12} />
                      {tr(vf.showAge ? "pdVfShow" : "pdVfHidden")}
                    </button>
                  </div>
                  <input type="number" min={18} max={100} value={vf.age} onChange={(e) => { setVf({ ...vf, age: e.target.value }); setVfState("idle"); }} placeholder="—" className="w-full bg-secondary border border-border rounded-sm px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-gold transition-colors" />
                </div>
              </div>
              <div className="divider-gold" />

              {/* Full name (with visibility toggle) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-montserrat font-semibold text-foreground">{tr("pdVfFullName")}</label>
                  <button
                    onClick={() => setVf({ ...vf, showFullName: !vf.showFullName })}
                    className={`flex items-center gap-1 text-[10px] font-montserrat font-bold px-2 py-1 rounded-sm transition-colors ${vf.showFullName ? "bg-gold/15 text-gold" : "bg-secondary text-muted-foreground"}`}
                  >
                    <Icon name={vf.showFullName ? "Eye" : "EyeOff"} size={12} />
                    {tr(vf.showFullName ? "pdVfShow" : "pdVfHidden")}
                  </button>
                </div>
                <input value={vf.fullName} onChange={(e) => { setVf({ ...vf, fullName: e.target.value }); setVfState("idle"); }} placeholder={tr("pdVfFullName")} className="w-full bg-secondary border border-border rounded-sm px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-gold transition-colors" />
              </div>

              {/* Pseudonym */}
              <div className="border border-border rounded-sm bg-secondary/40 p-4 space-y-3">
                <div>
                  <label className="text-xs font-montserrat font-semibold text-foreground flex items-center gap-1.5 mb-1"><Icon name="VenetianMask" size={13} className="text-gold" />{tr("pdVfPseudonym")}</label>
                  <p className="text-[11px] text-muted-foreground mb-2">{tr("pdVfPseudonymHint")}</p>
                  <input value={vf.pseudonym} onChange={(e) => { setVf({ ...vf, pseudonym: e.target.value }); setVfState("idle"); }} placeholder={tr("pdVfPseudonym")} className="w-full bg-secondary border border-border rounded-sm px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-gold transition-colors" />
                </div>
                <button
                  onClick={() => { setVf({ ...vf, usePseudonym: !vf.usePseudonym }); setVfState("idle"); }}
                  className="flex items-center justify-between w-full"
                >
                  <span className="text-xs text-foreground">{tr("pdVfUsePseudonym")}</span>
                  <span className={`relative w-10 h-5 rounded-full transition-colors ${vf.usePseudonym ? "bg-gold" : "bg-border"}`}>
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-card transition-all ${vf.usePseudonym ? "start-5" : "start-0.5"}`} />
                  </span>
                </button>
              </div>

              {/* Passport — never public */}
              <div>
                <label className="text-xs font-montserrat font-semibold text-foreground flex items-center gap-1.5 mb-2">
                  <Icon name="Lock" size={13} className="text-muted-foreground" />
                  {tr("pdVfPassport")}
                </label>
                <input value={vf.passportNumber} onChange={(e) => { setVf({ ...vf, passportNumber: e.target.value }); setVfState("idle"); }} placeholder="0000 000000" className="w-full bg-secondary border border-border rounded-sm px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-gold transition-colors" />
                <div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1"><Icon name="ShieldCheck" size={11} className="text-green-400" />{tr("pdVfPassportNote")}</div>
              </div>

              {/* Legal status (with visibility toggle) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-montserrat font-semibold text-foreground">{tr("pdVfStatus")}</label>
                  <button
                    onClick={() => setVf({ ...vf, showLegalStatus: !vf.showLegalStatus })}
                    className={`flex items-center gap-1 text-[10px] font-montserrat font-bold px-2 py-1 rounded-sm transition-colors ${vf.showLegalStatus ? "bg-gold/15 text-gold" : "bg-secondary text-muted-foreground"}`}
                  >
                    <Icon name={vf.showLegalStatus ? "Eye" : "EyeOff"} size={12} />
                    {tr(vf.showLegalStatus ? "pdVfShow" : "pdVfHidden")}
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { v: "self", k: "pdVfStatusSelf" as const },
                    { v: "ip", k: "pdVfStatusIp" as const },
                    { v: "company", k: "pdVfStatusCompany" as const },
                  ]).map((s) => (
                    <button
                      key={s.v}
                      onClick={() => { setVf({ ...vf, legalStatus: s.v }); setVfState("idle"); }}
                      className={`py-2.5 text-xs font-montserrat font-semibold rounded-sm border transition-all ${vf.legalStatus === s.v ? "border-gold text-gold bg-gold/10" : "border-border text-muted-foreground hover:text-foreground"}`}
                    >
                      {tr(s.k)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Licenses — multiple (with visibility toggle) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-montserrat font-semibold text-foreground">{tr("pdVfLicenses")}</label>
                  <button
                    onClick={() => setVf({ ...vf, showLicense: !vf.showLicense })}
                    className={`flex items-center gap-1 text-[10px] font-montserrat font-bold px-2 py-1 rounded-sm transition-colors ${vf.showLicense ? "bg-gold/15 text-gold" : "bg-secondary text-muted-foreground"}`}
                  >
                    <Icon name={vf.showLicense ? "Eye" : "EyeOff"} size={12} />
                    {tr(vf.showLicense ? "pdVfShow" : "pdVfHidden")}
                  </button>
                </div>
                <div className="space-y-2">
                  {vf.licenses.map((lic, i) => (
                    <div key={i} className="flex gap-2">
                      <input value={lic} onChange={(e) => { const arr = [...vf.licenses]; arr[i] = e.target.value; setVf({ ...vf, licenses: arr }); setVfState("idle"); }} placeholder={tr("pdVfLicensePh")} className="flex-1 min-w-0 bg-secondary border border-border rounded-sm px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-gold transition-colors" />
                      {vf.licenses.length > 1 && (
                        <button onClick={() => { setVf({ ...vf, licenses: vf.licenses.filter((_, idx) => idx !== i) }); setVfState("idle"); }} className="shrink-0 px-3 border border-border rounded-sm text-muted-foreground hover:border-destructive hover:text-destructive transition-colors" aria-label={tr("remove")}>
                          <Icon name="Trash2" size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button onClick={() => { setVf({ ...vf, licenses: [...vf.licenses, ""] }); setVfState("idle"); }} className="mt-2 inline-flex items-center gap-1.5 text-xs font-montserrat font-semibold text-gold hover:underline">
                  <Icon name="Plus" size={13} />{tr("pdVfAddLicense")}
                </button>
              </div>

              {/* Documents — diplomas, certificates */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-montserrat font-semibold text-foreground">{tr("pdVfDocuments")}</label>
                  <button
                    onClick={() => setVf({ ...vf, showDocuments: !vf.showDocuments })}
                    className={`flex items-center gap-1 text-[10px] font-montserrat font-bold px-2 py-1 rounded-sm transition-colors ${vf.showDocuments ? "bg-gold/15 text-gold" : "bg-secondary text-muted-foreground"}`}
                  >
                    <Icon name={vf.showDocuments ? "Eye" : "EyeOff"} size={12} />
                    {tr(vf.showDocuments ? "pdVfShow" : "pdVfHidden")}
                  </button>
                </div>
                <div className="space-y-3">
                  {vf.documents.map((doc, i) => (
                    <div key={i} className="border border-border rounded-sm bg-secondary/30 p-3">
                      <div className="flex gap-2">
                        <input value={doc.title} onChange={(e) => { const arr = [...vf.documents]; arr[i] = { ...arr[i], title: e.target.value }; setVf({ ...vf, documents: arr }); setVfState("idle"); }} placeholder={tr("pdVfDocTitlePh")} className="flex-1 min-w-0 bg-secondary border border-border rounded-sm px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-gold transition-colors" />
                        <button onClick={() => { setVf({ ...vf, documents: vf.documents.filter((_, idx) => idx !== i) }); setVfState("idle"); }} className="shrink-0 px-3 border border-border rounded-sm text-muted-foreground hover:border-destructive hover:text-destructive transition-colors" aria-label={tr("remove")}>
                          <Icon name="Trash2" size={14} />
                        </button>
                      </div>
                      <DocFileButton slug="morozov" url={doc.url || ""} onUploaded={(u) => { const arr = [...vf.documents]; arr[i] = { ...arr[i], url: u }; setVf({ ...vf, documents: arr }); setVfState("idle"); }} />
                    </div>
                  ))}
                </div>
                <button onClick={() => { setVf({ ...vf, documents: [...vf.documents, { title: "", url: "" }] }); setVfState("idle"); }} className="mt-2 inline-flex items-center gap-1.5 text-xs font-montserrat font-semibold text-gold hover:underline">
                  <Icon name="Plus" size={13} />{tr("pdVfAddDocument")}
                </button>
              </div>

              {/* Bio */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-montserrat font-semibold text-foreground">{tr("pdVfBio")}</label>
                  <button
                    onClick={() => setVf({ ...vf, showBio: !vf.showBio })}
                    className={`flex items-center gap-1 text-[10px] font-montserrat font-bold px-2 py-1 rounded-sm transition-colors ${vf.showBio ? "bg-gold/15 text-gold" : "bg-secondary text-muted-foreground"}`}
                  >
                    <Icon name={vf.showBio ? "Eye" : "EyeOff"} size={12} />
                    {tr(vf.showBio ? "pdVfShow" : "pdVfHidden")}
                  </button>
                </div>
                <textarea value={vf.bio} onChange={(e) => { setVf({ ...vf, bio: e.target.value }); setVfState("idle"); }} placeholder={tr("pdVfBioPh")} rows={4} className="w-full bg-secondary border border-border rounded-sm px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-gold transition-colors resize-none" />
              </div>

              {/* Registry (with visibility toggle) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-montserrat font-semibold text-foreground">{tr("pdVfRegistry")}</label>
                  <button
                    onClick={() => setVf({ ...vf, showRegistry: !vf.showRegistry })}
                    className={`flex items-center gap-1 text-[10px] font-montserrat font-bold px-2 py-1 rounded-sm transition-colors ${vf.showRegistry ? "bg-gold/15 text-gold" : "bg-secondary text-muted-foreground"}`}
                  >
                    <Icon name={vf.showRegistry ? "Eye" : "EyeOff"} size={12} />
                    {tr(vf.showRegistry ? "pdVfShow" : "pdVfHidden")}
                  </button>
                </div>
                <input value={vf.registry} onChange={(e) => { setVf({ ...vf, registry: e.target.value }); setVfState("idle"); }} placeholder="ОГРНИП / ИНН" className="w-full bg-secondary border border-border rounded-sm px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-gold transition-colors" />
              </div>

              <div className="border border-border rounded-sm bg-secondary/40 p-4 space-y-4">
                <div>
                  <label className="text-xs font-montserrat font-semibold text-foreground flex items-center gap-1.5 mb-1"><Icon name="Clock" size={13} className="text-gold" />{tr("pdAvailTitle")}</label>
                  <p className="text-[11px] text-muted-foreground">{tr("pdAvailHint")}</p>
                </div>
                <button
                  onClick={() => { setVf({ ...vf, alwaysAvailable: !vf.alwaysAvailable }); setVfState("idle"); }}
                  className="flex items-center justify-between w-full"
                >
                  <span className="text-xs text-foreground">{tr("pdAvailAlways")}</span>
                  <span className={`relative w-10 h-5 rounded-full transition-colors ${vf.alwaysAvailable ? "bg-gold" : "bg-border"}`}>
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-card transition-all ${vf.alwaysAvailable ? "start-[22px]" : "start-0.5"}`} />
                  </span>
                </button>
                {!vf.alwaysAvailable && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-montserrat font-semibold text-muted-foreground block mb-1.5">{tr("pdQuietFrom")}</label>
                      <input type="time" value={vf.quietStart} onChange={(e) => { setVf({ ...vf, quietStart: e.target.value }); setVfState("idle"); }} className="w-full bg-secondary border border-border rounded-sm px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold transition-colors" />
                    </div>
                    <div>
                      <label className="text-[11px] font-montserrat font-semibold text-muted-foreground block mb-1.5">{tr("pdQuietTo")}</label>
                      <input type="time" value={vf.quietEnd} onChange={(e) => { setVf({ ...vf, quietEnd: e.target.value }); setVfState("idle"); }} className="w-full bg-secondary border border-border rounded-sm px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold transition-colors" />
                    </div>
                  </div>
                )}
                <div>
                  <label className="text-[11px] font-montserrat font-semibold text-muted-foreground block mb-1.5">{tr("pdTimezone")}</label>
                  <select value={vf.timezone} onChange={(e) => { setVf({ ...vf, timezone: e.target.value }); setVfState("idle"); }} className="w-full bg-secondary border border-border rounded-sm px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold transition-colors">
                    <option value="">{tr("pdTimezoneAuto")}</option>
                    {["Europe/Kaliningrad","Europe/Moscow","Europe/Samara","Asia/Yekaterinburg","Asia/Omsk","Asia/Krasnoyarsk","Asia/Irkutsk","Asia/Yakutsk","Asia/Vladivostok","Asia/Magadan","Asia/Kamchatka","Europe/Kyiv","Europe/Minsk","Asia/Almaty","Europe/London","Europe/Berlin","America/New_York","America/Los_Angeles","Asia/Dubai"].map((z) => (
                      <option key={z} value={z}>{z}</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-muted-foreground/70 mt-1.5">{tr("pdTimezoneNote")}</p>
                </div>
              </div>

              {vfState === "saved" && <div className="flex items-center gap-2 text-sm text-green-400"><Icon name="CheckCircle2" size={16} />{tr("pdVfSaved")}</div>}
              {vfState === "error" && <div className="flex items-center gap-2 text-sm text-destructive"><Icon name="CircleAlert" size={16} />{tr("pdVfSaveErr")}</div>}
              <button onClick={saveVerification} disabled={vfState === "saving"} className="w-full gold-gradient text-[hsl(220,20%,6%)] py-3 text-sm font-montserrat font-bold rounded-sm hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2">
                {vfState === "saving" ? <Icon name="Loader" size={16} className="animate-spin" /> : <Icon name="Save" size={16} />}
                {tr("dashSave")}
              </button>
            </div>
          )}

          {tab === "contacts" && (
            <div className="border border-border rounded-sm bg-card p-6 space-y-5">
              <div>
                <div className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest mb-1">{tr("pdContactsTitle")}</div>
                <p className="text-xs text-muted-foreground leading-relaxed">{tr("pdContactsHint")}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {([
                  { key: "phone", label: "pdFieldPhone", icon: "Phone", ph: "+7 999 000-00-00", type: "tel" },
                  { key: "email", label: "pdFieldEmail", icon: "Mail", ph: "you@email.com", type: "email" },
                  { key: "whatsapp", label: "pdFieldWhatsApp", icon: "MessageSquare", ph: "+7 999 000-00-00", type: "tel" },
                  { key: "telegram", label: "pdFieldTelegram", icon: "Send", ph: "username", type: "text" },
                ] as const).map((f) => (
                  <div key={f.key}>
                    <label className="text-xs font-montserrat font-semibold text-foreground flex items-center gap-1.5 mb-2">
                      <Icon name={f.icon} size={13} className="text-gold" />
                      {tr(f.label)}
                    </label>
                    <input
                      type={f.type}
                      value={contacts[f.key]}
                      onChange={(e) => { setContacts({ ...contacts, [f.key]: e.target.value }); setSaveState("idle"); }}
                      placeholder={f.ph}
                      className="w-full bg-secondary border border-border rounded-sm px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-gold transition-colors"
                    />
                  </div>
                ))}
              </div>

              <div className="divider-gold" />
              <div className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest">{tr("pdSocialTitle")}</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {([
                  { key: "website", label: "pdFieldWebsite", icon: "Globe", ph: "https://..." },
                  { key: "vk", label: "VK" as const, icon: "Share2", ph: "vk.com/..." },
                  { key: "instagram", label: "Instagram" as const, icon: "Instagram", ph: "instagram.com/..." },
                  { key: "linkedin", label: "LinkedIn" as const, icon: "Linkedin", ph: "linkedin.com/in/..." },
                ] as const).map((f) => (
                  <div key={f.key}>
                    <label className="text-xs font-montserrat font-semibold text-foreground flex items-center gap-1.5 mb-2">
                      <Icon name={f.icon} size={13} className="text-gold" />
                      {f.label === "pdFieldWebsite" ? tr("pdFieldWebsite") : f.label}
                    </label>
                    <input
                      type="url"
                      value={contacts[f.key as keyof typeof contacts]}
                      onChange={(e) => { setContacts({ ...contacts, [f.key]: e.target.value }); setSaveState("idle"); }}
                      placeholder={f.ph}
                      className="w-full bg-secondary border border-border rounded-sm px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-gold transition-colors"
                    />
                  </div>
                ))}
              </div>

              {saveState === "saved" && (
                <div className="flex items-center gap-2 text-sm text-green-400"><Icon name="CheckCircle2" size={16} />{tr("pdContactsSaved")}</div>
              )}
              {saveState === "error" && (
                <div className="flex items-center gap-2 text-sm text-destructive"><Icon name="CircleAlert" size={16} />{tr("pdContactsSaveErr")}</div>
              )}
              <button
                onClick={saveContacts}
                disabled={saveState === "saving"}
                className="w-full gold-gradient text-[hsl(220,20%,6%)] py-3 text-sm font-montserrat font-bold rounded-sm hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {saveState === "saving" ? <Icon name="Loader" size={16} className="animate-spin" /> : <Icon name="Save" size={16} />}
                {tr("dashSave")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

type PayPlan = { name: keyof typeof t; price: keyof typeof t };

const PLAN_KEY_MAP: Record<string, string> = {
  planStartName: "start",
  planProName: "pro",
  planPremiumName: "premium",
};

function PaymentModal({ plan, onClose, defaultEmail = "", slug = "" }: { plan: PayPlan; onClose: () => void; defaultEmail?: string; slug?: string }) {
  const { lang, tr } = useLang();
  const { geo } = useGeo();
  const [method, setMethod] = useState<"card" | "sbp">("card");
  const [status, setStatus] = useState<"form" | "processing" | "success">("form");
  const [email, setEmail] = useState(defaultEmail);
  const [emailState, setEmailState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [autoSent, setAutoSent] = useState(false);
  const [period, setPeriod] = useState<"month" | "year">("month");
  const [quote, setQuote] = useState<{ currency: string; amount: number; provider: string; countryCode: string } | null>(null);
  const [payErr, setPayErr] = useState("");

  const planKey = PLAN_KEY_MAP[plan.name as string] || "pro";

  useEffect(() => {
    let alive = true;
    fetch(func2url["create-payment"], {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "quote", plan: planKey, period, countryCode: geo?.countryCode || "" }),
    })
      .then((r) => r.json())
      .then((d) => { if (alive && d && d.currency) setQuote(d); })
      .catch(() => {});
    return () => { alive = false; };
  }, [planKey, period, geo?.countryCode]);

  const isForeign = !!quote && quote.countryCode !== "RU";
  const localAmountStr = quote
    ? new Intl.NumberFormat(lang === "ru" ? "ru-RU" : "en-US", { style: "currency", currency: quote.currency, maximumFractionDigits: quote.currency === "RUB" ? 0 : 2 }).format(quote.amount)
    : null;

  // Parse the monthly price string ("2 490 ₽" / "from $90") into number + currency formatting
  const priceStr = tr(plan.price);
  const priceNum = parseFloat(priceStr.replace(/[^\d.,]/g, "").replace(/\s/g, "").replace(",", ".")) || 0;
  const fmt = (n: number) => {
    const rounded = Math.round(n);
    const grouped = rounded.toLocaleString(lang === "ru" ? "ru-RU" : "en-US");
    return priceStr.replace(/[\d\s.,]+/, grouped);
  };
  const yearlyFull = priceNum * 12;
  const yearlyDiscounted = Math.round(yearlyFull * 0.83);
  const yearlySaving = Math.round(yearlyFull - yearlyDiscounted);
  const amountStr = period === "year" ? fmt(yearlyDiscounted) : priceStr;

  const receipt = (to?: string) => ({
    receiptNo: "SN-" + new Date().toISOString().slice(0, 10).replace(/-/g, "") + "-" + Math.floor(Math.random() * 900 + 100),
    date: new Date().toLocaleDateString(lang === "ru" ? "ru-RU" : "en-US"),
    plan: tr(plan.name),
    period: period === "year" ? tr("payOneYear") : tr("payOneMonth"),
    amount: amountStr,
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

  const pay = async () => {
    setPayErr("");
    setStatus("processing");
    try {
      const res = await fetch(func2url["create-payment"], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planKey, period, email, slug, countryCode: geo?.countryCode || "", returnUrl: window.location.href }),
      });
      const d = await res.json();
      const redirect = d.confirmationUrl || d.checkoutUrl;
      if (d.configured && redirect) {
        window.location.href = redirect;
        return;
      }
      // Платёжная система ещё не настроена — показываем демо-успех
      setStatus("success");
      if (defaultEmail && defaultEmail.includes("@")) {
        setAutoSent(true);
        sendTo(defaultEmail);
      }
      if (!d.configured) setPayErr(tr("payNotConfigured"));
    } catch {
      setStatus("form");
      setPayErr(tr("payError"));
    }
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

            <div className="grid grid-cols-2 gap-2 mb-4 p-1 bg-secondary rounded-sm">
              <button
                onClick={() => setPeriod("month")}
                className={`py-2.5 text-xs font-montserrat font-bold rounded-sm transition-all ${period === "month" ? "bg-card text-foreground shadow" : "text-muted-foreground hover:text-foreground"}`}
              >
                {tr("billMonthly")}
              </button>
              <button
                onClick={() => setPeriod("year")}
                className={`relative py-2.5 text-xs font-montserrat font-bold rounded-sm transition-all ${period === "year" ? "gold-gradient text-[hsl(220,20%,6%)]" : "text-muted-foreground hover:text-foreground"}`}
              >
                {tr("billYearly")}
                <span className={`absolute -top-2 end-1 text-[9px] px-1.5 py-0.5 rounded-sm font-bold ${period === "year" ? "bg-[hsl(220,20%,6%)] text-gold" : "bg-gold text-[hsl(220,20%,6%)]"}`}>−17%</span>
              </button>
            </div>

            <div className="border border-border rounded-sm bg-card p-4 mb-5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{tr("payPlan")}</span>
                <span className="font-montserrat font-semibold text-foreground">{tr(plan.name)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{tr("payPeriod")}</span>
                <span className="font-montserrat font-semibold text-foreground">{period === "year" ? tr("payOneYear") : tr("payOneMonth")}</span>
              </div>
              {period === "year" && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{tr("billYearSaveLine")}</span>
                  <span className="font-montserrat font-bold text-green-400">−{fmt(yearlySaving)}</span>
                </div>
              )}
              <div className="divider-gold my-1" />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{tr("payAmount")}</span>
                <div className="text-end">
                  {period === "year" && (
                    <div className="text-xs text-muted-foreground line-through">{fmt(yearlyFull)}</div>
                  )}
                  <span className="font-montserrat font-extrabold text-2xl text-gold">{amountStr}</span>
                  <span className="text-xs text-muted-foreground ms-1">{period === "year" ? tr("billPerYear") : tr("perMonth")}</span>
                  {isForeign && localAmountStr && (
                    <div className="text-[11px] text-gold mt-1 flex items-center justify-end gap-1"><Icon name="Globe" size={11} />≈ {localAmountStr}</div>
                  )}
                </div>
              </div>
            </div>

            {isForeign ? (
              <div className="border border-gold/30 rounded-sm bg-card/60 p-4 mb-5 flex items-start gap-3">
                <Icon name="ShieldCheck" size={16} className="text-gold mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">{tr("payForeignNote")}</p>
              </div>
            ) : (
            <>
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
            </>
            )}

            {payErr && (
              <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-sm px-3 py-2 mb-3">
                <Icon name="Info" size={14} className="shrink-0" />{payErr}
              </div>
            )}

            <button onClick={pay} disabled={status === "processing"}
              className="w-full gold-gradient text-[hsl(220,20%,6%)] py-3.5 text-sm font-montserrat font-bold rounded-sm hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2">
              {status === "processing" ? (
                <><Icon name="Loader" size={16} className="animate-spin" /> {tr("payProcessing")}</>
              ) : (
                <><Icon name="Lock" size={15} /> {tr("payButton")} {isForeign && localAmountStr ? localAmountStr : amountStr}</>
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
      premium: false,
      enterprise: false,
      features: ["featProfile", "feat5cases", "featChat"] as const,
      muted: ["featCourses", "featPriority", "featTopPlacement", "featManager"] as const,
    },
    {
      name: "planProName" as const,
      price: "planProPrice" as const,
      for: "planProFor" as const,
      featured: true,
      premium: false,
      enterprise: false,
      features: ["featProfile", "feat20cases", "featChat", "featCourses", "featPriority"] as const,
      muted: ["featTopPlacement", "featManager"] as const,
    },
    {
      name: "planPremiumName" as const,
      price: "planPremiumPrice" as const,
      for: "planPremiumFor" as const,
      featured: false,
      premium: true,
      enterprise: false,
      features: ["featProfile", "featUnlimCases", "featChat", "featCourses", "featPriority", "featTopPlacement", "featBadge", "featPremiumCard", "featPremiumTop", "featPremiumAnalytics"] as const,
      muted: [] as const,
    },
    {
      name: "planEntName" as const,
      price: "planEntPrice" as const,
      for: "planEntFor" as const,
      featured: false,
      premium: false,
      enterprise: true,
      features: ["featProfile", "featUnlimCases", "featTopPlacement", "featBadge", "featManager", "featTeam", "featApi"] as const,
      muted: [] as const,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <div className="tag-security mb-3 inline-block">{tr("pricingTag")}</div>
        <h1 className="font-montserrat font-extrabold text-3xl md:text-4xl text-foreground mb-3 max-w-3xl mx-auto">{tr("pricingTitle")}</h1>
        <p className="text-muted-foreground text-sm max-w-2xl mx-auto">{tr("pricingDesc")}</p>
      </div>

      {/* No-commission highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10 max-w-4xl mx-auto">
        {[
          { icon: "BadgePercent", title: "priceNoCommission" as const, desc: "priceNoCommissionDesc" as const },
          { icon: "HandCoins", title: "priceKeepAll" as const, desc: "priceKeepAllDesc" as const },
          { icon: "Tag", title: "priceFixed" as const, desc: "priceFixedDesc" as const },
        ].map((h) => (
          <div key={h.title} className="flex items-start gap-3 border border-gold/30 rounded-sm bg-card p-4">
            <div className="w-9 h-9 gold-gradient rounded flex items-center justify-center shrink-0">
              <Icon name={h.icon} size={16} className="text-[hsl(220,20%,6%)]" />
            </div>
            <div>
              <div className="font-montserrat font-bold text-sm text-foreground leading-tight">{tr(h.title)}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{tr(h.desc)}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 stagger">
        {plans.map((p) => (
          <div
            key={p.name}
            className={`relative flex flex-col rounded-sm p-6 card-hover ${p.premium ? "border-2 border-gold security-glow ambient-gold bg-gradient-to-b from-gold/[0.07] to-card glow-gold-sm md:-mt-2 md:mb-2" : p.featured ? "border border-gold security-glow bg-card" : "border border-border bg-card"}`}
          >
            {p.premium && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 gold-gradient text-[hsl(220,20%,6%)] text-[10px] font-montserrat font-extrabold tracking-widest uppercase px-3 py-1 rounded-sm whitespace-nowrap flex items-center gap-1 shadow-lg">
                <Icon name="Crown" size={11} />{tr("bestChoice")}
              </div>
            )}
            {p.featured && !p.premium && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 badge-pro whitespace-nowrap">{tr("mostPopular")}</div>
            )}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-1">
                {p.premium && <Icon name="Crown" size={18} className="text-gold" />}
                <span className={`font-montserrat font-bold text-foreground ${p.premium ? "text-xl gold-text-gradient" : "text-lg"}`}>{tr(p.name)}</span>
              </div>
              <div className="text-xs text-muted-foreground">{tr(p.for)}</div>
            </div>
            <div className="mb-6">
              <div>
                <span className={`font-montserrat font-extrabold text-gold ${p.premium ? "text-4xl" : "text-3xl"}`}>{tr(p.price)}</span>
                {!p.enterprise && <span className="text-xs text-muted-foreground ms-1">{tr("perMonth")}</span>}
              </div>
              {!p.enterprise && (
                <div className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-montserrat font-semibold text-green-400">
                  <Icon name="Check" size={11} />
                  {tr("priceOnlySub")} · {tr("priceNoCommission")}
                </div>
              )}
            </div>
            {p.premium && (
              <div className="mb-5 -mt-1 rounded-sm bg-gold/10 border border-gold/30 px-3 py-2 flex items-start gap-2">
                <Icon name="Sparkles" size={13} className="text-gold mt-0.5 shrink-0" />
                <span className="text-[11px] text-foreground leading-snug">{tr("premiumValueNote")}</span>
              </div>
            )}
            <div className="divider-gold mb-5" />
            <div className="space-y-2.5 flex-1 mb-6">
              {p.features.map((f) => {
                const isExtra = (["featPremiumCard", "featPremiumTop", "featPremiumAnalytics"] as string[]).includes(f);
                return (
                  <div key={f} className="flex items-center gap-2">
                    <Icon name={isExtra ? "Sparkles" : "Check"} size={14} className={`shrink-0 ${isExtra ? "text-gold" : "text-gold"}`} />
                    <span className={`text-xs ${isExtra ? "text-gold font-semibold" : "text-foreground"}`}>{tr(f)}</span>
                  </div>
                );
              })}
              {p.muted.map((f) => (
                <div key={f} className="flex items-center gap-2 opacity-40">
                  <Icon name="X" size={14} className="text-muted-foreground shrink-0" />
                  <span className="text-xs text-muted-foreground line-through">{tr(f)}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => p.enterprise ? setActive("contacts") : setPayPlan({ name: p.name, price: p.price })}
              className={`w-full py-3 text-xs font-montserrat font-bold rounded-sm transition-all ${(p.featured || p.premium) ? "gold-gradient text-[hsl(220,20%,6%)] hover:opacity-90 glow-gold-sm" : "border border-gold text-gold hover:bg-gold hover:text-[hsl(220,20%,6%)]"}`}
            >
              {p.enterprise ? tr("contactSales") : p.premium ? tr("choosePremium") : tr("choosePlan")}
            </button>
          </div>
        ))}
      </div>

      {payPlan && <PaymentModal plan={payPlan} onClose={() => setPayPlan(null)} defaultEmail={PROVIDER_EMAIL} slug="morozov" />}

      {/* No-commission promise */}
      <div className="mt-10 border border-gold/30 rounded-sm glass-card p-6 flex flex-col md:flex-row items-start md:items-center gap-4 security-glow">
        <div className="w-10 h-10 gold-gradient rounded-full flex items-center justify-center shrink-0 glow-gold-sm">
          <Icon name="HandCoins" size={18} className="text-[hsl(220,20%,6%)]" />
        </div>
        <div>
          <div className="font-montserrat font-semibold text-sm text-foreground mb-1">{tr("pricingBottomTitle")}</div>
          <div className="text-xs text-muted-foreground">{tr("pricingBottomDesc")}</div>
        </div>
        <button onClick={() => setActive("contacts")} className="shrink-0 border border-border text-muted-foreground text-xs font-montserrat font-semibold px-4 py-2 hover:border-gold hover:text-gold transition-all rounded-sm ms-auto">
          {tr("contactUs")}
        </button>
      </div>
    </div>
  );
}

function ProfileSection({ setActive }: { setActive: (s: Section) => void }) {
  const { lang, tr } = useLang();
  const [activeTab, setActiveTab] = useState<"cases" | "services" | "reviews">("cases");
  const { providers } = useProviders();
  const provider = providers.find((p) => p.active);

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
                {provider && isLicensed(provider) && (
                  <span className="flex items-center gap-1 bg-gold/10 border border-gold/40 px-2 py-0.5 rounded-sm" title={tr("licenseBadge")}>
                    <Icon name="BadgeCheck" size={13} className="text-gold" />
                    <span className="text-[10px] font-montserrat font-semibold text-gold">{tr("licenseBadge")}</span>
                  </span>
                )}
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
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-montserrat font-semibold mb-2">{tr("contactTitle")}</div>
              {provider && <AvailabilityNote p={provider} />}
              {provider && <ContactButtons p={provider} onChat={() => setActive("chat")} />}
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

          {provider?.verification && <VerificationBlock v={provider.verification} />}
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

function ProviderResultCard({ p, onOpen }: { p: Provider; onOpen: () => void }) {
  const { lang, tr } = useLang();
  const tags = lang === "ru" ? p.tags.ru : p.tags.en;
  const premium = isPremium(p);
  return (
    <div
      onClick={onOpen}
      className={`card-hover shine-on-hover rounded-sm overflow-hidden cursor-pointer group flex flex-col relative ${premium ? "border-2 border-gold security-glow ambient-gold bg-card" : "border border-border bg-card"}`}
    >
      {premium && (
        <div className="absolute top-0 inset-x-0 z-20 gold-gradient text-[hsl(220,20%,6%)] text-[10px] font-montserrat font-extrabold tracking-widest uppercase text-center py-1 flex items-center justify-center gap-1">
          <Icon name="Crown" size={11} />{tr("premiumBadge")}
        </div>
      )}
      <div className={`h-48 overflow-hidden relative ${premium ? "mt-6" : ""}`}>
        <img src={resolveAvatar(p.img, p.gender)} alt={L(p.name, lang)} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
        {p.isPseudonym && (
          <div className="absolute top-3 start-3 flex items-center gap-1 bg-card/90 backdrop-blur-sm border border-border px-2 py-1 rounded-sm">
            <Icon name="VenetianMask" size={11} className="text-muted-foreground" />
            <span className="text-[10px] font-montserrat font-semibold text-muted-foreground">{tr("aliasBadge")}</span>
          </div>
        )}
        {isLicensed(p) && (
          <div className="absolute top-3 end-3 flex items-center gap-1 bg-card/90 backdrop-blur-sm border border-gold/40 px-2 py-1 rounded-sm">
            <Icon name="BadgeCheck" size={12} className="text-gold" />
            <span className="text-[10px] font-montserrat font-semibold text-gold">{tr("licenseBadge")}</span>
          </div>
        )}
        <div className="absolute bottom-3 start-4 end-4">
          <div className="font-montserrat font-bold text-base text-foreground">{L(p.name, lang)}</div>
          <div className="text-xs text-gold font-montserrat font-medium flex items-center gap-2 flex-wrap">
            {L(p.title, lang)}
            <span className="text-muted-foreground">· {p.experience} {tr("yearsShort")}</span>
          </div>
        </div>
      </div>
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center gap-3 mb-4">
          <StarRating rating={p.rating} />
          <span className="text-xs text-muted-foreground">{p.rating} ({p.reviews})</span>
          <span className="text-xs text-muted-foreground ms-auto flex items-center gap-1">
            <Icon name="MapPin" size={11} />{L(p.city, lang)}
          </span>
        </div>
        {p.country && (p.country.ru || p.country.en) && (
          <div className="text-[11px] text-muted-foreground mb-3 flex items-center gap-1"><Icon name="Globe" size={11} className="text-gold" />{L(p.country, lang)}</div>
        )}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {tags.slice(0, 4).map((tg) => (<span key={tg} className="tag-security">{tg}</span>))}
        </div>
        <div className="divider-gold mb-4" />
        <div className="flex items-center justify-between mt-auto">
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{tr("cost")}</div>
            <div className="font-montserrat font-bold text-sm text-gold">{L(p.price, lang)}</div>
          </div>
          <span className="text-xs font-montserrat font-semibold text-gold flex items-center gap-1 group-hover:gap-2 transition-all">{tr("openProfile")}<Icon name="ArrowRight" size={13} /></span>
        </div>
      </div>
    </div>
  );
}

function SearchSection({ setActive }: { setActive: (s: Section) => void }) {
  const { lang, tr } = useLang();
  const { providers } = useProviders();
  const { geo } = useGeo();
  const [service, setService] = useState("");
  const [category, setCategory] = useState("");
  const [minRating, setMinRating] = useState(0);
  const [licensedOnly, setLicensedOnly] = useState(false);
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [date, setDate] = useState("");

  const servicesInCat = category ? services.filter((s) => s.cat === category) : services;
  const serviceOptions = servicesInCat.map((s) => L(s.title, lang));
  const cityOptions = Array.from(new Set(providers.map((p) => L(p.city, lang)).filter(Boolean))).sort();
  const countryOptions = Array.from(new Set(providers.map((p) => (p.country ? L(p.country, lang) : "")).filter(Boolean))).sort();

  const reset = () => { setService(""); setCategory(""); setMinRating(0); setLicensedOnly(false); setCity(""); setCountry(""); setDate(""); };

  const matchesText = (p: Provider, q: string) => {
    const tags = (lang === "ru" ? p.tags.ru : p.tags.en).map((t) => t.toLowerCase());
    const title = L(p.title, lang).toLowerCase();
    const ql = q.toLowerCase();
    return title.includes(ql) || tags.some((t) => t.includes(ql) || ql.includes(t));
  };

  const dow = date ? new Date(date + "T12:00:00").getDay() : null;
  const availableOnDate = (p: Provider) => {
    if (dow == null) return true;
    if (p.alwaysAvailable) return true;
    return true;
  };

  const results = providers.filter((p) => {
    if (!p.active) return false;
    if (minRating && p.rating < minRating) return false;
    if (licensedOnly && !isLicensed(p)) return false;
    if (city && L(p.city, lang) !== city) return false;
    if (country && (!p.country || L(p.country, lang) !== country)) return false;
    if (category) {
      const catServices = services.filter((s) => s.cat === category);
      const anyMatch = catServices.some((s) => matchesText(p, L(s.title, lang)));
      if (!anyMatch) return false;
    }
    if (service && !matchesText(p, service)) return false;
    if (!availableOnDate(p)) return false;
    return true;
  });

  const activeFilters = [service, minRating ? "r" : "", licensedOnly ? "l" : "", city, country, date].filter(Boolean).length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="mb-6">
        <div className="tag-security mb-3 inline-block">{tr("searchTag")}</div>
        <h2 className="font-montserrat font-bold text-3xl text-foreground mb-2">{tr("searchTitle")}</h2>
        <p className="text-muted-foreground text-sm">{tr("searchSubtitle")}</p>
      </div>

      <div className="border border-border rounded-sm bg-card p-5 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="text-[11px] font-montserrat font-bold text-muted-foreground uppercase tracking-widest block mb-1.5">{tr("searchFCategory")}</label>
            <select value={category} onChange={(e) => { setCategory(e.target.value); setService(""); }} className="w-full border border-border bg-secondary rounded-sm px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold">
              <option value="">{tr("searchAnyCategory")}</option>
              {serviceCategories.map((c) => <option key={c.id} value={c.id}>{L(c.title, lang)}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-montserrat font-bold text-muted-foreground uppercase tracking-widest block mb-1.5">{tr("searchFService")}</label>
            <div className="flex items-center gap-2 border border-border bg-secondary rounded-sm px-3">
              <Icon name="Briefcase" size={14} className="text-muted-foreground" />
              <input list="svc-list" value={service} onChange={(e) => setService(e.target.value)} placeholder={tr("searchAnyService")} className="flex-1 bg-transparent py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none" />
              <datalist id="svc-list">{serviceOptions.map((s) => <option key={s} value={s} />)}</datalist>
            </div>
          </div>
          <div>
            <label className="text-[11px] font-montserrat font-bold text-muted-foreground uppercase tracking-widest block mb-1.5">{tr("searchFCity")}</label>
            <select value={city} onChange={(e) => setCity(e.target.value)} className="w-full border border-border bg-secondary rounded-sm px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold">
              <option value="">{tr("searchAnyCity")}</option>
              {cityOptions.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-montserrat font-bold text-muted-foreground uppercase tracking-widest block mb-1.5">{tr("searchFCountry")}</label>
            <select value={country} onChange={(e) => setCountry(e.target.value)} className="w-full border border-border bg-secondary rounded-sm px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold">
              <option value="">{tr("searchAnyCountry")}</option>
              {countryOptions.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-montserrat font-bold text-muted-foreground uppercase tracking-widest block mb-1.5">{tr("searchFRating")}</label>
            <select value={minRating} onChange={(e) => setMinRating(Number(e.target.value))} className="w-full border border-border bg-secondary rounded-sm px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold">
              <option value={0}>{tr("searchAnyRating")}</option>
              <option value={4}>4.0+</option>
              <option value={4.5}>4.5+</option>
              <option value={4.8}>4.8+</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] font-montserrat font-bold text-muted-foreground uppercase tracking-widest block mb-1.5">{tr("searchFDate")}</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full border border-border bg-secondary rounded-sm px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold" />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setLicensedOnly((v) => !v)}
              className={`w-full flex items-center justify-center gap-2 rounded-sm px-3 py-2.5 text-sm font-montserrat font-semibold border transition-all ${licensedOnly ? "bg-gold/15 border-gold/50 text-gold" : "border-border bg-secondary text-muted-foreground hover:border-gold hover:text-gold"}`}
            >
              <Icon name={licensedOnly ? "BadgeCheck" : "Badge"} size={15} />
              {tr("searchFLicensed")}
            </button>
          </div>
        </div>
        {activeFilters > 0 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
            <span className="text-xs text-muted-foreground">{tr("searchFound")}: <span className="text-gold font-bold">{results.length}</span></span>
            <button onClick={reset} className="text-xs font-montserrat font-semibold text-muted-foreground hover:text-gold flex items-center gap-1.5"><Icon name="X" size={13} />{tr("searchReset")}</button>
          </div>
        )}
      </div>

      {geo && geo.city && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-card border border-gold/30 rounded-sm px-3 py-2 mb-5 w-fit">
          <Icon name="MapPin" size={13} className="text-gold" />
          <span>{tr("geoYourLocation")}: <span className="text-foreground font-semibold">{geo.city}{geo.country ? `, ${geo.country}` : ""}</span></span>
        </div>
      )}

      {results.length === 0 ? (
        <div className="border border-dashed border-border rounded-sm bg-card/50 py-16 flex flex-col items-center gap-3 text-center">
          <Icon name="SearchX" size={40} className="text-muted-foreground/30" />
          <span className="text-sm text-muted-foreground">{tr("filterNoResults")}</span>
          <button onClick={reset} className="text-xs font-montserrat font-semibold text-gold hover:underline">{tr("searchReset")}</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 stagger">
          {results.map((p) => (
            <ProviderResultCard key={p.slug} p={p} onOpen={() => setActive("profile")} />
          ))}
        </div>
      )}
    </div>
  );
}

function ServicesSection() {
  const { lang, tr } = useLang();
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState("");

  const q = query.trim().toLowerCase();
  const filtered = services.filter((s) => {
    if (activeCat && s.cat !== activeCat) return false;
    if (q && !L(s.title, lang).toLowerCase().includes(q) && !L(s.desc, lang).toLowerCase().includes(q)) return false;
    return true;
  });
  const shownCats = serviceCategories.filter((c) => filtered.some((s) => s.cat === c.id));

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="mb-8">
        <div className="tag-security mb-3 inline-block">{tr("catalog")}</div>
        <h2 className="font-montserrat font-bold text-3xl text-foreground mb-2">{tr("servicesTitle")}</h2>
        <p className="text-muted-foreground text-sm">{tr("servicesDesc")}</p>
      </div>

      <div className="flex gap-3 mb-6">
        <div className="flex-1 flex items-center gap-3 border border-border bg-card rounded-sm px-4">
          <Icon name="Search" size={16} className="text-muted-foreground" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={tr("searchServices")} className="flex-1 bg-transparent py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none" />
          {query && <button onClick={() => setQuery("")} className="text-muted-foreground hover:text-foreground"><Icon name="X" size={15} /></button>}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-10">
        <button onClick={() => setActiveCat("")} className={`px-4 py-2 text-xs font-montserrat font-semibold rounded-sm border transition-colors ${activeCat === "" ? "gold-gradient text-[hsl(220,20%,6%)] border-transparent" : "border-border text-muted-foreground hover:text-gold hover:border-gold/50"}`}>{tr("searchAnyCategory")}</button>
        {serviceCategories.map((c) => (
          <button key={c.id} onClick={() => setActiveCat(c.id === activeCat ? "" : c.id)} className={`px-4 py-2 text-xs font-montserrat font-semibold rounded-sm border transition-colors flex items-center gap-1.5 ${activeCat === c.id ? "gold-gradient text-[hsl(220,20%,6%)] border-transparent" : "border-border text-muted-foreground hover:text-gold hover:border-gold/50"}`}>
            <Icon name={c.icon} fallback="Shield" size={13} />{L(c.title, lang)}
          </button>
        ))}
      </div>

      {shownCats.length === 0 && (
        <div className="text-center text-muted-foreground text-sm py-16 border border-dashed border-border rounded-sm">{tr("searchNoResults")}</div>
      )}

      {shownCats.map((cat) => (
        <div key={cat.id} className="mb-12">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 gold-gradient rounded flex items-center justify-center shrink-0">
              <Icon name={cat.icon} fallback="Shield" size={17} className="text-[hsl(220,20%,6%)]" />
            </div>
            <h3 className="font-montserrat font-bold text-lg text-foreground">{L(cat.title, lang)}</h3>
            <div className="h-px flex-1 bg-border" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.filter((s) => s.cat === cat.id).map((s) => (
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
        </div>
      ))}

      <div className="mt-10 border border-gold/30 rounded-sm bg-card p-6 flex flex-col md:flex-row items-start md:items-center gap-4">
        <div className="w-10 h-10 gold-gradient rounded flex items-center justify-center shrink-0">
          <Icon name="HandCoins" size={18} className="text-[hsl(220,20%,6%)]" />
        </div>
        <div>
          <div className="font-montserrat font-semibold text-sm text-foreground mb-1">{tr("noCommissionTitle")}</div>
          <div className="text-xs text-muted-foreground">{tr("noCommissionDesc")}</div>
        </div>
      </div>
    </div>
  );
}

function CoursesSection() {
  const { lang, tr } = useLang();
  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="mb-6">
        <div className="tag-security mb-3 inline-block">{tr("education")}</div>
        <h2 className="font-montserrat font-bold text-3xl text-foreground mb-2">{tr("coursesTitle")}</h2>
        <p className="text-muted-foreground text-sm">{tr("coursesDesc")}</p>
      </div>

      <div className="mb-8 border border-gold/30 rounded-sm bg-card/60 p-4 flex items-start gap-3">
        <Icon name="Megaphone" size={16} className="text-gold mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground leading-relaxed">{tr("coursesPartnerNote")}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10 stagger">
        {courses.map((c) => (
          <div key={c.title.en} className="group border border-border rounded-sm bg-card overflow-hidden card-hover shine-on-hover cursor-pointer">
            <div className="h-44 overflow-hidden relative">
              <img src={c.img} alt={L(c.title, lang)} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
              <div className="absolute top-3 start-3"><span className="badge-pro">{L(c.level, lang)}</span></div>
              <div className="absolute top-3 end-3 flex items-center gap-1 bg-card/90 backdrop-blur-sm border border-gold/40 px-2 py-1 rounded-sm">
                <Icon name="Megaphone" size={11} className="text-gold" />
                <span className="text-[10px] font-montserrat font-semibold text-gold">{tr("coursesPartnerBadge")}</span>
              </div>
            </div>
            <div className="p-5">
              <h3 className="font-montserrat font-bold text-sm text-foreground mb-2 leading-snug">{L(c.title, lang)}</h3>
              <div className="text-xs text-muted-foreground mb-3">{L(c.instructor, lang)} · {L(c.duration, lang)}</div>
              <div className="flex items-center gap-2 mb-4">
                <StarRating rating={c.rating} />
                <span className="text-xs text-muted-foreground">{c.rating}</span>
                <span className="text-xs text-muted-foreground ms-auto">{c.students} {tr("students")}</span>
              </div>
              <div className="divider-gold mb-4" />
              <div className="flex items-center justify-between">
                <div className="font-montserrat font-extrabold text-lg text-gold">{L(c.price, lang)}</div>
                <button className="gold-gradient text-[hsl(220,20%,6%)] px-4 py-2 text-xs font-montserrat font-bold rounded-sm hover:opacity-90 transition-opacity flex items-center gap-1.5">
                  {tr("coursesGoBtn")}<Icon name="ExternalLink" size={13} />
                </button>
              </div>
              <div className="text-[10px] text-muted-foreground/70 mt-2 text-center">{tr("coursesAdLabel")}</div>
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
          <div key={s.icon} className="border border-border rounded-sm bg-card p-5 flex items-center gap-4">
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
              <div className="absolute top-3 end-3 flex items-center gap-1 bg-card/90 backdrop-blur-sm border border-gold/40 px-2 py-1 rounded-sm">
                <Icon name="BadgeCheck" size={12} className="text-gold" />
                <span className="text-[10px] font-montserrat font-semibold text-gold">{tr("licensed")}</span>
              </div>
              <div className="absolute bottom-3 start-4 end-4">
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
          <div className="w-56 border-e border-border flex-col hidden md:flex">
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
              <div className="flex items-center gap-1 ms-auto">
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
                <div className="col-span-1 text-end">
                  <Icon name="ChevronRight" size={14} className="text-muted-foreground ms-auto" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="border border-border rounded-sm bg-card p-5">
            <div className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest mb-4">{tr("statistics")}</div>
            {[{ l: tr("topics"), v: "248" }, { l: tr("answers"), v: "4 120" }, { l: tr("members"), v: "1 240" }].map((s) => (
              <div key={s.v} className="flex justify-between py-2 border-b border-border last:border-0">
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

type LegalKey = keyof typeof t;
type LegalDoc = {
  icon: string;
  tag: LegalKey;
  title: LegalKey;
  intro: LegalKey;
  sections: { title: LegalKey; text: LegalKey }[];
};

const LEGAL_DOCS: Record<"privacy" | "terms" | "agreement" | "offer", LegalDoc> = {
  privacy: {
    icon: "ShieldCheck",
    tag: "lglTag",
    title: "fPrivacy",
    intro: "privIntro",
    sections: [
      { title: "priv1Title", text: "priv1Text" },
      { title: "priv2Title", text: "priv2Text" },
      { title: "priv3Title", text: "priv3Text" },
      { title: "priv4Title", text: "priv4Text" },
      { title: "priv5Title", text: "priv5Text" },
      { title: "priv6Title", text: "priv6Text" },
      { title: "priv7Title", text: "priv7Text" },
      { title: "priv8Title", text: "priv8Text" },
      { title: "priv9Title", text: "priv9Text" },
    ],
  },
  terms: {
    icon: "FileText",
    tag: "lglTag",
    title: "fTerms",
    intro: "termsIntro",
    sections: [
      { title: "terms1Title", text: "terms1Text" },
      { title: "terms2Title", text: "terms2Text" },
      { title: "terms3Title", text: "terms3Text" },
      { title: "terms4Title", text: "terms4Text" },
      { title: "terms5Title", text: "terms5Text" },
      { title: "terms6Title", text: "terms6Text" },
      { title: "terms7Title", text: "terms7Text" },
    ],
  },
  agreement: {
    icon: "Handshake",
    tag: "lglTag",
    title: "fAgreement",
    intro: "agrIntro",
    sections: [
      { title: "agr1Title", text: "agr1Text" },
      { title: "agr2Title", text: "agr2Text" },
      { title: "agr3Title", text: "agr3Text" },
      { title: "agr4Title", text: "agr4Text" },
      { title: "agr5Title", text: "agr5Text" },
      { title: "agr6Title", text: "agr6Text" },
    ],
  },
  offer: {
    icon: "Wallet",
    tag: "lglTag",
    title: "fOffer",
    intro: "offerIntro",
    sections: [
      { title: "offer1Title", text: "offer1Text" },
      { title: "offer2Title", text: "offer2Text" },
      { title: "offer3Title", text: "offer3Text" },
      { title: "offer4Title", text: "offer4Text" },
      { title: "offer5Title", text: "offer5Text" },
      { title: "offer6Title", text: "offer6Text" },
      { title: "offer7Title", text: "offer7Text" },
    ],
  },
};

function LegalDocSection({ doc, setActive }: { doc: LegalDoc; setActive: (s: Section) => void }) {
  const { tr } = useLang();
  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="border border-gold/30 rounded-sm glass-card p-8 md:p-10 mb-8 relative overflow-hidden security-glow ambient-gold">
        <div className="absolute inset-0 grid-line-bg opacity-30" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
          <div className="w-16 h-16 gold-gradient rounded-full flex items-center justify-center shrink-0 glow-gold-sm">
            <Icon name={doc.icon} fallback="FileText" size={30} className="text-[hsl(220,20%,6%)]" />
          </div>
          <div>
            <div className="tag-security mb-3 inline-block">{tr(doc.tag)}</div>
            <h1 className="font-montserrat font-extrabold text-3xl md:text-4xl text-foreground mb-2">{tr(doc.title)}</h1>
            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Icon name="Calendar" size={12} className="text-gold" />
              {tr("polUpdated")}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1 order-2 lg:order-1">
          <div className="lg:sticky lg:top-24 border border-border rounded-sm bg-card p-5">
            <div className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest mb-4">{tr("polNav")}</div>
            {doc.sections.map((s, i) => (
              <a key={s.title} href={`#lgl-${i}`} className="flex items-center gap-2 py-2 border-b border-border last:border-0 cursor-pointer group">
                <span className="font-montserrat font-bold text-[10px] text-gold w-4">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-xs text-muted-foreground group-hover:text-gold transition-colors">{tr(s.title).replace(/^\d+\.\s*/, "")}</span>
              </a>
            ))}
          </div>
        </aside>

        <div className="lg:col-span-3 order-1 lg:order-2">
          <div className="border border-border rounded-sm bg-card p-6 md:p-8 mb-6">
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{tr(doc.intro)}</p>
          </div>

          <div className="space-y-5 stagger">
            {doc.sections.map((s, i) => (
              <div key={s.title} id={`lgl-${i}`} className="border border-border rounded-sm bg-card p-6 md:p-7 card-hover scroll-mt-24">
                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 gold-gradient rounded flex items-center justify-center shrink-0 glow-gold-sm">
                    <span className="font-montserrat font-extrabold text-sm text-[hsl(220,20%,6%)]">{String(i + 1).padStart(2, "0")}</span>
                  </div>
                  <div>
                    <h2 className="font-montserrat font-bold text-base text-foreground mb-2">{tr(s.title)}</h2>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{tr(s.text)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 border border-border rounded-sm bg-card/60 p-5 flex items-start gap-3">
            <Icon name="Info" size={16} className="text-gold mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">{tr("lglDisclaimer")}</p>
          </div>

          <div className="mt-6 border border-gold/30 rounded-sm glass-card p-8 text-center security-glow">
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