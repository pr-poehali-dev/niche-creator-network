import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { useLang } from "@/lib/i18n";
import { useAuth, type AuthRole } from "@/lib/auth";
import { trackGoal, GOALS } from "@/lib/analytics";
import Brand from "@/components/Brand";
import { type Section } from "@/lib/shared";

export default function AuthModal({ onClose, onOpenDoc }: { onClose: () => void; onOpenDoc: (s: Section) => void }) {
  const { tr, lang } = useLang();
  const { login, verify2fa, resend2fa, register, adminLogin, resetRequest, resetConfirm } = useAuth();
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
  // Восстановление пароля: "request" — ввод почты, "confirm" — код и новый пароль.
  const [reset, setReset] = useState<null | "request" | "confirm" | "done">(null);
  const [resetCode, setResetCode] = useState("");
  const [newPass, setNewPass] = useState("");

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
    if (res.ok) {
      if (mode === "register") trackGoal(role === "provider" ? GOALS.signupProvider : GOALS.signupClient);
      else if (mode === "login") trackGoal(GOALS.login);
      onClose();
    }
    else setError(errText(res.error || "error"));
  };

  const submitCode = async () => {
    if (!twofa || code.length !== 6) return;
    setError("");
    setBusy(true);
    const res = await verify2fa(twofa.challengeId, code);
    setBusy(false);
    if (res.ok) {
      if (mode === "register") trackGoal(role === "provider" ? GOALS.signupProvider : GOALS.signupClient);
      else if (mode === "login") trackGoal(GOALS.login);
      onClose();
    }
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

  const doResetRequest = async () => {
    setError("");
    setBusy(true);
    const res = await resetRequest(email.trim(), lang);
    setBusy(false);
    if (res.ok) setReset("confirm");
    else setError(errText(res.error || "error"));
  };

  const doResetConfirm = async () => {
    setError("");
    setBusy(true);
    const res = await resetConfirm(email.trim(), resetCode, newPass);
    setBusy(false);
    if (res.ok) { setReset("done"); setResetCode(""); setNewPass(""); }
    else setError(errText(res.error || "error"));
  };

  if (reset) {
    const backToLogin = () => { setReset(null); setResetCode(""); setNewPass(""); setError(""); };
    return (
      <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
        <div className="absolute inset-0 bg-background/90 backdrop-blur-sm" />
        <div role="dialog" aria-modal="true" aria-label={tr("authForgotTitle")} className="relative z-10 w-full max-w-md bg-card border border-gold/40 rounded-sm shadow-2xl security-glow p-7" onClick={(e) => e.stopPropagation()}>
          <button onClick={onClose} className="absolute top-3 end-3 text-muted-foreground hover:text-foreground transition-colors" aria-label={tr("lightboxClose")}>
            <Icon name="X" size={20} />
          </button>
          <div className="w-12 h-12 icon-tile rounded-full flex items-center justify-center mb-4">
            <Icon name={reset === "done" ? "CircleCheck" : "KeyRound"} size={22} className="text-gold" />
          </div>

          {reset === "done" ? (
            <>
              <h3 className="font-montserrat font-bold text-lg text-foreground mb-1">{tr("authResetDoneTitle")}</h3>
              <p className="text-xs text-muted-foreground mb-5">{tr("authResetDoneDesc")}</p>
              <button onClick={backToLogin} className="w-full gold-gradient text-[hsl(28,20%,7%)] py-3 text-sm font-montserrat font-bold rounded-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                <Icon name="LogIn" size={16} />{tr("authTabLogin")}
              </button>
            </>
          ) : reset === "request" ? (
            <>
              <h3 className="font-montserrat font-bold text-lg text-foreground mb-1">{tr("authForgotTitle")}</h3>
              <p className="text-xs text-muted-foreground mb-4">{tr("authForgotDesc")}</p>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                onKeyDown={(e) => { if (e.key === "Enter" && email.trim() && !busy) doResetRequest(); }}
                autoFocus
                placeholder="your@email.com"
                className="w-full bg-secondary border border-border rounded-sm px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-gold transition-colors mb-3"
              />
              {error && (
                <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-sm px-3 py-2 mb-3">
                  <Icon name="CircleAlert" size={14} className="shrink-0" />{error}
                </div>
              )}
              <button onClick={doResetRequest} disabled={busy || !email.trim()} className="w-full gold-gradient text-[hsl(28,20%,7%)] py-3 text-sm font-montserrat font-bold rounded-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
                {busy ? <Icon name="Loader" size={16} className="animate-spin" /> : <Icon name="Send" size={16} />}
                {tr("authForgotSend")}
              </button>
            </>
          ) : (
            <>
              <h3 className="font-montserrat font-bold text-lg text-foreground mb-1">{tr("authResetTitle")}</h3>
              <p className="text-xs text-muted-foreground mb-4">{tr("authResetDesc")}</p>
              <input
                value={resetCode}
                onChange={(e) => { setResetCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
                inputMode="numeric"
                autoFocus
                placeholder="••••••"
                className="w-full bg-secondary border border-border rounded-sm px-4 py-3 text-center text-2xl tracking-[0.5em] font-montserrat font-bold text-foreground placeholder:text-muted-foreground outline-none focus:border-gold transition-colors mb-3"
              />
              <input
                type="password"
                value={newPass}
                onChange={(e) => { setNewPass(e.target.value); setError(""); }}
                onKeyDown={(e) => { if (e.key === "Enter" && resetCode.length === 6 && newPass && !busy) doResetConfirm(); }}
                placeholder={tr("authResetNewPass")}
                className="w-full bg-secondary border border-border rounded-sm px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-gold transition-colors mb-1"
              />
              <p className="text-[11px] text-muted-foreground mb-3">{tr("authPassHint")}</p>
              {error && (
                <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-sm px-3 py-2 mb-3">
                  <Icon name="CircleAlert" size={14} className="shrink-0" />{error}
                </div>
              )}
              <button onClick={doResetConfirm} disabled={busy || resetCode.length !== 6 || !newPass} className="w-full gold-gradient text-[hsl(28,20%,7%)] py-3 text-sm font-montserrat font-bold rounded-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
                {busy ? <Icon name="Loader" size={16} className="animate-spin" /> : <Icon name="ShieldCheck" size={16} />}
                {tr("authResetConfirm")}
              </button>
            </>
          )}

          {reset !== "done" && (
            <button onClick={backToLogin} className="mt-4 text-xs text-muted-foreground hover:text-gold flex items-center gap-1">
              <Icon name="ArrowLeft" size={13} />{tr("authBackToLogin")}
            </button>
          )}
        </div>
      </div>
    );
  }

  if (twofa) {
    return (
      <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
        <div className="absolute inset-0 bg-background/90 backdrop-blur-sm" />
        <div className="relative z-10 w-full max-w-md bg-card border border-gold/40 rounded-sm shadow-2xl security-glow p-7" onClick={(e) => e.stopPropagation()}>
          <button onClick={onClose} className="absolute top-3 end-3 text-muted-foreground hover:text-foreground transition-colors" aria-label={tr("lightboxClose")}>
            <Icon name="X" size={20} />
          </button>
          <div className="w-12 h-12 icon-tile rounded-full flex items-center justify-center mb-4">
            <Icon name="ShieldCheck" size={22} className="text-gold" />
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
            className="w-full gold-gradient text-[hsl(28,20%,7%)] py-3 text-sm font-montserrat font-bold rounded-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
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
                <Icon name="ShieldCheck" size={17} className="text-[hsl(28,20%,7%)]" />
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
                className="w-full gold-gradient text-[hsl(28,20%,7%)] py-3 text-sm font-montserrat font-bold rounded-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-60"
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
      <div role="dialog" aria-modal="true" aria-label={tr(mode === "login" ? "authTabLogin" : "authTabRegister")} className="relative z-10 w-full max-w-md bg-card border border-border rounded-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 end-3 text-muted-foreground hover:text-foreground transition-colors" aria-label={tr("lightboxClose")}>
          <Icon name="X" size={20} />
        </button>
        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-9 h-9 gold-gradient rounded flex items-center justify-center">
              <Icon name="Shield" size={17} className="text-[hsl(28,20%,7%)]" />
            </div>
            <Brand className="font-montserrat font-bold text-lg tracking-[0.2em] text-foreground" />
          </div>

          <div className="flex border border-border rounded-sm overflow-hidden mb-6">
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(""); }}
                className={`flex-1 py-2.5 text-sm font-montserrat font-bold transition-colors ${mode === m ? "gold-gradient text-[hsl(28,20%,7%)]" : "text-muted-foreground hover:text-foreground"}`}
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

            {/* Без этой ссылки забытый пароль означал потерю аккаунта навсегда. */}
            {mode === "login" && (
              <button type="button" onClick={() => { setReset("request"); setError(""); }} className="text-[11px] text-muted-foreground hover:text-gold transition-colors self-start">
                {tr("authForgotLink")}
              </button>
            )}

            {mode === "register" && (
              <label className="flex items-start gap-2.5 cursor-pointer select-none pt-1">
                <button
                  type="button"
                  onClick={() => setConsent((v) => !v)}
                  className={`mt-0.5 w-5 h-5 shrink-0 rounded-sm border flex items-center justify-center transition-all ${consent ? "gold-gradient border-gold" : "border-border bg-secondary"}`}
                  aria-checked={consent}
                  role="checkbox"
                >
                  {consent && <Icon name="Check" size={13} className="text-[hsl(28,20%,7%)]" />}
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
              className="w-full gold-gradient text-[hsl(28,20%,7%)] py-3 text-sm font-montserrat font-bold rounded-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-60"
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