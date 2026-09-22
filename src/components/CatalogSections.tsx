// Каталог: услуги, поиск специалистов, список исполнителей, кейсы, курсы
// и охранные предприятия. Вынесено из Index.tsx — монолит на 3000 строк
// целиком попадал в главный бандл при любом маршруте, поэтому человек,
// открывший политику конфиденциальности, скачивал и весь каталог тоже.
// Теперь этот код приходит только тем, кто действительно зашёл в каталог.
import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { useLang } from "@/lib/i18n";
import { useProviders, isLicensed, isPremium, type Provider } from "@/lib/providers";
import { L, resolveAvatar, type Section } from "@/lib/shared";
import { services, serviceCategories } from "@/lib/servicesCatalog";
import { lifeTasks, matchLifeTasks } from "@/lib/lifeTasks";
import LocationAutocomplete, { type LocationSuggestion } from "@/components/LocationAutocomplete";
import { StarRating } from "@/components/SharedControls";
import { applySeo, catSeo } from "@/lib/seoMeta";
import { cases } from "@/lib/casesData";
import { useFavorites, useTilt3D } from "@/hooks/useAppHooks";

const guardServices = [
  { icon: "Building2", title: { ru: "Охрана объектов", en: "Site security" }, desc: { ru: "Круглосуточная физическая охрана офисов, складов, ТЦ и промышленных объектов", en: "24/7 physical security for offices, warehouses, malls and industrial sites" } },
  { icon: "UserCog", title: { ru: "Личная охрана", en: "Close protection" }, desc: { ru: "Профессиональные телохранители и VIP-сопровождение для руководителей и публичных персон", en: "Professional bodyguards and VIP escort for executives and public figures" } },
  { icon: "Radio", title: { ru: "Пультовая охрана", en: "Alarm monitoring" }, desc: { ru: "Мониторинг сигнализации с выездом групп быстрого реагирования", en: "Alarm monitoring with rapid response team dispatch" } },
  { icon: "Video", title: { ru: "Видеонаблюдение", en: "Video surveillance" }, desc: { ru: "Проектирование, монтаж и обслуживание систем видеонаблюдения и контроля доступа", en: "Design, installation and maintenance of CCTV and access control systems" } },
];


