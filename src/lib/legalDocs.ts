// Состав юридических документов. Вынесено в данные: объект нужен и при
// открытии документа, и при построении меню, поэтому грузится сразу —
// он небольшой. Сами тексты лежат в словаре переводов, здесь только
// структура разделов.
import type { t } from "@/lib/i18n";

type LegalKey = keyof typeof t;

export type LegalDoc = {
  icon: string;
  tag: LegalKey;
  title: LegalKey;
  intro: LegalKey;
  sections: { title: LegalKey; text: LegalKey }[];
};

export const LEGAL_DOCS: Record<"privacy" | "consent" | "terms" | "agreement" | "offer", LegalDoc> = {
  privacy: {
    icon: "ShieldCheck",
    tag: "lglTag",
    title: "fPrivacy",
    intro: "privIntro",
    sections: [
      { title: "priv1Title", text: "priv1Text" },
      { title: "priv2Title", text: "priv2Text" },
      { title: "priv3Title", text: "priv3Text" },
      { title: "priv4Title", text: "priv4Text" },
      { title: "priv5Title", text: "priv5Text" },
      { title: "priv6Title", text: "priv6Text" },
      { title: "priv7Title", text: "priv7Text" },
      { title: "priv8Title", text: "priv8Text" },
      { title: "priv9Title", text: "priv9Text" },
    ],
  },
  consent: {
    icon: "FileCheck2",
    tag: "lglTag",
    title: "fConsent",
    intro: "consentDocIntro",
    sections: [
      { title: "consent1Title", text: "consent1Text" },
      { title: "consent2Title", text: "consent2Text" },
      { title: "consent3Title", text: "consent3Text" },
      { title: "consent4Title", text: "consent4Text" },
      { title: "consent5Title", text: "consent5Text" },
      { title: "consent6Title", text: "consent6Text" },
      { title: "consent7Title", text: "consent7Text" },
    ],
  },
  terms: {
    icon: "FileText",
    tag: "lglTag",
    title: "fTerms",
    intro: "termsIntro",
    sections: [
      { title: "terms1Title", text: "terms1Text" },
      { title: "terms2Title", text: "terms2Text" },
      { title: "terms3Title", text: "terms3Text" },
      { title: "terms4Title", text: "terms4Text" },
      { title: "terms5Title", text: "terms5Text" },
      { title: "terms6Title", text: "terms6Text" },
      { title: "terms7Title", text: "terms7Text" },
    ],
  },
  agreement: {
    icon: "Handshake",
    tag: "lglTag",
    title: "fAgreement",
    intro: "agrIntro",
    sections: [
      { title: "agr1Title", text: "agr1Text" },
      { title: "agr2Title", text: "agr2Text" },
      { title: "agr3Title", text: "agr3Text" },
      { title: "agr4Title", text: "agr4Text" },
      { title: "agr5Title", text: "agr5Text" },
      { title: "agr6Title", text: "agr6Text" },
    ],
  },
  offer: {
    icon: "Wallet",
    tag: "lglTag",
    title: "fOffer",
    intro: "offerIntro",
    sections: [
      { title: "offer1Title", text: "offer1Text" },
      { title: "offer2Title", text: "offer2Text" },
      { title: "offer3Title", text: "offer3Text" },
      { title: "offer4Title", text: "offer4Text" },
      { title: "offer5Title", text: "offer5Text" },
      { title: "offer6Title", text: "offer6Text" },
      { title: "offer7Title", text: "offer7Text" },
    ],
  },
};

