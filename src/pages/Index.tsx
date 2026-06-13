import { useState } from "react";
import Icon from "@/components/ui/icon";

const HERO_IMAGE = "https://cdn.poehali.dev/projects/cdac7d00-bd0a-4bb7-a1b1-237a7708c061/files/e0e84afb-8e88-40ff-81b2-c3597f9a8371.jpg";
const POLYGRAPH_IMAGE = "https://cdn.poehali.dev/projects/cdac7d00-bd0a-4bb7-a1b1-237a7708c061/files/c211bedb-fcf6-49e0-abb2-ad98fcf0bdac.jpg";
const DETECTIVE_IMAGE = "https://cdn.poehali.dev/projects/cdac7d00-bd0a-4bb7-a1b1-237a7708c061/files/b893f56c-cd01-49d7-b962-7f78f87ace2c.jpg";

type Section = "home" | "profile" | "cases" | "services" | "courses" | "chat" | "forum" | "contacts";

const NAV_ITEMS: { id: Section; label: string; icon: string }[] = [
  { id: "home", label: "Главная", icon: "Home" },
  { id: "profile", label: "Профиль", icon: "User" },
  { id: "cases", label: "Кейсы", icon: "FolderOpen" },
  { id: "services", label: "Услуги", icon: "Briefcase" },
  { id: "courses", label: "Курсы", icon: "GraduationCap" },
  { id: "chat", label: "Чат", icon: "MessageSquare" },
  { id: "forum", label: "Форум", icon: "MessagesSquare" },
  { id: "contacts", label: "Контакты", icon: "Phone" },
];

const specialists = [
  {
    name: "Александр Морозов",
    title: "Полиграфолог",
    rating: 4.9,
    reviews: 134,
    cases: 312,
    verified: true,
    tags: ["Полиграф", "HR-проверки", "Корпоративная безопасность"],
    img: DETECTIVE_IMAGE,
  },
  {
    name: "Елена Власова",
    title: "Частный детектив",
    rating: 4.8,
    reviews: 87,
    cases: 198,
    verified: true,
    tags: ["Розыск", "Наружное наблюдение", "Сбор доказательств"],
    img: HERO_IMAGE,
  },
  {
    name: "Игорь Семёнов",
    title: "Специалист по TSCM",
    rating: 5.0,
    reviews: 62,
    cases: 145,
    verified: true,
    tags: ["Поиск жучков", "Контрразведка", "Защита переговоров"],
    img: POLYGRAPH_IMAGE,
  },
];

const cases = [
  {
    title: "Корпоративный шпионаж: обнаружение прослушки в переговорной",
    category: "TSCM",
    date: "март 2024",
    views: 1240,
    likes: 87,
    summary: "В ходе плановой проверки переговорной комнаты крупного холдинга были обнаружены 3 замаскированных устройства...",
    author: "И. Семёнов",
  },
  {
    title: "Верификация кандидата на должность финансового директора",
    category: "Полиграф",
    date: "февраль 2024",
    views: 890,
    likes: 64,
    summary: "Проведена комплексная психофизиологическая экспертиза кандидата с применением компьютерного полиграфа...",
    author: "А. Морозов",
  },
  {
    title: "Розыск пропавшего без вести лица: методика и результат",
    category: "Детективная деятельность",
    date: "январь 2024",
    views: 2100,
    likes: 142,
    summary: "Успешное завершение розыскного дела за 11 суток. Применение OSINT-методов и агентурных источников...",
    author: "Е. Власова",
  },
];

const services = [
  { icon: "Activity", title: "Полиграф-проверка", price: "от 8 000 ₽", time: "2–3 часа", desc: "Психофизиологическое исследование с применением компьютерного полиграфа для HR и корпоративных нужд" },
  { icon: "Search", title: "Поиск прослушивающих устройств", price: "от 25 000 ₽", time: "от 4 часов", desc: "Профессиональное радиочастотное сканирование помещений, офисов и транспортных средств" },
  { icon: "Eye", title: "Наружное наблюдение", price: "от 12 000 ₽/день", time: "от 1 дня", desc: "Профессиональная слежка силами сертифицированных детективов с фото- и видеофиксацией" },
  { icon: "FileSearch", title: "Сбор досье", price: "от 15 000 ₽", time: "3–7 дней", desc: "Комплексная проверка физических и юридических лиц по открытым и закрытым источникам" },
  { icon: "Shield", title: "Защита переговоров", price: "от 30 000 ₽", time: "под ключ", desc: "Обеспечение защищённого периметра для конфиденциальных встреч на вашей или нейтральной территории" },
  { icon: "UserCheck", title: "HR-безопасность", price: "от 5 000 ₽", time: "1–2 дня", desc: "Проверка соискателей, мониторинг персонала, расследование инцидентов внутри компании" },
];