export function CasesSection() {
  const { lang, tr } = useLang();
  const [filter, setFilter] = useState("All");
  const cats = [
    { ru: "Все", en: "All" },
    { ru: "Полиграф", en: "Polygraph" },
    { ru: "TSCM", en: "TSCM" },
    { ru: "Детективная деятельность", en: "Investigation" },
    { ru: "Корпоративная безопасность", en: "Corporate security" },
  ];

  // Раньше здесь висели три «кейса» от несуществующих людей — с фамилиями,
  // просмотрами, лайками и рейтингом авторов («312 кейсов»). При 17
  // зарегистрированных пользователях и пустой таблице отзывов это заметная
  // подделка, а на платформе, которая продаёт доверие, подделка стоит
  // дороже, чем пустой раздел. Настоящих кейсов пока нет: показываем
  // разборы типовых задач без вымышленных авторов и накрученных счётчиков.
  const visible = filter === "All" ? cases : cases.filter((c) => c.category.en === filter);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-6">
        <div className="tag-security mb-3 inline-block">{tr("knowledgeBase")}</div>
        <h2 className="font-montserrat font-bold text-3xl text-foreground mb-2">{tr("proCases")}</h2>
        <p className="text-sm text-muted-foreground max-w-2xl">{tr("casesIntro")}</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {cats.map((c) => (
          <button key={c.en} onClick={() => setFilter(c.en)}
            className={`px-4 py-2 text-xs font-montserrat font-semibold rounded-sm border transition-all ${filter === c.en ? "border-gold bg-gold/10 text-gold" : "border-border text-muted-foreground hover:border-gold/40"}`}>
            {L(c, lang)}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {visible.map((c) => (
          <div key={c.title.en} className="border border-border rounded-sm bg-card p-5 md:p-6">
            <div className="flex items-start gap-3 mb-3">
              <span className="chip">{L(c.category, lang)}</span>
            </div>
            <h3 className="font-montserrat font-bold text-base text-foreground mb-2 leading-snug">{L(c.title, lang)}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{L(c.summary, lang)}</p>
          </div>
        ))}
      </div>

      {/* Честная рамка: объясняем, почему здесь пока нет имён и цифр. */}
      <div className="border border-gold/30 rounded-sm glass-card p-6 mt-8">
        <div className="flex items-start gap-3">
          <Icon name="Info" size={18} className="text-gold shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground leading-relaxed">{tr("casesNote")}</p>
        </div>
      </div>
    </div>
  );
}

export function ProviderResultCard({ p, onOpen }: { p: Provider; onOpen: () => void }) {
  const { lang, tr } = useLang();
  const { isFavorite, toggleFavorite } = useFavorites();
  const fav = isFavorite(p.slug);
  const tags = lang === "ru" ? p.tags.ru : p.tags.en;
  const premium = isPremium(p);
  const tiltRef = useTilt3D<HTMLDivElement>();
  return (
    <div
      ref={tiltRef}
      onClick={onOpen}
      className={`card-lift shine-on-hover rounded-sm overflow-hidden cursor-pointer group flex flex-col relative ${premium ? "border-2 border-gold security-glow ambient-gold bg-card" : "border border-border bg-card"}`}
    >
      {premium && (
        <div className="absolute top-0 inset-x-0 z-20 gold-gradient text-[hsl(28,20%,7%)] text-[10px] font-montserrat font-extrabold tracking-widest uppercase text-center py-1 flex items-center justify-center gap-1">
          <Icon name="Crown" size={11} />{tr("premiumBadge")}
        </div>
      )}
      <button
        onClick={(e) => { e.stopPropagation(); toggleFavorite(p.slug); }}
        aria-label={tr(fav ? "favRemove" : "favAdd")}
        className={`absolute z-20 end-3 ${premium ? "top-9" : "top-3"} w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm border transition-colors ${fav ? "bg-gold/90 border-gold text-[hsl(28,20%,7%)]" : "bg-card/80 border-border text-muted-foreground hover:text-gold hover:border-gold"}`}
      >
        <Icon name="Heart" size={15} className={fav ? "fill-current" : ""} />
      </button>
      <div className={`h-48 overflow-hidden relative ${premium ? "mt-6" : ""}`}>
        <img src={resolveAvatar(p.img, p.gender)} alt={L(p.name, lang)} loading="lazy" decoding="async" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
        {p.isPseudonym && (
          <div className="absolute top-3 start-3 flex items-center gap-1 bg-card/90 backdrop-blur-sm border border-border px-2 py-1 rounded-sm">
            <Icon name="VenetianMask" size={11} className="text-muted-foreground" />
            <span className="text-[10px] font-montserrat font-semibold text-muted-foreground">{tr("aliasBadge")}</span>
          </div>
        )}
        {/* Пометка образца намеренно заметная: рядом показан рейтинг «4.9 (134)»,
            которого в базе отзывов не существует. Тихая серая плашка терялась
            среди золотых звёзд, и карточка читалась как реальный специалист. */}
        {p.isDemo && (
          <div className="absolute top-3 start-3 z-20 flex items-center gap-1.5 bg-background/95 backdrop-blur-sm border border-gold/50 px-2.5 py-1 rounded-full">
            <Icon name="Info" size={11} className="text-gold" />
            <span className="text-[10px] font-montserrat font-bold text-gold uppercase tracking-wider">{tr("demoBadge")}</span>
          </div>
        )}
        {isLicensed(p) && (
          <div className="badge-scan absolute top-3 end-3 flex items-center gap-1 bg-card/90 backdrop-blur-sm border border-gold/40 px-2 py-1 rounded-sm">
            <Icon name="BadgeCheck" size={12} className="text-gold relative z-10" />
            <span className="text-[10px] font-montserrat font-semibold text-gold relative z-10">{tr("licenseBadge")}</span>
          </div>
        )}
        <div className="absolute bottom-3 start-4 end-4">
          <div className="font-montserrat font-bold text-base text-foreground">{L(p.name, lang)}</div>
          {/* «· 0 лет» у новой анкеты выглядело как отсутствие опыта вообще.
              Пока специалист не заполнил профиль — просто не показываем. */}
          <div className="text-xs text-gold font-montserrat font-medium flex items-center gap-2 flex-wrap">
            {L(p.title, lang) || tr("titleNotSet")}
            {p.experience > 0 && (
              <span className="text-muted-foreground">· {p.experience} {tr("yearsShort")}</span>
            )}
          </div>
        </div>
      </div>
      <div className="p-5 flex flex-col flex-1">
        {/* Рейтинг показываем ТОЛЬКО при наличии реальных отзывов.
            Раньше пустая анкета выглядела как «5 звёзд (0)» — пять золотых
            звёзд у специалиста, которого никто не оценивал, вводят в
            заблуждение и обесценивают оценки тех, у кого отзывы настоящие. */}
        <div className="flex items-center gap-3 mb-4 min-h-[20px]">
          {p.isDemo ? (
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Icon name="Info" size={12} className="text-gold/70" />
              {tr("demoRatingNote")}
            </span>
          ) : p.reviews > 0 ? (
            <>
              <StarRating rating={p.rating} />
              <span className="text-xs text-muted-foreground">{p.rating} ({p.reviews})</span>
            </>
          ) : (
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Icon name="Sparkles" size={12} className="text-gold/60" />
              {tr("noReviewsYet")}
            </span>
          )}
          {(p.city?.ru || p.city?.en) && (
            <span className="text-xs text-muted-foreground ms-auto flex items-center gap-1">
              <Icon name="MapPin" size={11} />{L(p.city, lang)}
            </span>
          )}
        </div>
        {p.country && (p.country.ru || p.country.en) && (
          <div className="text-[11px] text-muted-foreground mb-3 flex items-center gap-1"><Icon name="Globe" size={11} className="text-gold" />{L(p.country, lang)}</div>
        )}
        {/* Главный довод площадки — проверка документов. Раньше он был виден
            только внутри профиля: в каталоге все карточки выглядели одинаково,
            и клиент не понимал, чем проверенный специалист отличается от
            только что зарегистрированного. */}
        {!p.isDemo && (p.verified || p.licenseVerified) && (
          <div className="flex items-center gap-1.5 mb-3 text-[11px] text-green-400">
            <Icon name="ShieldCheck" size={12} className="shrink-0" />
            <span className="font-montserrat font-semibold">
              {tr(p.licenseVerified ? "cardLicenseChecked" : "cardDocsChecked")}
            </span>
          </div>
        )}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {tags.slice(0, 4).map((tg) => (<span key={tg} className="chip">{tg}</span>))}
        </div>
        <div className="divider-gold mb-4" />
        <div className="flex items-center justify-between mt-auto gap-3">
          <div className="min-w-0">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{tr("cost")}</div>
            <div className="font-montserrat font-bold text-sm text-gold truncate">
              {L(p.price, lang) || tr("priceOnRequest")}
            </div>
          </div>
          <span className="text-xs font-montserrat font-semibold text-gold flex items-center gap-1 group-hover:gap-2 transition-all">{tr("openProfile")}<Icon name="ArrowRight" size={13} /></span>
        </div>
      </div>
    </div>
  );
}

export function SearchSection({ setActive, initialCategory = "", initialService = "", openSpecialist }: { setActive: (s: Section) => void; initialCategory?: string; initialService?: string; openSpecialist?: (p: Provider) => void }) {
  const { lang, tr } = useLang();
  const { providers, failed } = useProviders();
  // Название услуги приходит на английском (так устроен каталог), а искать
  // надо на языке интерфейса — иначе русскому человеку ничего не найдётся.
  const localizeService = (titleEn: string) => {
    if (!titleEn) return "";
    const svc = services.find((x) => x.title.en === titleEn);
    return svc ? L(svc.title, lang) : titleEn;
  };
  const [query, setQuery] = useState(() => localizeService(initialService));
  const [category, setCategory] = useState(initialCategory);
  const [licensedOnly, setLicensedOnly] = useState(false);
  const [cityInput, setCityInput] = useState("");
  const [countryInput, setCountryInput] = useState("");
  // Запоминаем выбранную подсказку города, чтобы знать её страну для fallback-поиска
  // «в этом городе никого нет — покажем специалистов по всей стране».
  const [citySuggestion, setCitySuggestion] = useState<LocationSuggestion | null>(null);

  const matchesText = (p: Provider, q: string) => {
    if (!q.trim()) return true;
    const tags = (lang === "ru" ? p.tags.ru : p.tags.en).map((t) => t.toLowerCase());
    const title = L(p.title, lang).toLowerCase();
    const name = L(p.name, lang).toLowerCase();
    const cityName = L(p.city, lang).toLowerCase();
    const ql = q.toLowerCase();
    return title.includes(ql) || name.includes(ql) || cityName.includes(ql) || tags.some((t) => t.includes(ql) || ql.includes(t));
  };

  const matchesCategory = (p: Provider) => {
    if (!category) return true;
    const catServices = services.filter((s) => s.cat === category);
    return catServices.some((s) => matchesText(p, L(s.title, lang)));
  };

  const baseFilter = (p: Provider) => {
    if (!p.active) return false;
    if (licensedOnly && !isLicensed(p)) return false;
    if (!matchesCategory(p)) return false;
    if (!matchesText(p, query)) return false;
    return true;
  };

  const city = cityInput.trim().toLowerCase();
  const country = countryInput.trim().toLowerCase();

  // Строгие результаты — с учётом города и страны, как ввёл клиент.
  const strictResults = providers
    .filter((p) => {
      if (!baseFilter(p)) return false;
      if (city && !L(p.city, lang).toLowerCase().includes(city)) return false;
      if (country && !L(p.country || { ru: "", en: "" }, lang).toLowerCase().includes(country)) return false;
      return true;
    })
    .sort((a, b) => b.rating - a.rating);

  // Fallback: если в выбранном городе никого нет, но известна страна
  // (из явного поля «Страна» или из подсказки выбранного города) —
  // показываем проверенных специалистов по всей стране.
  const fallbackCountry = country || (citySuggestion?.country || "").toLowerCase();
  const showFallback = city && strictResults.length === 0 && !!fallbackCountry;
  const fallbackResults = showFallback
    ? providers
        .filter((p) => {
          if (!baseFilter(p)) return false;
          const pCountry = L(p.country || { ru: "", en: "" }, lang).toLowerCase();
          if (!pCountry) return false;
          return pCountry.includes(fallbackCountry) || fallbackCountry.includes(pCountry);
        })
        .sort((a, b) => b.rating - a.rating)
    : [];

  const results = showFallback ? fallbackResults : strictResults;

  const hasFilters = !!(query.trim() || category || licensedOnly || cityInput.trim() || countryInput.trim());
  const reset = () => { setQuery(""); setCategory(""); setLicensedOnly(false); setCityInput(""); setCountryInput(""); setCitySuggestion(null); };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="mb-6">
        <div className="tag-security mb-3 inline-block">{tr("searchTag")}</div>
        <h2 className="font-montserrat font-bold text-3xl text-foreground mb-2">{tr("searchTitle")}</h2>
        <p className="text-muted-foreground text-sm">{tr("searchSubtitle")}</p>
      </div>

      {/* Город и страна — клиент вводит вручную, с подсказками городов, областей/штатов и стран. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <LocationAutocomplete
          value={cityInput}
          onChange={(v) => { setCityInput(v); setCitySuggestion(null); }}
          onSelect={(s) => { setCityInput(s.name); setCitySuggestion(s); }}
          placeholder={tr("searchCityPh")}
          icon="MapPin"
          lang={lang}
          field="city"
        />
        <LocationAutocomplete
          value={countryInput}
          onChange={setCountryInput}
          onSelect={(s) => setCountryInput(s.name)}
          placeholder={tr("searchCountryPh")}
          icon="Globe"
          lang={lang}
          field="country"
        />
      </div>

      {showFallback && (
        <div className="flex items-start gap-2 mb-4 border border-gold/30 bg-gold/5 rounded-sm px-3 py-2.5 text-xs text-muted-foreground">
          <Icon name="Info" size={14} className="text-gold shrink-0 mt-0.5" />
          <span>{tr("searchFallbackCountry")}</span>
        </div>
      )}

      <div className="flex items-center gap-3 border-2 border-border focus-within:border-gold bg-card rounded-sm px-4 mb-5 transition-colors">
        <Icon name="Search" size={20} className="text-gold shrink-0" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={tr("searchSimplePh")}
          className="flex-1 bg-transparent py-4 text-base text-foreground placeholder:text-muted-foreground outline-none"
        />
        {query && <button onClick={() => setQuery("")} aria-label={tr("clearSearch")} className="text-muted-foreground hover:text-foreground shrink-0"><Icon name="X" size={18} /></button>}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={() => setCategory("")} className={`px-4 py-2 text-xs font-montserrat font-semibold rounded-sm border transition-colors flex items-center gap-1.5 ${category === "" ? "gold-gradient text-[hsl(28,20%,7%)] border-transparent" : "border-gold/50 text-gold hover:bg-gold/10"}`}>
            {tr("searchAnyCategory")}
        </button>
        {serviceCategories.map((c) => (
          <button key={c.id} onClick={() => setCategory(c.id === category ? "" : c.id)} className={`px-4 py-2 text-xs font-montserrat font-semibold rounded-sm border transition-colors flex items-center gap-1.5 ${category === c.id ? "gold-gradient text-[hsl(28,20%,7%)] border-transparent" : "border-border text-muted-foreground hover:text-gold hover:border-gold/50"}`}>
            <Icon name={c.icon} fallback="Shield" size={13} />{L(c.title, lang)}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <button
          onClick={() => setLicensedOnly((v) => !v)}
          className={`flex items-center gap-2 rounded-sm px-3 py-2 text-xs font-montserrat font-semibold border transition-all ${licensedOnly ? "bg-gold/15 border-gold/50 text-gold" : "border-border bg-card text-muted-foreground hover:border-gold hover:text-gold"}`}
        >
          <Icon name={licensedOnly ? "BadgeCheck" : "Badge"} size={14} />
          {tr("searchFLicensed")}
        </button>
        {hasFilters && (
          <button aria-label="Закрыть" onClick={reset} className="text-xs font-montserrat font-semibold text-muted-foreground hover:text-gold flex items-center gap-1.5"><Icon name="X" size={13} />{tr("searchReset")}</button>
        )}
        <span className="text-xs text-muted-foreground ms-auto">{tr("searchFound")}: <span className="text-gold font-bold">{results.length}</span></span>
      </div>

      {failed ? (
        /* Каталог не загрузился — честно объясняем причину и даём действие.
           Пустой экран человек читает как «здесь никого нет». */
        <div className="border border-dashed border-gold/40 rounded-sm bg-card/50 py-16 flex flex-col items-center gap-3 text-center px-6">
          <Icon name="CloudOff" size={40} className="text-gold/50" />
          <span className="text-sm text-foreground font-montserrat font-semibold">{tr("loadFailedTitle")}</span>
          <span className="text-xs text-muted-foreground max-w-md">{tr("loadFailedText")}</span>
          <button onClick={() => window.location.reload()} className="mt-1 text-xs font-montserrat font-semibold text-gold hover:underline">
            {tr("loadFailedRetry")}
          </button>
        </div>
      ) : results.length === 0 ? (
        /* Пустой результат был тупиком: «ничего не найдено» — и всё.
           Каталог молодой, совпадений часто нет, и человек просто уходил.
           Теперь предлагаем конкретный следующий шаг: снять фильтры или
           оставить задачу, чтобы специалисты откликнулись сами. */
        <div className="border border-dashed border-border rounded-sm bg-card/50 p-8 md:p-10 flex flex-col items-center gap-4 text-center">
          <Icon name="SearchX" size={36} className="text-muted-foreground/30" />
          <div>
            <div className="font-montserrat font-bold text-base text-foreground mb-1.5">{tr("filterNoResults")}</div>
            <p className="text-sm text-muted-foreground max-w-md leading-relaxed">{tr("noResultsHint")}</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-2.5 mt-1">
            {hasFilters && (
              <button onClick={reset} className="border border-border text-foreground px-5 py-2.5 text-xs font-montserrat font-semibold rounded-sm hover:border-gold hover:text-gold transition-all">
                {tr("searchReset")}
              </button>
            )}
            <button
              onClick={() => window.dispatchEvent(new CustomEvent("shchit:new-request"))}
              className="gold-gradient text-[hsl(28,20%,7%)] px-5 py-2.5 text-xs font-montserrat font-bold rounded-sm inline-flex items-center gap-2"
            >
              <Icon name="Send" size={14} />{tr("noResultsCta")}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger">
          {results.map((p) => (
            <ProviderResultCard key={p.slug} p={p} onOpen={() => (openSpecialist ? openSpecialist(p) : setActive("profile"))} />
          ))}
        </div>
      )}
    </div>
  );
}

