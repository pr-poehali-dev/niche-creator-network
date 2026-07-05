import { useEffect, useRef } from "react";

/**
 * Хук плавного появления элемента при прокрутке (scroll reveal).
 * Возвращает ref, который нужно повесить на элемент с классом "reveal".
 * Когда элемент попадает в область видимости, добавляется класс "reveal-visible".
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(options?: {
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
}) {
  const ref = useRef<T | null>(null);
  const { threshold = 0.15, rootMargin = "0px 0px -10% 0px", once = true } = options || {};

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Если пользователь отключил анимации — сразу показываем
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("reveal-visible");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("reveal-visible");
            if (once) observer.unobserve(entry.target);
          } else if (!once) {
            entry.target.classList.remove("reveal-visible");
          }
        });
      },
      { threshold, rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin, once]);

  return ref;
}

/**
 * Компонент-обёртка для scroll-reveal. Оборачивает любой контент и
 * плавно проявляет его при попадании в экран.
 */
export default useScrollReveal;
