import { useCallback, useEffect, useRef, useState } from "react";
import { FAVORITES_KEY, readFavorites } from "@/lib/shared";

// Имитация «живого» счётчика людей на сайте: число плавно колеблется вокруг
// базового значения (например, реального числа специалистов), создавая
// ощущение активности в реальном времени — без реального трекинга онлайн-сессий.
export function useLiveCounter(base: number, min = 8) {
  const [count, setCount] = useState(() => Math.max(min, base));
  useEffect(() => {
    setCount(Math.max(min, base));
    const tick = () => {
      setCount((c) => {
        const delta = Math.floor(Math.random() * 5) - 2; // -2..+2
        return Math.max(min, c + delta);
      });
    };
    const timer = setInterval(tick, 4000 + Math.random() * 3000);
    return () => clearInterval(timer);
  }, [base, min]);
  return count;
}

// Лёгкий 3D-наклон карточки при движении мыши (премиальный hover-эффект).
// Работает через прямую манипуляцию DOM (без ре-рендеров React) для плавности,
// и отключается на touch-устройствах и при prefers-reduced-motion.
export function useTilt3D<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(hover: none)").matches) return; // touch-устройства без hover
    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      // Наклон + лёгкий подъём — совмещает 3D-эффект с существующим hover-подъёмом карточки.
      el.style.transform = `perspective(900px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) translateY(-4px) translateZ(0)`;
    };
    const handleLeave = () => {
      // Возвращаем управление transform CSS-классу .card-hover (снимаем inline-стиль).
      el.style.transform = "";
    };
    el.addEventListener("mousemove", handleMove);
    el.addEventListener("mouseleave", handleLeave);
    return () => {
      el.removeEventListener("mousemove", handleMove);
      el.removeEventListener("mouseleave", handleLeave);
    };
  }, []);
  return ref;
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>(readFavorites);
  useEffect(() => {
    const onStorage = (e: StorageEvent) => { if (e.key === FAVORITES_KEY) setFavorites(readFavorites()); };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  const isFavorite = useCallback((slug: string) => favorites.includes(slug), [favorites]);
  const toggleFavorite = useCallback((slug: string) => {
    setFavorites((cur) => {
      const next = cur.includes(slug) ? cur.filter((s) => s !== slug) : [...cur, slug];
      try { window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(next)); } catch { /* noop */ }
      return next;
    });
  }, []);
  const removeFavorite = useCallback((slug: string) => {
    setFavorites((cur) => {
      const next = cur.filter((s) => s !== slug);
      try { window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(next)); } catch { /* noop */ }
      return next;
    });
  }, []);
  return { favorites, isFavorite, toggleFavorite, removeFavorite };
}
