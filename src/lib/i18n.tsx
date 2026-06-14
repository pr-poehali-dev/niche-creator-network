import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { extra, type ExtraLang } from "./i18n-extra";

export type Lang = "ru" | "en" | "fr" | "de" | "ja" | "ar" | "he";

export const LANGS: { code: Lang; label: string; flag: string; rtl?: boolean }[] = [
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "ja", label: "日本語", flag: "🇯🇵" },
  { code: "ar", label: "العربية", flag: "🇸🇦", rtl: true },
  { code: "he", label: "עברית", flag: "🇮🇱", rtl: true },
];

export const RTL_LANGS: Lang[] = ["ar", "he"];

type Dict = Record<string, { ru: string; en: string }>;

export const t: Dict = {
  // Brand / header
  brandSub: { ru: "Профессиональная платформа", en: "Professional Platform" },
  login: { ru: "Войти", en: "Sign in" },
  join: { ru: "Вступить", en: "Join" },

  // Auth
  authCabinet: { ru: "Кабинет", en: "Account" },
  authEnter: { ru: "Войти в кабинет", en: "Sign in to account" },
  authTabLogin: { ru: "Вход", en: "Sign in" },
  authTabRegister: { ru: "Регистрация", en: "Register" },
  authEmail: { ru: "Email", en: "Email" },
  authPassword: { ru: "Пароль", en: "Password" },
  authName: { ru: "Имя", en: "Name" },
  authNamePh: { ru: "Как к вам обращаться", en: "How should we call you" },
  authRoleQuestion: { ru: "Кто вы?", en: "Who are you?" },
  authLoginBtn: { ru: "Войти", en: "Sign in" },
  authRegisterBtn: { ru: "Создать аккаунт", en: "Create account" },
  authNoAccount: { ru: "Нет аккаунта?", en: "No account?" },
  authHaveAccount: { ru: "Уже есть аккаунт?", en: "Already have an account?" },
  authToRegister: { ru: "Зарегистрироваться", en: "Register" },
  authToLogin: { ru: "Войти", en: "Sign in" },
  authErrInvalid: { ru: "Неверный email или пароль", en: "Invalid email or password" },
  authErrExists: { ru: "Пользователь с таким email уже есть", en: "User with this email already exists" },
  authErrWeak: { ru: "Пароль минимум 6 символов", en: "Password must be at least 6 characters" },
  authErrEmail: { ru: "Введите корректный email", en: "Enter a valid email" },
  authErrGeneric: { ru: "Что-то пошло не так. Попробуйте ещё раз", en: "Something went wrong. Try again" },
  authSecureNote: { ru: "Данные защищены шифрованием", en: "Your data is encrypted" },
  authBusy: { ru: "Подождите...", en: "Please wait..." },
  consentIntro: { ru: "Регистрируясь, я подтверждаю, что мне есть 18 лет, и принимаю:", en: "By registering, I confirm I am at least 18 years old and accept:" },
  consentPrivacy: { ru: "Политику конфиденциальности", en: "Privacy Policy" },
  consentTerms: { ru: "Условия использования", en: "Terms of Use" },
  consentAgreement: { ru: "Пользовательское соглашение", en: "User Agreement" },
  consentOffer: { ru: "Оферту", en: "Public Offer" },
  consentCookie: { ru: "а также даю согласие на обработку персональных данных и использование cookie.", en: "and I consent to the processing of personal data and the use of cookies." },
  authErrConsent: { ru: "Нужно принять условия, чтобы продолжить", en: "You must accept the terms to continue" },
  reqName: { ru: "ИП Давыдов Алексей Владимирович", en: "Sole proprietor Aleksey Vladimirovich Davydov" },
  reqOgrnip: { ru: "ОГРНИП: 320222500068242", en: "OGRNIP: 320222500068242" },
  reqInn: { ru: "ИНН: 222111361597", en: "TIN: 222111361597" },
  reqAddress: { ru: "Адрес: Московская область, г. Электросталь, пос. Всеволодово", en: "Address: Moscow Region, Elektrostal, Vsevolodovo settlement" },
  reqTaxOffice: { ru: "Налоговый орган: Межрайонная инспекция ФНС России №6 по Московской области", en: "Tax authority: Interdistrict Inspectorate of the Federal Tax Service No. 6 for Moscow Region" },
  authAdminLink: { ru: "Вход для администратора", en: "Administrator login" },
  authAdminTitle: { ru: "Вход администратора", en: "Administrator login" },
  authAdminPassword: { ru: "Пароль администратора", en: "Administrator password" },
  authAdminViewAs: { ru: "Войти как", en: "View as" },
  authAdminBtn: { ru: "Войти", en: "Sign in" },
  authBackToLogin: { ru: "Назад ко входу", en: "Back to sign in" },

  // Minimal home / promo
  promoTitle1: { ru: "Проверенные специалисты", en: "Verified specialists" },
  promoTitle2: { ru: "по безопасности", en: "in security" },
  promoDesc: { ru: "Детективы, телохранители, полиграфологи и охранные агентства со всего мира. Для клиентов — бесплатно. Для исполнителей — поток заявок и продвижение.", en: "Detectives, bodyguards, polygraph examiners and security agencies worldwide. Free for clients. For providers — a flow of leads and promotion." },
  promoForClients: { ru: "Клиентам — подбор и связь со специалистами бесплатно", en: "For clients — find and contact specialists for free" },
  promoForProviders: { ru: "Исполнителям — заявки, профиль и репутация", en: "For providers — leads, profile and reputation" },
  homeSecTitle: { ru: "Безопасность платформы", en: "Platform security" },
  homeSec1: { ru: "Проверка лицензий и документов исполнителей", en: "License and document verification of providers" },
  homeSec2: { ru: "Шифрование данных и защита переписки", en: "Data encryption and message protection" },
  homeSec3: { ru: "Конфиденциальность и право на псевдоним", en: "Confidentiality and the right to an alias" },
  homeOpenCabinet: { ru: "Войти в кабинет", en: "Open account" },
  homeReadPolicy: { ru: "Подробнее о безопасности", en: "More about security" },

  // Roles
  roleClient: { ru: "Я клиент", en: "I'm a client" },
  roleProvider: { ru: "Я исполнитель", en: "I'm a provider" },
  navPricing: { ru: "Тарифы", en: "Pricing" },
  crumbPricing: { ru: "Тарифы", en: "Pricing" },
  navDashboard: { ru: "Кабинет", en: "Dashboard" },
  crumbDashboard: { ru: "Личный кабинет", en: "Dashboard" },

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
  whyUs: { ru: "Почему выбирают ЩИТ", en: "Why choose SHCHIT" },
  feat1Title: { ru: "Верификация специалистов", en: "Specialist verification" },
  feat1Desc: { ru: "Каждый участник проходит проверку документов, лицензий и профессиональной репутации", en: "Every member is screened for documents, licenses and professional reputation" },
  feat2Title: { ru: "Закрытое сообщество", en: "Private community" },
  feat2Desc: { ru: "Доступ только для практикующих специалистов в сфере безопасности. Без посторонних", en: "Access for practicing security professionals only. No outsiders" },
  feat3Title: { ru: "Прямые контакты", en: "Direct contacts" },
  feat3Desc: { ru: "Связывайтесь с исполнителем напрямую — звонок, чат и мессенджеры без посредников и комиссий", en: "Reach providers directly — call, chat and messengers, no middlemen or fees" },
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
  noCommissionTitle: { ru: "Без комиссии за сделки", en: "Zero deal commission" },
  noCommissionDesc: { ru: "Платформа не берёт процент с заказов. Вы общаетесь с исполнителем напрямую и платите ему напрямую — мы зарабатываем только на тарифах для специалистов.", en: "The platform takes no percentage from orders. You deal and pay the provider directly — we earn only from specialist subscription plans." },
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
  secReadPolicy: { ru: "Читать политику безопасности", en: "Read the security policy" },

  // Security policy page
  navPolicy: { ru: "Политика безопасности", en: "Security Policy" },
  crumbPolicy: { ru: "Политика безопасности", en: "Security Policy" },
  polTag: { ru: "Документ", en: "Document" },
  polTitle: { ru: "Политика безопасности", en: "Security Policy" },
  polUpdated: { ru: "Последнее обновление: 13 июня 2026", en: "Last updated: June 13, 2026" },
  polIntro: { ru: "Настоящая Политика описывает меры, которые «ЩИТ» применяет для защиты данных клиентов и специалистов. Безопасность — основа доверия в нашей профессиональной нише, поэтому мы используем многоуровневую защиту на каждом этапе работы платформы.", en: "This Policy describes the measures SHCHIT applies to protect the data of clients and specialists. Security is the foundation of trust in our professional niche, so we use multi-layered protection at every stage of the platform." },

  polNav: { ru: "Содержание", en: "Contents" },

  pol1Title: { ru: "1. Шифрование данных", en: "1. Data encryption" },
  pol1Text: { ru: "Все персональные данные — телефоны, email, документы и реквизиты — шифруются алгоритмом AES-256 перед сохранением в базе данных. Ключи шифрования хранятся отдельно от данных в защищённом хранилище секретов и недоступны напрямую сотрудникам платформы.", en: "All personal data — phone numbers, emails, documents and credentials — is encrypted with AES-256 before being stored in the database. Encryption keys are stored separately from the data in a protected secrets vault and are not directly accessible to platform staff." },

  pol2Title: { ru: "2. Защита аутентификации", en: "2. Authentication security" },
  pol2Text: { ru: "Пароли никогда не хранятся в открытом виде — мы используем необратимое хеширование (bcrypt) с индивидуальной солью. Сессии защищены подписанными токенами с ограниченным сроком действия. Для специалистов доступна двухфакторная аутентификация (2FA).", en: "Passwords are never stored in plain text — we use irreversible hashing (bcrypt) with a unique salt. Sessions are protected by signed tokens with a limited lifetime. Two-factor authentication (2FA) is available for specialists." },

  pol3Title: { ru: "3. Сквозное шифрование переписки", en: "3. End-to-end messaging" },
  pol3Text: { ru: "Сообщения в чате и данные форм заявок передаются по защищённым каналам со сквозным шифрованием. Содержимое переписки доступно только отправителю и получателю — платформа не имеет доступа к расшифрованному тексту сообщений.", en: "Chat messages and request form data are transmitted over secure channels with end-to-end encryption. Message content is accessible only to the sender and recipient — the platform has no access to the decrypted message text." },

  pol4Title: { ru: "4. Защищённое соединение", en: "4. Secure connection" },
  pol4Text: { ru: "Весь трафик между вашим устройством и платформой передаётся по протоколу TLS 1.3 с принудительным HTTPS на всех страницах. Это исключает перехват и подмену данных при передаче через интернет.", en: "All traffic between your device and the platform is transmitted over TLS 1.3 with enforced HTTPS on every page. This prevents interception and tampering of data in transit over the internet." },

  pol5Title: { ru: "5. Контроль доступа", en: "5. Access control" },
  pol5Text: { ru: "Доступ к данным строго разграничен по ролям: каждый сотрудник и пользователь видит только ту информацию, которая необходима для его задач. Все действия с чувствительными данными журналируются, а доступ регулярно пересматривается.", en: "Data access is strictly segregated by role: each employee and user sees only the information necessary for their tasks. All actions with sensitive data are logged, and access is reviewed regularly." },

  pol6Title: { ru: "6. Верификация участников", en: "6. Member verification" },
  pol6Text: { ru: "Каждый специалист и охранное предприятие проходят проверку документов и лицензий перед допуском на платформу. Это снижает риск мошенничества и гарантирует, что вы работаете только с проверенными профессионалами.", en: "Every specialist and security firm undergoes document and license verification before being admitted to the platform. This reduces the risk of fraud and ensures that you work only with verified professionals." },

  pol7Title: { ru: "7. Резервное копирование", en: "7. Backups" },
  pol7Text: { ru: "Данные регулярно резервируются в зашифрованном виде в географически распределённых хранилищах. Это обеспечивает восстановление информации при любых сбоях без потери данных.", en: "Data is regularly backed up in encrypted form across geographically distributed storage. This ensures information recovery in case of any failure without data loss." },

  pol8Title: { ru: "8. Соответствие стандартам", en: "8. Compliance" },
  pol8Text: { ru: "Обработка персональных данных соответствует требованиям GDPR и законодательства о защите персональных данных. Вы вправе запросить доступ к своим данным, их исправление или удаление в любой момент.", en: "Personal data processing complies with GDPR and personal data protection legislation. You have the right to request access to your data, its correction or deletion at any time." },

  polContactTitle: { ru: "Вопросы по безопасности?", en: "Security questions?" },
  polContactText: { ru: "Если у вас есть вопросы о защите данных или вы обнаружили уязвимость — свяжитесь с нашей командой безопасности.", en: "If you have questions about data protection or have discovered a vulnerability — contact our security team." },
  polContactBtn: { ru: "Связаться с поддержкой", en: "Contact support" },

  // ===== Legal documents (shared) =====
  lglTag: { ru: "Юридический документ", en: "Legal document" },
  lglDisclaimer: {
    ru: "Документ является публичной офертой и регулирует отношения между Платформой и Пользователями. Платформа выступает информационным посредником и не является стороной сделок между клиентами и исполнителями. Перед использованием сервиса рекомендуем ознакомиться со всеми документами. Актуальная редакция всегда доступна на этой странице.",
    en: "This document is a public offer governing the relationship between the Platform and Users. The Platform acts as an information intermediary and is not a party to transactions between clients and providers. We recommend reviewing all documents before using the service. The current version is always available on this page.",
  },

  // ===== Privacy Policy (GDPR + 152-FZ + payment data) =====
  privIntro: {
    ru: "Настоящая Политика конфиденциальности описывает, как Платформа собирает, использует, хранит и защищает персональные данные Пользователей. Платформа работает на международном уровне и соблюдает требования Общего регламента ЕС о защите данных (GDPR), Федерального закона РФ № 152-ФЗ «О персональных данных», а также применимого законодательства иных юрисдикций. Используя сервис, вы соглашаетесь с условиями данной Политики.",
    en: "This Privacy Policy describes how the Platform collects, uses, stores and protects Users' personal data. The Platform operates internationally and complies with the EU General Data Protection Regulation (GDPR), Russian Federal Law No. 152-FZ 'On Personal Data', and applicable laws of other jurisdictions. By using the service, you agree to the terms of this Policy.",
  },
  priv1Title: { ru: "1. Оператор и контактные данные", en: "1. Controller and contact details" },
  priv1Text: { ru: "Оператором обработки персональных данных является ИП Давыдов Алексей Владимирович (ОГРНИП: 320222500068242, ИНН: 222111361597, адрес: Московская область, г. Электросталь, пос. Всеволодово). Контактные данные оператора указаны в разделе «Контакты». По всем вопросам обработки данных вы можете обратиться по указанным реквизитам.", en: "The personal data controller is sole proprietor Aleksey Vladimirovich Davydov (OGRNIP: 320222500068242, TIN: 222111361597, address: Moscow Region, Elektrostal, Vsevolodovo settlement). The controller's contact details are listed in the 'Contacts' section. You may contact us using these details regarding any data processing matter." },
  priv2Title: { ru: "2. Какие данные мы собираем", en: "2. What data we collect" },
  priv2Text: { ru: "Мы обрабатываем: регистрационные данные (имя, email, роль), данные профиля (специализация, город, документы о квалификации), технические данные (IP-адрес, тип устройства, cookie), геолокацию (с вашего согласия) и платёжные данные. Полные реквизиты банковских карт нами не хранятся — оплата проводится через сертифицированных платёжных провайдеров.", en: "We process: registration data (name, email, role), profile data (specialization, city, qualification documents), technical data (IP address, device type, cookies), geolocation (with your consent), and payment data. We do not store full bank card details — payments are processed via certified payment providers." },
  priv3Title: { ru: "3. Цели и правовые основания обработки", en: "3. Purposes and legal basis for processing" },
  priv3Text: { ru: "Данные обрабатываются для: предоставления сервиса и исполнения договора (ст. 6(1)(b) GDPR), соблюдения юридических обязательств (ст. 6(1)(c)), на основании вашего согласия (ст. 6(1)(a)) и для законных интересов Платформы — безопасность и предотвращение мошенничества (ст. 6(1)(f)). Согласие может быть отозвано в любой момент.", en: "Data is processed for: providing the service and performing the contract (Art. 6(1)(b) GDPR), complying with legal obligations (Art. 6(1)(c)), on the basis of your consent (Art. 6(1)(a)), and for the Platform's legitimate interests — security and fraud prevention (Art. 6(1)(f)). Consent may be withdrawn at any time." },
  priv4Title: { ru: "4. Платёжные данные и безопасность оплаты", en: "4. Payment data and payment security" },
  priv4Text: { ru: "Все платежи обрабатываются сертифицированными платёжными системами, соответствующими стандарту PCI DSS. Платформа не получает и не хранит CVC-коды и полные номера карт. Данные передаются по защищённому каналу с шифрованием TLS. Мы храним только сведения о факте и сумме транзакции для бухгалтерии и возвратов.", en: "All payments are processed by certified PCI DSS-compliant payment systems. The Platform does not receive or store CVC codes or full card numbers. Data is transmitted over a secure TLS-encrypted channel. We retain only the fact and amount of a transaction for accounting and refunds." },
  priv5Title: { ru: "5. Передача данных третьим лицам", en: "5. Data sharing with third parties" },
  priv5Text: { ru: "Мы передаём данные только: платёжным провайдерам (для проведения оплаты), хостинг- и облачным сервисам (для работы Платформы), государственным органам (по законному требованию). Мы не продаём персональные данные. При трансграничной передаче применяются стандартные договорные положения ЕС или иные надлежащие гарантии.", en: "We share data only with: payment providers (to process payments), hosting and cloud services (to operate the Platform), and government authorities (upon lawful request). We do not sell personal data. For cross-border transfers, EU Standard Contractual Clauses or other appropriate safeguards apply." },
  priv6Title: { ru: "6. Cookie и технологии отслеживания", en: "6. Cookies and tracking technologies" },
  priv6Text: { ru: "Мы используем cookie для работы сервиса, аналитики и персонализации. Необходимые cookie обеспечивают базовую функциональность. Аналитические и маркетинговые cookie используются только с вашего согласия, которое вы можете изменить в настройках браузера или баннере согласия.", en: "We use cookies for the operation of the service, analytics, and personalization. Essential cookies provide basic functionality. Analytical and marketing cookies are used only with your consent, which you can change in your browser settings or the consent banner." },
  priv7Title: { ru: "7. Сроки хранения данных", en: "7. Data retention periods" },
  priv7Text: { ru: "Данные хранятся не дольше, чем необходимо для целей обработки или сроков, установленных законом (например, бухгалтерские документы). После прекращения использования аккаунта данные удаляются или обезличиваются, за исключением сведений, которые мы обязаны хранить по закону.", en: "Data is stored no longer than necessary for the purposes of processing or periods required by law (e.g., accounting records). After account closure, data is deleted or anonymized, except for information we are legally required to retain." },
  priv8Title: { ru: "8. Ваши права", en: "8. Your rights" },
  priv8Text: { ru: "Вы имеете право: на доступ к своим данным, исправление, удаление («право быть забытым»), ограничение обработки, переносимость данных, возражение против обработки и отзыв согласия. Для реализации прав обратитесь к оператору. Вы также вправе подать жалобу в надзорный орган по защите данных.", en: "You have the right to: access your data, rectification, erasure ('right to be forgotten'), restriction of processing, data portability, objection to processing, and withdrawal of consent. To exercise your rights, contact the controller. You also have the right to lodge a complaint with a data protection supervisory authority." },
  priv9Title: { ru: "9. Защита данных и изменения политики", en: "9. Data protection and changes to the policy" },
  priv9Text: { ru: "Мы применяем организационные и технические меры защиты: шифрование, контроль доступа, резервное копирование. Политика может обновляться; актуальная редакция всегда публикуется на этой странице с указанием даты. Существенные изменения мы доводим до сведения Пользователей.", en: "We apply organizational and technical protection measures: encryption, access control, backups. This Policy may be updated; the current version is always published on this page with the date indicated. We notify Users of material changes." },

  // ===== Terms of Use =====
  termsIntro: {
    ru: "Настоящие Условия использования регулируют доступ и использование Платформы. Платформа — это информационный сервис, соединяющий клиентов и проверенных исполнителей в сфере безопасности. Платформа не оказывает услуги безопасности самостоятельно и не является стороной договоров между Пользователями.",
    en: "These Terms of Use govern access to and use of the Platform. The Platform is an information service connecting clients with verified security providers. The Platform does not provide security services itself and is not a party to contracts between Users.",
  },
  terms1Title: { ru: "1. Принятие условий", en: "1. Acceptance of terms" },
  terms1Text: { ru: "Используя Платформу, вы подтверждаете, что вам исполнилось 18 лет, вы обладаете дееспособностью и принимаете настоящие Условия, Политику конфиденциальности и иные документы. Если вы не согласны — прекратите использование сервиса.", en: "By using the Platform, you confirm that you are at least 18 years old, have legal capacity, and accept these Terms, the Privacy Policy, and other documents. If you do not agree, please stop using the service." },
  terms2Title: { ru: "2. Роль Платформы", en: "2. Role of the Platform" },
  terms2Text: { ru: "Платформа выступает исключительно посредником и не несёт ответственности за качество, законность и результат услуг, оказываемых исполнителями. Все договорённости, оплата и исполнение услуг происходят напрямую между клиентом и исполнителем.", en: "The Platform acts solely as an intermediary and is not responsible for the quality, legality, or outcome of services rendered by providers. All arrangements, payments, and performance of services occur directly between the client and the provider." },
  terms3Title: { ru: "3. Обязанности пользователей", en: "3. User obligations" },
  terms3Text: { ru: "Пользователи обязуются: предоставлять достоверные данные, соблюдать законы своей юрисдикции, не использовать сервис в незаконных целях, уважать права других пользователей. Исполнители обязаны иметь необходимые лицензии и разрешения для оказываемых услуг.", en: "Users undertake to: provide accurate information, comply with the laws of their jurisdiction, not use the service for unlawful purposes, and respect the rights of other users. Providers must hold the necessary licenses and permits for the services they offer." },
  terms4Title: { ru: "4. Запрещённые действия", en: "4. Prohibited actions" },
  terms4Text: { ru: "Запрещено: размещать ложную информацию, нарушать закон, обходить системы безопасности, использовать сервис для мошенничества, спама или нарушения прав третьих лиц. Платформа вправе заблокировать аккаунт при нарушении настоящих Условий.", en: "It is prohibited to: post false information, violate the law, bypass security systems, use the service for fraud, spam, or infringement of third-party rights. The Platform may block an account for violating these Terms." },
  terms5Title: { ru: "5. Интеллектуальная собственность", en: "5. Intellectual property" },
  terms5Text: { ru: "Все материалы Платформы (дизайн, логотипы, тексты, код) защищены авторским правом и принадлежат владельцу Платформы. Контент, размещённый пользователями, остаётся их собственностью, но вы предоставляете Платформе право его отображения в рамках сервиса.", en: "All Platform materials (design, logos, texts, code) are protected by copyright and belong to the Platform owner. Content posted by users remains their property, but you grant the Platform the right to display it within the service." },
  terms6Title: { ru: "6. Ограничение ответственности", en: "6. Limitation of liability" },
  terms6Text: { ru: "Платформа предоставляется «как есть». В максимально допустимой законом степени Платформа не несёт ответственности за прямой или косвенный ущерб, возникший в результате использования сервиса, действий исполнителей или клиентов, а также за перерывы в работе сервиса.", en: "The Platform is provided 'as is'. To the maximum extent permitted by law, the Platform is not liable for any direct or indirect damages arising from use of the service, actions of providers or clients, or service interruptions." },
  terms7Title: { ru: "7. Применимое право и изменения", en: "7. Governing law and changes" },
  terms7Text: { ru: "Споры разрешаются в соответствии с применимым законодательством по месту регистрации владельца Платформы, с учётом императивных норм защиты прав потребителей в юрисдикции пользователя. Условия могут изменяться; продолжение использования сервиса означает принятие новой редакции.", en: "Disputes are resolved in accordance with the applicable law at the place of registration of the Platform owner, subject to mandatory consumer protection rules in the user's jurisdiction. The Terms may change; continued use of the service constitutes acceptance of the new version." },

  // ===== User Agreement =====
  agrIntro: {
    ru: "Пользовательское соглашение определяет правила регистрации, ведения аккаунта и взаимодействия Пользователей в рамках Платформы. Соглашение является обязательным для всех зарегистрированных пользователей.",
    en: "The User Agreement defines the rules for registration, account management, and interaction between Users on the Platform. The Agreement is binding on all registered users.",
  },
  agr1Title: { ru: "1. Регистрация и аккаунт", en: "1. Registration and account" },
  agr1Text: { ru: "Для доступа к функциям кабинета необходима регистрация с указанием достоверных данных. Вы несёте ответственность за сохранность пароля и за все действия, совершённые под вашим аккаунтом. Один пользователь не вправе создавать несколько аккаунтов для обмана системы.", en: "Access to account features requires registration with accurate information. You are responsible for keeping your password secure and for all actions performed under your account. A user may not create multiple accounts to deceive the system." },
  agr2Title: { ru: "2. Верификация исполнителей", en: "2. Provider verification" },
  agr2Text: { ru: "Исполнители проходят проверку документов и квалификации. Платформа вправе запрашивать подтверждающие документы и отказать в верификации. Статус «проверен» не является гарантией качества услуг, а лишь подтверждает прохождение базовой проверки.", en: "Providers undergo verification of documents and qualifications. The Platform may request supporting documents and refuse verification. A 'verified' status is not a guarantee of service quality but only confirms that a basic check has been passed." },
  agr3Title: { ru: "3. Правила размещения контента", en: "3. Content posting rules" },
  agr3Text: { ru: "Пользователи отвечают за размещаемый контент (профиль, кейсы, сообщения). Запрещён контент, нарушающий закон, права третьих лиц или содержащий недостоверные сведения. Платформа вправе модерировать и удалять контент, нарушающий правила.", en: "Users are responsible for the content they post (profile, cases, messages). Content that violates the law, third-party rights, or contains false information is prohibited. The Platform may moderate and remove content that violates the rules." },
  agr4Title: { ru: "4. Конфиденциальность и псевдонимы", en: "4. Confidentiality and aliases" },
  agr4Text: { ru: "С учётом специфики сферы безопасности исполнители вправе использовать псевдоним и ограничивать публичность части данных. Это не освобождает от прохождения верификации перед Платформой. Конфиденциальность переписки обеспечивается техническими средствами.", en: "Given the nature of the security industry, providers may use an alias and limit the visibility of some data. This does not exempt them from verification with the Platform. Confidentiality of correspondence is ensured by technical means." },
  agr5Title: { ru: "5. Блокировка и удаление аккаунта", en: "5. Account blocking and deletion" },
  agr5Text: { ru: "Платформа вправе ограничить или заблокировать аккаунт при нарушении документов Платформы. Вы можете удалить свой аккаунт в любой момент; часть данных может храниться в течение установленных законом сроков.", en: "The Platform may restrict or block an account for violations of the Platform documents. You may delete your account at any time; some data may be retained for periods established by law." },
  agr6Title: { ru: "6. Разрешение споров", en: "6. Dispute resolution" },
  agr6Text: { ru: "Споры между клиентами и исполнителями решаются ими самостоятельно. Платформа может оказать содействие, но не выступает арбитром и не несёт ответственности за исход. Споры с Платформой решаются путём переговоров, а при недостижении согласия — в установленном законом порядке.", en: "Disputes between clients and providers are resolved by them independently. The Platform may assist but does not act as an arbitrator and bears no responsibility for the outcome. Disputes with the Platform are resolved through negotiation and, failing agreement, in the manner prescribed by law." },

  // ===== Public Offer (payment terms) =====
  offerIntro: {
    ru: "Настоящая Публичная оферта определяет условия оказания платных услуг Платформы (для исполнителей — подписки и продвижение). Оплачивая услуги, вы полностью и безоговорочно принимаете условия настоящей оферты. Для клиентов базовое использование Платформы бесплатно.",
    en: "This Public Offer defines the terms for the Platform's paid services (for providers — subscriptions and promotion). By paying for services, you fully and unconditionally accept the terms of this offer. Basic use of the Platform is free for clients.",
  },
  offer1Title: { ru: "1. Предмет оферты", en: "1. Subject of the offer" },
  offer1Text: { ru: "Исполнителем по оферте выступает ИП Давыдов Алексей Владимирович (ОГРНИП: 320222500068242, ИНН: 222111361597). Платформа предоставляет исполнителям платные услуги: размещение профиля, подписку, инструменты продвижения и доступ к заявкам. Перечень и стоимость услуг указаны в разделе «Тарифы». Оферта считается принятой в момент оплаты.", en: "The service provider under this offer is sole proprietor Aleksey Vladimirovich Davydov (OGRNIP: 320222500068242, TIN: 222111361597). The Platform provides providers with paid services: profile placement, subscription, promotion tools, and access to leads. The list and cost of services are specified in the 'Pricing' section. The offer is deemed accepted at the moment of payment." },
  offer2Title: { ru: "2. Стоимость и порядок оплаты", en: "2. Cost and payment procedure" },
  offer2Text: { ru: "Стоимость услуг указывается в валюте, отображаемой на Платформе, и может включать применимые налоги. Оплата производится в безналичной форме через сертифицированных платёжных провайдеров. Услуга активируется после поступления оплаты. Платформа не хранит данные банковских карт.", en: "The cost of services is stated in the currency displayed on the Platform and may include applicable taxes. Payment is made by non-cash means through certified payment providers. The service is activated after payment is received. The Platform does not store bank card data." },
  offer3Title: { ru: "3. Подписка и автопродление", en: "3. Subscription and auto-renewal" },
  offer3Text: { ru: "Подписка действует в течение оплаченного периода. Если предусмотрено автопродление, оно происходит автоматически по окончании периода до момента отмены. Вы можете отключить автопродление в настройках кабинета в любое время до даты следующего списания.", en: "A subscription is valid for the paid period. If auto-renewal is provided, it occurs automatically at the end of the period until cancelled. You may disable auto-renewal in your account settings at any time before the next charge date." },
  offer4Title: { ru: "4. Возврат средств", en: "4. Refunds" },
  offer4Text: { ru: "Условия возврата зависят от вида услуги и применимого законодательства о защите прав потребителей. Запрос на возврат подаётся через поддержку. Денежные средства за уже оказанные услуги или активированную подписку за прошедший период, как правило, возврату не подлежат, за исключением случаев, предусмотренных законом.", en: "Refund terms depend on the type of service and applicable consumer protection law. A refund request is submitted via support. Funds for services already rendered or an activated subscription for a past period are generally non-refundable, except where required by law." },
  offer5Title: { ru: "5. Налоги и отчётность", en: "5. Taxes and reporting" },
  offer5Text: { ru: "Платформа выполняет налоговые обязательства в соответствии с законодательством страны регистрации. Исполнители самостоятельно отвечают за уплату налогов с доходов, полученных от клиентов. По запросу Платформа предоставляет документы об оплате услуг Платформы.", en: "The Platform fulfils its tax obligations in accordance with the laws of its country of registration. Providers are independently responsible for paying taxes on income received from clients. Upon request, the Platform provides documents confirming payment for the Platform's services." },
  offer6Title: { ru: "6. Безопасность платежей", en: "6. Payment security" },
  offer6Text: { ru: "Все транзакции защищены шифрованием и проводятся через провайдеров, соответствующих стандарту PCI DSS. Платформа применяет меры по предотвращению мошенничества. При подозрении на несанкционированную операцию немедленно свяжитесь с поддержкой.", en: "All transactions are protected by encryption and processed through PCI DSS-compliant providers. The Platform applies anti-fraud measures. If you suspect an unauthorized transaction, contact support immediately." },
  offer7Title: { ru: "7. Изменение условий и тарифов", en: "7. Changes to terms and pricing" },
  offer7Text: { ru: "Платформа вправе изменять стоимость и условия услуг. Изменения не распространяются на уже оплаченные периоды. Актуальная редакция оферты и тарифов публикуется на Платформе. Продолжение использования платных услуг означает согласие с новой редакцией.", en: "The Platform may change the cost and terms of services. Changes do not apply to periods already paid for. The current version of the offer and pricing is published on the Platform. Continued use of paid services constitutes agreement with the new version." },

  // Client hero
  heroClientTitle1: { ru: "Найдите проверенного", en: "Find a verified" },
  heroClientTitle2: { ru: "специалиста", en: "security specialist" },
  heroClientTitle3: { ru: "по безопасности", en: "you can trust" },
  heroClientDesc: { ru: "Выберите услугу, сравните проверенных исполнителей по рейтингу и кейсам и свяжитесь напрямую. Для клиентов платформа полностью бесплатна.", en: "Choose a service, compare verified providers by rating and case history, and contact them directly. The platform is completely free for clients." },
  heroClientCta1: { ru: "Подобрать услугу", en: "Browse services" },
  heroClientCta2: { ru: "Смотреть специалистов", en: "View specialists" },
  freeForClients: { ru: "Бесплатно для клиентов", en: "Free for clients" },
  noFees: { ru: "Без комиссий и подписок", en: "No fees or subscriptions" },

  // Provider hero
  heroProviderTitle1: { ru: "Получайте заказы", en: "Win clients" },
  heroProviderTitle2: { ru: "в сфере безопасности", en: "in the security industry" },
  heroProviderDesc: { ru: "Зарегистрируйтесь, подтвердите документы и лицензии, выберите тариф — и тысячи клиентов увидят ваш профиль. Кейсы, отзывы и рейтинг работают на вас.", en: "Register, confirm your documents and licenses, choose a plan — and thousands of clients will see your profile. Cases, reviews and ratings work for you." },
  heroProviderCta1: { ru: "Выбрать тариф", en: "Choose a plan" },
  heroProviderCta2: { ru: "Как это работает", en: "How it works" },
  becomeProvider: { ru: "Стать исполнителем", en: "Become a provider" },

  // Become provider steps
  bpTag: { ru: "Для исполнителей", en: "For providers" },
  bpTitle: { ru: "Как начать получать заказы", en: "How to start getting orders" },
  bp1Title: { ru: "Регистрация", en: "Register" },
  bp1Desc: { ru: "Создайте профиль и укажите вашу специализацию в сфере безопасности", en: "Create a profile and specify your security specialization" },
  bp2Title: { ru: "Проверка документов", en: "Document verification" },
  bp2Desc: { ru: "Загрузите лицензии и подтверждающие документы — мы проверим их в течение 24 часов", en: "Upload licenses and supporting documents — we'll verify them within 24 hours" },
  bp3Title: { ru: "Оплата тарифа", en: "Pay for a plan" },
  bp3Desc: { ru: "Выберите подходящий тариф и оплатите ежемесячный членский взнос", en: "Choose a suitable plan and pay the monthly membership fee" },
  bp4Title: { ru: "Получайте клиентов", en: "Get clients" },
  bp4Desc: { ru: "Ваш профиль становится виден клиентам — принимайте заказы и развивайтесь", en: "Your profile becomes visible to clients — accept orders and grow" },

  // Pricing
  pricingTag: { ru: "Членство", en: "Membership" },
  pricingTitle: { ru: "Платите только за подписку — без комиссии за заказы", en: "Pay only for your plan — zero order commission" },
  pricingDesc: { ru: "Никаких процентов со сделок и скрытых платежей. Фиксированный тариф — и весь доход с заказов остаётся у вас. Клиенты ищут и связываются бесплатно.", en: "No deal percentages, no hidden fees. A fixed plan — and you keep 100% of what you earn from orders. Clients search and contact for free." },

  // Pricing — no-commission highlights
  priceNoCommission: { ru: "0% комиссии с заказов", en: "0% commission on orders" },
  priceNoCommissionDesc: { ru: "Платформа не берёт ни рубля с ваших сделок", en: "The platform takes nothing from your deals" },
  priceKeepAll: { ru: "100% дохода — ваши", en: "Keep 100% of earnings" },
  priceKeepAllDesc: { ru: "Клиент платит вам напрямую, без посредников", en: "Clients pay you directly, no middlemen" },
  priceFixed: { ru: "Фиксированная цена", en: "Fixed price" },
  priceFixedDesc: { ru: "Понятная подписка без сюрпризов в счёте", en: "A clear subscription with no billing surprises" },
  priceOnlySub: { ru: "Только подписка", en: "Subscription only" },
  pricingBottomTitle: { ru: "Мы зарабатываем вместе с вами, а не на вас", en: "We grow with you, not off you" },
  pricingBottomDesc: { ru: "Единственный платёж — ваша подписка. Все деньги за выполненные заказы остаются у вас полностью. Для клиентов платформа всегда бесплатна.", en: "Your only payment is the subscription. All money for completed orders stays fully yours. For clients the platform is always free." },
  perMonth: { ru: "/ мес", en: "/ mo" },
  mostPopular: { ru: "Популярный", en: "Most popular" },
  choosePlan: { ru: "Выбрать тариф", en: "Choose plan" },
  contactSales: { ru: "Связаться с нами", en: "Contact us" },

  planStartName: { ru: "Старт", en: "Start" },
  planStartPrice: { ru: "1 990 ₽", en: "$22" },
  planStartFor: { ru: "Для начинающих специалистов", en: "For new specialists" },
  planProName: { ru: "Про", en: "Pro" },
  planProPrice: { ru: "4 490 ₽", en: "$49" },
  planProFor: { ru: "Для активных исполнителей", en: "For active providers" },
  planPremiumName: { ru: "Премиум", en: "Premium" },
  planPremiumPrice: { ru: "7 990 ₽", en: "$89" },
  planPremiumFor: { ru: "Максимум заказов и охвата", en: "Maximum orders and reach" },
  planEntName: { ru: "Enterprise", en: "Enterprise" },
  planEntPrice: { ru: "По запросу", en: "Custom" },
  planEntFor: { ru: "Для охранных предприятий", en: "For security firms" },

  featProfile: { ru: "Профиль в каталоге", en: "Profile in the catalog" },
  featCases: { ru: "Публикация кейсов", en: "Case publishing" },
  featChat: { ru: "Чат и форум", en: "Chat & forum" },
  featCourses: { ru: "Доступ к курсам", en: "Access to courses" },
  featPriority: { ru: "Приоритет в поиске", en: "Priority in search" },
  featTopPlacement: { ru: "Топ-размещение", en: "Top placement" },
  featBadge: { ru: "Премиум-бейдж", en: "Premium badge" },
  featManager: { ru: "Персональный менеджер", en: "Dedicated manager" },
  featTeam: { ru: "Командные аккаунты", en: "Team accounts" },
  featApi: { ru: "API и интеграции", en: "API & integrations" },
  feat5cases: { ru: "До 5 кейсов", en: "Up to 5 cases" },
  feat20cases: { ru: "До 20 кейсов", en: "Up to 20 cases" },
  featUnlimCases: { ru: "Безлимит кейсов", en: "Unlimited cases" },

  // License badge
  licenseBadge: { ru: "Лицензия", en: "License" },

  // Admin panel
  adminPanelTitle: { ru: "Админ-панель", en: "Admin panel" },
  adminLicenseHint: { ru: "Подтверждайте лицензию исполнителей. Флажок «Лицензия» появляется в карточке только после подтверждения.", en: "Confirm provider licenses. The 'License' badge appears on the card only after confirmation." },
  adminSearch: { ru: "Поиск по имени или slug", en: "Search by name or slug" },
  adminRefresh: { ru: "Обновить", en: "Refresh" },
  adminError: { ru: "Не удалось загрузить список. Войдите как администратор.", en: "Failed to load the list. Log in as administrator." },
  adminEmpty: { ru: "Исполнители не найдены", en: "No providers found" },
  adminVerified: { ru: "Верифицирован", en: "Verified" },
  adminNotVerified: { ru: "Не верифицирован", en: "Not verified" },
  adminStatusSelf: { ru: "Самозанятый", en: "Self-employed" },
  adminLicensesCount: { ru: "лиц.", en: "lic." },
  adminNotEligible: { ru: "Не выполнены условия: нужна полная верификация, статус ИП/ООО и загруженная лицензия", en: "Conditions not met: full verification, IP/LLC status and an uploaded license required" },
  adminLicenseOn: { ru: "Лицензия подтверждена", en: "License confirmed" },
  adminLicenseOff: { ru: "Подтвердить лицензию", en: "Confirm license" },
  adminVerifyOn: { ru: "Верификация пройдена", en: "Verification passed" },
  adminVerifyOff: { ru: "Подтвердить верификацию", en: "Confirm verification" },
  adminDocs: { ru: "Документы", en: "Documents" },
  adminFullName: { ru: "ФИО", en: "Full name" },
  adminRegistry: { ru: "Реестр / ОГРНИП", en: "Registry / OGRNIP" },
  adminLicensesList: { ru: "Лицензии", en: "Licenses" },
  adminNoLicenses: { ru: "Лицензии не указаны", en: "No licenses provided" },
  adminDocsList: { ru: "Загруженные документы", en: "Uploaded documents" },
  adminNoDocs: { ru: "Документы не загружены", en: "No documents uploaded" },
  adminOpenDoc: { ru: "Открыть документ", en: "Open document" },

  // Landing (pre-login marketing)
  lpStat1: { ru: "проверенных специалистов", en: "verified specialists" },
  lpStat2: { ru: "довольных клиентов", en: "satisfied clients" },
  lpStat3: { ru: "поддержка и связь", en: "support & messaging" },
  lpStat4: { ru: "стран присутствия", en: "countries covered" },
  lpHowTag: { ru: "Как это работает", en: "How it works" },
  lpHowTitle: { ru: "Безопасность в 4 шага", en: "Security in 4 steps" },
  lpHowDesc: { ru: "От поиска специалиста до решения вашей задачи — быстро, прозрачно и без посредников.", en: "From finding a specialist to solving your task — fast, transparent and without middlemen." },
  lpHow1Title: { ru: "Выберите услугу", en: "Choose a service" },
  lpHow1Desc: { ru: "Полиграф, поиск прослушки, охрана, детектив и десятки других направлений.", en: "Polygraph, bug sweeps, security, investigation and dozens of other areas." },
  lpHow2Title: { ru: "Сравните проверенных", en: "Compare verified pros" },
  lpHow2Desc: { ru: "Рейтинги, кейсы и подтверждённые документы. Только проверенные исполнители.", en: "Ratings, cases and confirmed documents. Only verified providers." },
  lpHow3Title: { ru: "Свяжитесь напрямую", en: "Contact directly" },
  lpHow3Desc: { ru: "Звонок, чат или мессенджер — общайтесь без посредников и комиссий.", en: "Call, chat or messenger — communicate with no middlemen or fees." },
  lpHow4Title: { ru: "Получите результат", en: "Get the result" },
  lpHow4Desc: { ru: "Задача решена профессионалом, которому можно доверять.", en: "Your task solved by a professional you can trust." },
  lpValClientTag: { ru: "Для клиентов", en: "For clients" },
  lpValClientTitle: { ru: "Найдите того, кому доверяете", en: "Find someone you trust" },
  lpValClient1: { ru: "Полностью бесплатно для клиентов", en: "Completely free for clients" },
  lpValClient2: { ru: "Только проверенные специалисты", en: "Only verified specialists" },
  lpValClient3: { ru: "Реальные кейсы и отзывы", en: "Real cases and reviews" },
  lpValClient4: { ru: "Защищённое общение в чате", en: "Secure in-app messaging" },
  lpValProTag: { ru: "Для исполнителей", en: "For providers" },
  lpValProTitle: { ru: "Получайте заказы напрямую", en: "Get orders directly" },
  lpValPro1: { ru: "0% комиссии с заказов — только подписка", en: "0% order commission — subscription only" },
  lpValPro2: { ru: "Поток клиентов из 15+ стран", en: "Client flow from 15+ countries" },
  lpValPro3: { ru: "Профиль, кейсы и продвижение", en: "Profile, cases and promotion" },
  lpValPro4: { ru: "Возможность работать под псевдонимом", en: "Option to work under an alias" },
  lpServicesTag: { ru: "Услуги", en: "Services" },
  lpServicesTitle: { ru: "Что можно заказать на платформе", en: "What you can order on the platform" },
  lpRevTag: { ru: "Отзывы", en: "Reviews" },
  lpRevTitle: { ru: "Нам доверяют по всему миру", en: "Trusted around the world" },
  lpCtaTitle: { ru: "Готовы начать?", en: "Ready to start?" },
  lpCtaDesc: { ru: "Зарегистрируйтесь за минуту и получите доступ к проверенным специалистам по безопасности.", en: "Sign up in a minute and get access to verified security specialists." },
  lpCtaBtn: { ru: "Зарегистрироваться", en: "Sign up" },
  lpCtaNote1: { ru: "Бесплатно для клиентов", en: "Free for clients" },
  lpCtaNote2: { ru: "Регистрация за минуту", en: "Sign up in a minute" },
  lpCtaNote3: { ru: "Данные под защитой", en: "Your data is protected" },

  // Provider availability settings
  pdAvailTitle: { ru: "Доступность для звонков", en: "Call availability" },
  pdAvailHint: { ru: "Укажите часы тишины — в это время кнопка звонка будет недоступна. Часовой пояс определяется автоматически для вас и клиента.", en: "Set quiet hours — the call button will be disabled during this time. The time zone is detected automatically for you and the client." },
  pdAvailAlways: { ru: "Всегда доступен для звонков", en: "Always available for calls" },
  pdQuietFrom: { ru: "Тишина с", en: "Quiet from" },
  pdQuietTo: { ru: "Тишина до", en: "Quiet until" },
  pdTimezone: { ru: "Часовой пояс", en: "Time zone" },
  pdTimezoneAuto: { ru: "Определять автоматически", en: "Detect automatically" },
  pdTimezoneNote: { ru: "Если выбрано «автоматически», используется часовой пояс вашего устройства.", en: "If 'automatically' is selected, your device's time zone is used." },

  // Availability / quiet hours
  availAlways: { ru: "Всегда доступен", en: "Always available" },
  availLocalTime: { ru: "местное время", en: "local time" },
  availSleeping: { ru: "Сейчас часы тишины", en: "Quiet hours now" },
  availCallFrom: { ru: "Звонки с", en: "Calls from" },
  quietHoursBtn: { ru: "Часы тишины", en: "Quiet hours" },
  quietHoursTip: { ru: "У исполнителя сейчас ночь. Позвоните позже или напишите в чат.", en: "It's night for this provider. Call later or message in chat." },

  // Courses (partner advertising)
  coursesPartnerNote: { ru: "Курсы проводят сторонние учебные заведения. Платформа размещает их на правах рекламы и может получать вознаграждение от организаторов. Оплата и обучение происходят на стороне учебного заведения.", en: "Courses are run by third-party training institutions. The Platform features them as advertising and may receive a fee from the organizers. Payment and training take place on the institution's side." },
  coursesPartnerBadge: { ru: "Партнёр", en: "Partner" },
  coursesGoBtn: { ru: "Перейти к курсу", en: "Go to course" },
  coursesAdLabel: { ru: "Реклама · партнёрский курс", en: "Ad · partner course" },

  // Dashboard — common
  dashWelcome: { ru: "С возвращением", en: "Welcome back" },
  dashEdit: { ru: "Редактировать", en: "Edit" },
  dashSave: { ru: "Сохранить", en: "Save" },
  dashLogout: { ru: "Выйти", en: "Log out" },
  dashSince: { ru: "На платформе с", en: "Member since" },

  // Client dashboard tabs
  cdTab1: { ru: "Профиль и рейтинг", en: "Profile & rating" },
  cdTab2: { ru: "Мои заявки", en: "My requests" },
  cdTab3: { ru: "Избранное", en: "Favorites" },
  cdTab4: { ru: "Настройки", en: "Settings" },
  // Client profile
  cdRatingTitle: { ru: "Ваш рейтинг как клиента", en: "Your rating as a client" },
  cdRatingDesc: { ru: "Исполнители оценивают клиентов после выполнения заказа. Высокий рейтинг повышает доверие специалистов к вам.", en: "Providers rate clients after a completed order. A high rating increases specialists' trust in you." },
  cdReviewsTitle: { ru: "Отзывы от исполнителей", en: "Reviews from providers" },
  cdOrdersDone: { ru: "Заказов завершено", en: "Orders completed" },
  cdReviewsCount: { ru: "Отзывов", en: "Reviews" },
  cdResponseRate: { ru: "Скорость ответа", en: "Response rate" },
  // Client requests
  cdReqTitle: { ru: "История заявок", en: "Request history" },
  cdStatusActive: { ru: "В работе", en: "In progress" },
  cdStatusDone: { ru: "Завершено", en: "Completed" },
  cdStatusNew: { ru: "Новая", en: "New" },
  cdReqEmpty: { ru: "Открыть каталог услуг", en: "Open services catalog" },
  // Client favorites
  cdFavTitle: { ru: "Избранные специалисты", en: "Favorite specialists" },
  cdViewProfile: { ru: "Открыть профиль", en: "Open profile" },
  cdRemove: { ru: "Убрать", en: "Remove" },
  // Settings
  cdSetTitle: { ru: "Настройки аккаунта", en: "Account settings" },
  cdFullName: { ru: "Имя и фамилия", en: "Full name" },
  cdCity: { ru: "Город", en: "City" },
  cdNotifications: { ru: "Уведомления на email", en: "Email notifications" },
  cd2fa: { ru: "Двухфакторная аутентификация", en: "Two-factor authentication" },
  cdEnabled: { ru: "Включено", en: "Enabled" },
  cdDisabled: { ru: "Выключено", en: "Disabled" },

  // Provider dashboard tabs
  pdTab1: { ru: "Профиль и статистика", en: "Profile & stats" },
  pdTab2: { ru: "Мой тариф", en: "My plan" },
  pdTab3: { ru: "Кейсы и услуги", en: "Cases & services" },
  pdTab4: { ru: "Заявки от клиентов", en: "Client requests" },
  // Provider stats
  pdStatViews: { ru: "Просмотров профиля", en: "Profile views" },
  pdStatRequests: { ru: "Откликов", en: "Requests" },
  pdStatRating: { ru: "Рейтинг", en: "Rating" },
  pdStatConversion: { ru: "Конверсия", en: "Conversion" },
  pdThisMonth: { ru: "за месяц", en: "this month" },
  pdProfileFill: { ru: "Заполненность профиля", en: "Profile completeness" },
  pdVerified: { ru: "Документы проверены", en: "Documents verified" },
  // Provider plan
  pdCurrentPlan: { ru: "Текущий тариф", en: "Current plan" },
  pdRenews: { ru: "Продление", en: "Renews on" },
  pdActive: { ru: "Активен", en: "Active" },
  pdChangePlan: { ru: "Сменить тариф", en: "Change plan" },
  pdPaymentMethod: { ru: "Способ оплаты", en: "Payment method" },
  pdAutoRenew: { ru: "Автопродление", en: "Auto-renewal" },
  // Provider cases
  pdMyCases: { ru: "Мои кейсы", en: "My cases" },
  pdMyServices: { ru: "Мои услуги", en: "My services" },
  pdAddCase: { ru: "+ Добавить кейс", en: "+ Add case" },
  pdAddService: { ru: "+ Добавить услугу", en: "+ Add service" },
  pdPublished: { ru: "Опубликовано", en: "Published" },
  pdDraft: { ru: "Черновик", en: "Draft" },
  // Provider requests
  pdReqTitle: { ru: "Входящие заявки", en: "Incoming requests" },
  pdAccept: { ru: "Принять", en: "Accept" },
  pdDecline: { ru: "Отклонить", en: "Decline" },
  pdReqService: { ru: "Услуга", en: "Service" },
  pdReqBudget: { ru: "Бюджет", en: "Budget" },

  // Payment modal
  payTitle: { ru: "Оплата тарифа", en: "Plan payment" },
  paySubtitle: { ru: "Разовая оплата членского взноса за месяц", en: "One-time monthly membership payment" },
  payPlan: { ru: "Тариф", en: "Plan" },
  payAmount: { ru: "К оплате", en: "Total" },
  payPeriod: { ru: "Период", en: "Period" },
  payOneMonth: { ru: "1 месяц", en: "1 month" },
  payMethod: { ru: "Способ оплаты", en: "Payment method" },
  payCard: { ru: "Банковская карта", en: "Bank card" },
  paySbp: { ru: "СБП", en: "SBP" },
  payCardNumber: { ru: "Номер карты", en: "Card number" },
  payCardExp: { ru: "Срок", en: "Expiry" },
  payCardCvc: { ru: "CVC", en: "CVC" },
  payCardName: { ru: "Имя на карте", en: "Cardholder name" },
  paySbpHint: { ru: "Отсканируйте QR-код в приложении банка", en: "Scan the QR code in your bank app" },
  payButton: { ru: "Оплатить", en: "Pay" },
  payProcessing: { ru: "Обработка...", en: "Processing..." },
  payCancel: { ru: "Отмена", en: "Cancel" },
  paySecure: { ru: "Платёж защищён шифрованием", en: "Payment is encrypted and secure" },
  paySuccess: { ru: "Оплата прошла успешно!", en: "Payment successful!" },
  paySuccessDesc: { ru: "Тариф активирован. Ваш профиль теперь виден клиентам.", en: "Plan activated. Your profile is now visible to clients." },
  payDone: { ru: "Готово", en: "Done" },
  payDemo: { ru: "Демо-режим: реальное списание не производится", en: "Demo mode: no real charge is made" },

  // Payment history
  pdHistoryTitle: { ru: "История оплат", en: "Payment history" },
  pdHistDate: { ru: "Дата", en: "Date" },
  pdHistPlan: { ru: "Тариф", en: "Plan" },
  pdHistAmount: { ru: "Сумма", en: "Amount" },
  pdHistStatus: { ru: "Статус", en: "Status" },
  pdHistReceipt: { ru: "Чек", en: "Receipt" },
  pdHistPaid: { ru: "Оплачено", en: "Paid" },
  pdHistPending: { ru: "В обработке", en: "Pending" },
  pdHistFailed: { ru: "Отклонено", en: "Failed" },
  pdHistDownload: { ru: "Скачать", en: "Download" },
  pdHistTotal: { ru: "Всего оплачено", en: "Total paid" },

  // Receipt by email
  payEmailLabel: { ru: "Отправить чек на email", en: "Send receipt to email" },
  payEmailPlaceholder: { ru: "ваша@почта.ru", en: "your@email.com" },
  payEmailSend: { ru: "Отправить чек", en: "Send receipt" },
  payEmailSending: { ru: "Отправка...", en: "Sending..." },
  payEmailSent: { ru: "Чек отправлен на почту", en: "Receipt sent to your email" },
  payEmailError: { ru: "Не удалось отправить. Попробуйте позже.", en: "Failed to send. Try again later." },
  payDownloadPdf: { ru: "Скачать PDF-чек", en: "Download PDF receipt" },
  payAutoSent: { ru: "Чек автоматически отправлен на", en: "Receipt automatically sent to" },
  payAutoSending: { ru: "Отправляем чек на почту...", en: "Sending receipt to your email..." },
  payResend: { ru: "Отправить на другой email", en: "Send to another email" },
  pdHistEmail: { ru: "На почту", en: "Email" },
  pdHistEmailPrompt: { ru: "Укажите email для отправки чека:", en: "Enter email to send the receipt:" },
  pdHistEmailSent: { ru: "Чек отправлен на", en: "Receipt sent to" },
  pdHistEmailFail: { ru: "Не удалось отправить чек", en: "Failed to send receipt" },

  // Footer
  footerDesc: { ru: "Международное закрытое сообщество для специалистов в сфере безопасности", en: "International private community for security professionals" },
  footerPlatform: { ru: "Платформа", en: "Platform" },
  footerCommunity: { ru: "Сообщество", en: "Community" },
  footerDocs: { ru: "Документы", en: "Legal" },
  rights: { ru: "© 2024 «ЩИТ». Все права защищены.", en: "© 2024 SHCHIT. All rights reserved." },
  forVerified: { ru: "Платформа для верифицированных специалистов", en: "A platform for verified professionals" },
  fAbout: { ru: "О нас", en: "About" },
  fSpecialists: { ru: "Специалисты", en: "Specialists" },
  fEvents: { ru: "Мероприятия", en: "Events" },
  fNews: { ru: "Новости отрасли", en: "Industry news" },
  fPrivacy: { ru: "Политика конфиденциальности", en: "Privacy Policy" },
  fTerms: { ru: "Условия использования", en: "Terms of Use" },
  fAgreement: { ru: "Пользовательское соглашение", en: "User Agreement" },
  fOffer: { ru: "Оферта", en: "Public Offer" },

  // Geolocation
  geoNearYou: { ru: "Рядом с вами", en: "Near you" },
  geoYourLocation: { ru: "Ваше местоположение", en: "Your location" },
  geoDetecting: { ru: "Определяем местоположение...", en: "Detecting your location..." },
  geoKm: { ru: "км", en: "km" },
  geoSortNearby: { ru: "Сначала ближайшие", en: "Nearest first" },
  geoNearbyHint: { ru: "Исполнители отсортированы по удалённости от вас", en: "Providers sorted by distance from you" },

  // Contacts & subscription
  contactCall: { ru: "Позвонить", en: "Call" },
  contactChat: { ru: "Написать", en: "Message" },
  contactWhatsApp: { ru: "WhatsApp", en: "WhatsApp" },
  contactTelegram: { ru: "Telegram", en: "Telegram" },
  contactEmail: { ru: "Email", en: "Email" },
  contactWebsite: { ru: "Сайт", en: "Website" },
  contactTitle: { ru: "Связаться с исполнителем", en: "Contact the provider" },
  subInactiveBadge: { ru: "Профиль неактивен", en: "Profile inactive" },
  subInactiveTitle: { ru: "Профиль скрыт", en: "Profile hidden" },
  subInactiveDesc: { ru: "Исполнитель не продлил подписку. Контакты временно недоступны.", en: "The provider hasn't renewed their subscription. Contacts are temporarily unavailable." },
  subRenewHint: { ru: "Это ваш профиль? Продлите тариф, чтобы клиенты снова вас видели.", en: "Is this your profile? Renew your plan so clients can find you again." },
  chatWithProvider: { ru: "Чат на сайте", en: "On-site chat" },

  // Billing period
  billMonthly: { ru: "Помесячно", en: "Monthly" },
  billYearly: { ru: "На год", en: "Yearly" },
  billSave: { ru: "Выгода 17%", en: "Save 17%" },
  billPerYear: { ru: "/год", en: "/year" },
  billYearOld: { ru: "вместо", en: "instead of" },
  billYearSaveLine: { ru: "Экономия", en: "You save" },
  billBestValue: { ru: "Выгоднее всего", en: "Best value" },
  payOneYear: { ru: "1 год", en: "1 year" },

  // Sales / social proof
  heroProofRating: { ru: "4.9 из 5 — средняя оценка", en: "4.9 out of 5 — average rating" },
  heroProofReviews: { ru: "на основе 2 800+ отзывов", en: "based on 2,800+ reviews" },
  heroProofTrusted: { ru: "Нам доверяют 1 240+ специалистов и сотни компаний", en: "Trusted by 1,240+ specialists and hundreds of companies" },
  heroFast: { ru: "Подбор за 5 минут", en: "Matched in 5 minutes" },
  heroNoFeeBig: { ru: "Без комиссии для клиентов", en: "No fees for clients" },
  heroGuarantee: { ru: "Проверенные лицензии и гарантия качества", en: "Verified licenses & quality guarantee" },
  ctaUrgency: { ru: "Начните сегодня — первый контакт бесплатно", en: "Start today — first contact is free" },

  // Provider contacts editor
  pdTabContacts: { ru: "Контакты", en: "Contacts" },
  pdContactsTitle: { ru: "Контакты и мессенджеры", en: "Contacts & messengers" },
  pdContactsHint: { ru: "Эти данные видят клиенты на вашей карточке. Заполните, чтобы с вами могли связаться.", en: "Clients see these on your profile card. Fill them in so they can reach you." },
  pdFieldPhone: { ru: "Телефон", en: "Phone" },
  pdFieldEmail: { ru: "Email", en: "Email" },
  pdFieldWhatsApp: { ru: "WhatsApp", en: "WhatsApp" },
  pdFieldTelegram: { ru: "Telegram (без @)", en: "Telegram (without @)" },
  pdFieldWebsite: { ru: "Сайт", en: "Website" },
  pdSocialTitle: { ru: "Социальные сети", en: "Social networks" },
  pdContactsSaved: { ru: "Контакты сохранены", en: "Contacts saved" },
  pdContactsSaveErr: { ru: "Не удалось сохранить. Попробуйте ещё раз.", en: "Failed to save. Please try again." },

  // Provider verification
  pdTabVerify: { ru: "Верификация", en: "Verification" },
  pdVerifyTitle: { ru: "Документы и реквизиты", en: "Documents & details" },
  pdVerifyHint: { ru: "Эти данные нужны для проверки. Включите переключатель рядом с полем, чтобы клиенты видели его в вашей карточке. Номер паспорта никогда не показывается публично.", en: "This data is required for verification. Toggle the switch next to a field to show it on your public card. The passport number is never shown publicly." },
  pdVfFullName: { ru: "ФИО полностью", en: "Full name" },
  pdVfPassport: { ru: "Серия и номер паспорта", en: "Passport series & number" },
  pdVfPassportNote: { ru: "Хранится защищённо, не показывается клиентам", en: "Stored securely, never shown to clients" },
  pdVfStatus: { ru: "Статус", en: "Legal status" },
  pdVfStatusSelf: { ru: "Самозанятый", en: "Self-employed" },
  pdVfStatusIp: { ru: "ИП", en: "Sole proprietor" },
  pdVfStatusCompany: { ru: "Юр. лицо", en: "Company" },
  pdVfLicense: { ru: "Лицензия на вид деятельности", en: "Activity license" },
  pdVfRegistry: { ru: "ОГРНИП / ИНН", en: "Registration number / Tax ID" },
  pdVfShow: { ru: "Показывать клиентам", en: "Show to clients" },
  pdVfHidden: { ru: "Скрыто", en: "Hidden" },
  pdVfSaved: { ru: "Данные верификации сохранены", en: "Verification saved" },
  pdVfSaveErr: { ru: "Не удалось сохранить. Попробуйте ещё раз.", en: "Failed to save. Please try again." },

  // Pseudonym
  pdVfPseudonym: { ru: "Псевдоним", en: "Pseudonym" },
  pdVfPseudonymHint: { ru: "Можно показывать клиентам псевдоним вместо реального имени", en: "You can show clients a pseudonym instead of your real name" },
  pdVfUsePseudonym: { ru: "Показывать псевдоним вместо ФИО", en: "Show pseudonym instead of real name" },

  // Avatar
  avatarTitle: { ru: "Фото профиля", en: "Profile photo" },
  avatarHint: { ru: "Загрузите фото или оставьте шпионский аватар", en: "Upload a photo or keep the spy avatar" },
  avatarUpload: { ru: "Загрузить фото", en: "Upload photo" },
  avatarUploading: { ru: "Загрузка...", en: "Uploading..." },
  avatarRemove: { ru: "Убрать фото", en: "Remove photo" },
  avatarError: { ru: "Не удалось загрузить фото", en: "Failed to upload photo" },
  genderLabel: { ru: "Аватар по умолчанию", en: "Default avatar" },
  genderMale: { ru: "Мужской", en: "Male" },
  genderFemale: { ru: "Женский", en: "Female" },
  aliasBadge: { ru: "Псевдоним", en: "Alias" },

  // Verification: gender, licenses, documents, bio, age
  pdVfGender: { ru: "Пол", en: "Gender" },
  pdVfGenderM: { ru: "Мужской", en: "Male" },
  pdVfGenderF: { ru: "Женский", en: "Female" },
  pdVfAge: { ru: "Возраст", en: "Age" },
  pdVfLicenses: { ru: "Лицензии", en: "Licenses" },
  pdVfAddLicense: { ru: "Добавить лицензию", en: "Add license" },
  pdVfLicensePh: { ru: "Название и номер лицензии", en: "License name & number" },
  pdVfDocuments: { ru: "Документы (дипломы, сертификаты)", en: "Documents (diplomas, certificates)" },
  pdVfAddDocument: { ru: "Добавить документ", en: "Add document" },
  pdVfDocTitlePh: { ru: "Название документа", en: "Document title" },
  pdVfDocAttach: { ru: "Прикрепить файл", en: "Attach file" },
  pdVfDocUploading: { ru: "Загрузка...", en: "Uploading..." },
  pdVfDocAttached: { ru: "Файл прикреплён", en: "File attached" },
  pdVfDocReplace: { ru: "Заменить", en: "Replace" },
  pdVfDocError: { ru: "Ошибка загрузки файла", en: "File upload failed" },
  pdVfDocHint: { ru: "PDF или изображение, до 10 МБ", en: "PDF or image, up to 10 MB" },
  docOpen: { ru: "Открыть", en: "Open" },
  lightboxOpenNewTab: { ru: "Открыть в новой вкладке", en: "Open in new tab" },
  lightboxClose: { ru: "Закрыть", en: "Close" },
  pdVfBio: { ru: "О себе и достижениях", en: "About yourself & achievements" },
  pdVfBioPh: { ru: "Краткая справка: опыт, специализация, ключевые достижения...", en: "Short summary: experience, specialization, key achievements..." },
  remove: { ru: "Удалить", en: "Remove" },

  // Public profile/card
  verifyBio: { ru: "О специалисте", en: "About" },
  verifyDocuments: { ru: "Документы", en: "Documents" },
  yearsOld: { ru: "лет", en: "y.o." },

  // Public verification block (on card/profile)
  verifyBlockTitle: { ru: "Подтверждённые данные", en: "Verified details" },
  verifyName: { ru: "ФИО", en: "Name" },
  verifyStatus: { ru: "Статус", en: "Status" },
  verifyLicense: { ru: "Лицензия", en: "License" },
  verifyRegistry: { ru: "Реквизиты", en: "Registration" },
  verifyDocsConfirmed: { ru: "Документы подтверждены", en: "Documents verified" },
  filterVerifiedOnly: { ru: "Только с подтверждёнными документами", en: "Verified documents only" },
  filterNoResults: { ru: "Нет исполнителей с подтверждёнными документами", en: "No providers with verified documents" },

  // Client data
  cdClientData: { ru: "Ваши данные", en: "Your details" },
  cdClientDataHint: { ru: "Эти данные нужны для оформления заявок исполнителям.", en: "These details are used when you place orders with providers." },
  cdClientName: { ru: "ФИО", en: "Full name" },
  cdClientPhone: { ru: "Номер телефона", en: "Phone number" },
  cdClientSaved: { ru: "Данные сохранены", en: "Details saved" },
  cdClientSaveErr: { ru: "Не удалось сохранить. Попробуйте ещё раз.", en: "Failed to save. Please try again." },
};

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  tr: (key: keyof typeof t) => string;
  rtl: boolean;
  applyGeoLang: (countryCode: string) => void;
}

