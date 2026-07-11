// Отзывы КЛИЕНТОВ о специалистах платформы ЩИТ (для клиентской главной).
// Двуязычные (ru/en); на fr/de/ja/ar/he переводятся автоматически, как блог.
// Это социальное доказательство — ключевой фактор конверсии на лендинге.

export type LocaleStr = { ru: string; en: string };

export type ClientReview = {
  id: string;
  name: LocaleStr;
  city: LocaleStr;
  service: LocaleStr;
  gender: "m" | "f";
  rating: number;
  text: LocaleStr;
};

export const CLIENT_REVIEWS: ClientReview[] = [
  {
    id: "r1",
    name: { ru: "Марина К.", en: "Marina K." },
    city: { ru: "Москва", en: "Moscow" },
    service: { ru: "Проверка контрагента", en: "Counterparty check" },
    gender: "f",
    rating: 5,
    text: {
      ru: "Перед крупной сделкой заказала проверку партнёра. Специалист нашёл скрытые долги и суды — сделку отменили, сэкономили несколько миллионов. Всё чётко и по договору.",
      en: "Before a big deal I ordered a partner check. The specialist found hidden debts and lawsuits — we cancelled the deal and saved several million. Everything was clear and under contract.",
    },
  },
  {
    id: "r2",
    name: { ru: "Дмитрий В.", en: "Dmitry V." },
    city: { ru: "Санкт-Петербург", en: "Saint Petersburg" },
    service: { ru: "Личная охрана", en: "Personal security" },
    gender: "m",
    rating: 5,
    text: {
      ru: "Нужен был телохранитель на серию деловых поездок. Нашёл специалиста с лицензией за один вечер. Работал профессионально и незаметно. Буду обращаться снова.",
      en: "I needed a bodyguard for a series of business trips. Found a licensed specialist in one evening. He worked professionally and discreetly. I'll be back.",
    },
  },
  {
    id: "r3",
    name: { ru: "Елена С.", en: "Elena S." },
    city: { ru: "Казань", en: "Kazan" },
    service: { ru: "Поиск человека", en: "Person search" },
    gender: "f",
    rating: 5,
    text: {
      ru: "Помогли найти родственника, с которым не общались 20 лет. Детектив действовал строго законно и очень деликатно. Спасибо огромное — воссоединили семью.",
      en: "They helped me find a relative I hadn't spoken to in 20 years. The detective acted strictly legally and very tactfully. Huge thanks — they reunited our family.",
    },
  },
  {
    id: "r4",
    name: { ru: "Игорь Н.", en: "Igor N." },
    city: { ru: "Екатеринбург", en: "Yekaterinburg" },
    service: { ru: "Полиграф (HR)", en: "Polygraph (HR)" },
    gender: "m",
    rating: 5,
    text: {
      ru: "Проверяли кандидатов на материально ответственную должность. Полиграфолог с платформы работал корректно и с согласия людей. Отчёт помог принять верное решение.",
      en: "We screened candidates for a financially responsible position. The examiner from the platform worked correctly and with people's consent. The report helped us decide right.",
    },
  },
  {
    id: "r5",
    name: { ru: "Ольга П.", en: "Olga P." },
    city: { ru: "Новосибирск", en: "Novosibirsk" },
    service: { ru: "Кибербезопасность", en: "Cybersecurity" },
    gender: "f",
    rating: 5,
    text: {
      ru: "После взлома аккаунтов обратилась к специалисту. Помог вернуть доступ, закрыл уязвимости и объяснил, как защититься. Теперь спокойна за свои данные.",
      en: "After my accounts were hacked I turned to a specialist. He recovered access, closed the vulnerabilities and explained how to stay protected. Now I'm calm about my data.",
    },
  },
  {
    id: "r6",
    name: { ru: "Артём Л.", en: "Artem L." },
    city: { ru: "Краснодар", en: "Krasnodar" },
    service: { ru: "Проверка авто", en: "Car check" },
    gender: "m",
    rating: 5,
    text: {
      ru: "Перед покупкой машины заказал проверку. Выяснилось, что авто в залоге. Специалист буквально спас меня от потери денег. Рекомендую всем перед сделкой.",
      en: "Before buying a car I ordered a check. It turned out the car was pledged as collateral. The specialist literally saved me from losing money. I recommend it to everyone before a deal.",
    },
  },
  {
    id: "r7",
    name: { ru: "Светлана М.", en: "Svetlana M." },
    city: { ru: "Нижний Новгород", en: "Nizhny Novgorod" },
    service: { ru: "Безопасность бизнеса", en: "Business security" },
    gender: "f",
    rating: 5,
    text: {
      ru: "Провели аудит безопасности офиса. Нашли слабые места в контроле доступа и утечках. Внедрили рекомендации — стало заметно спокойнее. Профессиональный подход.",
      en: "They audited our office security. They found weak spots in access control and leaks. We implemented the recommendations — it's noticeably calmer now. A professional approach.",
    },
  },
  {
    id: "r8",
    name: { ru: "Роман Т.", en: "Roman T." },
    city: { ru: "Самара", en: "Samara" },
    service: { ru: "Взыскание долга", en: "Debt recovery" },
    gender: "m",
    rating: 4,
    text: {
      ru: "Долго не мог вернуть долг. Детектив законно нашёл активы должника, юрист помог со взысканием. Деньги вернули. Заняло время, но результат есть.",
      en: "I couldn't recover a debt for a long time. The detective legally located the debtor's assets, and a lawyer helped with recovery. The money came back. It took time, but there's a result.",
    },
  },
  {
    id: "r9",
    name: { ru: "Наталья Ж.", en: "Natalia Zh." },
    city: { ru: "Ростов-на-Дону", en: "Rostov-on-Don" },
    service: { ru: "Проверка няни", en: "Nanny check" },
    gender: "f",
    rating: 5,
    text: {
      ru: "Проверяли няню для ребёнка. Специалист собрал всю законную информацию и дал заключение. Теперь доверяю человеку, который с детьми. Бесценно для мамы.",
      en: "We checked a nanny for our child. The specialist gathered all lawful information and gave a conclusion. Now I trust the person who's with the kids. Priceless for a mom.",
    },
  },
  {
    id: "r10",
    name: { ru: "Павел Б.", en: "Pavel B." },
    city: { ru: "Челябинск", en: "Chelyabinsk" },
    service: { ru: "Поиск прослушки (TSCM)", en: "Bug sweeping (TSCM)" },
    gender: "m",
    rating: 5,
    text: {
      ru: "Перед важными переговорами заказал проверку переговорной. Нашли скрытое устройство. Даже не подозревал. Специалист приехал быстро и всё сделал аккуратно.",
      en: "Before important negotiations I ordered a sweep of the meeting room. They found a hidden device. I never suspected it. The specialist arrived fast and did everything neatly.",
    },
  },
  {
    id: "r11",
    name: { ru: "Виктория А.", en: "Victoria A." },
    city: { ru: "Уфа", en: "Ufa" },
    service: { ru: "Проверка недвижимости", en: "Real estate check" },
    gender: "f",
    rating: 5,
    text: {
      ru: "Покупала квартиру, боялась подводных камней. Специалист проверил юридическую чистоту и историю сделок. Купила спокойно, без рисков. Огромная благодарность.",
      en: "I was buying an apartment and feared hidden pitfalls. The specialist checked the legal status and transaction history. I bought it calmly, without risks. Huge thanks.",
    },
  },
  {
    id: "r12",
    name: { ru: "Сергей Д.", en: "Sergey D." },
    city: { ru: "Владивосток", en: "Vladivostok" },
    service: { ru: "Корпоративное расследование", en: "Corporate investigation" },
    gender: "m",
    rating: 5,
    text: {
      ru: "В компании были утечки информации. Специалист провёл расследование законно и тактично, вычислил источник. Вопрос закрыли без огласки. Очень доволен.",
      en: "Our company had information leaks. The specialist investigated lawfully and tactfully and identified the source. The issue was closed without publicity. Very satisfied.",
    },
  },
  {
    id: "r13",
    name: { ru: "Анна Ф.", en: "Anna F." },
    city: { ru: "Воронеж", en: "Voronezh" },
    service: { ru: "Защита от мошенников", en: "Fraud protection" },
    gender: "f",
    rating: 5,
    text: {
      ru: "Столкнулась с телефонными мошенниками. Специалист помог разобраться, куда обращаться, и защитить счета. Поддержал в стрессовой ситуации. Спасибо за человечность.",
      en: "I ran into phone scammers. The specialist helped me figure out where to turn and protect my accounts. He supported me in a stressful situation. Thanks for the humanity.",
    },
  },
  {
    id: "r14",
    name: { ru: "Максим Р.", en: "Maxim R." },
    city: { ru: "Пермь", en: "Perm" },
    service: { ru: "Охрана мероприятия", en: "Event security" },
    gender: "m",
    rating: 4,
    text: {
      ru: "Заказывал охрану на частное мероприятие. Команда приехала вовремя, всё прошло спокойно и без инцидентов. Гостям было комфортно. Обращусь ещё.",
      en: "I hired security for a private event. The team arrived on time, everything went calmly and without incidents. The guests felt comfortable. I'll use them again.",
    },
  },
  {
    id: "r15",
    name: { ru: "Юлия Г.", en: "Yulia G." },
    city: { ru: "Калининград", en: "Kaliningrad" },
    service: { ru: "Проверка работодателя", en: "Employer check" },
    gender: "f",
    rating: 5,
    text: {
      ru: "Перед выходом на новую работу проверила компанию. Оказалось, вакансия сомнительная. Специалист уберёг меня от потери времени и денег. Очень признательна.",
      en: "Before starting a new job I checked the company. The vacancy turned out to be dubious. The specialist saved me from wasting time and money. I'm very grateful.",
    },
  },
];
