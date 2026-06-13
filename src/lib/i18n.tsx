import { createContext, useContext, useState, ReactNode } from "react";

export type Lang = "ru" | "en";

type Dict = Record<string, { ru: string; en: string }>;

export const t: Dict = {
  // Brand / header
  brandSub: { ru: "Профессиональная платформа", en: "Professional Platform" },
  login: { ru: "Войти", en: "Sign in" },
  join: { ru: "Вступить", en: "Join" },

  // Nav
  navHome: { ru: "Главная", en: "Home" },
  navProfile: { ru: "Профиль", en: "Profile" },
  navCases: { ru: "Кейсы", en: "Cases" },
  navServices: { ru: "Услуги", en: "Services" },
  navCourses: { ru: "Курсы", en: "Courses" },
  navGuards: { ru: "Охрана", en: "Security Firms" },
  navChat: { ru: "Чат", en: "Chat" },
  navForum: { ru: "Форум", en: "Forum" },
  navContacts: { ru: "Контакты", en: "Contacts" },

  // Breadcrumb
  crumbHome: { ru: "Главная", en: "Home" },
  crumbProfile: { ru: "Специалисты", en: "Specialists" },
  crumbCases: { ru: "Кейсы", en: "Cases" },
  crumbServices: { ru: "Услуги", en: "Services" },
  crumbCourses: { ru: "Курсы", en: "Courses" },
  crumbGuards: { ru: "Охранные предприятия", en: "Security Firms" },
  crumbChat: { ru: "Чат", en: "Chat" },
  crumbForum: { ru: "Форум", en: "Forum" },
  crumbContacts: { ru: "Контакты", en: "Contacts" },

  // Hero
  closedPlatform: { ru: "Закрытая платформа", en: "Private Platform" },
  verifyAll: { ru: "Верификация всех участников", en: "All members verified" },
  heroTitle1: { ru: "Профессионалы", en: "Security" },
  heroTitle2: { ru: "безопасности", en: "professionals" },
  heroTitle3: { ru: "по всему миру", en: "worldwide" },
  heroDesc: {
    ru: "Международное верифицированное сообщество полиграфологов, частных детективов, TSCM-специалистов, охранных предприятий и экспертов корпоративной безопасности. Кейсы, услуги, курсы и деловые связи — в одном месте.",
    en: "International verified community of polygraph examiners, private investigators, TSCM specialists, security firms and corporate security experts. Cases, services, courses and business connections — all in one place.",
  },
  findSpecialist: { ru: "Найти специалиста", en: "Find a specialist" },
  viewCases: { ru: "Смотреть кейсы", en: "View cases" },
  trust1: { ru: "Проверенные лицензии", en: "Verified licenses" },
  trust2: { ru: "Конфиденциальность", en: "Confidentiality" },
  trust3: { ru: "Работа в правовом поле", en: "Fully compliant" },

  // Stats
  statSpecialists: { ru: "Верифицированных специалистов", en: "Verified specialists" },
  statCases: { ru: "Реализованных кейсов", en: "Completed cases" },
  statServices: { ru: "Доступных услуг", en: "Available services" },
  statClients: { ru: "Довольных клиентов", en: "Satisfied clients" },

  // Sections common
  specialists: { ru: "Специалисты", en: "Specialists" },
  topExperts: { ru: "Топ-эксперты платформы", en: "Top platform experts" },
  allSpecialists: { ru: "Все специалисты", en: "All specialists" },
  contactBtn: { ru: "Связаться", en: "Contact" },
  profileBtn: { ru: "Профиль", en: "Profile" },
  cost: { ru: "Стоимость услуг", en: "Starting price" },
  reviews: { ru: "отзывов", en: "reviews" },
  yearsShort: { ru: "лет", en: "yrs" },

  // Process
  process: { ru: "Процесс", en: "Process" },
  howItWorks: { ru: "Как работает платформа", en: "How the platform works" },
  step1Title: { ru: "Регистрация", en: "Registration" },
  step1Desc: { ru: "Подаёте заявку и проходите верификацию документов и лицензий", en: "Submit an application and pass document and license verification" },
  step2Title: { ru: "Профиль и кейсы", en: "Profile & cases" },
  step2Desc: { ru: "Публикуете портфолио, кейсы и формируете профессиональную репутацию", en: "Publish your portfolio, cases and build a professional reputation" },
  step3Title: { ru: "Сделки", en: "Deals" },
  step3Desc: { ru: "Получаете заказы от клиентов через защищённую систему расчётов", en: "Receive orders from clients via a secure payment system" },
  step4Title: { ru: "Рост", en: "Growth" },
  step4Desc: { ru: "Развиваетесь, обучаетесь и расширяете сеть деловых контактов", en: "Develop, learn and expand your network of business contacts" },

  // Features
  features: { ru: "Возможности", en: "Features" },
  whyUs: { ru: "Почему выбирают SecureNet", en: "Why choose SecureNet" },
  feat1Title: { ru: "Верификация специалистов", en: "Specialist verification" },
  feat1Desc: { ru: "Каждый участник проходит проверку документов, лицензий и профессиональной репутации", en: "Every member is screened for documents, licenses and professional reputation" },
  feat2Title: { ru: "Закрытое сообщество", en: "Private community" },
  feat2Desc: { ru: "Доступ только для практикующих специалистов в сфере безопасности. Без посторонних", en: "Access for practicing security professionals only. No outsiders" },
  feat3Title: { ru: "Безопасные платежи", en: "Secure payments" },
  feat3Desc: { ru: "Интегрированная система расчётов с автоматическим распределением комиссий", en: "Integrated payment system with automatic commission distribution" },
  feat4Title: { ru: "База знаний", en: "Knowledge base" },
  feat4Desc: { ru: "Тысячи кейсов, методических материалов и обучающих программ от практиков", en: "Thousands of cases, methodologies and training programs from practitioners" },
  feat5Title: { ru: "Деловые связи", en: "Business network" },
  feat5Desc: { ru: "Находите партнёров, коллег и клиентов в своей профессиональной нише", en: "Find partners, colleagues and clients in your professional niche" },
  feat6Title: { ru: "Репутация и рейтинг", en: "Reputation & rating" },
  feat6Desc: { ru: "Прозрачная система оценки и отзывов для формирования профессиональной репутации", en: "A transparent rating and review system to build your reputation" },

  // Testimonial
  testimonialText: {
    ru: "«За год на платформе я полностью закрыл вопрос поиска корпоративных клиентов. Закрытое сообщество профессионалов — это совсем другой уровень доверия и качества заказов».",
    en: "\"In a year on the platform I fully solved the problem of finding corporate clients. A private community of professionals is a whole new level of trust and order quality.\"",
  },

  // CTA
  closedAccess: { ru: "Закрытый доступ", en: "Private access" },
  ctaTitle1: { ru: "Вступите в профессиональное", en: "Join the professional" },
  ctaTitle2: { ru: "сообщество сегодня", en: "community today" },
  ctaDesc: { ru: "Оставьте заявку на верификацию — наша команда свяжется с вами в течение 24 часов для проверки профессиональных документов", en: "Submit a verification request — our team will contact you within 24 hours to check your professional documents" },
  applyJoin: { ru: "Подать заявку на вступление", en: "Apply to join" },
  contactUs: { ru: "Связаться с нами", en: "Contact us" },

  // Profile
  profileSection: { ru: "Профиль специалиста", en: "Specialist profile" },
  back: { ru: "Назад", en: "Back" },
  orderService: { ru: "Заказать услугу", en: "Order a service" },
  casesCount: { ru: "Кейсов", en: "Cases" },
  reviewsCount: { ru: "Отзывов", en: "Reviews" },
  success: { ru: "Успех", en: "Success" },
  specialization: { ru: "Специализация", en: "Specialization" },
  certificates: { ru: "Сертификаты", en: "Certificates" },
  aboutSpecialist: { ru: "О специалисте", en: "About the specialist" },
  aboutText: {
    ru: "Профессиональный полиграфолог с 12-летним опытом проведения психофизиологических исследований. Специализируюсь на корпоративных проверках, HR-скрининге при приёме на работу и расследовании инцидентов. Провёл более 3 000 индивидуальных сессий.",
    en: "Professional polygraph examiner with 12 years of experience conducting psychophysiological examinations. Specializing in corporate screenings, HR pre-employment checks and incident investigations. Conducted over 3,000 individual sessions.",
  },
  tabCases: { ru: "Кейсы", en: "Cases" },
  tabServices: { ru: "Услуги", en: "Services" },
  tabReviews: { ru: "Отзывы", en: "Reviews" },

  // Cases
  knowledgeBase: { ru: "База знаний", en: "Knowledge base" },
  proCases: { ru: "Профессиональные кейсы", en: "Professional cases" },
  publishCase: { ru: "+ Опубликовать кейс", en: "+ Publish a case" },
  catAll: { ru: "Все", en: "All" },
  topAuthors: { ru: "Топ авторов", en: "Top authors" },
  popularTags: { ru: "Популярные теги", en: "Popular tags" },

  // Services
  catalog: { ru: "Каталог", en: "Catalog" },
  servicesTitle: { ru: "Услуги специалистов", en: "Specialist services" },
  servicesDesc: { ru: "Профессиональные услуги верифицированных экспертов с гарантией качества", en: "Professional services from verified experts with a quality guarantee" },
  searchServices: { ru: "Поиск услуг...", en: "Search services..." },
  search: { ru: "Найти", en: "Search" },
  order: { ru: "Заказать", en: "Order" },
  commission: { ru: "Комиссия платформы", en: "Platform commission" },
  commissionDesc: { ru: "Платформа берёт комиссию 8–12% от суммы сделки. Оплата через безопасную сделку — ваши деньги защищены до подтверждения выполнения заказа", en: "The platform charges an 8–12% commission of the deal amount. Payment via secure escrow — your money is protected until the order is confirmed completed" },
  more: { ru: "Подробнее", en: "Learn more" },

  // Courses
  education: { ru: "Обучение", en: "Education" },
  coursesTitle: { ru: "Курсы и тренинги", en: "Courses & training" },
  coursesDesc: { ru: "Обучающие программы от действующих практиков отрасли", en: "Training programs from active industry practitioners" },
  enroll: { ru: "Записаться", en: "Enroll" },
  students: { ru: "студентов", en: "students" },
  coursesStat: { ru: "Курсов", en: "Courses" },
  graduates: { ru: "Выпускников", en: "Graduates" },
  instructors: { ru: "Преподавателей", en: "Instructors" },
  avgRating: { ru: "Средний рейтинг", en: "Avg. rating" },

  // Guards (Security firms)
  guardsTag: { ru: "Охранные предприятия", en: "Security firms" },
  guardsTitle: { ru: "Охранные предприятия", en: "Security firms" },
  guardsDesc: { ru: "Лицензированные охранные компании для бизнеса и частных клиентов по всему миру", en: "Licensed security companies for businesses and private clients worldwide" },
  searchGuards: { ru: "Поиск охранных компаний...", en: "Search security firms..." },
  employees: { ru: "сотрудников", en: "employees" },
  founded: { ru: "Основана", en: "Founded" },
  objects: { ru: "объектов", en: "sites" },
  requestQuote: { ru: "Запросить КП", en: "Request a quote" },
  guardServices: { ru: "Услуги охраны", en: "Security services" },
  licensed: { ru: "ЛИЦЕНЗИРОВАНА", en: "LICENSED" },
  whyGuards: { ru: "Что вы получаете", en: "What you get" },

  // Chat
  community: { ru: "Сообщество", en: "Community" },
  proChat: { ru: "Профессиональный чат", en: "Professional chat" },
  channels: { ru: "Каналы", en: "Channels" },
  online: { ru: "онлайн", en: "online" },
  writeMessage: { ru: "Написать в #общий-чат...", en: "Write in #general..." },

  // Forum
  discussions: { ru: "Дискуссии", en: "Discussions" },
  proForum: { ru: "Профессиональный форум", en: "Professional forum" },
  createTopic: { ru: "+ Создать тему", en: "+ New topic" },
  topic: { ru: "Тема", en: "Topic" },
  replies: { ru: "Ответы", en: "Replies" },
  views: { ru: "Просмотры", en: "Views" },
  repliesLower: { ru: "ответов", en: "replies" },
  viewsLower: { ru: "просмотров", en: "views" },
  statistics: { ru: "Статистика", en: "Statistics" },
  topics: { ru: "Тем", en: "Topics" },
  answers: { ru: "Ответов", en: "Answers" },
  members: { ru: "Участников", en: "Members" },
  sections: { ru: "Разделы", en: "Sections" },

  // Contacts
  support: { ru: "Поддержка", en: "Support" },
  contactsTitle: { ru: "Контакты", en: "Contacts" },
  contactsDesc: { ru: "Мы готовы помочь вам по любым вопросам работы платформы", en: "We're ready to help with any questions about the platform" },
  writeSupport: { ru: "Написать в поддержку", en: "Contact support" },
  name: { ru: "Имя", en: "Name" },
  yourName: { ru: "Ваше имя", en: "Your name" },
  subject: { ru: "Тема", en: "Subject" },
  message: { ru: "Сообщение", en: "Message" },
  describeQuestion: { ru: "Опишите ваш вопрос...", en: "Describe your question..." },
  sendMessage: { ru: "Отправить сообщение", en: "Send message" },
  subjVerify: { ru: "Верификация аккаунта", en: "Account verification" },
  subjPayment: { ru: "Вопрос об оплате", en: "Payment question" },
  subjTech: { ru: "Технические проблемы", en: "Technical issues" },
  subjComplaint: { ru: "Жалоба на специалиста", en: "Complaint about a specialist" },
  subjOther: { ru: "Другое", en: "Other" },
  emailSupport: { ru: "Email поддержки", en: "Support email" },
  emailSupportDesc: { ru: "Ответим в течение 4 рабочих часов", en: "We reply within 4 business hours" },
  phone: { ru: "Телефон", en: "Phone" },
  phoneDesc: { ru: "Пн–Пт, 09:00–18:00 МСК", en: "Mon–Fri, 09:00–18:00 GMT+3" },
  telegramDesc: { ru: "Быстрые ответы в рабочие часы", en: "Quick replies during business hours" },
  legalAddress: { ru: "Юридический адрес", en: "Registered address" },
  workHours: { ru: "Время работы поддержки", en: "Support hours" },
  monFri: { ru: "Понедельник–Пятница", en: "Monday–Friday" },
  sat: { ru: "Суббота", en: "Saturday" },
  sun: { ru: "Воскресенье", en: "Sunday" },
  holidays: { ru: "Праздники", en: "Holidays" },
  dayOff: { ru: "Выходной", en: "Closed" },
  bySchedule: { ru: "По расписанию", en: "By schedule" },

  // Security / encryption section
  secBanner: { ru: "Платформа зашифрована и максимально защищена", en: "The platform is encrypted and maximally protected" },
  secBannerSub: { ru: "Все данные клиентов и специалистов под защитой сквозного шифрования", en: "All client and specialist data is protected by end-to-end encryption" },
  secTag: { ru: "Безопасность", en: "Security" },
  secTitle: { ru: "Шифрование и защита данных", en: "Encryption & data protection" },
  secDesc: { ru: "Мы применяем многоуровневую защиту военного класса. Данные клиентов и специалистов шифруются на каждом этапе — от входа до хранения и переписки.", en: "We apply multi-layered military-grade protection. Client and specialist data is encrypted at every stage — from login to storage and messaging." },
  sec1Title: { ru: "Защита входа", en: "Login protection" },
  sec1Desc: { ru: "Пароли хранятся в виде необратимых хешей, сессии защищены токенами, доступна двухфакторная аутентификация", en: "Passwords are stored as irreversible hashes, sessions are protected by tokens, two-factor authentication available" },
  sec2Title: { ru: "Персональные данные", en: "Personal data" },
  sec2Desc: { ru: "Телефоны, email и документы шифруются алгоритмом AES-256 перед записью в базу данных", en: "Phone numbers, emails and documents are encrypted with AES-256 before being written to the database" },
  sec3Title: { ru: "Сквозное шифрование переписки", en: "End-to-end messaging" },
  sec3Desc: { ru: "Сообщения чата и заявки защищены сквозным шифрованием — доступ только у отправителя и получателя", en: "Chat messages and requests are protected by end-to-end encryption — accessible only to sender and recipient" },
  sec4Title: { ru: "Защищённое соединение", en: "Secure connection" },
  sec4Desc: { ru: "Весь трафик передаётся по протоколу TLS 1.3 с принудительным HTTPS на всех страницах", en: "All traffic is transmitted over TLS 1.3 with enforced HTTPS on every page" },
  sec5Title: { ru: "Контроль доступа", en: "Access control" },
  sec5Desc: { ru: "Строгое разграничение прав, журналирование действий и регулярный аудит безопасности", en: "Strict role-based permissions, action logging and regular security audits" },
  sec6Title: { ru: "Соответствие стандартам", en: "Compliance" },
  sec6Desc: { ru: "Обработка данных соответствует требованиям GDPR и 152-ФЗ «О персональных данных»", en: "Data processing complies with GDPR and personal data protection regulations" },
  secBadge1: { ru: "Шифрование AES-256", en: "AES-256 encryption" },
  secBadge2: { ru: "TLS 1.3 / HTTPS", en: "TLS 1.3 / HTTPS" },
  secBadge3: { ru: "GDPR-совместимость", en: "GDPR compliant" },
  secBadge4: { ru: "Двухфакторная защита", en: "Two-factor security" },
  secStat1: { ru: "Шифрование данных", en: "Data encryption" },
  secStat2: { ru: "Утечек данных", en: "Data breaches" },
  secStat3: { ru: "Мониторинг угроз", en: "Threat monitoring" },

  // Footer
  footerDesc: { ru: "Международное закрытое сообщество для специалистов в сфере безопасности", en: "International private community for security professionals" },
  footerPlatform: { ru: "Платформа", en: "Platform" },
  footerCommunity: { ru: "Сообщество", en: "Community" },
  footerDocs: { ru: "Документы", en: "Legal" },
  rights: { ru: "© 2024 SecureNet. Все права защищены.", en: "© 2024 SecureNet. All rights reserved." },
  forVerified: { ru: "Платформа для верифицированных специалистов", en: "A platform for verified professionals" },
  fAbout: { ru: "О нас", en: "About" },
  fSpecialists: { ru: "Специалисты", en: "Specialists" },
  fEvents: { ru: "Мероприятия", en: "Events" },
  fNews: { ru: "Новости отрасли", en: "Industry news" },
  fPrivacy: { ru: "Политика конфиденциальности", en: "Privacy Policy" },
  fTerms: { ru: "Условия использования", en: "Terms of Use" },
  fAgreement: { ru: "Пользовательское соглашение", en: "User Agreement" },
  fOffer: { ru: "Оферта", en: "Public Offer" },
};

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  tr: (key: keyof typeof t) => string;
}

const LanguageContext = createContext<LangCtx>({
  lang: "ru",
  setLang: () => {},
  tr: (k) => String(k),
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("ru");
  const tr = (key: keyof typeof t) => t[key]?.[lang] ?? String(key);
  return (
    <LanguageContext.Provider value={{ lang, setLang, tr }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLang = () => useContext(LanguageContext);