const courses = [
  {
    title: "Основы полиграфологии",
    instructor: "А. Морозов",
    level: "Начинающий",
    duration: "32 часа",
    price: "24 900 ₽",
    students: 312,
    rating: 4.8,
    img: POLYGRAPH_IMAGE,
  },
  {
    title: "TSCM: технический поиск средств наблюдения",
    instructor: "И. Семёнов",
    level: "Продвинутый",
    duration: "48 часов",
    price: "49 900 ₽",
    students: 187,
    rating: 4.9,
    img: HERO_IMAGE,
  },
  {
    title: "Частная детективная деятельность: с нуля до лицензии",
    instructor: "Е. Власова",
    level: "С нуля",
    duration: "60 часов",
    price: "39 900 ₽",
    students: 248,
    rating: 4.7,
    img: DETECTIVE_IMAGE,
  },
];

const messages = [
  { user: "А. Морозов", time: "10:42", text: "Игорь, можете порекомендовать анализатор нелинейностей для работы в полевых условиях?" },
  { user: "И. Семёнов", time: "10:48", text: "Рекомендую НЕЛАН-В. Компактный, хорошая чувствительность. Использую его уже 3 года." },
  { user: "Е. Власова", time: "11:02", text: "Коллеги, вопрос по документированию. Как оформляете итоговый отчёт при комплексной проверке?" },
  { user: "А. Морозов", time: "11:15", text: "Есть готовый шаблон, соответствующий требованиям. Скину в личку." },
  { user: "К. Петров", time: "11:28", text: "Добрый день всем! Новый участник, специализация — корпоративная разведка и безопасность бизнеса." },
];

