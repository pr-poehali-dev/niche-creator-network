import type { LS } from "@/lib/shared";

/**
 * Житейские задачи — мост между языком клиента и названиями профессий.
 *
 * Человек приходит не за «полиграфологом» и не за «OSINT-аналитиком».
 * Он приходит с бедой: пропал родственник, уволенный сотрудник унёс базу,
 * подозревает прослушку в кабинете. Названия специальностей ему ничего не
 * говорят — он их просто не знает.
 *
 * Здесь задача описана так, как её формулирует сам человек, и привязана к
 * нужной специальности каталога.
 */
export type LifeTask = {
  id: string;
  icon: string;
  title: LS;
  /** Что получит человек — одной строкой, без терминов. */
  hint: LS;
  /** Категория каталога, куда ведём. */
  cat: string;
  /** Английские названия услуг — по ним фильтруем специалистов. */
  services: string[];
  /** Синонимы для поиска: как эту задачу могут назвать своими словами. */
  keywords: string[];
};

export const lifeTasks: LifeTask[] = [
  {
    id: "find-person",
    icon: "UserSearch",
    title: { ru: "Найти человека", en: "Find a person" },
    hint: { ru: "Пропал родственник, должник скрывается, потеряна связь", en: "A relative is missing, a debtor is hiding, contact is lost" },
    cat: "physical",
    services: ["Private investigator", "OSINT analyst"],
    keywords: ["пропал", "найти", "розыск", "должник", "скрывается", "потерялся", "ищу человека", "разыскать"],
  },
  {
    id: "check-partner",
    icon: "FileSearch",
    title: { ru: "Проверить партнёра или фирму", en: "Check a partner or company" },
    hint: { ru: "Перед сделкой, договором или крупной покупкой", en: "Before a deal, contract or major purchase" },
    cat: "economic",
    services: ["OSINT analyst", "Due diligence investigator", "Corporate security manager"],
    keywords: ["проверить", "контрагент", "фирма", "компания", "сделка", "партнёр", "надёжность", "due diligence", "договор"],
  },
  {
    id: "check-employee",
    icon: "UserCheck",
    title: { ru: "Проверить сотрудника", en: "Screen an employee" },
    hint: { ru: "При найме или если пропали деньги и документы", en: "When hiring, or if money or documents went missing" },
    cat: "physical",
    services: ["Polygraph examiner", "Behavioral detection officer"],
    keywords: ["полиграф", "детектор лжи", "сотрудник", "кража", "воровство", "найм", "hr", "кандидат", "персонал"],
  },
  {
    id: "personal-guard",
    icon: "ShieldCheck",
    title: { ru: "Личная охрана", en: "Personal protection" },
    hint: { ru: "Сопровождение, угрозы, поездка в незнакомый город", en: "Escort, threats, a trip to an unfamiliar city" },
    cat: "physical",
    services: ["Executive protection agent", "Route planning specialist"],
    keywords: ["охрана", "телохранитель", "сопровождение", "угрожают", "защита", "бодигард", "безопасность поездки"],
  },
  {
    id: "find-bugs",
    icon: "RadioTower",
    title: { ru: "Проверить на прослушку", en: "Sweep for bugs" },
    hint: { ru: "Кабинет, машина, квартира — поиск скрытых устройств", en: "Office, car or flat — finding hidden devices" },
    cat: "physical",
    services: ["TSCM specialist", "Acoustic protection specialist"],
    keywords: ["прослушка", "жучок", "жучки", "слежка", "камера", "подслушивают", "шпион", "tscm", "закладка"],
  },
  {
    id: "hacked",
    icon: "ShieldAlert",
    title: { ru: "Взломали аккаунт или почту", en: "Account or email hacked" },
    hint: { ru: "Украли доступ, шантажируют, утекли данные", en: "Access stolen, blackmail, data leaked" },
    cat: "cyber",
    services: ["Digital forensics examiner", "SOC analyst"],
    keywords: ["взлом", "взломали", "хакер", "украли аккаунт", "шантаж", "вирус", "утечка", "почта", "телеграм"],
  },
  {
    id: "protect-business",
    icon: "Building2",
    title: { ru: "Защитить бизнес от утечек", en: "Protect a business from leaks" },
    hint: { ru: "Сотрудник унёс базу, конкуренты знают лишнее", en: "An employee took the database, competitors know too much" },
    cat: "cyber",
    services: ["Corporate security manager", "Digital forensics examiner", "Cloud security engineer"],
    keywords: ["утечка", "база", "конкуренты", "коммерческая тайна", "слив", "данные", "бизнес"],
  },
  {
    id: "debt-fraud",
    icon: "Scale",
    title: { ru: "Обманули с деньгами", en: "Money fraud" },
    hint: { ru: "Мошенники, невозврат долга, сомнительная сделка", en: "Scammers, unpaid debt, a dubious deal" },
    cat: "economic",
    services: ["Fraud prevention analyst", "Private investigator", "Forensic evidence collection specialist"],
    keywords: ["мошенник", "обманули", "долг", "деньги", "развод", "не отдаёт", "кинули", "фрод"],
  },
  {
    id: "guard-object",
    icon: "Warehouse",
    title: { ru: "Охрана объекта", en: "Guard a site" },
    hint: { ru: "Офис, склад, стройка, магазин, мероприятие", en: "Office, warehouse, construction site, shop or event" },
    cat: "physical",
    services: ["Physical security monitoring operator", "K9 screening handler"],
    keywords: ["охрана объекта", "чоп", "склад", "офис", "магазин", "стройка", "мероприятие", "пультовая"],
  },
];

/** Ищет задачи по слову, которое ввёл человек. */
export function matchLifeTasks(query: string, lang: "ru" | "en"): LifeTask[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  return lifeTasks.filter((t) => {
    const title = (lang === "ru" ? t.title.ru : t.title.en).toLowerCase();
    const hint = (lang === "ru" ? t.hint.ru : t.hint.en).toLowerCase();
    return title.includes(q) || hint.includes(q) || t.keywords.some((k) => k.includes(q) || q.includes(k));
  });
}
