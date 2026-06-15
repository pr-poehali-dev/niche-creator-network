// Клиентский фильтр нецензурной лексики (RU + EN).
// Маскирует ругательства звёздочками. На сервере дублируется такой же фильтр.

const BAD_ROOTS = [
  "хуй", "хуя", "хуе", "пизд", "ебан", "ебат", "еба", "ебл", "бляд", "блят",
  "сука", "сук", "мудак", "муда", "гондон", "гандон", "долбоеб", "залуп",
  "пидор", "пидар", "манда", "дрочи", "выеб", "наеб", "отъеб", "уеб",
  "fuck", "shit", "bitch", "cunt", "dick", "pussy", "asshole", "bastard", "whore", "slut",
];

const BAD_RE = new RegExp("(" + BAD_ROOTS.join("|") + ")", "gi");

export function cleanText(text: string): string {
  if (!text) return "";
  return text.replace(BAD_RE, (m) => m[0] + "*".repeat(Math.max(0, m.length - 1)));
}

export function hasProfanity(text: string): boolean {
  if (!text) return false;
  BAD_RE.lastIndex = 0;
  return BAD_RE.test(text);
}
