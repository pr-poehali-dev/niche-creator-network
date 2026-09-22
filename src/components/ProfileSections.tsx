import { useState, useEffect, lazy } from "react";
import Icon from "@/components/ui/icon";
import func2url from "../../backend/func2url.json";
import { useLang } from "@/lib/i18n";
import { useProviders, isLicensed, type Provider } from "@/lib/providers";
import { AvailabilityNote, ContactButtons, VerificationBlock } from "@/components/ProviderCardParts";
import { L, resolveAvatar, DETECTIVE_IMAGE, type Section } from "@/lib/shared";
import { services } from "@/lib/servicesCatalog";
import { cases } from "@/lib/casesData";
import { StarRating } from "@/components/SharedControls";

// Профиль специалиста: карточка чужой анкеты (то, что видит клиент) и
// собственный профиль исполнителя в кабинете. Вынесено из Index.tsx:
// эти 400 строк нужны только тем, кто открыл конкретного специалиста
// или зашёл в свой кабинет, — большинству посетителей главной они
// никогда не понадобятся.
const ReviewsList = lazy(() => import("@/components/ReviewsAndReports").then((m) => ({ default: m.ReviewsList })));
const ReportModal = lazy(() => import("@/components/ReviewsAndReports").then((m) => ({ default: m.ReportModal })));