export function SpecialistsListSection({ setActive, openSpecialist }: { setActive: (s: Section) => void; openSpecialist?: (p: Provider) => void }) {
  const { tr } = useLang();
  const { providers } = useProviders();
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  // Порядок: сначала заполненные анкеты, потом образцы, в самом конце —
  // пустые профили. Незаполненная карточка («Специализация не указана»,
  // цена «по запросу») не помогает выбрать и отпугивает сильнее, чем
  // честно помеченный образец, поэтому наверх её пускать нельзя.
  const isFilled = (p: Provider) => Boolean(L(p.title, "ru")?.trim());
  const rank = (p: Provider) => (isFilled(p) && !p.isDemo ? 0 : p.isDemo ? 1 : 2);
  const list = providers
    .filter((p) => p.active)
    .filter((p) => !verifiedOnly || isLicensed(p))
    .slice()
    .sort((a, b) => rank(a) - rank(b));

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="mb-6">
        <div className="tag-security mb-3 inline-block">{tr("specialists")}</div>
        <h2 className="font-montserrat font-bold text-3xl text-foreground mb-2">{tr("allSpecialistsTitle")}</h2>
        <p className="text-muted-foreground text-sm">{tr("allSpecialistsSub")}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <button
          onClick={() => setVerifiedOnly((v) => !v)}
          className={`flex items-center gap-2 text-xs font-montserrat font-semibold rounded-sm px-3 py-2 border transition-all ${verifiedOnly ? "bg-green-500/15 border-green-500/40 text-green-400" : "bg-card border-border text-muted-foreground hover:border-gold hover:text-foreground"}`}
        >
          <Icon name={verifiedOnly ? "ShieldCheck" : "Shield"} size={14} />
          {tr("filterVerifiedOnly")}
        </button>
        <button
          onClick={() => setActive("services")}
          className="flex items-center gap-2 text-xs font-montserrat font-semibold rounded-sm px-3 py-2 border border-border bg-card text-muted-foreground hover:border-gold hover:text-gold transition-all"
        >
          <Icon name="Search" size={14} />
          {tr("heroClientCta1")}
        </button>
        {/* Считаем реальные анкеты отдельно от образцов. «Найдено: 19» при
            четырёх живых специалистах вводило в заблуждение: человек ждал
            выбора из девятнадцати, а находил четверых и пятнадцать примеров. */}
        {/* Счётчик показываем, только когда есть что считать: «Найдено: 0»
            рядом с пояснением дублирует мысль и выглядит как ошибка. */}
        {list.filter((p) => !p.isDemo && isFilled(p)).length > 0 && (
          <span className="text-xs text-muted-foreground ms-auto">
            {tr("searchFound")}: <span className="text-gold font-bold">{list.filter((p) => !p.isDemo && isFilled(p)).length}</span>
            {list.some((p) => p.isDemo) && (
              <span className="text-muted-foreground"> · {list.filter((p) => p.isDemo).length} {tr("demoSamples")}</span>
            )}
          </span>
        )}
      </div>

      {/* Пока нет ни одной заполненной анкеты — честно объясняем, что
          человек видит примеры, и предлагаем оставить задачу. Голый
          счётчик «0» без объяснения выглядит как сломанный сайт. */}
      {list.filter((p) => !p.isDemo && isFilled(p)).length === 0 && list.length > 0 && (
        <div className="border border-gold/30 rounded-sm glass-card p-5 mb-6">
          <div className="flex items-start gap-3">
            <Icon name="Info" size={18} className="text-gold shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">{tr("catalogEarlyNote")}</p>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent("shchit:new-request"))}
                className="gold-gradient text-[hsl(28,20%,7%)] px-4 py-2.5 text-xs font-montserrat font-bold rounded-sm inline-flex items-center gap-2"
              >
                <Icon name="Send" size={14} />{tr("noResultsCta")}
              </button>
            </div>
          </div>
        </div>
      )}

      {list.length === 0 ? (
        <div className="border border-dashed border-border rounded-sm bg-card/50 py-16 flex flex-col items-center gap-3 text-center">
          <Icon name="SearchX" size={40} className="text-muted-foreground/30" />
          <span className="text-sm text-muted-foreground">{tr("filterNoResults")}</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger">
          {list.map((p) => (
            <ProviderResultCard key={p.slug} p={p} onOpen={() => (openSpecialist ? openSpecialist(p) : setActive("profile"))} />
          ))}
        </div>
      )}
    </div>
  );
}

