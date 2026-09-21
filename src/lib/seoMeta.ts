/**
 * Уникальные мета-теги для каждого раздела сайта.
 *
 * Проблема, которую это решает: в HTML жёстко прописан canonical на главную
 * («https://shieldpspl.ru/»). Для поисковика это прямое указание: все адреса
 * сайта — одна и та же страница, склей их. В результате блог, тарифы и
 * каталог услуг не попадали в индекс как самостоятельные страницы, а весь
 * сайт выглядел одностраничником с дублями.
 *
 * Здесь каждому разделу задаётся свой адрес, заголовок и описание. При
 * переходе они подставляются в <head> — робот видит разные страницы.
 */

export type SeoEntry = { title: string; description: string };

const SITE = "https://shieldpspl.ru";
const BRAND = "ЩИТ";

/**
 * Заголовки написаны под то, как человек ищет: «частный детектив цена»,
 * «проверка на полиграфе», а не «наши услуги». Длина — до 60 знаков,
 * иначе поисковик обрежет. Описание — до 160 знаков.
 */
export const SEO_META: Record<string, SeoEntry> = {
  home: {
    title: `${BRAND} — детективы, охрана, полиграф: проверенные специалисты`,
    description:
      "Каталог специалистов по безопасности с проверкой документов и лицензий. Детективы, телохранители, полиграфологи, кибербезопасность. Поиск бесплатный.",
  },
  services: {
    title: `Услуги по безопасности: цены и специалисты — ${BRAND}`,
    description:
      "48 специальностей: частный детектив от 12 000 ₽/день, телохранитель от 9 000 ₽/смена, полиграф от 8 000 ₽, поиск прослушки от 25 000 ₽. Документы проверены.",
  },
  specialists: {
    title: `Проверенные специалисты по безопасности — ${BRAND}`,
    description:
      "Анкеты детективов, телохранителей, полиграфологов и экспертов по кибербезопасности. Лицензии и документы проверены вручную, а не роботом.",
  },
  pricing: {
    title: `Тарифы для специалистов: подписка без комиссии — ${BRAND}`,
    description:
      "Фиксированная подписка вместо процента со сделок. Весь доход с заказов остаётся у специалиста. Для клиентов поиск и связь бесплатны.",
  },
  blog: {
    title: `Блог о безопасности: детективы, полиграф, защита данных — ${BRAND}`,
    description:
      "Разборы без воды: как выбрать частного детектива, сколько стоит телохранитель, как проходит проверка на полиграфе, как найти прослушку.",
  },
  howitworks: {
    title: `Как работает платформа ${BRAND}: от задачи до исполнителя`,
    description:
      "Опишите задачу своими словами — специалисты откликнутся с ценой и сроком. Вы выбираете исполнителя и общаетесь напрямую, без посредников.",
  },
  about: {
    title: `О платформе ${BRAND}: проверка документов специалистов`,
    description:
      "Раньше детектива искали через знакомых, а проверить лицензию было почти невозможно. Мы собрали специалистов в одном месте и сами смотрим их документы.",
  },
  policy: {
    title: `Как мы защищаем данные: шифрование и границы — ${BRAND}`,
    description:
      "AES-128 с проверкой целостности, пароли PBKDF2 со 120 000 итераций, двухфакторный вход. Честно рассказываем и о том, чего наша защита не делает.",
  },
  contacts: {
    title: `Контакты платформы ${BRAND}`,
    description: "Связаться с платформой ЩИТ: поддержка пользователей, вопросы по безопасности, сотрудничество.",
  },
  resumes: {
    title: `База резюме специалистов по безопасности — ${BRAND}`,
    description:
      "Поиск сотрудников в сфере безопасности: охрана, кибербезопасность, экономическая безопасность. Резюме с подтверждёнными документами.",
  },
  courses: {
    title: `Курсы и повышение квалификации для специалистов — ${BRAND}`,
    description: "Обучающие материалы и курсы для специалистов по безопасности на платформе ЩИТ.",
  },
  cases: {
    title: `Кейсы и примеры работ специалистов — ${BRAND}`,
    description: "Примеры задач, которые решают специалисты по безопасности на платформе ЩИТ.",
  },
  guards: {
    title: `Охранные предприятия и агентства — ${BRAND}`,
    description: "Охранные организации с проверенными лицензиями: охрана объектов, мероприятий, сопровождение.",
  },
  mobileapp: {
    title: `Мобильная версия платформы ${BRAND}`,
    description: "Как пользоваться платформой ЩИТ с телефона: установка на главный экран, работа без приложения из магазина.",
  },
  privacy: { title: `Политика конфиденциальности — ${BRAND}`, description: "Как платформа ЩИТ обрабатывает и защищает персональные данные пользователей." },
  offer: { title: `Публичная оферта — ${BRAND}`, description: "Условия оказания услуг платформы ЩИТ." },
  terms: { title: `Условия использования — ${BRAND}`, description: "Правила пользования платформой ЩИТ." },
  agreement: { title: `Пользовательское соглашение — ${BRAND}`, description: "Пользовательское соглашение платформы ЩИТ." },
  consent: { title: `Согласие на обработку данных — ${BRAND}`, description: "Согласие на обработку персональных данных на платформе ЩИТ." },
};

/** Собирает канонический адрес раздела. */
export function canonicalFor(section: string, extra?: Record<string, string>): string {
  if (section === "home") return `${SITE}/`;
  const params = new URLSearchParams({ section, ...(extra || {}) });
  return `${SITE}/?${params.toString()}`;
}

/** Обновляет тег в <head> или создаёт его, если такого ещё нет. */
function setTag(selector: string, create: () => HTMLElement, attr: string, value: string) {
  let el = document.head.querySelector(selector) as HTMLElement | null;
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}

/**
 * Применяет мета-теги раздела. Вызывается при каждом переходе.
 * Для статьи блога заголовок берётся из самой статьи — так у каждой
 * публикации появляется собственная страница в глазах поисковика.
 */
export function applySeo(section: string, override?: Partial<SeoEntry> & { canonical?: string }) {
  if (typeof document === "undefined") return;
  const base = SEO_META[section] || SEO_META.home;
  const title = override?.title || base.title;
  const description = override?.description || base.description;
  const url = override?.canonical || canonicalFor(section);

  document.title = title;

  setTag('meta[name="description"]', () => {
    const m = document.createElement("meta");
    m.setAttribute("name", "description");
    return m;
  }, "content", description);

  setTag('link[rel="canonical"]', () => {
    const l = document.createElement("link");
    l.setAttribute("rel", "canonical");
    return l;
  }, "href", url);

  setTag('meta[property="og:title"]', () => {
    const m = document.createElement("meta");
    m.setAttribute("property", "og:title");
    return m;
  }, "content", title);

  setTag('meta[property="og:description"]', () => {
    const m = document.createElement("meta");
    m.setAttribute("property", "og:description");
    return m;
  }, "content", description);

  setTag('meta[property="og:url"]', () => {
    const m = document.createElement("meta");
    m.setAttribute("property", "og:url");
    return m;
  }, "content", url);
}
