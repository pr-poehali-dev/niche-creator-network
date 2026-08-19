import { useState } from "react";
import Icon from "@/components/ui/icon";
import { useLang, t } from "@/lib/i18n";
import { useProviders } from "@/lib/providers";
import { services } from "@/lib/servicesCatalog";
import { L, HERO_IMAGE } from "@/lib/shared";

export function TrustBadges() {
  const { tr } = useLang();
  return (
    <section className="border-t border-border bg-card/30">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {([
            ["BadgeCheck", "aboutTrust1"],
            ["ShieldCheck", "aboutTrust2"],
            ["Globe", "aboutTrust3"],
            ["Lock", "aboutTrust4"],
          ] as const).map(([icon, key]) => (
            <div key={key} className="group border border-border rounded-sm bg-card p-4 flex flex-col items-center text-center gap-2 card-hover card-tilt">
              <Icon name={icon} size={22} className="icon-hover text-gold" />
              <span className="text-xs font-montserrat font-semibold text-foreground leading-snug">{tr(key)}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function MinimalHome({ onCabinet, onPolicy }: { onCabinet: () => void; onPolicy: () => void }) {
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
              {tr("promoBadge")}
            </div>
            <h1 className="font-montserrat font-extrabold text-4xl md:text-5xl lg:text-6xl text-foreground leading-[1.05] mb-6 tracking-tight">
              <span className="md:whitespace-nowrap">{tr("promoTitle1")}</span><br />
              <span className="gold-text-gradient md:whitespace-nowrap">{tr("promoTitle2")}</span>
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

      <TrustBadges />

      <LandingStats />
      <LandingWhyUs />
      <LandingHowItWorks />
      <LandingValue />
      <LandingServices />
      <LandingTestimonials />
      <LandingFaq />
      <LandingFinalCta onCabinet={onCabinet} />
    </>
  );
}

// Переиспользуемый аккордеон FAQ для внутренних страниц (Контакты, Политика и т.п.).
// В отличие от LandingFaq (жёстко зашит список для главной), принимает набор пар ключей i18n.
export function FaqAccordion({ tag, title, items }: { tag: string; title: string; items: { q: keyof typeof t; a: keyof typeof t }[] }) {
  const { tr } = useLang();
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="mt-10">
      <div className="mb-5">
        <div className="tag-security inline-block mb-3">{tag}</div>
        <h2 className="font-montserrat font-extrabold text-2xl text-foreground">{title}</h2>
      </div>
      <div className="space-y-3">
        {items.map((f, i) => {
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
  );
}

export function LandingFaq() {
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

export function LandingWhyUs() {
  const { tr } = useLang();
  const cards = [
    { icon: "Globe2", title: "whyUs1Title" as const, desc: "whyUs1Desc" as const, accent: true },
    { icon: "LayoutGrid", title: "whyUs2Title" as const, desc: "whyUs2Desc" as const, accent: false },
    { icon: "Megaphone", title: "whyUs3Title" as const, desc: "whyUs3Desc" as const, accent: false },
    { icon: "Users", title: "whyUs4Title" as const, desc: "whyUs4Desc" as const, accent: false },
  ];
  return (
    <section className="max-w-7xl mx-auto px-4 py-16 md:py-20">
      <div className="text-center mb-12 max-w-2xl mx-auto">
        <div className="tag-security inline-block mb-3">{tr("whyUsTag")}</div>
        <h2 className="font-montserrat font-extrabold text-3xl md:text-4xl text-foreground mb-3">{tr("whyUsTitle")}</h2>
        <p className="text-muted-foreground text-base leading-relaxed">{tr("whyUsSubtitle")}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 stagger">
        {cards.map((c) => (
          <div key={c.title} className="group rounded-sm p-6 border border-border bg-card transition-all card-hover card-tilt">
            <div className="w-12 h-12 gold-gradient rounded flex items-center justify-center mb-5 glow-gold-sm">
              <Icon name={c.icon} fallback="ShieldCheck" size={22} className="icon-hover text-[hsl(220,20%,6%)]" />
            </div>
            <h3 className="font-montserrat font-bold text-base text-foreground mb-2">{tr(c.title)}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{tr(c.desc)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function LandingStats() {
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
          <div key={s.key} className="group text-center">
            <div className="w-11 h-11 gold-gradient rounded-full flex items-center justify-center mx-auto mb-3 glow-gold-sm">
              <Icon name={s.icon} fallback="Star" size={19} className="icon-hover text-[hsl(220,20%,6%)]" />
            </div>
            <div className="font-montserrat font-extrabold text-2xl md:text-3xl gold-text-gradient">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{tr(s.key)}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function LandingHowItWorks() {
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
          <div key={s.title} className="group relative border border-border rounded-sm bg-card p-6 card-hover card-tilt">
            <div className="absolute top-4 end-4 font-montserrat font-extrabold text-3xl text-gold/15">{i + 1}</div>
            <div className="w-12 h-12 gold-gradient rounded flex items-center justify-center mb-4 glow-gold-sm">
              <Icon name={s.icon} fallback="Check" size={21} className="icon-hover text-[hsl(220,20%,6%)]" />
            </div>
            <h3 className="font-montserrat font-bold text-base text-foreground mb-2">{tr(s.title)}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{tr(s.desc)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function LandingValue() {
  const { tr } = useLang();
  const cards = [
    { tag: "lpValClientTag" as const, title: "lpValClientTitle" as const, icon: "UserSearch", items: ["lpValClient1", "lpValClient2", "lpValClient3", "lpValClient4"] as const, accent: false },
    { tag: "lpValProTag" as const, title: "lpValProTitle" as const, icon: "Briefcase", items: ["lpValPro1", "lpValPro2", "lpValPro3", "lpValPro4"] as const, accent: true },
  ];
  return (
    <section className="border-y border-border bg-card/30">
      <div className="max-w-7xl mx-auto px-4 py-16 grid grid-cols-1 md:grid-cols-2 gap-6">
        {cards.map((c) => (
          <div key={c.title} className="group rounded-sm p-7 md:p-8 border border-border bg-card card-hover">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 gold-gradient rounded flex items-center justify-center shrink-0">
                <Icon name={c.icon} fallback="User" size={21} className="icon-hover text-[hsl(220,20%,6%)]" />
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

export function LandingServices() {
  const { lang, tr } = useLang();
  const { servicePrices } = useProviders();
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
              <div className="w-10 h-10 gold-gradient rounded flex items-center justify-center shrink-0">
                <Icon name={s.icon} fallback="ShieldCheck" size={18} className="icon-hover text-[hsl(220,20%,6%)]" />
              </div>
              <h3 className="font-montserrat font-bold text-sm text-foreground">{L(s.title, lang)}</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-2">{L(s.desc, lang)}</p>
            <div className="font-montserrat font-bold text-sm text-gold">{servicePrices[s.title.en] ? `${tr("priceFrom")} ${servicePrices[s.title.en]}` : L(s.price, lang)}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function LandingTestimonials() {
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

export function LandingFinalCta({ onCabinet }: { onCabinet: () => void }) {
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
            className="group cta-attention shine-on-hover gold-gradient text-[hsl(220,20%,6%)] px-10 py-4 font-montserrat font-extrabold text-base tracking-wide rounded-sm inline-flex items-center gap-2.5"
          >
            <Icon name="UserPlus" size={18} className="icon-hover" />
            {tr("lpCtaBtn")}
            <Icon name="ArrowRight" size={18} className="icon-hover" />
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