export function ClientServices({ setActive, openSpecialist }: { setActive: (s: Section) => void; openSpecialist?: (p: Provider) => void }) {
  const [mode, setMode] = useState<"catalog" | "search">("catalog");
  const [prefillCat, setPrefillCat] = useState("");
  const [prefillService, setPrefillService] = useState("");
  const { tr } = useLang();

  if (mode === "search") {
    return (
      <div>
        <div className="max-w-7xl mx-auto px-4 pt-6">
          <button
            onClick={() => setMode("catalog")}
            className="inline-flex items-center gap-1.5 text-xs font-montserrat font-semibold text-muted-foreground hover:text-gold transition-colors"
          >
            <Icon name="ArrowLeft" size={14} />{tr("catBackToCatalog")}
          </button>
        </div>
        <SearchSection setActive={setActive} initialCategory={prefillCat} initialService={prefillService} openSpecialist={openSpecialist} />
      </div>
    );
  }

  return (
    <ServicesSection
      onOrder={(catId, serviceTitleEn) => {
        setPrefillCat(catId);
        // Название услуги раньше терялось: человек выбирал «Найти человека»,
        // а попадал в раздел из девяти специальностей и искал заново.
        // Теперь запрос уходит в поиск вместе с задачей.
        setPrefillService(serviceTitleEn || "");
        setMode("search");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }}
    />
  );
}

