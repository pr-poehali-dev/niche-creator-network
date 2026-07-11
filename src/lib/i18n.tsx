import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { extra, type ExtraLang } from "./i18n-extra";

// Тяжёлый словарь переводов (fr/de/ja/ar/he, ~5000 строк) грузится лениво —
// только когда пользователь выбирает один из этих языков. Для ru/en он не нужен,
// поэтому не попадает в первичный бандл и сайт открывается быстрее.
type FullDict = Record<string, Record<string, string>>;
let full: FullDict = {};
let fullPromise: Promise<FullDict> | null = null;

function loadFull(): Promise<FullDict> {
  if (!fullPromise) {
    fullPromise = import("./i18n-full").then((m) => {
      full = m.full as FullDict;
      return full;
    });
  }
  return fullPromise;
}

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
  // Mobile App (PWA) page
  navMobileApp: { ru: "Мобильное приложение", en: "Mobile app" },
  maTag: { ru: "Приложение", en: "App" },
  maTitle: { ru: "Мобильное приложение ЩИТ", en: "SHCHIT Mobile App" },
  maSubtitle: { ru: "Установите ЩИТ на телефон как обычное приложение — с иконкой на экране, полноэкранным режимом и быстрым запуском. Бесплатно, за 15 секунд.", en: "Install SHCHIT on your phone like a regular app — with an icon on your home screen, full-screen mode and instant launch. Free, in 15 seconds." },
  maWhatTitle: { ru: "Что это за приложение", en: "What kind of app is this" },
  maWhatText: { ru: "Это не отдельное приложение из App Store или Google Play, а современная веб-технология (PWA). Вы добавляете сайт ЩИТ на главный экран телефона — и он открывается как настоящее приложение: на весь экран, без адресной строки браузера, с собственной иконкой. При этом вам не нужно ничего скачивать из магазинов и оно не занимает много памяти. Все обновления приходят автоматически.", en: "This is not a separate app from the App Store or Google Play, but a modern web technology (PWA). You add the SHCHIT website to your phone's home screen — and it opens like a real app: full-screen, without the browser address bar, with its own icon. You don't need to download anything from the stores and it takes almost no memory. All updates come automatically." },
  maBen1T: { ru: "Быстрый запуск", en: "Instant launch" },
  maBen1D: { ru: "Один тап с главного экрана — и вы в приложении. Без поиска сайта в браузере.", en: "One tap from the home screen and you're in. No searching for the site in a browser." },
  maBen2T: { ru: "Работает офлайн", en: "Works offline" },
  maBen2D: { ru: "Основные страницы открываются даже при слабом или отсутствующем интернете.", en: "Core pages open even with weak or no internet connection." },
  maBen3T: { ru: "Безопасно", en: "Secure" },
  maBen3D: { ru: "Тот же защищённый сайт, никаких сторонних магазинов и лишних разрешений.", en: "The same secure website — no third-party stores or unnecessary permissions." },
  maQuickTitle: { ru: "Установка в один клик", en: "One-click install" },
  maQuickTitleManual: { ru: "Установить приложение", en: "Install the app" },
  maQuickText: { ru: "Ваш браузер поддерживает быструю установку. Нажмите кнопку — и приложение появится на экране.", en: "Your browser supports quick install. Tap the button and the app will appear on your screen." },
  maQuickTextManual: { ru: "Установите приложение на своё устройство — нажмите кнопку, и мы покажем короткую инструкцию именно для вашего браузера.", en: "Install the app on your device — tap the button and we'll show a short guide tailored to your browser." },
  maQuickHint: { ru: "Работает на iPhone, Android и компьютере — из любого браузера.", en: "Works on iPhone, Android and desktop — from any browser." },
  maQuickBtn: { ru: "Установить приложение", en: "Install app" },
  installBannerTitle: { ru: "Установите приложение ЩИТ", en: "Install the SHCHIT app" },
  installBannerText: { ru: "Быстрый доступ с экрана телефона, работает офлайн.", en: "Quick access from your home screen, works offline." },
  installBannerBtn: { ru: "Установить", en: "Install" },
  installBannerLater: { ru: "Позже", en: "Later" },
  maInstalledTitle: { ru: "Приложение уже установлено", en: "App is already installed" },
  maInstalledText: { ru: "Вы открыли ЩИТ в режиме приложения. Иконка есть на главном экране.", en: "You opened SHCHIT in app mode. The icon is on your home screen." },
  maInstrTitle: { ru: "Инструкция по установке", en: "Installation guide" },
  maYourDevice: { ru: "ваше устройство", en: "your device" },
  maTabIos: { ru: "iPhone / iPad", en: "iPhone / iPad" },
  maTabAndroid: { ru: "Android", en: "Android" },
  maTabDesktop: { ru: "Компьютер", en: "Desktop" },
  // iOS steps
  maIosS1T: { ru: "Откройте сайт в Safari", en: "Open the site in Safari" },
  maIosS1D: { ru: "Важно: на iPhone установка работает только в браузере Safari. Если вы открыли в другом браузере — скопируйте адрес и откройте в Safari.", en: "Important: on iPhone, install only works in the Safari browser. If you opened it in another browser, copy the address and open it in Safari." },
  maIosS2T: { ru: "Нажмите кнопку «Поделиться»", en: "Tap the Share button" },
  maIosS2D: { ru: "Внизу экрана нажмите значок квадрата со стрелкой вверх.", en: "At the bottom of the screen, tap the square icon with an upward arrow." },
  maIosS3T: { ru: "Выберите «На экран Домой»", en: "Choose Add to Home Screen" },
  maIosS3D: { ru: "Пролистайте меню и нажмите «На экран Домой» (Add to Home Screen).", en: "Scroll the menu and tap 'Add to Home Screen'." },
  maIosS4T: { ru: "Готово", en: "Done" },
  maIosS4D: { ru: "Нажмите «Добавить» — иконка ЩИТ появится на главном экране рядом с другими приложениями.", en: "Tap 'Add' — the SHCHIT icon will appear on your home screen next to your other apps." },
  // Android steps
  maAndS1T: { ru: "Откройте сайт в Chrome", en: "Open the site in Chrome" },
  maAndS1D: { ru: "На Android удобнее всего устанавливать через браузер Chrome.", en: "On Android it's easiest to install via the Chrome browser." },
  maAndS2T: { ru: "Откройте меню браузера", en: "Open the browser menu" },
  maAndS2D: { ru: "Нажмите три точки в правом верхнем углу.", en: "Tap the three dots in the top-right corner." },
  maAndS3T: { ru: "«Установить приложение»", en: "Install app" },
  maAndS3D: { ru: "Выберите «Установить приложение» или «Добавить на главный экран».", en: "Choose 'Install app' or 'Add to Home screen'." },
  maAndS4T: { ru: "Готово", en: "Done" },
  maAndS4D: { ru: "Подтвердите установку — иконка ЩИТ появится на главном экране.", en: "Confirm the install — the SHCHIT icon will appear on your home screen." },
  // Desktop steps
  maDeskS1T: { ru: "Откройте сайт в Chrome или Edge", en: "Open the site in Chrome or Edge" },
  maDeskS1D: { ru: "Установка на компьютер работает в браузерах Google Chrome и Microsoft Edge.", en: "Desktop install works in Google Chrome and Microsoft Edge browsers." },
  maDeskS2T: { ru: "Нажмите значок установки", en: "Click the install icon" },
  maDeskS2D: { ru: "В правой части адресной строки нажмите значок монитора со стрелкой, либо выберите в меню «Установить ЩИТ».", en: "On the right side of the address bar, click the monitor icon with an arrow, or choose 'Install SHCHIT' in the menu." },
  maDeskS3T: { ru: "Готово", en: "Done" },
  maDeskS3D: { ru: "Приложение откроется в отдельном окне и появится ярлык на рабочем столе.", en: "The app opens in a separate window and a shortcut appears on your desktop." },
  // FAQ
  maFaqTitle: { ru: "Частые вопросы", en: "FAQ" },
  maFaq1Q: { ru: "Это бесплатно?", en: "Is it free?" },
  maFaq1A: { ru: "Да, установка полностью бесплатна и не требует регистрации в App Store или Google Play.", en: "Yes, installation is completely free and does not require an App Store or Google Play account." },
  maFaq2Q: { ru: "Почему приложения нет в App Store и Google Play?", en: "Why isn't the app in the App Store and Google Play?" },
  maFaq2A: { ru: "Мы используем технологию PWA — она даёт то же удобство, что и приложение из магазина, но без скачивания, ожидания модерации и лишнего места в памяти. Обновления приходят сами.", en: "We use PWA technology — it gives the same convenience as a store app, but without downloads, review waiting times or extra memory usage. Updates arrive automatically." },
  maFaq3Q: { ru: "Как удалить приложение?", en: "How do I remove the app?" },
  maFaq3A: { ru: "Так же, как обычное: удерживайте иконку на экране и выберите «Удалить».", en: "Just like a regular app: press and hold the icon and choose 'Remove'." },
  maHelpTitle: { ru: "Нужна помощь с установкой?", en: "Need help installing?" },
  maHelpText: { ru: "Если что-то не получается — напишите нам, поможем установить приложение на ваше устройство.", en: "If something doesn't work, contact us — we'll help you install the app on your device." },
  maHelpBtn: { ru: "Связаться с поддержкой", en: "Contact support" },
  appBannerTitle: { ru: "Установите ЩИТ как приложение", en: "Install SHCHIT as an app" },
  appBannerText: { ru: "Быстрый доступ с главного экрана телефона — без App Store и Google Play.", en: "Quick access from your phone's home screen — no App Store or Google Play needed." },
  appBannerBtn: { ru: "Установить", en: "Install" },

  // Brand / header
  brandSub: { ru: "Международная профессиональная платформа безопасности", en: "International Professional Security Platform" },
  brandSub1: { ru: "Международная профессиональная", en: "International Professional" },
  brandSub2: { ru: "платформа безопасности", en: "Security Platform" },
  navMenuOpen: { ru: "Открыть меню", en: "Open menu" },
  navMenuClose: { ru: "Закрыть меню", en: "Close menu" },
  login: { ru: "Войти", en: "Sign in" },
  join: { ru: "Вступить", en: "Join" },

  // Auth
  authCabinet: { ru: "Кабинет", en: "Account" },
  authEnter: { ru: "Войти в кабинет", en: "Sign in to account" },
  authTabLogin: { ru: "Вход", en: "Sign in" },
  authTabRegister: { ru: "Регистрация", en: "Register" },
  authEmail: { ru: "Электронная почта", en: "Email" },
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
  authErrWeak: { ru: "Пароль минимум 8 символов, с буквами и цифрами", en: "Password must be at least 8 characters, with letters and numbers" },
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
  auth2faTitle: { ru: "Подтверждение входа", en: "Confirm sign-in" },
  auth2faDesc: { ru: "Мы отправили 6-значный код на", en: "We sent a 6-digit code to" },
  auth2faConfirm: { ru: "Подтвердить и войти", en: "Confirm and sign in" },
  auth2faResend: { ru: "Отправить код снова", en: "Resend code" },
  auth2faResent: { ru: "Код отправлен ✓", en: "Code sent ✓" },
  auth2faWrong: { ru: "Неверный код. Попробуйте ещё раз", en: "Wrong code. Try again" },
  auth2faExpired: { ru: "Код истёк. Запросите новый", en: "Code expired. Request a new one" },
  auth2faTooMany: { ru: "Слишком много попыток. Войдите заново", en: "Too many attempts. Sign in again" },
  auth2faNotConfigured: { ru: "Email-рассылка ещё настраивается. Обратитесь к администратору.", en: "Email delivery is being set up. Contact the administrator." },

  authAdminLink: { ru: "Вход для администратора", en: "Administrator login" },
  authAdminTitle: { ru: "Вход администратора", en: "Administrator login" },
  authAdminPassword: { ru: "Пароль администратора", en: "Administrator password" },
  authAdminViewAs: { ru: "Войти как", en: "View as" },
  authAdminBtn: { ru: "Войти", en: "Sign in" },
  authBackToLogin: { ru: "Назад ко входу", en: "Back to sign in" },

  // Minimal home / promo
  promoBadge: { ru: "Международная платформа безопасности", en: "International security platform" },
  promoTitle1: { ru: "Специалисты по безопасности", en: "Security specialists" },
  promoTitle2: { ru: "проверены и на связи", en: "verified and available" },
  promoDesc: { ru: "Детективы, телохранители, полиграфологи, специалисты по кибербезопасности и охранные агентства со всего мира — в одном каталоге с проверкой документов и защищённой связью.", en: "Detectives, bodyguards, polygraph examiners, cybersecurity experts and security agencies worldwide — in one directory with document verification and secure communication." },
  promoForClients: { ru: "Клиентам — поиск и связь со специалистом бесплатно", en: "For clients — free search and contact with a specialist" },
  promoForProviders: { ru: "Специалистам — заказы по фиксированной подписке, без комиссии с сделок", en: "For specialists — orders on a fixed subscription, no deal commission" },
  homeSecTitle: { ru: "Безопасность платформы", en: "Platform security" },
  homeSec1: { ru: "Проверка лицензий и документов исполнителей", en: "License and document verification of providers" },
  homeSec2: { ru: "Шифрование данных и защита переписки", en: "Data encryption and message protection" },
  homeSec3: { ru: "Конфиденциальность и право на псевдоним", en: "Confidentiality and the right to an alias" },
  homeOpenCabinet: { ru: "Войти в кабинет", en: "Sign in" },
  homeReadPolicy: { ru: "Подробнее о безопасности", en: "More about security" },

  // Why us
  whyUsTag: { ru: "Почему ЩИТ", en: "Why SHCHIT" },
  whyUsTitle: { ru: "Пять направлений в одном каталоге", en: "Five specializations in one directory" },
  whyUsSubtitle: { ru: "Детективы, охрана, полиграфологи, кибербезопасность и охранные агентства — раньше их искали по разным сайтам и знакомым. Теперь достаточно одной проверенной платформы.", en: "Detectives, security, polygraph examiners, cybersecurity and agencies used to be scattered across different sites and personal contacts. Now one verified platform is enough." },
  whyUs1Title: { ru: "Международный охват", en: "International reach" },
  whyUs1Desc: { ru: "Специалисты и клиенты из разных стран на одной платформе, с поддержкой нескольких языков.", en: "Specialists and clients from different countries on one platform, with multi-language support." },
  whyUs2Title: { ru: "Пять специализаций сразу", en: "Five specializations at once" },
  whyUs2Desc: { ru: "Детективы, охрана, полиграфологи, кибербезопасность и агентства — без регистрации на разных сайтах.", en: "Detectives, security, polygraph examiners, cybersecurity and agencies — without signing up on different sites." },
  whyUs3Title: { ru: "Без комиссии с заказов", en: "No commission on orders" },
  whyUs3Desc: { ru: "Специалисты платят фиксированную подписку и оставляют себе весь доход от заказов.", en: "Specialists pay a fixed subscription and keep all the income from their orders." },
  whyUs4Title: { ru: "Сообщество и обучение", en: "Community and training" },
  whyUs4Desc: { ru: "Закрытый форум для обмена опытом с коллегами и курсы повышения квалификации.", en: "A private forum for exchanging experience with colleagues and professional development courses." },

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
  topExperts: { ru: "Ведущие специалисты платформы", en: "Leading specialists on the platform" },
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

  // Client process (how the platform works — FOR CLIENTS)
  cstep1Title: { ru: "Опишите задачу", en: "Describe your task" },
  cstep1Desc: { ru: "Выберите нужную услугу или опишите ситуацию — платформа бесплатна для клиентов", en: "Choose the service you need or describe your situation — the platform is free for clients" },
  cstep2Title: { ru: "Сравните специалистов", en: "Compare specialists" },
  cstep2Desc: { ru: "Смотрите проверенных исполнителей: рейтинг, отзывы, кейсы, лицензии и цены", en: "Browse verified providers: rating, reviews, cases, licenses and prices" },
  cstep3Title: { ru: "Свяжитесь напрямую", en: "Contact directly" },
  cstep3Desc: { ru: "Пишите или звоните выбранному специалисту без посредников и комиссий", en: "Message or call your chosen specialist with no middlemen or fees" },
  cstep4Title: { ru: "Получите результат", en: "Get the result" },
  cstep4Desc: { ru: "Работайте по договору, оставьте отзыв и возвращайтесь за новыми задачами", en: "Work under a contract, leave a review and come back for new tasks" },

  // Client features (why choose SHCHIT — FOR CLIENTS)
  cfeat1Title: { ru: "Только проверенные специалисты", en: "Only verified specialists" },
  cfeat1Desc: { ru: "Каждый исполнитель проходит проверку документов, лицензий и репутации — вы не нарвётесь на мошенника", en: "Every provider is screened for documents, licenses and reputation — you won't run into a scammer" },
  cfeat2Title: { ru: "Все услуги в одном месте", en: "All services in one place" },
  cfeat2Desc: { ru: "Детективы, охрана, полиграф, кибербезопасность и десятки других услуг — не нужно искать по разным сайтам", en: "Detectives, security, polygraph, cybersecurity and dozens of other services — no need to search different sites" },
  cfeat3Title: { ru: "Прямой контакт без комиссий", en: "Direct contact, no fees" },
  cfeat3Desc: { ru: "Связывайтесь с исполнителем напрямую — звонок, чат и мессенджеры. Платформа для клиентов бесплатна", en: "Reach the provider directly — call, chat and messengers. The platform is free for clients" },
  cfeat4Title: { ru: "Честные рейтинги и отзывы", en: "Honest ratings and reviews" },
  cfeat4Desc: { ru: "Прозрачная система оценок и реальные отзывы клиентов помогают выбрать лучшего специалиста", en: "A transparent rating system and real client reviews help you choose the best specialist" },
  cfeat5Title: { ru: "Специалист рядом с вами", en: "A specialist near you" },
  cfeat5Desc: { ru: "Геопоиск подбирает проверенных исполнителей в вашем городе и стране", en: "Geo-search finds verified providers in your city and country" },
  cfeat6Title: { ru: "Безопасность и конфиденциальность", en: "Security and confidentiality" },
  cfeat6Desc: { ru: "Шифрованные чаты и защита данных — ваши задачи и переписка остаются приватными", en: "Encrypted chats and data protection — your tasks and messages stay private" },

  // Client reviews section
  clientReviewsTag: { ru: "Отзывы клиентов", en: "Client reviews" },
  clientReviewsTitle: { ru: "Клиенты о специалистах платформы", en: "Clients about the platform's specialists" },
  clientReviewsSub: { ru: "Реальные истории людей и компаний, которым помогли специалисты ЩИТ", en: "Real stories from people and companies helped by SHCHIT specialists" },

  // Registration gate (client must complete profile to open specialist profiles)
  regRequiredTitle: { ru: "Завершите регистрацию", en: "Complete your registration" },
  regRequiredText: { ru: "Чтобы открыть профиль специалиста, заполните свой профиль в личном кабинете: имя и телефон. Это защищает специалистов от спама и повышает доверие.", en: "To open a specialist's profile, fill in your profile in the dashboard: name and phone. This protects specialists from spam and builds trust." },
  regRequiredBtn: { ru: "Заполнить профиль", en: "Fill in profile" },
  regRequiredCancel: { ru: "Позже", en: "Later" },

  // CTA
  closedAccess: { ru: "Закрытый доступ", en: "Private access" },
  ctaTitle1: { ru: "Вступите в профессиональное", en: "Join the professional" },
  ctaTitle2: { ru: "сообщество сегодня", en: "community today" },
  ctaDesc: { ru: "Оставьте заявку на верификацию — наша команда свяжется с вами в течение 24 часов для проверки профессиональных документов", en: "Submit a verification request — our team will contact you within 24 hours to check your professional documents" },
  applyJoin: { ru: "Подать заявку на вступление", en: "Apply to join" },
  contactUs: { ru: "Связаться с нами", en: "Contact us" },

  // Profile
  profileSection: { ru: "Профиль специалиста", en: "Specialist profile" },
  profileSpecialization: { ru: "Специализация", en: "Specialization" },
  profileCasesCount: { ru: "кейсов", en: "cases" },
  profileReviewsCount: { ru: "отзывов", en: "reviews" },
  profileAbout: { ru: "О специалисте", en: "About the specialist" },
  profileInfo: { ru: "Информация", en: "Information" },
  profileVerification: { ru: "Проверка и верификация", en: "Checks & verification" },
  profileAge: { ru: "Возраст", en: "Age" },
  profileCountry: { ru: "Страна", en: "Country" },
  profileCity: { ru: "Город", en: "City" },
  profileExperienceLabel: { ru: "Опыт работы", en: "Experience" },
  profileLegalStatus: { ru: "Правовой статус", en: "Legal status" },
  profileLicenseNumber: { ru: "Номер лицензии", en: "License number" },
  profileVerifiedIdentity: { ru: "Личность подтверждена", en: "Identity verified" },
  profileLicenseChecked: { ru: "Лицензия проверена", en: "License verified" },
  profileDocsConfirmed: { ru: "Документы подтверждены", en: "Documents confirmed" },
  profileNotVerified: { ru: "Не подтверждено", en: "Not verified" },
  profileAliasNote: { ru: "Работает под псевдонимом в целях безопасности", en: "Works under an alias for safety reasons" },
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
  catSpecialties: { ru: "специальностей", en: "specialties" },
  catFindSpecialist: { ru: "Найти специалиста", en: "Find a specialist" },
  catBackToCatalog: { ru: "Назад к каталогу", en: "Back to catalog" },
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
  feedbackSentTitle: { ru: "Сообщение отправлено", en: "Message sent" },
  feedbackSentDesc: { ru: "Спасибо за обращение! Мы ответим вам на указанный email.", en: "Thank you! We'll reply to the email you provided." },
  feedbackSendAnother: { ru: "Отправить ещё", en: "Send another" },
  feedbackError: { ru: "Не удалось отправить. Проверьте email и попробуйте ещё раз.", en: "Failed to send. Check the email and try again." },
  feedbackReplyTitle: { ru: "Ответим по email", en: "We reply by email" },
  feedbackReplyDesc: { ru: "Обычно отвечаем в течение нескольких рабочих часов", en: "We usually reply within a few business hours" },
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
  secBanner: { ru: "Платформа защищена современным шифрованием", en: "The platform is protected by modern encryption" },
  secBannerSub: { ru: "Личные данные и переписка хранятся в базе в зашифрованном виде", en: "Personal data and messages are stored in the database in encrypted form" },
  secTag: { ru: "Безопасность", en: "Security" },
  secTitle: { ru: "Шифрование и защита данных", en: "Encryption & data protection" },
  secDesc: { ru: "Мы применяем многоуровневую защиту. Пароли, личные данные и переписка шифруются перед сохранением в базу — от входа до хранения и переписки.", en: "We apply multi-layered protection. Passwords, personal data and messages are encrypted before being saved to the database — from login to storage and messaging." },
  sec1Title: { ru: "Защита входа", en: "Login protection" },
  sec1Desc: { ru: "Пароли хранятся в виде необратимых хешей, сессии защищены токенами, доступна двухфакторная аутентификация", en: "Passwords are stored as irreversible hashes, sessions are protected by tokens, two-factor authentication available" },
  sec2Title: { ru: "Персональные данные", en: "Personal data" },
  sec2Desc: { ru: "Телефоны, email, ФИО и паспортные данные шифруются алгоритмом AES перед записью в базу данных", en: "Phone numbers, emails, full names and passport data are encrypted with AES before being written to the database" },
  sec3Title: { ru: "Шифрование личных сообщений", en: "Encrypted private messages" },
  sec3Desc: { ru: "Личная переписка между пользователями хранится в базе данных в зашифрованном виде", en: "Private messages between users are stored in the database in encrypted form" },
  sec4Title: { ru: "Защищённое соединение", en: "Secure connection" },
  sec4Desc: { ru: "Весь трафик передаётся по протоколу TLS с принудительным HTTPS на всех страницах", en: "All traffic is transmitted over TLS with enforced HTTPS on every page" },
  sec5Title: { ru: "Контроль доступа", en: "Access control" },
  sec5Desc: { ru: "Строгое разграничение прав, журналирование действий и регулярный аудит безопасности", en: "Strict role-based permissions, action logging and regular security audits" },
  sec6Title: { ru: "Соответствие стандартам", en: "Compliance" },
  sec6Desc: { ru: "Обработка данных соответствует требованиям GDPR и 152-ФЗ «О персональных данных»", en: "Data processing complies with GDPR and personal data protection regulations" },
  secBadge1: { ru: "Шифрование AES", en: "AES encryption" },
  secBadge2: { ru: "TLS / HTTPS", en: "TLS / HTTPS" },
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
  pol1Text: { ru: "Чувствительные персональные данные — телефоны, email, ФИО и паспортные данные — шифруются алгоритмом AES перед сохранением в базе данных. Ключ шифрования хранится отдельно от данных в защищённом хранилище секретов и недоступен напрямую сотрудникам платформы.", en: "Sensitive personal data — phone numbers, emails, full names and passport data — is encrypted with AES before being stored in the database. The encryption key is stored separately from the data in a protected secrets vault and is not directly accessible to platform staff." },

  pol2Title: { ru: "2. Защита аутентификации", en: "2. Authentication security" },
  pol2Text: { ru: "Пароли никогда не хранятся в открытом виде — мы используем необратимое хеширование PBKDF2 с индивидуальной солью для каждого пользователя. Сессии защищены токенами с ограниченным сроком действия, а вход дополнительно защищён от подбора пароля. Для специалистов доступна двухфакторная аутентификация (2FA) по email.", en: "Passwords are never stored in plain text — we use irreversible PBKDF2 hashing with a unique salt for each user. Sessions are protected by tokens with a limited lifetime, and sign-in is additionally protected against password guessing. Two-factor authentication (2FA) via email is available for specialists." },

  pol3Title: { ru: "3. Шифрование личных сообщений", en: "3. Encrypted private messages" },
  pol3Text: { ru: "Личная переписка между пользователями хранится в базе данных в зашифрованном виде. Публичные чаты и форум по специализациям остаются видимыми участникам сообщества — это открытые разделы для профессионального общения.", en: "Private messages between users are stored in the database in encrypted form. Public specialty chats and the forum remain visible to community members — these are open sections for professional discussion." },

  pol4Title: { ru: "4. Защищённое соединение", en: "4. Secure connection" },
  pol4Text: { ru: "Весь трафик между вашим устройством и платформой передаётся по протоколу TLS с принудительным HTTPS на всех страницах. Это исключает перехват и подмену данных при передаче через интернет.", en: "All traffic between your device and the platform is transmitted over TLS with enforced HTTPS on every page. This prevents interception and tampering of data in transit over the internet." },

  pol5Title: { ru: "5. Контроль доступа", en: "5. Access control" },
  pol5Text: { ru: "Доступ к данным строго разграничен по ролям: каждый сотрудник и пользователь видит только ту информацию, которая необходима для его задач. Доступ к чувствительным данным регулярно пересматривается.", en: "Data access is strictly segregated by role: each employee and user sees only the information necessary for their tasks. Access to sensitive data is reviewed regularly." },

  pol6Title: { ru: "6. Верификация участников", en: "6. Member verification" },
  pol6Text: { ru: "Каждый специалист и охранное предприятие проходят проверку документов и лицензий перед допуском на платформу. Это снижает риск мошенничества и гарантирует, что вы работаете только с проверенными профессионалами.", en: "Every specialist and security firm undergoes document and license verification before being admitted to the platform. This reduces the risk of fraud and ensures that you work only with verified professionals." },

  pol7Title: { ru: "7. Резервное копирование", en: "7. Backups" },
  pol7Text: { ru: "Данные регулярно резервируются в географически распределённых хранилищах. Это обеспечивает восстановление информации при сбоях без потери данных.", en: "Data is regularly backed up across geographically distributed storage. This ensures information recovery in case of failures without data loss." },

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
  priv2Text: { ru: "Мы придерживаемся принципа минимизации и обрабатываем только необходимые данные: регистрационные данные (имя или псевдоним, email, роль), контактные данные для связи (телефон, мессенджеры — по желанию Пользователя), данные профиля (специализация, город, услуги, сведения о квалификации/лицензиях), технические данные (IP-адрес, тип устройства, cookie), геолокацию (с вашего согласия) и сведения о платежах. Мы НЕ собираем и НЕ храним паспортные данные, дату рождения и регистрационные реквизиты. Полные реквизиты банковских карт нами не хранятся — оплата проводится через сертифицированных платёжных провайдеров.", en: "We follow the data minimization principle and process only the data that is necessary: registration data (name or pseudonym, email, role), contact details (phone, messengers — at the User's discretion), profile data (specialization, city, services, qualification/licence information), technical data (IP address, device type, cookies), geolocation (with your consent), and payment records. We do NOT collect or store passport data, date of birth, or registration details. We do not store full bank card details — payments are processed via certified payment providers." },
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

  // ===== Consent to personal data processing (152-FZ) =====
  fConsent: { ru: "Согласие на обработку данных", en: "Consent to data processing" },
  consentDocIntro: {
    ru: "Настоящим Пользователь, регистрируясь на Платформе и/или используя её сервисы, даёт свободное, конкретное, информированное и сознательное согласие на обработку своих персональных данных Оператору — ИП Давыдов Алексей Владимирович (ОГРНИП: 320222500068242, ИНН: 222111361597) — на условиях, изложенных ниже, в соответствии с Федеральным законом от 27.07.2006 № 152-ФЗ «О персональных данных».",
    en: "By registering on the Platform and/or using its services, the User gives free, specific, informed and conscious consent to the processing of their personal data by the Operator — sole proprietor Aleksey Vladimirovich Davydov (OGRNIP: 320222500068242, TIN: 222111361597) — on the terms set out below, in accordance with Russian Federal Law No. 152-FZ of 27.07.2006 'On Personal Data'.",
  },
  consent1Title: { ru: "1. Оператор", en: "1. Operator" },
  consent1Text: { ru: "Оператор персональных данных: ИП Давыдов Алексей Владимирович, ОГРНИП: 320222500068242, ИНН: 222111361597, адрес: Московская область, г. Электросталь, пос. Всеволодово. Контакт по вопросам обработки данных указан в разделе «Контакты».", en: "Personal data operator: sole proprietor Aleksey Vladimirovich Davydov, OGRNIP: 320222500068242, TIN: 222111361597, address: Moscow Region, Elektrostal, Vsevolodovo settlement. Contact for data processing matters is listed in the 'Contacts' section." },
  consent2Title: { ru: "2. Перечень персональных данных", en: "2. List of personal data" },
  consent2Text: { ru: "Пользователь даёт согласие на обработку следующих данных: имя или псевдоним, адрес электронной почты, роль в сервисе, контактные данные для связи (телефон, мессенджеры — по усмотрению Пользователя), данные профиля (специализация, город, услуги, сведения о квалификации и лицензиях), технические данные (IP-адрес, тип устройства, cookie), данные о геолокации (с отдельного согласия) и сведения о платежах. Паспортные данные, дата рождения и регистрационные реквизиты Оператором не собираются.", en: "The User consents to the processing of the following data: name or pseudonym, email address, role in the service, contact details (phone, messengers — at the User's discretion), profile data (specialization, city, services, qualification and licence information), technical data (IP address, device type, cookies), geolocation data (with separate consent) and payment records. Passport data, date of birth and registration details are not collected by the Operator." },
  consent3Title: { ru: "3. Цели обработки", en: "3. Purposes of processing" },
  consent3Text: { ru: "Данные обрабатываются для регистрации и идентификации Пользователя, предоставления функций сервиса, связи между клиентами и исполнителями, проведения платежей, обеспечения безопасности и предотвращения мошенничества, а также для исполнения требований законодательства.", en: "Data is processed to register and identify the User, provide service features, enable communication between clients and providers, process payments, ensure security and prevent fraud, and comply with legal requirements." },
  consent4Title: { ru: "4. Действия с данными и способ обработки", en: "4. Actions and method of processing" },
  consent4Text: { ru: "Согласие даётся на сбор, запись, систематизацию, накопление, хранение, уточнение, использование, передачу (предоставление доступа), обезличивание, блокирование и удаление персональных данных. Обработка осуществляется как с использованием средств автоматизации, так и без них. Чувствительные данные хранятся в зашифрованном виде.", en: "Consent is given for the collection, recording, systematization, accumulation, storage, updating, use, transfer (granting access), anonymization, blocking and deletion of personal data. Processing is carried out both with and without automation tools. Sensitive data is stored in encrypted form." },
  consent5Title: { ru: "5. Передача третьим лицам", en: "5. Transfer to third parties" },
  consent5Text: { ru: "Данные могут передаваться платёжным провайдерам (для проведения оплаты), хостинг- и облачным сервисам (для работы Платформы) и государственным органам по законному требованию. Оператор не продаёт персональные данные третьим лицам.", en: "Data may be transferred to payment providers (to process payments), hosting and cloud services (to operate the Platform), and government authorities upon lawful request. The Operator does not sell personal data to third parties." },
  consent6Title: { ru: "6. Срок действия и отзыв согласия", en: "6. Validity and withdrawal of consent" },
  consent6Text: { ru: "Согласие действует с момента его предоставления и до достижения целей обработки либо до его отзыва. Пользователь вправе отозвать согласие в любой момент, направив обращение Оператору по контактным данным. После отзыва Оператор прекращает обработку и удаляет либо обезличивает данные, за исключением сведений, которые обязан хранить по закону.", en: "Consent is valid from the moment it is given until the purposes of processing are achieved or until it is withdrawn. The User may withdraw consent at any time by contacting the Operator using the provided contact details. Upon withdrawal, the Operator ceases processing and deletes or anonymizes the data, except for information it is legally required to retain." },
  consent7Title: { ru: "7. Права субъекта данных", en: "7. Rights of the data subject" },
  consent7Text: { ru: "Пользователь имеет право на доступ к своим данным, их уточнение, блокирование и удаление, а также на обжалование действий Оператора в уполномоченном органе по защите прав субъектов персональных данных (Роскомнадзор). Подтверждая согласие, Пользователь заявляет, что ознакомлен с Политикой конфиденциальности и своими правами.", en: "The User has the right to access their data, to have it updated, blocked and deleted, and to appeal the Operator's actions to the authorized body for the protection of personal data subjects' rights (Roskomnadzor). By confirming consent, the User declares that they are familiar with the Privacy Policy and their rights." },

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
  heroClientTitle1: { ru: "Найдите проверенного специалиста", en: "Find a verified specialist" },
  heroClientTitle2: { ru: "по безопасности", en: "in security" },
  heroClientTitle3: { ru: "", en: "" },
  heroClientDesc: { ru: "Все специалисты по безопасности — в одном месте. Не нужно искать по разным площадкам: выберите услугу, сравните проверенных исполнителей по рейтингу и кейсам и свяжитесь напрямую. Для клиентов — бесплатно.", en: "Every security specialist in one place. No need to search across different sites: choose a service, compare verified providers by rating and cases, and contact them directly. Free for clients." },
  heroClientCta1: { ru: "Подобрать услугу", en: "Browse services" },
  heroClientCta2: { ru: "Смотреть специалистов", en: "View specialists" },
  freeForClients: { ru: "Бесплатно для клиентов", en: "Free for clients" },
  noFees: { ru: "Без комиссий и подписок", en: "No fees or subscriptions" },

  // Provider hero
  heroProviderTitle1: { ru: "Заказы без затрат", en: "Orders without" },
  heroProviderTitle2: { ru: "на рекламу", en: "ad spend" },
  heroProviderDesc: { ru: "Клиенты находят вас сами — не нужно тратить бюджет на рекламу на других площадках. А ещё: живое общение с коллегами со всего мира и актуальные курсы для повышения квалификации. Всё на одной платформе.", en: "Clients find you on their own — no need to spend budget on ads elsewhere. Plus: live communication with colleagues worldwide and up-to-date courses for professional growth. All on one platform." },
  heroProviderCta1: { ru: "Выбрать тариф", en: "Choose a plan" },
  heroProviderCta2: { ru: "Как это работает", en: "How it works" },
  becomeProvider: { ru: "Стать исполнителем", en: "Become a provider" },
  providerActiveTag: { ru: "Ваш кабинет исполнителя", en: "Your provider dashboard" },
  providerGetClients: { ru: "Получайте заказы от клиентов напрямую", en: "Get orders from clients directly" },
  statProvClients: { ru: "Клиентов на платформе", en: "Clients on the platform" },
  statProvSearches: { ru: "Поисковых запросов от клиентов", en: "Client search queries" },
  proAccessTag: { ru: "Доступ открыт", en: "Access granted" },
  proCtaTitle1: { ru: "Вы в профессиональном", en: "You're in the professional" },
  proCtaTitle2: { ru: "сообществе ЩИТ", en: "SHCHIT community" },
  proCtaDesc: { ru: "После верификации доступ к закрытому сообществу открывается автоматически — дополнительная модерация не нужна. Общайтесь с коллегами, обменивайтесь опытом и находите деловые связи.", en: "After verification, access to the private community opens automatically — no extra moderation needed. Connect with colleagues, share experience and find business contacts." },
  proOpenCommunity: { ru: "Перейти в сообщество", en: "Open the community" },
  featPro1Title: { ru: "Заказы без затрат на рекламу", en: "Orders without ad spend" },
  featPro1Desc: { ru: "Клиенты сами находят вас в каталоге — не нужно покупать рекламу на сторонних площадках", en: "Clients find you in the catalog themselves — no need to buy ads on third-party sites" },
  featPro2Title: { ru: "100% дохода — ваши", en: "Keep 100% of earnings" },
  featPro2Desc: { ru: "Платформа не берёт комиссию с заказов. Вы работаете по фиксированной подписке", en: "The platform takes no commission from orders. You work on a fixed subscription" },
  featPro3Title: { ru: "Прямые клиенты", en: "Direct clients" },
  featPro3Desc: { ru: "Клиенты связываются с вами напрямую — звонок, чат и мессенджеры без посредников", en: "Clients reach you directly — call, chat and messengers, no middlemen" },
  featPro4Title: { ru: "Профессиональное сообщество", en: "Professional community" },
  featPro4Desc: { ru: "Живое общение с коллегами со всего мира, обмен опытом и деловые связи", en: "Live communication with colleagues worldwide, sharing experience and business network" },
  featPro5Title: { ru: "Репутация и рейтинг", en: "Reputation & rating" },
  featPro5Desc: { ru: "Прозрачная система отзывов помогает вам выделиться и получать больше заказов", en: "A transparent review system helps you stand out and win more orders" },
  featPro6Title: { ru: "Развитие и обучение", en: "Growth & training" },
  featPro6Desc: { ru: "Актуальные курсы и материалы для повышения квалификации — прямо на платформе", en: "Up-to-date courses and materials for professional growth — right on the platform" },
  coursesSoonBadge: { ru: "Скоро открытие", en: "Coming soon" },
  coursesSoonTitle: { ru: "Раздел в разработке", en: "Section under development" },
  coursesSoonText: { ru: "Мы готовим каталог курсов и тренингов от действующих практиков отрасли. Раздел наполняется — совсем скоро здесь появятся программы для повышения квалификации. Следите за обновлениями.", en: "We are preparing a catalog of courses and training from active industry practitioners. The section is being filled — professional development programs will appear here very soon. Stay tuned." },
  heroClientBadgeAll: { ru: "Все специалисты в одном месте", en: "All specialists in one place" },
  heroProviderBadgeNoAds: { ru: "Без затрат на рекламу", en: "No ad spend" },
  heroProviderBadgeCommunity: { ru: "Сообщество и курсы", en: "Community and courses" },

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
  planEntName: { ru: "Корпоративный", en: "Enterprise" },
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
  featPremiumCard: { ru: "Выделенная Премиум-карточка", en: "Highlighted Premium card" },
  featPremiumTop: { ru: "Всегда в топе выдачи", en: "Always at the top of results" },
  featPremiumAnalytics: { ru: "Расширенная аналитика", en: "Advanced analytics" },

  // Premium plan extras
  bestChoice: { ru: "Лучший выбор", en: "Best choice" },
  choosePremium: { ru: "Стать Премиум", en: "Go Premium" },
  premiumValueNote: { ru: "Ваша карточка выделяется среди всех и всегда показывается выше — клиенты замечают вас первыми.", en: "Your card stands out from the rest and always appears higher — clients notice you first." },
  pdPremiumWhatFor: { ru: "За что вы платите", en: "What you pay for" },
  pdUpgradePremium: { ru: "Перейти на Премиум", en: "Upgrade to Premium" },
  pdPremB1: { ru: "Золотая рамка и корона на карточке в поиске.", en: "Gold frame and crown on your card in search." },
  pdPremB2: { ru: "Ваш профиль выше конкурентов в результатах.", en: "Your profile ranks above competitors in results." },
  pdPremB3: { ru: "Просмотры, клики и источники заявок.", en: "Views, clicks and lead sources." },
  pdPremB4: { ru: "Знак доверия рядом с именем.", en: "A trust mark next to your name." },

  // Payment (YooKassa + Paddle + currency)
  payForeignNote: { ru: "Оплата проходит банковской картой через защищённый сервис ЮKassa. Принимаются карты Visa, Mastercard и «Мир». После нажатия вы перейдёте на безопасную страницу оплаты. Списание производится в рублях (₽); сумма в вашей валюте показана справочно по текущему курсу.", en: "Payment is made by bank card via the secure YooKassa service, which accepts Visa, Mastercard and Mir. After clicking, you'll be redirected to a secure checkout. The charge is made in Russian rubles (₽); the amount in your currency is shown for reference at the current rate." },
  payApproxInCurrency: { ru: "≈ в вашей валюте:", en: "≈ in your currency:" },
  payNotConfigured: { ru: "Это демо-оплата: платёжная система ещё подключается. Реальное списание не произведено.", en: "This is a demo payment: the payment system is still being connected. No real charge was made." },
  payError: { ru: "Не удалось создать платёж. Попробуйте ещё раз.", en: "Failed to create the payment. Please try again." },
  pdInactive: { ru: "Не активна", en: "Inactive" },
  pdNoSub: { ru: "Подписка не оформлена — выберите тариф", en: "No active subscription — choose a plan" },
  searchFCategory: { ru: "Категория", en: "Category" },
  searchAnyCategory: { ru: "Все категории", en: "All categories" },
  searchNoResults: { ru: "Ничего не найдено. Попробуйте изменить запрос.", en: "Nothing found. Try changing your query." },
  pdManageServices: { ru: "Выбрать услуги", en: "Choose services" },
  pdDone: { ru: "Готово", en: "Done" },
  pdSaved: { ru: "Сохранено", en: "Saved" },
  pdServicesHint: { ru: "Отметьте услуги, которые вы оказываете — они появятся в вашей карточке и в поиске.", en: "Select the services you provide — they will appear on your card and in search." },
  pdNoServices: { ru: "Услуги пока не выбраны. Нажмите «Выбрать услуги».", en: "No services selected yet. Click 'Choose services'." },
  priceFrom: { ru: "от", en: "from" },
  priceNotSet: { ru: "цена не указана", en: "price not set" },
  pricePlaceholder: { ru: "например, 8 000 ₽", en: "e.g. $90" },
  pdPriceHint: { ru: "Укажите вашу минимальную цену по каждой услуге. В каталоге клиенты увидят самую низкую цену среди всех исполнителей.", en: "Set your minimum price for each service. In the catalog clients see the lowest price across all providers." },
  dcGreeting: { ru: "Здравствуйте! Чем могу помочь? Опишите вашу задачу.", en: "Hello! How can I help? Describe your task." },
  heroProviderFindOrders: { ru: "Найти заказы", en: "Find orders" },
  pdVfBirthDate: { ru: "Дата рождения", en: "Date of birth" },
  pdVfYears: { ru: "лет", en: "years" },
  pdVfBirthHint: { ru: "Возраст рассчитается автоматически", en: "Age is calculated automatically" },
  chatEmpty: { ru: "Сообщений пока нет. Начните общение!", en: "No messages yet. Start the conversation!" },
  forumNewTopicTitle: { ru: "Заголовок темы", en: "Topic title" },
  forumNewTopicPh: { ru: "О чём хотите поговорить?", en: "What would you like to discuss?" },
  forumCreateBtn: { ru: "Создать тему", en: "Create topic" },
  forumEmpty: { ru: "В этом разделе пока нет тем. Создайте первую!", en: "No topics in this section yet. Create the first one!" },
  forumReplyPh: { ru: "Ваш ответ…", en: "Your reply…" },
  forumReplyBtn: { ru: "Ответить", en: "Reply" },
  forumAllCats: { ru: "Все разделы", en: "All sections" },
  forumBackToList: { ru: "К списку тем", en: "Back to topics" },
  forumNoPosts: { ru: "Пока нет ответов. Будьте первым!", en: "No replies yet. Be the first!" },
  cancel: { ru: "Отмена", en: "Cancel" },
  pdCaseTitle: { ru: "Название кейса", en: "Case title" },
  pdCaseTitlePh: { ru: "Например: Проверка кандидата на полиграфе", en: "E.g. Candidate polygraph screening" },
  pdCaseCat: { ru: "Категория", en: "Category" },
  pdCaseDefaultCat: { ru: "Общее", en: "General" },
  pdCaseSave: { ru: "Сохранить кейс", en: "Save case" },
  pdSaving: { ru: "Сохранение…", en: "Saving…" },
  reqNew: { ru: "Новая заявка", en: "New request" },
  reqBroadcastHint: { ru: "Заявка автоматически разойдётся всем исполнителям выбранной категории. Они откликнутся, и вы сами выберете, с кем работать.", en: "Your request is broadcast to all providers in the selected category. They respond, and you choose whom to work with." },
  reqCategory: { ru: "Категория", en: "Category" },
  reqService: { ru: "Услуга", en: "Service" },
  reqServicePh: { ru: "Например: проверка кандидата на полиграфе", en: "E.g. candidate polygraph screening" },
  reqDesc: { ru: "Описание задачи", en: "Task description" },
  reqDescPh: { ru: "Опишите, что нужно сделать", en: "Describe what needs to be done" },
  reqBudget: { ru: "Бюджет", en: "Budget" },
  reqBudgetPh: { ru: "например, от 8 000 ₽", en: "e.g. from $90" },
  reqCity: { ru: "Город", en: "City" },
  reqCityPh: { ru: "Москва", en: "Moscow" },
  reqPublish: { ru: "Опубликовать заявку", en: "Publish request" },
  reqEmpty: { ru: "У вас пока нет заявок. Создайте первую.", en: "You have no requests yet. Create your first one." },
  reqResponses: { ru: "Отклики исполнителей", en: "Provider responses" },
  reqNoResponses: { ru: "Пока никто не откликнулся. Ожидайте.", en: "No responses yet. Please wait." },
  reqChoose: { ru: "Выбрать", en: "Choose" },
  reqChosen: { ru: "Выбран", en: "Chosen" },
  reqDeclined: { ru: "Отклонён", en: "Declined" },
  reqStatusOpen: { ru: "Открыта", en: "Open" },
  reqStatusAssigned: { ru: "Исполнитель выбран", en: "Provider chosen" },
  pdReqHint: { ru: "Заявки клиентов по вашим категориям. Откликнитесь — клиент выберет исполнителя.", en: "Client requests in your categories. Respond — the client will pick a provider." },
  pdReqEmpty: { ru: "Пока нет открытых заявок по вашим услугам.", en: "No open requests in your services yet." },
  pdReqClient: { ru: "Клиент", en: "Client" },
  pdRespond: { ru: "Откликнуться", en: "Respond" },
  pdEditOffer: { ru: "Изменить отклик", en: "Edit offer" },
  pdResponded: { ru: "Вы откликнулись", en: "You responded" },
  pdYourOffer: { ru: "Ваше предложение", en: "Your offer" },
  pdOfferPrice: { ru: "Ваша цена, напр. от 8 000 ₽", en: "Your price, e.g. from $90" },
  pdOfferMsg: { ru: "Сообщение клиенту", en: "Message to the client" },
  pdSendOffer: { ru: "Отправить отклик", en: "Send offer" },

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

  // Client search & premium
  navSearch: { ru: "Поиск", en: "Search" },
  searchTag: { ru: "Подбор специалиста", en: "Find a specialist" },
  searchTitle: { ru: "Найдите проверенного исполнителя", en: "Find a verified provider" },
  searchSubtitle: { ru: "Отфильтруйте специалистов по услуге, рейтингу, лицензии, городу, стране и нужной дате.", en: "Filter specialists by service, rating, license, city, country and the date you need." },
  searchFService: { ru: "Услуга", en: "Service" },
  searchFCity: { ru: "Город", en: "City" },
  searchFCountry: { ru: "Страна", en: "Country" },
  searchFRating: { ru: "Рейтинг", en: "Rating" },
  searchFDate: { ru: "Дата услуги", en: "Service date" },
  searchFLicensed: { ru: "С лицензией", en: "Licensed only" },
  searchAnyService: { ru: "Любая услуга", en: "Any service" },
  searchAnyCity: { ru: "Любой город", en: "Any city" },
  searchAnyCountry: { ru: "Любая страна", en: "Any country" },
  searchAnyRating: { ru: "Любой рейтинг", en: "Any rating" },
  searchFound: { ru: "Найдено", en: "Found" },
  searchReset: { ru: "Сбросить фильтры", en: "Reset filters" },
  premiumBadge: { ru: "Премиум", en: "Premium" },
  openProfile: { ru: "Открыть профиль", en: "Open profile" },

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
  lpFaqTag: { ru: "Вопросы и ответы", en: "Q & A" },
  lpFaqTitle: { ru: "Частые вопросы", en: "Frequently asked questions" },
  lpFaq1Q: { ru: "Сколько стоит использование платформы?", en: "How much does the platform cost?" },
  lpFaq1A: { ru: "Для клиентов платформа полностью бесплатна — вы ищете специалистов и связываетесь с ними без оплаты. Исполнители платят только за подписку, без комиссии с заказов.", en: "The platform is completely free for clients — you search for specialists and contact them at no cost. Providers pay only for a subscription, with no commission on orders." },
  lpFaq2Q: { ru: "Как вы проверяете специалистов?", en: "How do you verify specialists?" },
  lpFaq2A: { ru: "Каждый исполнитель проходит проверку документов и квалификации. Значок «Лицензия» появляется только после подтверждения лицензии, статуса ИП/ООО и полной верификации модератором.", en: "Each provider undergoes verification of documents and qualifications. The 'License' badge appears only after the license, IP/LLC status and full moderator verification are confirmed." },
  lpFaq3Q: { ru: "Безопасно ли передавать данные?", en: "Is it safe to share my data?" },
  lpFaq3A: { ru: "Да. Мы используем шифрование, защищённый чат и соблюдаем требования GDPR и 152-ФЗ. Платёжные данные обрабатываются сертифицированными провайдерами — мы не храним номера карт.", en: "Yes. We use encryption, a secure chat and comply with GDPR and Russian law. Payment data is processed by certified providers — we do not store card numbers." },
  lpFaq4Q: { ru: "Как происходит оплата услуг исполнителя?", en: "How is the provider's service paid for?" },
  lpFaq4A: { ru: "Оплата и условия услуг согласуются напрямую между клиентом и исполнителем. Платформа — информационный посредник и не является стороной сделки.", en: "Payment and service terms are agreed directly between the client and the provider. The platform is an information intermediary and is not a party to the deal." },
  lpFaq5Q: { ru: "Могу ли я работать под псевдонимом?", en: "Can I work under an alias?" },
  lpFaq5A: { ru: "Да. С учётом специфики сферы безопасности исполнители могут использовать псевдоним и ограничивать публичность части данных — но верификацию перед платформой проходят все.", en: "Yes. Given the nature of the security field, providers may use an alias and limit the visibility of some data — but everyone passes verification with the platform." },
  lpFaq6Q: { ru: "В каких странах работает платформа?", en: "Which countries does the platform operate in?" },
  lpFaq6A: { ru: "Платформа международная: специалисты представлены в 15+ странах. Часовой пояс и доступность для звонков учитываются автоматически.", en: "The platform is international: specialists are present in 15+ countries. Time zone and call availability are taken into account automatically." },

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
  pdPaidUntil: { ru: "Оплачено до", en: "Paid until" },
  pdDaysLeft: { ru: "осталось дней", en: "days left" },
  pdExpiresToday: { ru: "Истекает сегодня", en: "Expires today" },
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
  pdPublish: { ru: "Опубликовать", en: "Publish" },
  pdUnpublish: { ru: "Снять с публикации", en: "Unpublish" },
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
  pdHistLoading: { ru: "Загружаем историю оплат...", en: "Loading payment history..." },
  pdHistEmpty: { ru: "Оплат пока нет. После первой оплаты тарифа здесь появится история.", en: "No payments yet. Your history will appear here after the first plan payment." },

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
  blogTitle: { ru: "Блог / Полезное", en: "Blog / Useful" },
  blogTag: { ru: "Полезные материалы", en: "Useful materials" },
  blogIntro: { ru: "Статьи и гайды о безопасности: как выбрать специалиста, сколько стоят услуги и на что обращать внимание.", en: "Articles and guides on security: how to choose a specialist, how much services cost and what to look out for." },
  blogReadMore: { ru: "Читать", en: "Read" },
  blogTabClients: { ru: "Для клиентов", en: "For clients" },
  blogTabProviders: { ru: "Для специалистов", en: "For specialists" },
  blogBack: { ru: "Ко всем статьям", en: "Back to all articles" },
  blogMinRead: { ru: "мин чтения", en: "min read" },
  blogCtaTitle: { ru: "Нужен проверенный специалист?", en: "Need a verified specialist?" },
  blogCtaText: { ru: "Найдите проверенного специалиста по безопасности в каталоге ЩИТ — с подтверждёнными документами и отзывами.", en: "Find a verified security specialist in the SHCHIT catalog — with confirmed documents and reviews." },
  blogCtaBtn: { ru: "Открыть каталог", en: "Open the catalog" },
  navBlog: { ru: "Блог", en: "Blog" },
  shareTitle: { ru: "Поделиться платформой", en: "Share the platform" },
  shareCopied: { ru: "Ссылка скопирована", en: "Link copied" },
  shareText: { ru: "ЩИТ — международная платформа проверенных специалистов по безопасности", en: "SHCHIT — international platform of verified security specialists" },
  footerPlatform: { ru: "Платформа", en: "Platform" },
  footerCommunity: { ru: "Сообщество", en: "Community" },
  footerDocs: { ru: "Документы", en: "Legal" },
  // About page
  aboutTag: { ru: "О компании", en: "About company" },
  aboutPageTitle: { ru: "О ЩИТ", en: "About SHCHIT" },
  aboutIntro: { ru: "Международная платформа, объединяющая проверенных специалистов по безопасности и клиентов со всего мира — в одном защищённом пространстве.", en: "An international platform connecting verified security specialists with clients worldwide — in one secure space." },
  aboutMissionTitle: { ru: "Наша миссия", en: "Our mission" },
  aboutMissionText: { ru: "Мы делаем поиск специалистов по безопасности простым и безопасным процессом. Детективы, телохранители, полиграфологи, эксперты по кибербезопасности и охранные агентства — раньше их искали по разным сайтам и знакомым. ЩИТ собрал их в одном месте, с проверкой документов и защищённой связью, чтобы клиенты могли довериться профессионалу, а специалисты — получать заказы без затрат на рекламу.", en: "We make finding security specialists simple and safe. Detectives, bodyguards, polygraph examiners, cybersecurity experts and security agencies used to be scattered across different sites and personal contacts. SHCHIT brings them together in one place, with document verification and secure communication, so clients can trust a professional and specialists can get orders without ad spend." },
  aboutStoryTitle: { ru: "Как всё начиналось", en: "How it started" },
  aboutStoryText: { ru: "Платформа ЩИТ создана как ответ на запрос рынка: клиентам было сложно найти проверенного специалиста по безопасности, а специалистам — выйти на клиентов без посредников и дорогой рекламы. Мы объединили разрозненный рынок в единую международную сеть с проверкой лицензий, репутацией и закрытым сообществом профессионалов.", en: "SHCHIT was created in response to a market need: clients struggled to find a verified security specialist, while specialists struggled to reach clients without intermediaries and expensive advertising. We united a fragmented market into a single international network with license verification, reputation tracking and a private professional community." },
  aboutTrustTitle: { ru: "Нам доверяют", en: "Trusted by" },
  aboutTrust1: { ru: "Лицензированные специалисты", en: "Licensed specialists" },
  aboutTrust2: { ru: "Проверка документов", en: "Document verification" },
  aboutTrust3: { ru: "Международное сообщество", en: "International community" },
  aboutTrust4: { ru: "Защищённая переписка", en: "Secure messaging" },
  aboutValuesTitle: { ru: "Наши принципы", en: "Our principles" },
  aboutVal1Title: { ru: "Проверка каждого специалиста", en: "Every specialist is verified" },
  aboutVal1Text: { ru: "Документы, лицензии и квалификация проходят проверку перед публикацией профиля.", en: "Documents, licenses and qualifications are verified before a profile goes live." },
  aboutVal2Title: { ru: "Международный охват", en: "International reach" },
  aboutVal2Text: { ru: "Специалисты и клиенты из разных стран — на одной платформе, с поддержкой нескольких языков.", en: "Specialists and clients from different countries — on one platform, with multi-language support." },
  aboutVal3Title: { ru: "Прозрачная репутация", en: "Transparent reputation" },
  aboutVal3Text: { ru: "Рейтинги, отзывы и подтверждённые кейсы помогают выбрать проверенного специалиста.", en: "Ratings, reviews and verified case studies help choose a trustworthy specialist." },
  aboutVal4Title: { ru: "Без комиссии со сделок", en: "No deal commission" },
  aboutVal4Text: { ru: "Специалисты платят фиксированную подписку и оставляют себе весь доход от заказов.", en: "Specialists pay a fixed subscription and keep all the income from their orders." },
  aboutCtaTitle: { ru: "Остались вопросы о платформе?", en: "Still have questions about the platform?" },
  aboutCtaText: { ru: "Напишите нам — расскажем подробнее о том, как работает ЩИТ, и поможем начать.", en: "Write to us — we'll explain how SHCHIT works and help you get started." },
  aboutCtaBtn: { ru: "Связаться с нами", en: "Contact us" },

  footerForClients: { ru: "Клиентам", en: "For clients" },
  footerForSpecialists: { ru: "Специалистам", en: "For specialists" },
  footerAboutShchit: { ru: "О ЩИТ", en: "About SHCHIT" },
  fHowToOrder: { ru: "Как заказать услугу", en: "How to order a service" },
  fSafetyDeal: { ru: "Безопасность сделки", en: "Deal safety" },
  fBecomeProvider: { ru: "Стать специалистом", en: "Become a specialist" },
  fSpecialistFaq: { ru: "Вопросы и ответы", en: "FAQ" },
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
  contactEmail: { ru: "Электронная почта", en: "Email" },
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
  heroProofTrusted: { ru: "1 240+ верифицированных специалистов на платформе", en: "1,240+ verified specialists on the platform" },
  heroFast: { ru: "Регистрация за 5 минут", en: "Sign up in 5 minutes" },
  heroNoFeeBig: { ru: "Без комиссии для клиентов", en: "No fees for clients" },
  heroGuarantee: { ru: "Проверенные лицензии и гарантия качества", en: "Verified licenses & quality guarantee" },
  ctaUrgency: { ru: "Свяжитесь со специалистом напрямую и бесплатно", en: "Contact a specialist directly, free of charge" },

  // Provider contacts editor
  pdTabContacts: { ru: "Контакты", en: "Contacts" },
  pdContactsTitle: { ru: "Контакты и мессенджеры", en: "Contacts & messengers" },
  pdContactsHint: { ru: "Эти данные видят клиенты на вашей карточке. Заполните, чтобы с вами могли связаться.", en: "Clients see these on your profile card. Fill them in so they can reach you." },
  pdFieldPhone: { ru: "Телефон", en: "Phone" },
  pdFieldEmail: { ru: "Электронная почта", en: "Email" },
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
  avatarHint: { ru: "Загрузите фото или оставьте аватар по умолчанию", en: "Upload a photo or keep the default avatar" },
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
  cdNoReviews: { ru: "Пока нет отзывов", en: "No reviews yet" },
  dcEmpty: { ru: "Напишите первое сообщение, чтобы начать диалог", en: "Send the first message to start the conversation" },
  chatGuestName: { ru: "Гость", en: "Guest" },
  searchBtn: { ru: "Поиск", en: "Search" },
  searchPrompt: { ru: "Задайте критерии и нажмите «Поиск», чтобы увидеть специалистов", en: "Set the criteria and press “Search” to see specialists" },
  pdVfLicenseDate: { ru: "Дата выдачи", en: "Issue date" },
  pdVfLicenseAuthority: { ru: "Орган выдачи", en: "Issuing authority" },
  pdVfLicenseAuthorityPh: { ru: "Например: Росгвардия, МВД", en: "E.g. Rosgvardia, Ministry of Interior" },
  forumBlock: { ru: "Заблокировать", en: "Block" },
  forumDelete: { ru: "Удалить", en: "Delete" },
  forumDeleteConfirm: { ru: "Удалить тему вместе со всеми сообщениями?", en: "Delete the topic with all its posts?" },
  reqTitle: { ru: "Реквизиты оператора", en: "Operator details" },
  reqName: { ru: "ИП Давыдов Алексей Владимирович", en: "Sole proprietor Aleksey V. Davydov" },
  reqOgrnip: { ru: "ОГРНИП: 320222500068242", en: "OGRNIP: 320222500068242" },
  reqInn: { ru: "ИНН: 222111361597", en: "INN: 222111361597" },
  reqAddress: { ru: "Московская обл., г. Электросталь, пос. Всеволодово", en: "Vsevolodovo, Elektrostal, Moscow Region, Russia" },
  reqTaxOffice: { ru: "kackad.rf@yandex.ru", en: "kackad.rf@yandex.ru" },
  paywallTitle: { ru: "Нужен активный тариф", en: "Active subscription required" },
  paywallText: { ru: "Заполните карточку и оплатите тариф, чтобы открыть чаты, форум, курсы и поиск заказов.", en: "Complete your profile and purchase a plan to unlock chats, forum, courses and order search." },
  paywallBtn: { ru: "Перейти к оплате тарифа", en: "Go to subscription" },
  allSpecialistsTitle: { ru: "Все специалисты", en: "All specialists" },
  allSpecialistsSub: { ru: "Все исполнители, зарегистрированные на платформе. Нажмите на карточку, чтобы открыть профиль.", en: "Every provider registered on the platform. Click a card to open the profile." },
  promoLabel: { ru: "Скидка по акции", en: "Promo discount" },
  promoUntil: { ru: "Акция −30% действует до 1 августа 2026", en: "−30% promo valid until August 1, 2026" },
  promoBannerTitle: { ru: "Скидка 30% на все тарифы", en: "30% off all plans" },
  promoBannerText: { ru: "Оформите подписку со скидкой 30% — акция действует до 1 августа 2026 года.", en: "Get 30% off your subscription — offer valid until August 1, 2026." },
  urgencyPrefix: { ru: "Успейте: скидка −30% на все тарифы", en: "Hurry: −30% on all plans" },
  urgencyEnds: { ru: "до конца акции", en: "left" },
  urgencyDays: { ru: "дн", en: "d" },
  urgencyHours: { ru: "ч", en: "h" },
  urgencyMins: { ru: "мин", en: "m" },
  urgencySecs: { ru: "сек", en: "s" },
  urgencyCta: { ru: "Забрать скидку", en: "Claim discount" },
  riskFreeClient: { ru: "Бесплатно для клиентов · Без комиссии", en: "Free for clients · No commission" },
  riskFreeProvider: { ru: "0% комиссии · Отмена в любой момент", en: "0% commission · Cancel anytime" },
  liveOnline: { ru: "специалистов на платформе", en: "specialists on the platform" },
  liveVerified: { ru: "проверено модератором", en: "verified by moderator" },
  planCancelAnytime: { ru: "Отмена в любой момент · без комиссии со сделок", en: "Cancel anytime · no commission on deals" },
  planPopularProof: { ru: "Оптимальный выбор большинства", en: "Most specialists choose this" },
  planGuarantee: { ru: "Оплата защищена · чек на почту сразу после оплаты", en: "Secure payment · receipt emailed instantly" },
  popTag1: { ru: "OSINT", en: "OSINT" },
  popTag2: { ru: "Полиграф", en: "Polygraph" },
  popTag3: { ru: "TSCM", en: "TSCM" },
  popTag4: { ru: "HR-безопасность", en: "HR security" },
  popTag5: { ru: "Корпоративный шпионаж", en: "Corporate espionage" },
  popTag6: { ru: "RF-сканирование", en: "RF scanning" },
  popTag7: { ru: "Детектив", en: "Detective" },
  popTag8: { ru: "Расследование", en: "Investigation" },
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
    const el = lang as ExtraLang;
    // Priority: full UI dictionary → legacy extra → English fallback.
    const fu = full[el]?.[key];
    if (fu) return fu;
    const ex = extra[el]?.[key];
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
  // Наивысший приоритет — язык из URL (?lang=xx). Это делает многоязычные
  // ссылки (hreflang, ссылки из соцсетей и поиска) рабочими для SEO:
  // страница сразу открывается на нужном языке.
  try {
    const urlLang = new URLSearchParams(window.location.search).get("lang") as Lang | null;
    if (urlLang && LANGS.some((l) => l.code === urlLang)) {
      window.localStorage.setItem("lang", urlLang);
      window.localStorage.setItem("langChosen", "1");
      return urlLang;
    }
  } catch {
    // URLSearchParams недоступен — молча пропускаем и идём дальше по приоритетам.
  }
  const saved = window.localStorage.getItem("lang") as Lang | null;
  if (saved && LANGS.some((l) => l.code === saved)) return saved;
  const browser = window.navigator.language.slice(0, 2) as Lang;
  if (LANGS.some((l) => l.code === browser)) return browser;
  return "ru";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(getInitialLang);
  // Счётчик для перерендера после ленивой подгрузки словаря переводов.
  const [dictReady, setDictReady] = useState(0);
  const rtl = RTL_LANGS.includes(lang);

  // Подгружаем тяжёлый словарь только для fr/de/ja/ar/he. До его готовности
  // показывается английский fallback, затем интерфейс мягко обновляется.
  useEffect(() => {
    if (lang !== "ru" && lang !== "en" && !full[lang as ExtraLang]) {
      let alive = true;
      loadFull().then(() => {
        if (alive) setDictReady((v) => v + 1);
      });
      return () => {
        alive = false;
      };
    }
  }, [lang]);

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

      // Локализованные SEO-заголовки для вкладки браузера и превью в соцсетях
      const SEO: Record<string, { title: string; desc: string; locale: string }> = {
        ru: { title: "ЩИТ — Международная платформа специалистов по безопасности", desc: "Проверенные специалисты по безопасности из разных стран — в одном каталоге: детективы, телохранители, полиграфологи, эксперты по кибербезопасности и охранные агентства.", locale: "ru_RU" },
        en: { title: "SHCHIT — International Security Specialists Platform", desc: "Verified security specialists worldwide in one directory: detectives, bodyguards, polygraph examiners, cybersecurity experts and security agencies.", locale: "en_US" },
        fr: { title: "SHCHIT — Plateforme internationale de spécialistes de la sécurité", desc: "Spécialistes de la sécurité vérifiés du monde entier dans un seul annuaire : détectives, gardes du corps, polygraphistes, experts en cybersécurité et agences de sécurité.", locale: "fr_FR" },
        de: { title: "SHCHIT — Internationale Plattform für Sicherheitsspezialisten", desc: "Verifizierte Sicherheitsspezialisten weltweit in einem Verzeichnis: Detektive, Personenschützer, Polygraf-Prüfer, Cybersicherheitsexperten und Sicherheitsfirmen.", locale: "de_DE" },
        ja: { title: "SHCHIT — セキュリティ専門家の国際プラットフォーム", desc: "世界中の認証済みセキュリティ専門家を1つのディレクトリに：探偵、ボディガード、ポリグラフ検査官、サイバーセキュリティの専門家、警備会社。", locale: "ja_JP" },
        ar: { title: "SHCHIT — منصة دولية لخبراء الأمن", desc: "خبراء أمن موثّقون من جميع أنحاء العالم في دليل واحد: محققون، حراس شخصيون، فاحصو كشف الكذب، خبراء الأمن السيبراني وشركات الأمن.", locale: "ar_AR" },
        he: { title: "SHCHIT — פלטפורמה בינלאומית למומחי אבטחה", desc: "מומחי אבטחה מאומתים מרחבי העולם במדריך אחד: חוקרים, מאבטחים אישיים, בודקי פוליגרף, מומחי סייבר וחברות אבטחה.", locale: "he_IL" },
      };
      const seo = SEO[lang] ?? SEO.ru;
      document.title = seo.title;

      const setMeta = (selector: string, attr: string, value: string) => {
        const el = document.querySelector(selector);
        if (el) el.setAttribute(attr, value);
      };
      setMeta('meta[name="description"]', "content", seo.desc);
      setMeta('meta[property="og:title"]', "content", seo.title);
      setMeta('meta[property="og:description"]', "content", seo.desc);
      setMeta('meta[property="og:locale"]', "content", seo.locale);
      setMeta('meta[name="twitter:title"]', "content", seo.title);
      setMeta('meta[name="twitter:description"]', "content", seo.desc);
    }
  }, [lang, rtl]);

  // dictReady включён в зависимости, чтобы после ленивой загрузки словаря
  // все переводы пересчитались с полными строками вместо fallback.
  void dictReady;
  const tr = (key: keyof typeof t) => translate(key as string, lang);

  return (
    <LanguageContext.Provider value={{ lang, setLang, tr, rtl, applyGeoLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLang = () => useContext(LanguageContext);