// Country code (ISO-2) → preferred site language
const COUNTRY_LANG: Record<string, Lang> = {
  RU: "ru", BY: "ru", KZ: "ru", KG: "ru", UA: "ru",
  FR: "fr", BE: "fr", MC: "fr", LU: "fr",
  DE: "de", AT: "de", CH: "de", LI: "de",
  JP: "ja",
  SA: "ar", AE: "ar", EG: "ar", QA: "ar", KW: "ar", BH: "ar", OM: "ar",
  JO: "ar", LB: "ar", IQ: "ar", MA: "ar", DZ: "ar", TN: "ar", LY: "ar",
  IL: "he",
};

function translate(key: string, lang: Lang): string {
  if (lang !== "ru" && lang !== "en") {
    const ex = extra[lang as ExtraLang]?.[key];
    if (ex) return ex;
    return t[key]?.en ?? t[key]?.ru ?? String(key);
  }
  return t[key]?.[lang] ?? t[key]?.en ?? String(key);
}

const LanguageContext = createContext<LangCtx>({
  lang: "ru",
  setLang: () => {},
  tr: (k) => String(k),
  rtl: false,
  applyGeoLang: () => {},
});

function getInitialLang(): Lang {
  if (typeof window === "undefined") return "ru";
  const saved = window.localStorage.getItem("lang") as Lang | null;
  if (saved && LANGS.some((l) => l.code === saved)) return saved;
  const browser = window.navigator.language.slice(0, 2) as Lang;
  if (LANGS.some((l) => l.code === browser)) return browser;
  return "ru";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(getInitialLang);
  const rtl = RTL_LANGS.includes(lang);

  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("lang", l);
      window.localStorage.setItem("langChosen", "1");
    }
  };

  // Auto-select language by user's country (only if not chosen manually before)
  const applyGeoLang = (countryCode: string) => {
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem("langChosen") === "1") return;
    if (window.localStorage.getItem("lang")) return;
    const code = (countryCode || "").toUpperCase();
    const geoLang = COUNTRY_LANG[code];
    if (geoLang && LANGS.some((l) => l.code === geoLang)) {
      setLangState(geoLang);
    }
  };

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
      document.documentElement.dir = rtl ? "rtl" : "ltr";
    }
  }, [lang, rtl]);

  const tr = (key: keyof typeof t) => translate(key as string, lang);

  return (
    <LanguageContext.Provider value={{ lang, setLang, tr, rtl, applyGeoLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLang = () => useContext(LanguageContext);