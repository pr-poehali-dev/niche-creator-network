import { type Lang, type t } from "@/lib/i18n";
import { dataExtra } from "@/lib/i18n-extra";

export const HERO_IMAGE = "https://cdn.poehali.dev/projects/cdac7d00-bd0a-4bb7-a1b1-237a7708c061/files/92040949-913f-4126-80f9-fa681d96ea82.jpg";
export const POLYGRAPH_IMAGE = "https://cdn.poehali.dev/projects/cdac7d00-bd0a-4bb7-a1b1-237a7708c061/files/7ad3b230-2fec-4347-a4a7-4c4670578fee.jpg";
export const DETECTIVE_IMAGE = "https://cdn.poehali.dev/projects/cdac7d00-bd0a-4bb7-a1b1-237a7708c061/files/fc0c15b9-2bf3-4932-b821-d76b3c5a8c55.jpg";
export const GUARDS_IMAGE = "https://cdn.poehali.dev/projects/cdac7d00-bd0a-4bb7-a1b1-237a7708c061/files/3ab23f4f-4190-41a8-a1f3-206d541e0669.jpg";
export const SPY_AVATAR_M = "https://cdn.poehali.dev/projects/cdac7d00-bd0a-4bb7-a1b1-237a7708c061/files/61fc9ccd-a5ee-4375-8640-5c890da0df33.jpg";
export const SPY_AVATAR_F = "https://cdn.poehali.dev/projects/cdac7d00-bd0a-4bb7-a1b1-237a7708c061/files/b40d29de-2a29-448c-82c8-a2baa711ee57.jpg";
// Гражданские аватары-заглушки для КЛИЕНТОВ (в отличие от «шпионских» у специалистов).
export const CLIENT_AVATAR_M = "https://cdn.poehali.dev/projects/cdac7d00-bd0a-4bb7-a1b1-237a7708c061/files/486ba939-2480-4918-8a33-e0c4db578f26.jpg";
export const CLIENT_AVATAR_F = "https://cdn.poehali.dev/projects/cdac7d00-bd0a-4bb7-a1b1-237a7708c061/files/600d0761-1767-4e8d-a2ac-7fc9ffb9877a.jpg";

export type Section =
  | "home" | "profile" | "specialists" | "cases" | "services" | "courses" | "guards"
  | "chat" | "community" | "contacts" | "policy" | "pricing" | "dashboard" | "privacy"
  | "terms" | "agreement" | "offer" | "consent" | "admin" | "mobileapp" | "about"
  | "blog" | "howitworks";

export type Role = "client" | "provider";

export type NavItem = { id: Section; key: keyof typeof t; icon: string };

export const CLIENT_NAV: NavItem[] = [
  { id: "home", key: "navHome", icon: "Home" },
  { id: "services", key: "navSearch", icon: "Search" },
  { id: "blog", key: "navBlog", icon: "BookOpen" },
  { id: "contacts", key: "navContacts", icon: "Mail" },
];

export const PROVIDER_NAV: NavItem[] = [
  { id: "home", key: "navHome", icon: "Home" },
  { id: "courses", key: "navCourses", icon: "GraduationCap" },
  { id: "chat", key: "navChat", icon: "MessageSquare" },
  // Форум удалён: общение специалистов переехало в «Сообщество» — там поиск
  // коллег, заявки в друзья и личная переписка вместо публичных тем.
  { id: "community", key: "navCommunity", icon: "Users" },
  { id: "blog", key: "navBlog", icon: "BookOpen" },
  { id: "dashboard", key: "navDashboard", icon: "LayoutDashboard" },
  { id: "contacts", key: "navContacts", icon: "Mail" },
];

// Меню для неавторизованных посетителей (гостей). Блог доступен всем —
// это точки входа для бесплатного поискового трафика.
export const GUEST_NAV: NavItem[] = [
  { id: "blog", key: "navBlog", icon: "BookOpen" },
  { id: "pricing", key: "navPricing", icon: "Wallet" },
  { id: "about", key: "fAbout", icon: "Info" },
];

export type LS = { ru: string; en: string };

export const L = (v: LS, lang: Lang) => {
  if (lang === "ru") return v.ru;
  if (lang === "en") return v.en;
  return dataExtra[lang as keyof typeof dataExtra]?.[v.en] ?? v.en;
};

export const spyAvatar = (gender?: string) => (gender === "f" ? SPY_AVATAR_F : SPY_AVATAR_M);
export const civilAvatar = (gender?: string) => (gender === "f" ? CLIENT_AVATAR_F : CLIENT_AVATAR_M);
// Заглушка аватара. Для клиентов — гражданский образ, для специалистов — «шпионский».
export const resolveAvatar = (img: string | null | undefined, gender?: string, role?: "client" | "provider") =>
  (img && img.trim() ? img : (role === "client" ? civilAvatar(gender) : spyAvatar(gender)));
export const isImageUrl = (url?: string) => !!url && /\.(png|jpe?g|webp|gif)(\?|$)/i.test(url);

// Скрытие фамилии между оппонентами: показываем имя и первую букву фамилии.
// «Александр Морозов» → «Александр М.»; одиночное имя остаётся как есть.
export const shortName = (full: string | null | undefined): string => {
  const s = String(full || "").trim();
  if (!s) return "";
  const parts = s.split(/\s+/);
  if (parts.length < 2) return parts[0];
  return `${parts[0]} ${parts[1].charAt(0)}.`;
};

export const parsePrice = (s: string): number =>
  parseFloat(s.replace(/[^\d.,]/g, "").replace(/\s/g, "").replace(",", ".")) || 0;

// Избранные специалисты клиента. Хранятся локально по slug.
export const FAVORITES_KEY = "shchit_favorites";

export function readFavorites(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(FAVORITES_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}