export function SpecialistProfileSection({ provider: p, onBack, openChat }: { provider: Provider; onBack: () => void; openChat: (t: { name: string; title: string; avatar?: string | null }) => void }) {
  const { lang, tr } = useLang();
  const tags = lang === "ru" ? p.tags.ru : p.tags.en;
  const licensed = isLicensed(p);
  const v = p.verification;
  const bio = v?.bio ? v.bio : "";
  const [reportOpen, setReportOpen] = useState(false);
  const licenseNo = v?.license || (Array.isArray(v?.licenses) && v?.licenses.length
    ? (typeof v.licenses[0] === "string" ? v.licenses[0] : v.licenses[0]?.number)
    : "");
  const hasDocs = !!v && ((Array.isArray(v.licenses) && v.licenses.length > 0) || (Array.isArray(v.documents) && v.documents.length > 0));

  // Считаем просмотр анкеты: специалист видит эти цифры в своём кабинете.
  // Один посетитель за сутки засчитывается один раз — накрутка исключена
  // на стороне сервера. Ошибку глушим: статистика не должна ломать страницу.
  useEffect(() => {
    if (!p.slug || p.isDemo) return;
    fetch(func2url["profile-stats"], {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: p.slug, source: "catalog" }),
    }).catch(() => { /* статистика необязательна */ });
  }, [p.slug, p.isDemo]);

  // Строка статуса проверки. Формулировка меняется вместе со значком:
  // раньше рядом с «крестиком» стояло «Личность подтверждена» — фраза
  // утверждала обратное тому, что показывал значок, и читатель терялся.
  const checkRow = (ok: boolean, labelOk: string, labelNo: string) => (
    <div className="flex items-center gap-2 text-sm">
      <Icon
        name={ok ? "CircleCheck" : "Circle"}
        size={16}
        className={ok ? "text-green-400 shrink-0" : "text-muted-foreground/40 shrink-0"}
      />
      <span className={ok ? "text-foreground" : "text-muted-foreground"}>{ok ? labelOk : labelNo}</span>
    </div>
  );

  // Пара «подпись — значение» для блока информации.
  const infoRow = (icon: string, label: string, value: string) => (
    <div className="flex items-center gap-3 py-2.5 border-b border-border last:border-0">
      <Icon name={icon} size={16} className="text-gold shrink-0" />
      <span className="text-xs text-muted-foreground w-28 shrink-0">{label}</span>
      <span className="text-sm text-foreground font-medium">{value}</span>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <div className="tag-security inline-block">{tr("profileSection")}</div>
        <div className="flex items-center gap-3">
          <button onClick={() => setReportOpen(true)} className="text-xs text-muted-foreground hover:text-destructive transition-colors font-montserrat flex items-center gap-1">
            <Icon name="Flag" size={13} />{tr("reportBtn")}
          </button>
          <button aria-label="Назад" onClick={onBack} className="text-xs text-muted-foreground hover:text-gold transition-colors font-montserrat flex items-center gap-1">
            <Icon name="ArrowLeft" size={13} />{tr("back")}
          </button>
        </div>
      </div>

      {reportOpen && <ReportModal targetType="provider" targetId={p.slug} onClose={() => setReportOpen(false)} />}

      {/* Шапка: одно фото среднего размера + основные данные */}
      <div className="border border-border rounded-sm bg-card p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="w-full sm:w-56 shrink-0">
            <div className="relative rounded-sm overflow-hidden border border-border aspect-[4/5] bg-secondary">
              <img src={resolveAvatar(p.img, p.gender)} alt={L(p.name, lang)} loading="lazy" className="w-full h-full object-cover" />
              {p.isPseudonym && (
                <div className="absolute top-2 start-2 flex items-center gap-1 bg-card/90 backdrop-blur-sm border border-border px-2 py-1 rounded-sm">
                  <Icon name="VenetianMask" size={11} className="text-muted-foreground" />
                  <span className="text-[10px] font-montserrat font-semibold text-muted-foreground">{tr("aliasBadge")}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h1 className="font-montserrat font-bold text-2xl text-foreground">{L(p.name, lang)}</h1>
              {p.verified && (
                <span className="flex items-center gap-1 bg-green-500/10 border border-green-500/40 px-2 py-0.5 rounded-sm">
                  <Icon name="BadgeCheck" size={13} className="text-green-400" />
                  <span className="text-[10px] font-montserrat font-semibold text-green-400">{tr("verifyDocsConfirmed")}</span>
                </span>
              )}
              {licensed && (
                <span className="badge-scan flex items-center gap-1 bg-gold/10 border border-gold/40 px-2 py-0.5 rounded-sm">
                  <Icon name="BadgeCheck" size={13} className="text-gold relative z-10" />
                  <span className="text-[10px] font-montserrat font-semibold text-gold relative z-10">{tr("licenseBadge")}</span>
                </span>
              )}
            </div>
            {/* Опыт не дублируем: он уже показан строкой ниже, рядом с городом
                и возрастом. Раньше «12 лет» стояло дважды на одном экране. */}
            <div className="text-gold text-sm font-montserrat font-medium mb-3">
              {L(p.title, lang) || tr("titleNotSet")}
            </div>
            {/* Рейтинг — только когда он на чём-то основан. У демо-анкеты
                честно говорим, что оценки условные. */}
            <div className="flex items-center gap-2 mb-4">
              {p.isDemo ? (
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Icon name="Info" size={13} className="text-gold/70" />
                  {tr("demoRatingNote")}
                </span>
              ) : p.reviews > 0 ? (
                <>
                  <StarRating rating={p.rating} />
                  <span className="text-xs text-muted-foreground">{p.rating} ({p.reviews} {tr("profileReviewsCount")})</span>
                </>
              ) : (
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Icon name="Sparkles" size={13} className="text-gold/60" />
                  {tr("noReviewsYet")}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-4">
              <span className="flex items-center gap-1"><Icon name="MapPin" size={13} className="text-gold" />{p.country ? `${L(p.country, lang)}, ` : ""}{L(p.city, lang)}</span>
              {p.age != null && <span className="flex items-center gap-1"><Icon name="User" size={13} className="text-gold" />{p.age} {tr("yearsOld")}</span>}
              <span className="flex items-center gap-1"><Icon name="Award" size={13} className="text-gold" />{p.experience} {tr("yearsShort")}</span>
            </div>
            <div className="border border-gold/30 rounded-sm bg-background px-4 py-3 inline-flex items-center gap-3">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{tr("cost")}</span>
              <span className="font-montserrat font-bold text-lg text-gold">{L(p.price, lang)}</span>
            </div>
          </div>
        </div>
        {p.isPseudonym && (
          <div className="mt-4 flex items-center gap-2 text-[11px] text-muted-foreground bg-secondary/50 border border-border rounded-sm px-3 py-2">
            <Icon name="Info" size={13} className="shrink-0" />{tr("profileAliasNote")}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* О специалисте */}
          {bio && (
            <div className="border border-border rounded-sm bg-card p-6">
              <h3 className="font-montserrat font-bold text-sm text-foreground mb-3 flex items-center gap-2"><Icon name="UserRound" size={15} className="text-gold" />{tr("profileAbout")}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{bio}</p>
            </div>
          )}

          {/* Информация */}
          <div className="border border-border rounded-sm bg-card p-6">
            <h3 className="font-montserrat font-bold text-sm text-foreground mb-3 flex items-center gap-2"><Icon name="IdCard" size={15} className="text-gold" />{tr("profileInfo")}</h3>
            <div>
              {p.country && infoRow("Globe", tr("profileCountry"), L(p.country, lang))}
              {infoRow("MapPin", tr("profileCity"), L(p.city, lang))}
              {p.age != null && infoRow("User", tr("profileAge"), `${p.age} ${tr("yearsOld")}`)}
              {infoRow("Award", tr("profileExperienceLabel"), `${p.experience} ${tr("yearsShort")}`)}
              {v?.legalStatus && infoRow("Building2", tr("profileLegalStatus"), v.legalStatus)}
              {licenseNo && infoRow("FileBadge", tr("profileLicenseNumber"), String(licenseNo))}
            </div>
          </div>

          {/* Специализация */}
          <div className="border border-border rounded-sm bg-card p-6">
            <h3 className="font-montserrat font-bold text-sm text-foreground mb-4 flex items-center gap-2"><Icon name="Tag" size={15} className="text-gold" />{tr("profileSpecialization")}</h3>
            <div className="flex flex-wrap gap-2">
              {tags.map((tg) => (<span key={tg} className="chip">{tg}</span>))}
            </div>
          </div>

          {/* Счётчики. Показываем только заполненные значения: блок из трёх
              нулей у новой анкеты выглядел как «специалист ничего не сделал».
              У демо-анкеты цифры условные, поэтому блок целиком скрыт. */}
          {!p.isDemo && (p.experience > 0 || p.cases > 0 || p.reviews > 0) && (
            <div className="grid grid-cols-3 gap-4">
              {[
                { n: p.experience, l: "yearsShort" as const, icon: "Award" },
                { n: p.cases, l: "profileCasesCount" as const, icon: "FolderCheck" },
                { n: p.reviews, l: "profileReviewsCount" as const, icon: "Star" },
              ]
                .filter((s) => s.n > 0)
                .map((s) => (
                  <div key={s.l} className="border border-border rounded-sm bg-card p-4 text-center">
                    <Icon name={s.icon} size={18} className="text-gold mx-auto mb-2" />
                    <div className="font-montserrat font-extrabold text-xl text-foreground">{s.n}</div>
                    <div className="text-[11px] text-muted-foreground">{tr(s.l)}</div>
                  </div>
                ))}
            </div>
          )}

          <div className="border border-border rounded-sm bg-card p-6">
            <h3 className="font-montserrat font-bold text-sm text-foreground mb-4 flex items-center gap-2"><Icon name="MessageSquareText" size={15} className="text-gold" />{tr("profileReviewsTitle")}</h3>
            <ReviewsList targetType="provider" targetId={p.slug} />
          </div>
        </div>

        <div className="space-y-5">
          {/* Проверка и верификация */}
          <div className="border border-border rounded-sm bg-card p-5">
            <h3 className="font-montserrat font-bold text-sm text-foreground mb-4 flex items-center gap-2"><Icon name="ShieldCheck" size={15} className="text-gold" />{tr("profileVerification")}</h3>
            <div className="space-y-2.5">
              {checkRow(!!p.verified, tr("profileVerifiedIdentity"), tr("profileIdentityPending"))}
              {checkRow(licensed, tr("profileLicenseChecked"), tr("profileLicensePending"))}
              {checkRow(hasDocs, tr("profileDocsConfirmed"), tr("profileDocsPending"))}
            </div>
          </div>

          {/* Контакты */}
          <div className="border border-gold/30 rounded-sm bg-card p-5 security-glow">
            <AvailabilityNote p={p} />
            <div className="mt-3">
              <ContactButtons p={p} onChat={() => openChat({ name: L(p.name, lang), title: L(p.title, lang), avatar: p.img })} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProfileSection({ setActive, openChat }: { setActive: (s: Section) => void; openChat: (t: { name: string; title: string; avatar?: string | null }) => void }) {
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
              <img src={DETECTIVE_IMAGE} alt="Профиль" loading="lazy" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
            </div>
            <div className="p-5 -mt-8 relative">
              <div className="w-16 h-16 rounded-sm border-2 border-gold overflow-hidden mb-3">
                <img src={DETECTIVE_IMAGE} alt="Аватар" loading="lazy" className="w-full h-full object-cover" />
              </div>
              <div className="flex items-center gap-2 mb-1">
                {/* Имя и данные берём из анкеты самого специалиста. Раньше
                    здесь стояло имя выдуманного «Александра Морозова» с его
                    рейтингом и «312 кейсами» — человек открывал свой профиль
                    и видел чужую карточку с накрученными цифрами. */}
                <div className="font-montserrat font-bold text-lg text-foreground">{provider ? L(provider.name, lang) : tr("profileNoData")}</div>
                {provider && isLicensed(provider) && (
                  <span className="flex items-center gap-1 bg-gold/10 border border-gold/40 px-2 py-0.5 rounded-sm" title={tr("licenseBadge")}>
                    <Icon name="BadgeCheck" size={13} className="text-gold" />
                    <span className="text-[10px] font-montserrat font-semibold text-gold">{tr("licenseBadge")}</span>
                  </span>
                )}
              </div>
              <div className="text-gold text-xs font-montserrat font-medium mb-1">{provider ? L(provider.title, lang) : ""}</div>
              <div className="text-xs text-muted-foreground mb-4">{provider ? L(provider.city, lang) : ""}</div>
              {/* Рейтинг и счётчики показываем только когда за ними стоят
                  реальные сделки. Пока отзывов нет — честная подпись вместо
                  нарисованных «4.9» и «98% успеха». */}
              {provider && provider.reviews > 0 ? (
                <div className="flex items-center gap-2 mb-4">
                  <StarRating rating={provider.rating} />
                  <span className="text-xs text-muted-foreground">{provider.rating} ({provider.reviews})</span>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground mb-4">{tr("profileNoReviews")}</div>
              )}
              <div className="divider-gold mb-4" />
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-montserrat font-semibold mb-2">{tr("contactTitle")}</div>
              {provider && <AvailabilityNote p={provider} />}
              {provider && <ContactButtons p={provider} onChat={() => openChat({ name: L(provider.name, lang), title: L(provider.title, lang), avatar: provider.img })} />}
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
                    <div key={c.title.en} className="p-4 border border-border rounded-sm card-lift cursor-pointer">
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
                  {(() => {
                    const sel = provider?.verification?.services;
                    if (Array.isArray(sel) && sel.length) {
                      return sel
                        .map((it) => ({ s: services.find((x) => x.title.en === it.key), price: it.price || "" }))
                        .filter((x): x is { s: typeof services[number]; price: string } => !!x.s);
                    }
                    return services.slice(0, 3).map((s) => ({ s, price: "" }));
                  })().map(({ s, price }) => (
                    <div key={s.title.en} className="flex items-center gap-4 p-4 border border-border rounded-sm card-lift cursor-pointer">
                      <div className="w-9 h-9 gold-gradient rounded flex items-center justify-center shrink-0">
                        <Icon name={s.icon} size={15} className="text-[hsl(28,20%,7%)]" />
                      </div>
                      <div className="flex-1">
                        <div className="font-montserrat font-semibold text-sm text-foreground">{L(s.title, lang)}</div>
                        <div className="text-xs text-muted-foreground">{L(s.desc, lang).slice(0, 60)}...</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-montserrat font-bold text-gold">{price ? `${tr("priceFrom")} ${price}` : L(s.price, lang)}</div>
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
