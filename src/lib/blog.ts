// SEO-статьи раздела «Блог/Полезное». Тексты под реальные поисковые запросы
// клиентов — это бесплатный органический трафик из Яндекс/Google.
// Каждая статья двуязычная (ru/en). Для fr/de/ja/ar/he показывается англ. версия
// (как и остальной «тяжёлый» контент платформы).

export type LocaleStr = { ru: string; en: string };

export type BlogBlock =
  | { type: "p"; text: LocaleStr }
  | { type: "h"; text: LocaleStr }
  | { type: "li"; items: LocaleStr[] };

export type BlogPost = {
  slug: string;
  icon: string;
  date: string;
  readMin: number;
  title: LocaleStr;
  excerpt: LocaleStr;
  // SEO мета для конкретной статьи
  metaTitle: LocaleStr;
  metaDescription: LocaleStr;
  body: BlogBlock[];
};

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "how-to-choose-private-detective",
    icon: "Search",
    date: "2026-07-11",
    readMin: 6,
    title: {
      ru: "Как выбрать частного детектива: полное руководство",
      en: "How to choose a private detective: a complete guide",
    },
    excerpt: {
      ru: "На что смотреть при выборе частного детектива, какие документы проверять и как не попасть к мошеннику.",
      en: "What to look for when choosing a private detective, which documents to check and how to avoid scammers.",
    },
    metaTitle: {
      ru: "Как выбрать частного детектива — критерии, документы, цены | ЩИТ",
      en: "How to choose a private detective — criteria, documents, prices | SHCHIT",
    },
    metaDescription: {
      ru: "Пошаговое руководство по выбору частного детектива: лицензия, опыт, договор, цены и признаки мошенников. Проверенные специалисты на платформе ЩИТ.",
      en: "Step-by-step guide to choosing a private detective: license, experience, contract, prices and scam red flags. Verified specialists on SHCHIT.",
    },
    body: [
      { type: "p", text: {
        ru: "Частный детектив помогает в ситуациях, где нужна аккуратная и законная работа с информацией: поиск людей, проверка контрагентов, сбор доказательств. Ошибка в выборе стоит дорого — и денег, и времени. Разберём, как выбрать специалиста, которому можно доверять.",
        en: "A private detective helps in situations that require careful and lawful work with information: locating people, vetting counterparties, gathering evidence. Choosing wrong is costly — in money and time. Let's break down how to pick a specialist you can trust.",
      } },
      { type: "h", text: { ru: "1. Проверьте лицензию и статус", en: "1. Check the license and legal status" } },
      { type: "p", text: {
        ru: "В большинстве стран частная детективная деятельность лицензируется. Попросите номер лицензии и подтверждение статуса ИП или компании. На платформе ЩИТ значок «Лицензия» появляется только после проверки документов модератором.",
        en: "In most countries private investigation is licensed. Ask for the license number and confirmation of sole-proprietor or company status. On SHCHIT, the 'License' badge appears only after a moderator verifies the documents.",
      } },
      { type: "h", text: { ru: "2. Оцените опыт и специализацию", en: "2. Assess experience and specialization" } },
      { type: "p", text: {
        ru: "Детективы часто специализируются: одни сильны в корпоративных расследованиях, другие — в поиске людей или семейных делах. Спросите про похожие кейсы и результат.",
        en: "Detectives often specialize: some are strong in corporate investigations, others in locating people or family matters. Ask about similar cases and outcomes.",
      } },
      { type: "h", text: { ru: "3. Обязательно заключайте договор", en: "3. Always sign a contract" } },
      { type: "p", text: {
        ru: "Договор фиксирует объём работ, сроки, стоимость и законные рамки. Отказ работать по договору — тревожный сигнал.",
        en: "A contract fixes the scope, timeline, cost and legal boundaries. Refusing to work under a contract is a red flag.",
      } },
      { type: "h", text: { ru: "Признаки мошенника", en: "Scam red flags" } },
      { type: "li", items: [
        { ru: "Обещает «стопроцентный результат» по любому делу", en: "Promises a '100% result' on any case" },
        { ru: "Требует всю оплату вперёд наличными без документов", en: "Demands full prepayment in cash with no paperwork" },
        { ru: "Отказывается показывать лицензию и заключать договор", en: "Refuses to show a license or sign a contract" },
        { ru: "Предлагает заведомо незаконные методы", en: "Offers clearly illegal methods" },
      ] },
      { type: "p", text: {
        ru: "Вывод: проверяйте лицензию, работайте по договору и выбирайте специалистов с подтверждённой репутацией. На платформе ЩИТ все специалисты проходят проверку, а рейтинг и отзывы помогают принять решение.",
        en: "Bottom line: verify the license, work under a contract, and choose specialists with a proven reputation. On SHCHIT every specialist is verified, and ratings and reviews help you decide.",
      } },
    ],
  },
  {
    slug: "how-much-bodyguard-costs",
    icon: "Shield",
    date: "2026-07-11",
    readMin: 5,
    title: {
      ru: "Сколько стоит телохранитель и от чего зависит цена",
      en: "How much a bodyguard costs and what affects the price",
    },
    excerpt: {
      ru: "Разбираем реальные цены на услуги личной охраны: почасовая, посуточная и постоянная защита.",
      en: "A breakdown of real personal protection prices: hourly, daily and full-time security.",
    },
    metaTitle: {
      ru: "Сколько стоит телохранитель — цены на личную охрану 2026 | ЩИТ",
      en: "How much a bodyguard costs — personal security prices 2026 | SHCHIT",
    },
    metaDescription: {
      ru: "Реальные цены на услуги телохранителя: от чего зависит стоимость, форматы охраны и как сэкономить без потери качества. Проверенные специалисты на ЩИТ.",
      en: "Real bodyguard prices: what affects the cost, protection formats and how to save without losing quality. Verified specialists on SHCHIT.",
    },
    body: [
      { type: "p", text: {
        ru: "Стоимость услуг телохранителя зависит от уровня риска, квалификации специалиста, продолжительности и формата защиты. Разберём, из чего складывается цена и как выбрать оптимальный вариант.",
        en: "The cost of a bodyguard depends on the risk level, the specialist's qualifications, duration and protection format. Let's see what makes up the price and how to choose the best option.",
      } },
      { type: "h", text: { ru: "Что влияет на цену", en: "What affects the price" } },
      { type: "li", items: [
        { ru: "Уровень угрозы и публичность клиента", en: "Threat level and the client's public profile" },
        { ru: "Опыт, лицензия и подготовка специалиста", en: "The specialist's experience, license and training" },
        { ru: "Формат: разовое сопровождение или постоянная защита", en: "Format: one-off escort or full-time protection" },
        { ru: "Количество охранников и наличие автомобиля", en: "Number of guards and whether a vehicle is provided" },
      ] },
      { type: "h", text: { ru: "Форматы оплаты", en: "Payment formats" } },
      { type: "p", text: {
        ru: "Обычно услуги считают почасово (короткое сопровождение), посуточно (мероприятие, поездка) или помесячно (постоянная защита). Помесячный формат чаще выгоднее в пересчёте на час.",
        en: "Services are usually priced hourly (short escort), daily (an event or trip) or monthly (full-time protection). The monthly format is often cheaper per hour.",
      } },
      { type: "p", text: {
        ru: "Совет: не выбирайте охрану только по низкой цене. Проверяйте лицензию, подготовку и отзывы. На платформе ЩИТ вы видите подтверждённый статус специалиста и его рейтинг.",
        en: "Tip: don't choose security by low price alone. Check the license, training and reviews. On SHCHIT you can see a specialist's verified status and rating.",
      } },
    ],
  },
  {
    slug: "how-polygraph-test-works",
    icon: "Activity",
    date: "2026-07-11",
    readMin: 6,
    title: {
      ru: "Как проходит проверка на полиграфе (детекторе лжи)",
      en: "How a polygraph (lie detector) test works",
    },
    excerpt: {
      ru: "Что такое полиграф, как проходит проверка, можно ли обмануть детектор и что учитывать при заказе.",
      en: "What a polygraph is, how the test goes, whether you can beat it and what to consider when booking.",
    },
    metaTitle: {
      ru: "Как проходит проверка на полиграфе — этапы, цена, точность | ЩИТ",
      en: "How a polygraph test works — steps, price, accuracy | SHCHIT",
    },
    metaDescription: {
      ru: "Подробно о проверке на полиграфе: этапы, подготовка, точность, стоимость и как выбрать полиграфолога. Проверенные специалисты на платформе ЩИТ.",
      en: "In detail about polygraph testing: steps, preparation, accuracy, cost and how to choose an examiner. Verified specialists on SHCHIT.",
    },
    body: [
      { type: "p", text: {
        ru: "Полиграф фиксирует физиологические реакции человека на вопросы. Его применяют при найме, служебных проверках и в частных ситуациях. Разберём, как проходит проверка и на что обратить внимание.",
        en: "A polygraph records a person's physiological reactions to questions. It's used in hiring, internal investigations and private situations. Let's look at how the test goes and what matters.",
      } },
      { type: "h", text: { ru: "Этапы проверки", en: "Test stages" } },
      { type: "li", items: [
        { ru: "Предтестовая беседа: обсуждение вопросов и согласие", en: "Pre-test interview: discussing the questions and consent" },
        { ru: "Основной этап: регистрация реакций на вопросы", en: "Main stage: recording reactions to questions" },
        { ru: "Анализ данных и заключение полиграфолога", en: "Data analysis and the examiner's conclusion" },
      ] },
      { type: "h", text: { ru: "Точность и ограничения", en: "Accuracy and limitations" } },
      { type: "p", text: {
        ru: "Результат сильно зависит от квалификации специалиста и корректной методики. Поэтому важно выбирать опытного полиграфолога с подтверждённой подготовкой.",
        en: "The result strongly depends on the examiner's qualifications and a correct methodology. That's why it's important to choose an experienced examiner with verified training.",
      } },
      { type: "p", text: {
        ru: "На платформе ЩИТ можно выбрать полиграфолога с проверенными документами, изучить отзывы и связаться напрямую без посредников.",
        en: "On SHCHIT you can choose a polygraph examiner with verified documents, read reviews and contact them directly without intermediaries.",
      } },
    ],
  },
  {
    slug: "how-to-verify-security-specialist",
    icon: "BadgeCheck",
    date: "2026-07-11",
    readMin: 5,
    title: {
      ru: "Как проверить специалиста по безопасности перед заказом",
      en: "How to verify a security specialist before hiring",
    },
    excerpt: {
      ru: "Простой чек-лист проверки любого специалиста по безопасности: документы, репутация, договор.",
      en: "A simple checklist to verify any security specialist: documents, reputation, contract.",
    },
    metaTitle: {
      ru: "Как проверить специалиста по безопасности — чек-лист | ЩИТ",
      en: "How to verify a security specialist — checklist | SHCHIT",
    },
    metaDescription: {
      ru: "Чек-лист проверки специалиста по безопасности: лицензия, статус, репутация, договор и признаки мошенников. Проверенные профессионалы на платформе ЩИТ.",
      en: "Checklist to verify a security specialist: license, status, reputation, contract and scam signs. Verified professionals on SHCHIT.",
    },
    body: [
      { type: "p", text: {
        ru: "Перед тем как доверить деликатное дело, важно убедиться в надёжности специалиста. Вот короткий чек-лист, который защитит вас от ошибок.",
        en: "Before trusting someone with a sensitive matter, make sure the specialist is reliable. Here's a short checklist that protects you from mistakes.",
      } },
      { type: "h", text: { ru: "Чек-лист проверки", en: "Verification checklist" } },
      { type: "li", items: [
        { ru: "Лицензия и правовой статус (ИП/компания)", en: "License and legal status (sole proprietor/company)" },
        { ru: "Реальные отзывы и рейтинг", en: "Genuine reviews and rating" },
        { ru: "Готовность заключить договор", en: "Willingness to sign a contract" },
        { ru: "Прозрачное ценообразование без скрытых платежей", en: "Transparent pricing with no hidden fees" },
        { ru: "Специализация под вашу задачу", en: "Specialization matching your task" },
      ] },
      { type: "p", text: {
        ru: "Платформа ЩИТ берёт часть проверки на себя: значок «Лицензия» выдаётся только после подтверждения документов, а рейтинг и отзывы формируют прозрачную репутацию.",
        en: "SHCHIT takes part of the verification off your shoulders: the 'License' badge is issued only after documents are confirmed, while ratings and reviews build a transparent reputation.",
      } },
    ],
  },
  {
    slug: "what-is-tscm-bug-sweeping",
    icon: "Radar",
    date: "2026-07-11",
    readMin: 5,
    title: {
      ru: "Что такое поиск прослушки (TSCM) и когда он нужен",
      en: "What is bug sweeping (TSCM) and when you need it",
    },
    excerpt: {
      ru: "Когда стоит заказать проверку помещения на прослушку, как проходит поиск устройств и что важно знать.",
      en: "When to order a room sweep for bugs, how device detection works and what to know.",
    },
    metaTitle: {
      ru: "Поиск прослушки (TSCM) — что это, когда нужно, цена | ЩИТ",
      en: "Bug sweeping (TSCM) — what it is, when you need it, price | SHCHIT",
    },
    metaDescription: {
      ru: "Поиск прослушки и скрытых камер (TSCM): когда заказывать, как проходит проверка помещения и как выбрать специалиста. Проверенные эксперты на платформе ЩИТ.",
      en: "Bug and hidden-camera sweeping (TSCM): when to order, how a room check works and how to choose a specialist. Verified experts on SHCHIT.",
    },
    body: [
      { type: "p", text: {
        ru: "TSCM — это профессиональный поиск скрытых устройств прослушки и наблюдения. Его заказывают, когда есть риск утечки информации или слежки.",
        en: "TSCM is the professional search for hidden listening and surveillance devices. It's ordered when there's a risk of information leaks or surveillance.",
      } },
      { type: "h", text: { ru: "Когда стоит заказать проверку", en: "When to order a sweep" } },
      { type: "li", items: [
        { ru: "Перед важными переговорами и сделками", en: "Before important negotiations and deals" },
        { ru: "При подозрении на утечку конфиденциальной информации", en: "When you suspect a leak of confidential information" },
        { ru: "После визита посторонних в офис или дом", en: "After strangers have visited your office or home" },
      ] },
      { type: "p", text: {
        ru: "Проверку должны проводить специалисты со специальным оборудованием. На платформе ЩИТ можно найти проверенных экспертов по технической безопасности с подтверждённой квалификацией.",
        en: "The sweep should be done by specialists with dedicated equipment. On SHCHIT you can find verified technical-security experts with confirmed qualifications.",
      } },
    ],
  },
];
