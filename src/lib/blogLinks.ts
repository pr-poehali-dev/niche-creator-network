/**
 * Связи статьи с каталогом и с похожими материалами.
 *
 * Зачем: человек дочитывает разбор «как проходит проверка на полиграфе» —
 * и упирается в тупик. Общая кнопка «смотреть каталог» отправляла его в
 * начало списка из 48 специальностей, где нужно было искать заново.
 * Здесь у каждой статьи есть своё направление каталога и 2-3 соседних
 * материала — читатель идёт дальше, а поисковик видит связную структуру
 * вместо набора изолированных страниц.
 *
 * Держим отдельно от blog.ts: тот файл весит ~97 КБ и грузится отдельно,
 * а эти связи нужны сразу и занимают считанные килобайты.
 */

export type CatId = "physical" | "cyber" | "economic" | "crisis";

type Link = { cat: CatId; related: string[] };

/**
 * cat — направление каталога, куда логично перейти после статьи.
 * related — 2-3 материала по смежному вопросу (не «ещё почитать вообще»,
 * а следующий вопрос, который реально возникает у человека).
 */
export const BLOG_LINKS: Record<string, Link> = {
  "how-to-choose-private-detective": {
    cat: "physical",
    related: ["how-to-verify-security-specialist", "how-to-find-missing-person-legally", "how-to-collect-evidence-legally"],
  },
  "how-much-bodyguard-costs": {
    cat: "physical",
    related: ["vip-personal-security-basics", "how-to-behave-in-dangerous-situation", "travel-safety-abroad"],
  },
  "how-polygraph-test-works": {
    cat: "physical",
    related: ["employee-background-check", "how-to-verify-security-specialist", "corporate-security-audit"],
  },
  "how-to-verify-security-specialist": {
    cat: "physical",
    related: ["how-to-choose-private-detective", "how-much-bodyguard-costs", "how-to-find-lawyer-security-case"],
  },
  "what-is-tscm-bug-sweeping": {
    cat: "physical",
    related: ["how-to-secure-office", "corporate-security-audit", "how-to-protect-business-from-raiders"],
  },
  "how-to-check-counterparty-before-deal": {
    cat: "economic",
    related: ["how-to-check-real-estate-before-buying", "business-competitive-intelligence-legal", "how-to-recover-debt-legally"],
  },
  "how-to-find-missing-person-legally": {
    cat: "physical",
    related: ["how-to-choose-private-detective", "how-to-collect-evidence-legally", "how-to-deal-with-stalking-legally"],
  },
  "employee-background-check": {
    cat: "economic",
    related: ["how-polygraph-test-works", "corporate-security-audit", "how-to-check-employer-before-job"],
  },
  "how-to-protect-home-from-burglary": {
    cat: "physical",
    related: ["how-to-secure-office", "children-online-safety", "how-to-behave-in-dangerous-situation"],
  },
  "personal-cybersecurity-basics": {
    cat: "cyber",
    related: ["how-to-protect-personal-data", "how-to-recognize-phone-scam", "children-online-safety"],
  },
  "how-to-recognize-phone-scam": {
    cat: "cyber",
    related: ["personal-cybersecurity-basics", "how-to-verify-online-seller", "how-to-protect-personal-data"],
  },
  "corporate-security-audit": {
    cat: "economic",
    related: ["how-to-secure-office", "what-is-tscm-bug-sweeping", "how-to-protect-business-from-raiders"],
  },
  "event-security-organization": {
    cat: "physical",
    related: ["how-much-bodyguard-costs", "vip-personal-security-basics", "how-to-secure-office"],
  },
  "how-to-check-car-before-buying": {
    cat: "economic",
    related: ["how-to-check-real-estate-before-buying", "how-to-verify-online-seller", "how-to-check-counterparty-before-deal"],
  },
  "how-to-check-real-estate-before-buying": {
    cat: "economic",
    related: ["how-to-check-counterparty-before-deal", "how-to-check-car-before-buying", "how-to-find-lawyer-security-case"],
  },
  "children-online-safety": {
    cat: "cyber",
    related: ["personal-cybersecurity-basics", "how-to-protect-personal-data", "how-to-recognize-phone-scam"],
  },
  "how-to-protect-personal-data": {
    cat: "cyber",
    related: ["personal-cybersecurity-basics", "how-to-recognize-phone-scam", "children-online-safety"],
  },
  "how-to-behave-in-dangerous-situation": {
    cat: "physical",
    related: ["how-much-bodyguard-costs", "travel-safety-abroad", "how-to-deal-with-stalking-legally"],
  },
  "how-to-find-lawyer-security-case": {
    cat: "crisis",
    related: ["how-to-collect-evidence-legally", "how-to-recover-debt-legally", "how-to-protect-business-from-raiders"],
  },
  "how-to-collect-evidence-legally": {
    cat: "physical",
    related: ["how-to-choose-private-detective", "how-to-find-lawyer-security-case", "how-to-deal-with-stalking-legally"],
  },
  "business-competitive-intelligence-legal": {
    cat: "economic",
    related: ["how-to-check-counterparty-before-deal", "corporate-security-audit", "how-to-protect-business-from-raiders"],
  },
  "how-to-protect-business-from-raiders": {
    cat: "crisis",
    related: ["corporate-security-audit", "how-to-find-lawyer-security-case", "business-competitive-intelligence-legal"],
  },
  "travel-safety-abroad": {
    cat: "physical",
    related: ["how-to-behave-in-dangerous-situation", "vip-personal-security-basics", "how-much-bodyguard-costs"],
  },
  "how-to-deal-with-stalking-legally": {
    cat: "crisis",
    related: ["how-to-collect-evidence-legally", "how-to-behave-in-dangerous-situation", "how-to-find-lawyer-security-case"],
  },
  "how-to-verify-online-seller": {
    cat: "cyber",
    related: ["how-to-recognize-phone-scam", "how-to-check-car-before-buying", "personal-cybersecurity-basics"],
  },
  "vip-personal-security-basics": {
    cat: "physical",
    related: ["how-much-bodyguard-costs", "travel-safety-abroad", "event-security-organization"],
  },
  "how-to-check-employer-before-job": {
    cat: "economic",
    related: ["employee-background-check", "how-to-check-counterparty-before-deal", "how-to-verify-security-specialist"],
  },
  "how-to-recover-debt-legally": {
    cat: "economic",
    related: ["how-to-check-counterparty-before-deal", "how-to-find-lawyer-security-case", "how-to-collect-evidence-legally"],
  },
  "how-to-secure-office": {
    cat: "physical",
    related: ["corporate-security-audit", "what-is-tscm-bug-sweeping", "how-to-protect-home-from-burglary"],
  },
  "how-to-check-charity-before-donating": {
    cat: "economic",
    related: ["how-to-check-counterparty-before-deal", "how-to-verify-online-seller", "how-to-recognize-phone-scam"],
  },
  // Статьи для специалистов — ведут не в каталог услуг, а к условиям работы
  // на платформе: человек тут не заказчик, а исполнитель.
  "how-to-promote-detective-agency": {
    cat: "physical",
    related: ["where-security-specialists-find-clients", "how-to-build-reputation-detective", "how-to-price-detective-services"],
  },
  "where-security-specialists-find-clients": {
    cat: "physical",
    related: ["how-to-promote-detective-agency", "why-join-shchit-platform", "how-to-price-detective-services"],
  },
  "how-to-build-reputation-detective": {
    cat: "physical",
    related: ["how-to-promote-detective-agency", "where-security-specialists-find-clients", "why-join-shchit-platform"],
  },
  "how-to-price-detective-services": {
    cat: "economic",
    related: ["how-to-promote-detective-agency", "where-security-specialists-find-clients", "how-to-build-reputation-detective"],
  },
  "why-join-shchit-platform": {
    cat: "physical",
    related: ["where-security-specialists-find-clients", "how-to-promote-detective-agency", "how-to-build-reputation-detective"],
  },
};

/** Подписи направлений каталога — под живые формулировки, не внутренние названия. */
export const CAT_LABEL: Record<CatId, { ru: string; en: string }> = {
  physical: { ru: "детективы, охрана, полиграф", en: "detectives, guards, polygraph" },
  cyber: { ru: "кибербезопасность и цифровые улики", en: "cybersecurity & digital forensics" },
  economic: { ru: "проверка контрагентов и расследования", en: "counterparty checks & investigations" },
  crisis: { ru: "антикризисное сопровождение", en: "crisis support" },
};
