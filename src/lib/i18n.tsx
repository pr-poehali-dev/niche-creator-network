import { createContext, useContext, useState, ReactNode } from "react";

export type Lang = "ru" | "en";

type Dict = Record<string, { ru: string; en: string }>;

export const t: Dict = {
  // Brand / header
  brandSub: { ru: "Профессиональная платформа", en: "Professional Platform" },
  login: { ru: "Войти", en: "Sign in" },
  join: { ru: "Вступить", en: "Join" },

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
  secReadPolicy: { ru: "Читать политику безопасности", en: "Read the security policy" },

  // Security policy page
  navPolicy: { ru: "Политика безопасности", en: "Security Policy" },
  crumbPolicy: { ru: "Политика безопасности", en: "Security Policy" },
  polTag: { ru: "Документ", en: "Document" },
  polTitle: { ru: "Политика безопасности", en: "Security Policy" },
  polUpdated: { ru: "Последнее обновление: 13 июня 2026", en: "Last updated: June 13, 2026" },
  polIntro: { ru: "Настоящая Политика описывает меры, которые SecureNet применяет для защиты данных клиентов и специалистов. Безопасность — основа доверия в нашей профессиональной нише, поэтому мы используем многоуровневую защиту на каждом этапе работы платформы.", en: "This Policy describes the measures SecureNet applies to protect the data of clients and specialists. Security is the foundation of trust in our professional niche, so we use multi-layered protection at every stage of the platform." },

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
  pricingTitle: { ru: "Тарифы для исполнителей", en: "Plans for providers" },
  pricingDesc: { ru: "Выберите уровень присутствия на платформе. Клиенты ищут бесплатно — вы платите только за видимость и инструменты продвижения.", en: "Choose your level of presence on the platform. Clients search for free — you only pay for visibility and promotion tools." },
  perMonth: { ru: "/ мес", en: "/ mo" },
  mostPopular: { ru: "Популярный", en: "Most popular" },
  choosePlan: { ru: "Выбрать тариф", en: "Choose plan" },
  contactSales: { ru: "Связаться с нами", en: "Contact us" },

  planStartName: { ru: "Старт", en: "Start" },
  planStartPrice: { ru: "990 ₽", en: "$12" },
  planStartFor: { ru: "Для начинающих специалистов", en: "For new specialists" },
  planProName: { ru: "Про", en: "Pro" },
  planProPrice: { ru: "2 490 ₽", en: "$29" },
  planProFor: { ru: "Для активных исполнителей", en: "For active providers" },
  planPremiumName: { ru: "Премиум", en: "Premium" },
  planPremiumPrice: { ru: "4 990 ₽", en: "$59" },
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