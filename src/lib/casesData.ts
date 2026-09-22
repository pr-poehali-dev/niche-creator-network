// Разборы типовых задач. Вынесены в отдельный файл данных: массив нужен
// и каталогу (страница «Кейсы»), и профилю специалиста. Если держать его
// внутри CatalogSections, статический импорт из Index.tsx обнуляет
// ленивую загрузку — сборщик тянет весь каталог в главный бандл.
export const cases = [
  {
    title: { ru: "Корпоративный шпионаж: обнаружение прослушки в переговорной", en: "Corporate espionage: bugs found in a boardroom" },
    category: { ru: "TSCM", en: "TSCM" },
    date: { ru: "март 2024", en: "March 2024" },
    views: 1240,
    likes: 87,
    summary: { ru: "В ходе плановой проверки переговорной комнаты крупного холдинга были обнаружены 3 замаскированных устройства...", en: "During a routine sweep of a large holding's boardroom, 3 concealed devices were discovered..." },
    author: { ru: "И. Семёнов", en: "I. Semenov" },
  },
  {
    title: { ru: "Верификация кандидата на должность финансового директора", en: "Vetting a candidate for a CFO position" },
    category: { ru: "Полиграф", en: "Polygraph" },
    date: { ru: "февраль 2024", en: "February 2024" },
    views: 890,
    likes: 64,
    summary: { ru: "Проведена комплексная психофизиологическая экспертиза кандидата с применением компьютерного полиграфа...", en: "A comprehensive psychophysiological examination of the candidate was conducted using a computer polygraph..." },
    author: { ru: "А. Морозов", en: "A. Morozov" },
  },
  {
    title: { ru: "Розыск пропавшего без вести лица: методика и результат", en: "Tracing a missing person: method and result" },
    category: { ru: "Детективная деятельность", en: "Investigation" },
    date: { ru: "январь 2024", en: "January 2024" },
    views: 2100,
    likes: 142,
    summary: { ru: "Успешное завершение розыскного дела за 11 суток. Применение OSINT-методов и агентурных источников...", en: "A search case successfully closed in 11 days using OSINT methods and human sources..." },
    author: { ru: "Е. Власова", en: "E. Vlasova" },
  },
];