export function ServicesSection({ onOrder }: { onOrder?: (categoryId: string, serviceTitleEn?: string) => void } = {}) {
  const { lang, tr } = useLang();
  const { servicePrices } = useProviders();
  const [query, setQuery] = useState("");
  // Категорию можно открыть прямой ссылкой (?section=services&cat=physical).
  // Без этого все четыре направления жили по одному адресу: и человек по
  // ссылке из поиска попадал в общий каталог и искал нужное заново, и
  // поисковик видел одну страницу вместо четырёх.
  const [openCat, setOpenCat] = useState(() => {
    if (typeof window === "undefined") return "";
    const c = new URLSearchParams(window.location.search).get("cat") || "";
    return serviceCategories.some((x) => x.id === c) ? c : "";
  });
  const [openService, setOpenService] = useState<string | null>(null);
  const priceFor = (s: { title: { en: string }; price: { ru: string; en: string } }) =>
    servicePrices[s.title.en] ? `${tr("priceFrom")} ${servicePrices[s.title.en]}` : L(s.price, lang);

  const q = query.trim().toLowerCase();
  const filtered = services.filter((s) => {
    if (q && !L(s.title, lang).toLowerCase().includes(q) && !L(s.desc, lang).toLowerCase().includes(q)) return false;
    return true;
  });

  // Без запроса показываем частые задачи, с запросом — подходящие под него.
  // Так человек либо узнаёт свою ситуацию в списке, либо находит её словами.
  const matchedTasks = q
    ? matchLifeTasks(q, lang === "en" ? "en" : "ru")
    : (onOrder ? lifeTasks : []);
  const shownCats = serviceCategories.filter((c) => filtered.some((s) => s.cat === c.id));

  // При поиске текстом сразу разворачиваем категории, где есть совпадения.
  const catIsOpen = (catId: string) => (q ? filtered.some((s) => s.cat === catId) : openCat === catId);
  // Человек, пришедший по ссылке на категорию, должен сразу увидеть её, а
  // не начало каталога. Прокручиваем после отрисовки списка.
  useEffect(() => {
    if (!openCat) return;
    const el = document.getElementById(`cat-${openCat}`);
    if (el) el.scrollIntoView({ block: "start", behavior: "smooth" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleCat = (catId: string) => {
    const next = openCat === catId ? "" : catId;
    setOpenCat(next);
    setOpenService(null);
    // Адрес в строке браузера держим в соответствии с открытой категорией:
    // ссылку можно скопировать и отправить, а поисковик видит отдельную
    // страницу. Обновление адреса вынесено из функции пересчёта состояния —
    // React может вызывать её повторно, и тогда история ломается.
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      if (next) p.set("cat", next); else p.delete("cat");
      const q = p.toString();
      window.history.replaceState(null, "", q ? `/?${q}` : "/");
      applySeo("services", next ? catSeo(next) : undefined);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8">
        <div className="tag-security mb-3 inline-block">{tr("catalog")}</div>
        <h2 className="font-montserrat font-bold text-3xl text-foreground mb-2">{tr("servicesTitle")}</h2>
        <p className="text-muted-foreground text-sm">{tr("servicesDesc")}</p>
      </div>

      <div className="flex gap-3 mb-6">
        <div className="flex-1 flex items-center gap-3 border border-border bg-card rounded-sm px-4">
          <Icon name="Search" size={16} className="text-muted-foreground" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={tr("searchServicesPlain")} className="flex-1 bg-transparent py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none" />
          {query && <button onClick={() => setQuery("")} aria-label={tr("clearSearch")} className="text-muted-foreground hover:text-foreground"><Icon name="X" size={15} /></button>}
        </div>
      </div>

      {/* Поиск по задачам, а не по названиям профессий. Человек приходит с
          бедой — «пропал родственник», «взломали почту» — и не обязан знать,
          что ему нужен «OSINT-аналитик» или «полиграфолог». Отраслевой
          каталог остаётся ниже для тех, кто знает, что ищет. */}
      {matchedTasks.length > 0 && (
        <div className="mb-8">
          <div className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest mb-3">
            {query ? tr("ltFound") : tr("ltTitle")}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {matchedTasks.map((t) => (
              <button
                key={t.id}
                onClick={() => onOrder?.(t.cat, t.services[0])}
                className="flex items-start gap-3 border border-border rounded-sm bg-card p-3.5 text-start hover:border-gold/50 hover:bg-secondary/30 transition-all card-lift"
              >
                <div className="w-9 h-9 rounded-sm bg-secondary flex items-center justify-center shrink-0">
                  <Icon name={t.icon} fallback="Search" size={17} className="text-gold" />
                </div>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-montserrat font-bold text-foreground">{L(t.title, lang)}</span>
                  <span className="block text-[11px] text-muted-foreground leading-snug mt-0.5">{L(t.hint, lang)}</span>
                </span>
                <Icon name="ArrowRight" size={14} className="text-muted-foreground shrink-0 mt-1" />
              </button>
            ))}
          </div>
          {!query && (
            <div className="text-[11px] text-muted-foreground mt-3 flex items-center gap-1.5">
              <Icon name="Info" size={12} className="text-gold shrink-0" />
              {tr("ltOrBrowse")}
            </div>
          )}
        </div>
      )}

      {/* «Ничего не найдено» показываем, только если не подошла ни одна
          житейская задача. Иначе по запросу «прослушка» человек видел бы
          и подходящую карточку, и надпись, что ничего не найдено. */}
      {shownCats.length === 0 && matchedTasks.length === 0 && (
        <div className="border border-dashed border-border rounded-sm py-14 px-6 text-center">
          <Icon name="SearchX" size={34} className="text-muted-foreground/30 mx-auto mb-3" />
          <div className="text-sm text-foreground font-montserrat font-semibold mb-1.5">{tr("searchNoResults")}</div>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">{tr("ltNothingHint")}</p>
          <button onClick={() => setQuery("")} className="mt-4 border border-gold text-gold text-xs font-montserrat font-bold px-4 py-2 rounded-sm hover:bg-gold hover:text-[hsl(28,20%,7%)] transition-all">
            {tr("ltShowAll")}
          </button>
        </div>
      )}

      {/* Вертикальный список категорий-глав: клик раскрывает специальности внутри. */}
      <div className="space-y-3">
        {shownCats.map((cat) => {
          const catServices = filtered.filter((s) => s.cat === cat.id);
          const isOpen = catIsOpen(cat.id);
          return (
            <div key={cat.id} id={`cat-${cat.id}`} className="border border-border rounded-sm bg-card overflow-hidden">
              <button
                onClick={() => toggleCat(cat.id)}
                className="w-full flex items-center gap-4 p-4 sm:p-5 text-start hover:bg-secondary/40 transition-colors"
              >
                <div className="w-11 h-11 sm:w-12 sm:h-12 gold-gradient rounded flex items-center justify-center shrink-0">
                  <Icon name={cat.icon} fallback="Shield" size={22} className="text-[hsl(28,20%,7%)]" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-montserrat font-bold text-sm sm:text-base text-foreground leading-tight">{L(cat.title, lang)}</h3>
                  <div className="mt-1 text-[11px] sm:text-xs text-muted-foreground">{catServices.length} {tr("catSpecialties")}</div>
                </div>
                <Icon name={isOpen ? "ChevronUp" : "ChevronDown"} size={18} className="text-muted-foreground shrink-0" />
              </button>

              {isOpen && (
                <div className="border-t border-border divide-y divide-border animate-fade-in">
                  {catServices.map((s) => {
                    const serviceOpen = openService === s.title.en;
                    return (
                      <div key={s.title.en}>
                        <button
                          onClick={() => setOpenService((cur) => (cur === s.title.en ? null : s.title.en))}
                          className="w-full flex items-center gap-3 px-4 sm:px-5 py-3.5 text-start hover:bg-secondary/30 transition-colors"
                        >
                          <Icon name={s.icon} fallback="ShieldCheck" size={17} className="text-gold shrink-0" />
                          <span className="flex-1 min-w-0 text-xs sm:text-sm font-montserrat font-semibold text-foreground">{L(s.title, lang)}</span>
                          <span className="text-xs font-montserrat font-bold text-gold shrink-0">{priceFor(s)}</span>
                          <Icon name={serviceOpen ? "ChevronUp" : "ChevronRight"} size={15} className="text-muted-foreground shrink-0" />
                        </button>
                        {serviceOpen && (
                          <div className="px-4 sm:px-5 pb-4 pt-1 bg-secondary/20 animate-fade-in">
                            <p className="text-xs text-muted-foreground leading-relaxed mb-3">{L(s.desc, lang)}</p>
                            <div className="flex items-center justify-between gap-3">
                              <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                                <Icon name="Clock" size={11} />{L(s.time, lang)}
                              </div>
                              {onOrder && (
                                <button
                                  onClick={() => onOrder(s.cat, s.title.en)}
                                  className="border border-gold text-gold text-xs font-montserrat font-semibold px-4 py-2 hover:bg-gold hover:text-[hsl(28,20%,7%)] transition-all rounded-sm inline-flex items-center gap-1.5 shrink-0"
                                >
                                  {tr("catFindSpecialist")}<Icon name="ArrowRight" size={13} />
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-10 border border-gold/30 rounded-sm bg-card p-6 flex flex-col md:flex-row items-start md:items-center gap-4">
        <div className="w-10 h-10 gold-gradient rounded flex items-center justify-center shrink-0">
          <Icon name="HandCoins" size={18} className="text-[hsl(28,20%,7%)]" />
        </div>
        <div>
          <div className="font-montserrat font-semibold text-sm text-foreground mb-1">{tr("noCommissionTitle")}</div>
          <div className="text-xs text-muted-foreground">{tr("noCommissionDesc")}</div>
        </div>
      </div>
    </div>
  );
}

export function CoursesSection() {
  const { tr } = useLang();
  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="mb-6">
        <div className="tag-security mb-3 inline-block">{tr("education")}</div>
        <h2 className="font-montserrat font-bold text-3xl text-foreground mb-2">{tr("coursesTitle")}</h2>
        <p className="text-muted-foreground text-sm">{tr("coursesDesc")}</p>
      </div>

      <div className="relative overflow-hidden rounded-sm border border-gold/30 glass-card ambient-gold p-10 md:p-16 text-center">
        <div className="absolute inset-0 grid-line-bg opacity-30" />
        <div className="relative z-10 max-w-xl mx-auto">
          <div className="inline-flex items-center gap-2 mb-6">
            <span className="badge-pro">{tr("coursesSoonBadge")}</span>
          </div>
          <div className="w-16 h-16 gold-gradient rounded-full flex items-center justify-center mx-auto mb-6 glow-gold-sm">
            <Icon name="GraduationCap" size={30} className="text-[hsl(28,20%,7%)]" />
          </div>
          <h3 className="font-montserrat font-extrabold text-2xl md:text-3xl text-foreground mb-4">{tr("coursesSoonTitle")}</h3>
          <p className="text-muted-foreground text-sm md:text-base leading-relaxed mb-8">{tr("coursesSoonText")}</p>
          <div className="flex items-center justify-center gap-2 text-xs text-gold font-montserrat font-semibold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-gold" />
            </span>
            {tr("coursesSoonBadge")}
          </div>
        </div>
      </div>
    </div>
  );
}

export function GuardsSection() {
  const { lang, tr } = useLang();
  const { providers } = useProviders();
  const [q, setQ] = useState("");

  // Раньше здесь висели три несуществующие компании — «ЧОО Легион
  // Секьюрити» с рейтингом 4.9, «480 сотрудниками» и 210 отзывами. При
  // четырёх реальных исполнителях в базе это заметная подделка, а на
  // платформе, которая проверяет чужие лицензии, собственная выдумка
  // обесценивает всю проверку. Показываем настоящие охранные компании;
  // пока их нет — честно говорим об этом и зовём зарегистрироваться.
  const companies = providers.filter((p) => {
    const tags = (lang === "ru" ? p.tags.ru : p.tags.en).join(" ").toLowerCase();
    const title = L(p.title, lang).toLowerCase();
    const isGuard = /охран|guard|чоп|чоо|secur/.test(title + " " + tags);
    if (!isGuard) return false;
    if (!q.trim()) return true;
    return (L(p.name, lang) + " " + title).toLowerCase().includes(q.trim().toLowerCase());
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="mb-8">
        <div className="tag-security mb-3 inline-block">{tr("guardsTag")}</div>
        <h2 className="font-montserrat font-bold text-3xl text-foreground mb-2">{tr("guardsTitle")}</h2>
        <p className="text-muted-foreground text-sm max-w-2xl">{tr("guardsDesc")}</p>
      </div>

      <div className="flex gap-3 mb-8">
        <div className="flex-1 flex items-center gap-3 border border-border bg-card rounded-sm px-4">
          <Icon name="Search" size={16} className="text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={tr("searchGuards")}
            className="flex-1 bg-transparent py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
        </div>
      </div>

      {companies.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger">
          {companies.map((g) => (
            <ProviderResultCard key={g.slug} p={g} onOpen={() => { /* профиль откроется из каталога */ }} />
          ))}
        </div>
      ) : (
        <div className="border border-gold/30 rounded-sm glass-card p-6 md:p-8">
          <div className="flex items-start gap-3">
            <Icon name="Building2" size={20} className="text-gold shrink-0 mt-0.5" />
            <div>
              <div className="font-montserrat font-bold text-base text-foreground mb-2">{tr("guardsEmptyTitle")}</div>
              <p className="text-sm text-muted-foreground leading-relaxed">{tr("guardsEmptyText")}</p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-12">
        <h3 className="font-montserrat font-bold text-2xl text-foreground mb-2">{tr("guardServices")}</h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-2xl">{tr("guardServicesNote")}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {guardServices.map((x) => (
            <div key={x.title.en} className="group border border-border rounded-sm bg-card p-6 card-lift shine-on-hover cursor-default">
              <div className="w-11 h-11 icon-tile rounded-full flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110">
                <Icon name={x.icon} size={19} className="text-gold" />
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
