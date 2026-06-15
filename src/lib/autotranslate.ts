import { useCallback, useEffect, useRef, useState } from "react";
import { useLang } from "./i18n";
import func2url from "../../backend/func2url.json";

const TRANSLATE_URL = (func2url as Record<string, string>)["translate"];

// Простейшая эвристика: содержит ли текст символы целевого языка.
// Используется только чтобы НЕ дёргать API для очевидно «родных» строк.
function looksLikeLang(text: string, lang: string): boolean {
  const hasCyr = /[а-яё]/i.test(text);
  const hasLat = /[a-z]/i.test(text);
  const hasJa = /[぀-ヿ㐀-鿿]/.test(text);
  const hasAr = /[؀-ۿ]/.test(text);
  const hasHe = /[֐-׿]/.test(text);
  switch (lang) {
    case "ru": return hasCyr && !hasJa && !hasAr && !hasHe;
    case "ja": return hasJa;
    case "ar": return hasAr;
    case "he": return hasHe;
    // en/fr/de используют латиницу — различить надёжно нельзя, переводим через API
    default: return false;
  }
}

const cache = new Map<string, string>();

async function translateBatch(texts: string[], target: string): Promise<{ items: string[]; translated: boolean }> {
  if (!TRANSLATE_URL) return { items: texts, translated: false };
  try {
    const res = await fetch(TRANSLATE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texts, target }),
    });
    const data = await res.json();
    if (Array.isArray(data.items) && data.items.length === texts.length) {
      return { items: data.items, translated: !!data.translated };
    }
  } catch {
    // ignore
  }
  return { items: texts, translated: false };
}

/**
 * Хук автоперевода списка сообщений на язык интерфейса пользователя.
 * Возвращает функцию-резолвер текста, флаг «активен ли перевод» и тумблер.
 */
export function useAutoTranslate(texts: string[]) {
  const { lang } = useLang();
  const [enabled, setEnabledState] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return window.localStorage.getItem("autoTranslate") !== "0";
  });
  const [map, setMap] = useState<Record<string, string>>({});
  const [didTranslate, setDidTranslate] = useState(false);
  const pending = useRef<Set<string>>(new Set());

  const setEnabled = useCallback((v: boolean) => {
    setEnabledState(v);
    if (typeof window !== "undefined") window.localStorage.setItem("autoTranslate", v ? "1" : "0");
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const need: string[] = [];
    for (const text of texts) {
      const key = `${lang}::${text}`;
      if (!text || !text.trim()) continue;
      if (cache.has(key)) continue;
      if (looksLikeLang(text, lang)) { cache.set(key, text); continue; }
      if (pending.current.has(key)) continue;
      need.push(text);
    }
    if (need.length === 0) {
      // подтянуть из кэша, что уже есть
      const next: Record<string, string> = {};
      let changed = false;
      for (const text of texts) {
        const cached = cache.get(`${lang}::${text}`);
        if (cached !== undefined) { next[text] = cached; if (cached !== text) changed = true; }
      }
      setMap((m) => ({ ...m, ...next }));
      if (changed) setDidTranslate(true);
      return;
    }
    need.forEach((t) => pending.current.add(`${lang}::${t}`));
    let cancelled = false;
    translateBatch(need, lang).then(({ items, translated }) => {
      if (cancelled) return;
      const next: Record<string, string> = {};
      need.forEach((t, i) => {
        const key = `${lang}::${t}`;
        cache.set(key, items[i]);
        pending.current.delete(key);
        next[t] = items[i];
      });
      setMap((m) => ({ ...m, ...next }));
      if (translated && items.some((v, i) => v !== need[i])) setDidTranslate(true);
    });
    return () => { cancelled = true; };
  }, [texts, lang, enabled]);

  const resolve = useCallback(
    (text: string) => (enabled && map[text] !== undefined ? map[text] : text),
    [enabled, map],
  );

  const isTranslated = useCallback(
    (text: string) => enabled && map[text] !== undefined && map[text] !== text,
    [enabled, map],
  );

  return { resolve, isTranslated, enabled, setEnabled, didTranslate: enabled && didTranslate, lang };
}