const forumTopics = [
  { title: "Легитимность OSINT в РФ 2024: что можно, что нельзя", replies: 34, views: 1820, hot: true, category: "Право" },
  { title: "Сертификация полиграфологов: какой курс выбрать?", replies: 21, views: 940, hot: false, category: "Обучение" },
  { title: "Оборудование для TSCM: рейтинг 2024", replies: 58, views: 3210, hot: true, category: "Оборудование" },
  { title: "Работа с корпоративными клиентами: договорная база", replies: 17, views: 720, hot: false, category: "Бизнес" },
  { title: "Этика частного детектива: сложные случаи", replies: 43, views: 2100, hot: true, category: "Практика" },
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

export default function Index() {
  const [active, setActive] = useState<Section>("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");

  const renderSection = () => {
    switch (active) {
      case "home": return <HomeSection setActive={setActive} />;
      case "profile": return <ProfileSection />;
      case "cases": return <CasesSection />;
      case "services": return <ServicesSection />;
      case "courses": return <CoursesSection />;
      case "chat": return <ChatSection chatInput={chatInput} setChatInput={setChatInput} />;
      case "forum": return <ForumSection />;
      case "contacts": return <ContactsSection />;
      default: return <HomeSection setActive={setActive} />;
    }
  };

  return (
    <div className="min-h-screen bg-background font-ibm">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 gold-gradient rounded flex items-center justify-center">
              <Icon name="Shield" size={16} className="text-[hsl(220,20%,6%)]" />
            </div>
            <div>
              <span className="font-montserrat font-bold text-lg tracking-tight text-foreground">SECURE<span className="text-gold">NET</span></span>
              <div className="text-[9px] text-muted-foreground font-montserrat tracking-widest uppercase leading-none">Профессиональная платформа</div>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-6">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => setActive(item.id)}
                className={`nav-link text-sm font-montserrat font-medium tracking-wide transition-colors ${active === item.id ? "text-gold active" : "text-muted-foreground hover:text-foreground"}`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <button className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <Icon name="Bell" size={16} />
            </button>
            <button className="hidden sm:flex items-center gap-2 px-4 py-2 border border-gold text-gold text-sm font-montserrat font-semibold hover:bg-gold hover:text-[hsl(220,20%,6%)] transition-all duration-200 rounded-sm">
              Войти
            </button>
            <button className="gold-gradient text-[hsl(220,20%,6%)] px-4 py-2 text-sm font-montserrat font-bold rounded-sm hover:opacity-90 transition-opacity">
              Вступить
            </button>
            <button className="lg:hidden text-muted-foreground" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <Icon name={mobileMenuOpen ? "X" : "Menu"} size={22} />
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-border bg-card animate-fade-in">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => { setActive(item.id); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-montserrat border-b border-border last:border-0 ${active === item.id ? "text-gold bg-secondary" : "text-muted-foreground"}`}
              >
                <Icon name={item.icon} size={16} />
                {item.label}
              </button>
            ))}
          </div>
        )}
      </header>

      <main className="pt-16">{renderSection()}</main>

      <footer className="border-t border-border bg-card mt-16">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 gold-gradient rounded flex items-center justify-center">
                  <Icon name="Shield" size={12} className="text-[hsl(220,20%,6%)]" />
                </div>
                <span className="font-montserrat font-bold text-sm text-foreground">SECURE<span className="text-gold">NET</span></span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">Закрытое профессиональное сообщество для специалистов в сфере безопасности России</p>
            </div>
            <div>
              <div className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest mb-3">Платформа</div>
              {["О нас", "Специалисты", "Кейсы", "Услуги", "Курсы"].map(l => (
                <div key={l} className="text-xs text-muted-foreground hover:text-gold cursor-pointer transition-colors mb-2">{l}</div>
              ))}
            </div>
            <div>
              <div className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest mb-3">Сообщество</div>
              {["Форум", "Чат", "Мероприятия", "Новости отрасли"].map(l => (
                <div key={l} className="text-xs text-muted-foreground hover:text-gold cursor-pointer transition-colors mb-2">{l}</div>
              ))}
            </div>
            <div>
              <div className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest mb-3">Документы</div>
              {["Политика конфиденциальности", "Условия использования", "Пользовательское соглашение", "Оферта"].map(l => (
                <div key={l} className="text-xs text-muted-foreground hover:text-gold cursor-pointer transition-colors mb-2">{l}</div>
              ))}
            </div>
          </div>
          <div className="divider-gold mt-8 mb-6" />
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
            <div className="text-xs text-muted-foreground">© 2024 SecureNet. Все права защищены.</div>
            <div className="text-xs text-muted-foreground">Платформа для верифицированных специалистов</div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function HomeSection({ setActive }: { setActive: (s: Section) => void }) {
  return (
    <div>
      <section className="relative overflow-hidden grid-line-bg min-h-[90vh] flex items-center">
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-transparent z-10" />
        <div className="absolute inset-0">
          <img src={HERO_IMAGE} alt="Специалист по безопасности" className="w-full h-full object-cover opacity-20" />
        </div>
        <div className="relative z-20 max-w-7xl mx-auto px-4 py-24">
          <div className="max-w-2xl animate-fade-in">
            <div className="tag-security mb-6 inline-block">Закрытая платформа</div>
            <h1 className="font-montserrat font-extrabold text-5xl md:text-6xl lg:text-7xl text-foreground leading-none mb-6">
              Профессионалы<br />
              <span className="text-gold">безопасности</span><br />
              России
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8 max-w-xl">
              Верифицированное сообщество полиграфологов, частных детективов, TSCM-специалистов и экспертов корпоративной безопасности. Кейсы, услуги, курсы и деловые связи — в одном месте.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setActive("services")}
                className="gold-gradient text-[hsl(220,20%,6%)] px-8 py-3.5 font-montserrat font-bold text-sm tracking-wide hover:opacity-90 transition-opacity rounded-sm"
              >
                Найти специалиста
              </button>
              <button
                onClick={() => setActive("cases")}
                className="border border-border text-foreground px-8 py-3.5 font-montserrat font-semibold text-sm tracking-wide hover:border-gold hover:text-gold transition-all rounded-sm"
              >
                Смотреть кейсы
              </button>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 z-20 border-t border-border bg-card/90 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
              {[
                { n: "1 240+", l: "Верифицированных специалистов" },
                { n: "4 800+", l: "Реализованных кейсов" },
                { n: "320+", l: "Доступных услуг" },
                { n: "98%", l: "Довольных клиентов" },
              ].map((s) => (
                <div key={s.n} className="py-5 px-6 text-center">
                  <div className="stat-number text-2xl mb-1">{s.n}</div>
                  <div className="text-xs text-muted-foreground">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="tag-security mb-3 inline-block">Специалисты</div>
            <h2 className="font-montserrat font-bold text-3xl text-foreground">Топ-эксперты платформы</h2>
          </div>
          <button onClick={() => setActive("profile")} className="text-sm text-gold hover:underline font-montserrat hidden md:block">
            Все специалисты →
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {specialists.map((s) => (
            <div key={s.name} className="card-hover border border-border rounded-sm bg-card overflow-hidden cursor-pointer">
              <div className="h-44 overflow-hidden relative">
                <img src={s.img} alt={s.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
                {s.verified && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 bg-card/90 border border-gold/40 px-2 py-1 rounded-sm">
                    <Icon name="BadgeCheck" size={12} className="text-gold" />
                    <span className="text-[10px] font-montserrat font-semibold text-gold">ВЕРИФИЦИРОВАН</span>
                  </div>
                )}
              </div>
              <div className="p-5">
                <div className="font-montserrat font-bold text-base text-foreground">{s.name}</div>
                <div className="text-xs text-gold font-montserrat font-medium mt-0.5 mb-3">{s.title}</div>
                <div className="flex items-center gap-3 mb-4">
                  <StarRating rating={s.rating} />
                  <span className="text-xs text-muted-foreground">{s.rating} ({s.reviews} отзывов)</span>
                  <span className="text-xs text-muted-foreground ml-auto">{s.cases} кейсов</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {s.tags.map((t) => (
                    <span key={t} className="tag-security">{t}</span>
                  ))}
                </div>
                <button className="w-full mt-4 border border-gold text-gold text-xs font-montserrat font-semibold py-2 hover:bg-gold hover:text-[hsl(220,20%,6%)] transition-all rounded-sm">
                  Связаться
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-card py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="tag-security mb-3 inline-block">Возможности</div>
            <h2 className="font-montserrat font-bold text-3xl text-foreground">Почему выбирают SecureNet</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: "ShieldCheck", title: "Верификация специалистов", desc: "Каждый участник проходит проверку документов, лицензий и профессиональной репутации" },
              { icon: "Lock", title: "Закрытое сообщество", desc: "Доступ только для практикующих специалистов в сфере безопасности. Без посторонних" },
              { icon: "CreditCard", title: "Безопасные платежи", desc: "Интегрированная система расчётов с автоматическим распределением комиссий" },
              { icon: "BookOpen", title: "База знаний", desc: "Тысячи кейсов, методических материалов и обучающих программ от практиков" },
              { icon: "Users", title: "Деловые связи", desc: "Находите партнёров, коллег и клиентов в своей профессиональной нише" },
              { icon: "Star", title: "Репутация и рейтинг", desc: "Прозрачная система оценки и отзывов для формирования профессиональной репутации" },
            ].map((f) => (
              <div key={f.title} className="p-6 border border-border rounded-sm card-hover cursor-default">
                <div className="w-10 h-10 gold-gradient rounded flex items-center justify-center mb-4">
                  <Icon name={f.icon} size={18} className="text-[hsl(220,20%,6%)]" />
                </div>
                <div className="font-montserrat font-semibold text-sm text-foreground mb-2">{f.title}</div>
                <div className="text-xs text-muted-foreground leading-relaxed">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="border border-gold/30 rounded-sm bg-card p-10 md:p-16 text-center relative overflow-hidden grid-line-bg">
          <div className="relative z-10">
            <div className="tag-security mb-4 inline-block">Закрытый доступ</div>
            <h2 className="font-montserrat font-extrabold text-3xl md:text-4xl text-foreground mb-4">
              Вступите в профессиональное<br /><span className="text-gold">сообщество сегодня</span>
            </h2>
            <p className="text-muted-foreground text-sm mb-8 max-w-xl mx-auto">
              Оставьте заявку на верификацию — наша команда свяжется с вами в течение 24 часов для проверки профессиональных документов
            </p>
            <button className="gold-gradient text-[hsl(220,20%,6%)] px-10 py-4 font-montserrat font-bold text-sm tracking-wide hover:opacity-90 transition-opacity rounded-sm">
              Подать заявку на вступление
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function ProfileSection() {
  const [activeTab, setActiveTab] = useState<"cases" | "services" | "reviews">("cases");

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 animate-fade-in">
      <div className="tag-security mb-6 inline-block">Профиль специалиста</div>
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
                <div className="font-montserrat font-bold text-lg text-foreground">Александр Морозов</div>
                <Icon name="BadgeCheck" size={16} className="text-gold" />
              </div>
              <div className="text-gold text-xs font-montserrat font-medium mb-1">Полиграфолог · 12 лет опыта</div>
              <div className="text-xs text-muted-foreground mb-4">Москва · Россия</div>
              <div className="flex items-center gap-2 mb-4">
                <StarRating rating={4.9} />
                <span className="text-xs text-muted-foreground">4.9 (134 отзыва)</span>
              </div>
              <div className="divider-gold mb-4" />
              <div className="grid grid-cols-3 text-center gap-2 mb-4">
                <div><div className="stat-number text-xl">312</div><div className="text-[10px] text-muted-foreground">Кейсов</div></div>
                <div><div className="stat-number text-xl">134</div><div className="text-[10px] text-muted-foreground">Отзывов</div></div>
                <div><div className="stat-number text-xl">98%</div><div className="text-[10px] text-muted-foreground">Успех</div></div>
              </div>
              <button className="w-full gold-gradient text-[hsl(220,20%,6%)] py-2.5 text-xs font-montserrat font-bold rounded-sm hover:opacity-90 transition-opacity">Связаться</button>
              <button className="w-full mt-2 border border-border text-muted-foreground py-2.5 text-xs font-montserrat font-semibold rounded-sm hover:border-gold hover:text-gold transition-all">Заказать услугу</button>
            </div>
          </div>

          <div className="border border-border rounded-sm bg-card p-5">
            <div className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest mb-4">Специализация</div>
            {["Компьютерная полиграфология", "HR-проверки персонала", "Корпоративная безопасность", "Психофизиологическая экспертиза", "Работа с ложными воспоминаниями"].map((skill) => (
              <div key={skill} className="flex items-center gap-2 py-2 border-b border-border last:border-0">
                <div className="w-1.5 h-1.5 rounded-full bg-gold" />
                <span className="text-xs text-muted-foreground">{skill}</span>
              </div>
            ))}
          </div>

          <div className="border border-border rounded-sm bg-card p-5">
            <div className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest mb-4">Сертификаты</div>
            {[{ title: "Лицензия ФСИН", year: "2019" }, { title: "AAPP Certified Polygraphist", year: "2021" }, { title: "Частный детектив РФ", year: "2018" }].map((c) => (
              <div key={c.title} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-2">
                  <Icon name="Award" size={12} className="text-gold" />
                  <span className="text-xs text-muted-foreground">{c.title}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">{c.year}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-5">
          <div className="border border-border rounded-sm bg-card p-6">
            <div className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest mb-3">О специалисте</div>
            <p className="text-sm text-muted-foreground leading-relaxed">Профессиональный полиграфолог с 12-летним опытом проведения психофизиологических исследований. Специализируюсь на корпоративных проверках, HR-скрининге при приёме на работу и расследовании инцидентов. Провёл более 3 000 индивидуальных сессий. Сотрудничаю с юридическими компаниями, банками и крупными корпорациями.</p>
          </div>

          <div className="border border-border rounded-sm bg-card">
            <div className="flex border-b border-border">
              {(["cases", "services", "reviews"] as const).map((t) => {
                const labels = { cases: "Кейсы (28)", services: "Услуги (5)", reviews: "Отзывы (134)" };
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
                    <div key={c.title} className="p-4 border border-border rounded-sm hover:border-gold/40 transition-colors cursor-pointer">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="font-montserrat font-semibold text-sm text-foreground">{c.title}</div>
                        <span className="tag-security whitespace-nowrap shrink-0">{c.category}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">{c.summary}</div>
                      <div className="flex items-center gap-4 mt-3">
                        <span className="text-[10px] text-muted-foreground">{c.date}</span>
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
                    <div key={s.title} className="flex items-center gap-4 p-4 border border-border rounded-sm hover:border-gold/40 transition-colors cursor-pointer">
                      <div className="w-9 h-9 gold-gradient rounded flex items-center justify-center shrink-0">
                        <Icon name={s.icon} size={15} className="text-[hsl(220,20%,6%)]" />
                      </div>
                      <div className="flex-1">
                        <div className="font-montserrat font-semibold text-sm text-foreground">{s.title}</div>
                        <div className="text-xs text-muted-foreground">{s.desc.slice(0, 60)}...</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-montserrat font-bold text-gold">{s.price}</div>
                        <div className="text-[10px] text-muted-foreground">{s.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {activeTab === "reviews" && (
                <div className="space-y-4">
                  {[
                    { name: "ООО «АльфаТех»", rating: 5, text: "Провёл полный HR-скрининг нашей команды (18 человек). Профессионально, дискретно, в срок. Нашли двух проблемных кандидатов.", date: "2 недели назад" },
                    { name: "Иван К.", rating: 5, text: "Проверка предполагаемой утечки данных. Чёткая работа, понятный отчёт. Рекомендую коллегам.", date: "1 месяц назад" },
                    { name: "ЧОП «Легион»", rating: 4, text: "Регулярно пользуемся услугами при отборе персонала. Надёжный специалист.", date: "2 месяца назад" },
                  ].map((r) => (
                    <div key={r.name} className="p-4 border border-border rounded-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-montserrat font-semibold text-sm text-foreground">{r.name}</div>
                        <div className="flex items-center gap-2">
                          <StarRating rating={r.rating} />
                          <span className="text-[10px] text-muted-foreground">{r.date}</span>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">{r.text}</div>
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
  const [filter, setFilter] = useState("Все");
  const cats = ["Все", "Полиграф", "TSCM", "Детективная деятельность", "Корпоративная безопасность"];

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="tag-security mb-3 inline-block">База знаний</div>
          <h2 className="font-montserrat font-bold text-3xl text-foreground">Профессиональные кейсы</h2>
        </div>
        <button className="gold-gradient text-[hsl(220,20%,6%)] px-5 py-2.5 text-xs font-montserrat font-bold rounded-sm self-start md:self-auto">
          + Опубликовать кейс
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        {cats.map((c) => (
          <button key={c} onClick={() => setFilter(c)}
            className={`px-4 py-1.5 text-xs font-montserrat font-semibold rounded-sm border transition-all ${filter === c ? "border-gold bg-gold/10 text-gold" : "border-border text-muted-foreground hover:border-gold/40"}`}>
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          {cases.map((c) => (
            <div key={c.title} className="border border-border rounded-sm bg-card p-6 card-hover cursor-pointer">
              <div className="flex items-start gap-3 mb-3">
                <span className="tag-security">{c.category}</span>
                <span className="text-[10px] text-muted-foreground ml-auto">{c.date}</span>
              </div>
              <h3 className="font-montserrat font-bold text-base text-foreground mb-2 leading-snug">{c.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">{c.summary}</p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 gold-gradient rounded-sm flex items-center justify-center">
                    <Icon name="User" size={10} className="text-[hsl(220,20%,6%)]" />
                  </div>
                  <span className="text-xs text-muted-foreground">{c.author}</span>
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
            <div className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest mb-4">Топ авторов</div>
            {specialists.map((s, i) => (
              <div key={s.name} className="flex items-center gap-3 py-2.5 border-b border-border last:border-0">
                <div className="font-montserrat font-bold text-xs text-gold w-4">{i + 1}</div>
                <div className="w-7 h-7 rounded-sm overflow-hidden">
                  <img src={s.img} alt={s.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="text-xs font-montserrat font-semibold text-foreground">{s.name}</div>
                  <div className="text-[10px] text-muted-foreground">{s.cases} кейсов</div>
                </div>
              </div>
            ))}
          </div>
          <div className="border border-border rounded-sm bg-card p-5">
            <div className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest mb-4">Популярные теги</div>
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

function ServicesSection() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-10 animate-fade-in">
      <div className="mb-10">
        <div className="tag-security mb-3 inline-block">Каталог</div>
        <h2 className="font-montserrat font-bold text-3xl text-foreground mb-2">Услуги специалистов</h2>
        <p className="text-muted-foreground text-sm">Профессиональные услуги верифицированных экспертов с гарантией качества</p>
      </div>

      <div className="flex gap-3 mb-10">
        <div className="flex-1 flex items-center gap-3 border border-border bg-card rounded-sm px-4">
          <Icon name="Search" size={16} className="text-muted-foreground" />
          <input placeholder="Поиск услуг..." className="flex-1 bg-transparent py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none" />
        </div>
        <button className="gold-gradient text-[hsl(220,20%,6%)] px-6 py-3 text-xs font-montserrat font-bold rounded-sm">Найти</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {services.map((s) => (
          <div key={s.title} className="border border-border rounded-sm bg-card p-6 card-hover cursor-pointer">
            <div className="w-11 h-11 gold-gradient rounded flex items-center justify-center mb-5">
              <Icon name={s.icon} size={20} className="text-[hsl(220,20%,6%)]" />
            </div>
            <h3 className="font-montserrat font-bold text-sm text-foreground mb-2">{s.title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed mb-5">{s.desc}</p>
            <div className="divider-gold mb-4" />
            <div className="flex items-center justify-between">
              <div>
                <div className="font-montserrat font-extrabold text-base text-gold">{s.price}</div>
                <div className="text-[10px] text-muted-foreground">{s.time}</div>
              </div>
              <button className="border border-gold text-gold text-xs font-montserrat font-semibold px-4 py-2 hover:bg-gold hover:text-[hsl(220,20%,6%)] transition-all rounded-sm">Заказать</button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 border border-gold/30 rounded-sm bg-card p-6 flex flex-col md:flex-row items-start md:items-center gap-4">
        <div className="w-10 h-10 gold-gradient rounded flex items-center justify-center shrink-0">
          <Icon name="Percent" size={18} className="text-[hsl(220,20%,6%)]" />
        </div>
        <div>
          <div className="font-montserrat font-semibold text-sm text-foreground mb-1">Комиссия платформы</div>
          <div className="text-xs text-muted-foreground">Платформа берёт комиссию 8–12% от суммы сделки. Оплата через безопасную сделку — ваши деньги защищены до подтверждения выполнения заказа</div>
        </div>
        <button className="shrink-0 border border-border text-muted-foreground text-xs font-montserrat font-semibold px-4 py-2 hover:border-gold hover:text-gold transition-all rounded-sm ml-auto">Подробнее</button>
      </div>
    </div>
  );
}

function CoursesSection() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-10 animate-fade-in">
      <div className="mb-10">
        <div className="tag-security mb-3 inline-block">Обучение</div>
        <h2 className="font-montserrat font-bold text-3xl text-foreground mb-2">Курсы и тренинги</h2>
        <p className="text-muted-foreground text-sm">Обучающие программы от действующих практиков отрасли</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
        {courses.map((c) => (
          <div key={c.title} className="border border-border rounded-sm bg-card overflow-hidden card-hover cursor-pointer">
            <div className="h-44 overflow-hidden relative">
              <img src={c.img} alt={c.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
              <div className="absolute top-3 left-3"><span className="badge-pro">{c.level}</span></div>
            </div>
            <div className="p-5">
              <h3 className="font-montserrat font-bold text-sm text-foreground mb-2 leading-snug">{c.title}</h3>
              <div className="text-xs text-muted-foreground mb-3">{c.instructor} · {c.duration}</div>
              <div className="flex items-center gap-2 mb-4">
                <StarRating rating={c.rating} />
                <span className="text-xs text-muted-foreground">{c.rating}</span>
                <span className="text-xs text-muted-foreground ml-auto">{c.students} студентов</span>
              </div>
              <div className="divider-gold mb-4" />
              <div className="flex items-center justify-between">
                <div className="font-montserrat font-extrabold text-lg text-gold">{c.price}</div>
                <button className="gold-gradient text-[hsl(220,20%,6%)] px-4 py-2 text-xs font-montserrat font-bold rounded-sm hover:opacity-90 transition-opacity">Записаться</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: "BookOpen", n: "47", l: "Курсов" },
          { icon: "Users", n: "2 800+", l: "Выпускников" },
          { icon: "Award", n: "31", l: "Преподавателей" },
          { icon: "Star", n: "4.8", l: "Средний рейтинг" },
        ].map((s) => (
          <div key={s.l} className="border border-border rounded-sm bg-card p-5 flex items-center gap-4">
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

function ChatSection({ chatInput, setChatInput }: { chatInput: string; setChatInput: (v: string) => void }) {
  const rooms = [
    { name: "Общий чат", online: 24 },
    { name: "Полиграфологи", online: 8 },
    { name: "TSCM-специалисты", online: 5 },
    { name: "Детективы", online: 11 },
    { name: "Новости отрасли", online: 32 },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 animate-fade-in">
      <div className="mb-6">
        <div className="tag-security mb-3 inline-block">Сообщество</div>
        <h2 className="font-montserrat font-bold text-3xl text-foreground">Профессиональный чат</h2>
      </div>
      <div className="border border-border rounded-sm bg-card overflow-hidden" style={{ height: "600px" }}>
        <div className="flex h-full">
          <div className="w-56 border-r border-border flex-col hidden md:flex">
            <div className="p-4 border-b border-border">
              <div className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest">Каналы</div>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin">
              {rooms.map((r) => (
                <div key={r.name} className={`px-4 py-3 cursor-pointer hover:bg-secondary transition-colors border-b border-border last:border-0 ${r.name === "Общий чат" ? "bg-secondary" : ""}`}>
                  <div className="text-xs font-montserrat font-medium text-foreground mb-1"># {r.name}</div>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    <span className="text-[10px] text-muted-foreground">{r.online} онлайн</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b border-border flex items-center gap-3">
              <div className="text-sm font-montserrat font-semibold text-foreground"># Общий чат</div>
              <div className="flex items-center gap-1 ml-auto">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span className="text-xs text-muted-foreground">24 онлайн</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin">
              {messages.map((m, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-8 h-8 gold-gradient rounded-sm flex items-center justify-center shrink-0 font-montserrat font-bold text-xs text-[hsl(220,20%,6%)]">
                    {m.user[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-montserrat font-semibold text-foreground">{m.user}</span>
                      <span className="text-[10px] text-muted-foreground">{m.time}</span>
                    </div>
                    <div className="text-sm text-muted-foreground leading-relaxed">{m.text}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-border">
              <div className="flex gap-3">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Написать в #общий-чат..."
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
  return (
    <div className="max-w-7xl mx-auto px-4 py-10 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="tag-security mb-3 inline-block">Дискуссии</div>
          <h2 className="font-montserrat font-bold text-3xl text-foreground">Профессиональный форум</h2>
        </div>
        <button className="gold-gradient text-[hsl(220,20%,6%)] px-5 py-2.5 text-xs font-montserrat font-bold rounded-sm self-start">
          + Создать тему
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-3">
          <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 text-[10px] font-montserrat font-semibold uppercase tracking-widest text-muted-foreground border-b border-border">
            <div className="col-span-7">Тема</div>
            <div className="col-span-2 text-center">Ответы</div>
            <div className="col-span-2 text-center">Просмотры</div>
            <div className="col-span-1" />
          </div>
          {forumTopics.map((t) => (
            <div key={t.title} className="border border-border rounded-sm bg-card p-4 card-hover cursor-pointer">
              <div className="md:grid grid-cols-12 gap-4 items-center">
                <div className="col-span-7">
                  <div className="flex items-center gap-2 mb-1">
                    {t.hot && <Icon name="Flame" size={12} className="text-orange-400" />}
                    <span className="tag-security">{t.category}</span>
                  </div>
                  <div className="font-montserrat font-semibold text-sm text-foreground mt-2">{t.title}</div>
                </div>
                <div className="col-span-2 text-center mt-3 md:mt-0">
                  <div className="text-xs font-montserrat font-bold text-foreground">{t.replies}</div>
                  <div className="text-[10px] text-muted-foreground">ответов</div>
                </div>
                <div className="col-span-2 text-center">
                  <div className="text-xs font-montserrat font-bold text-foreground">{t.views}</div>
                  <div className="text-[10px] text-muted-foreground">просмотров</div>
                </div>
                <div className="col-span-1 text-right">
                  <Icon name="ChevronRight" size={14} className="text-muted-foreground ml-auto" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="border border-border rounded-sm bg-card p-5">
            <div className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest mb-4">Статистика</div>
            {[{ l: "Тем", v: "248" }, { l: "Ответов", v: "4 120" }, { l: "Участников", v: "1 240" }].map((s) => (
              <div key={s.l} className="flex justify-between py-2 border-b border-border last:border-0">
                <span className="text-xs text-muted-foreground">{s.l}</span>
                <span className="text-xs font-montserrat font-bold text-gold">{s.v}</span>
              </div>
            ))}
          </div>
          <div className="border border-border rounded-sm bg-card p-5">
            <div className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest mb-4">Разделы</div>
            {["Право и лицензирование", "Оборудование", "Методики", "Обучение", "Бизнес"].map((r) => (
              <div key={r} className="flex items-center gap-2 py-2 border-b border-border last:border-0 cursor-pointer">
                <div className="w-1 h-1 rounded-full bg-gold" />
                <span className="text-xs text-muted-foreground hover:text-gold transition-colors">{r}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ContactsSection() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-10 animate-fade-in">
      <div className="mb-10">
        <div className="tag-security mb-3 inline-block">Поддержка</div>
        <h2 className="font-montserrat font-bold text-3xl text-foreground mb-2">Контакты</h2>
        <p className="text-muted-foreground text-sm">Мы готовы помочь вам по любым вопросам работы платформы</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="border border-border rounded-sm bg-card p-8">
          <div className="text-sm font-montserrat font-bold text-foreground mb-6">Написать в поддержку</div>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest block mb-2">Имя</label>
              <input placeholder="Ваше имя" className="w-full bg-secondary border border-border rounded-sm px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-gold transition-colors" />
            </div>
            <div>
              <label className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest block mb-2">Email</label>
              <input placeholder="your@email.com" className="w-full bg-secondary border border-border rounded-sm px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-gold transition-colors" />
            </div>
            <div>
              <label className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest block mb-2">Тема</label>
              <select className="w-full bg-secondary border border-border rounded-sm px-4 py-3 text-sm text-muted-foreground outline-none focus:border-gold transition-colors">
                <option>Верификация аккаунта</option>
                <option>Вопрос об оплате</option>
                <option>Технические проблемы</option>
                <option>Жалоба на специалиста</option>
                <option>Другое</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest block mb-2">Сообщение</label>
              <textarea rows={4} placeholder="Опишите ваш вопрос..." className="w-full bg-secondary border border-border rounded-sm px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-gold transition-colors resize-none" />
            </div>
            <button className="w-full gold-gradient text-[hsl(220,20%,6%)] py-3.5 font-montserrat font-bold text-sm rounded-sm hover:opacity-90 transition-opacity">
              Отправить сообщение
            </button>
          </div>
        </div>

        <div className="space-y-5">
          {[
            { icon: "Mail", title: "Email поддержки", val: "support@securenet.ru", desc: "Ответим в течение 4 рабочих часов" },
            { icon: "Phone", title: "Телефон", val: "+7 (495) 123-45-67", desc: "Пн–Пт, 09:00–18:00 МСК" },
            { icon: "MessageSquare", title: "Telegram", val: "@securenet_support", desc: "Быстрые ответы в рабочие часы" },
            { icon: "MapPin", title: "Юридический адрес", val: "125009, Москва, ул. Тверская, д. 1", desc: "ООО «СекьюрНет», ИНН 7701234567" },
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
              <div className="text-xs font-montserrat font-semibold text-gold">Время работы поддержки</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { d: "Понедельник–Пятница", t: "09:00 – 20:00" },
                { d: "Суббота", t: "10:00 – 16:00" },
                { d: "Воскресенье", t: "Выходной" },
                { d: "Праздники", t: "По расписанию" },
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
