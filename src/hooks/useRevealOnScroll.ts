import { useEffect } from "react";

/**
 * Оживление элементов при прокрутке: когда блок попадает в поле зрения,
 * ему добавляется класс stat-reveal и срабатывает мягкое появление.
 *
 * Сделано на встроенном в браузер IntersectionObserver — без сторонних
 * библиотек, поэтому не влияет на скорость загрузки сайта.
 *
 * Срабатывает один раз на элемент: повторная анимация при прокрутке
 * туда-обратно раздражает.
 */
export function useRevealOnScroll(selector = ".stat-appear") {
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>(selector));
    if (!nodes.length) return;

    // Если браузер старый или человек попросил уменьшить анимацию —
    // просто показываем всё сразу, без эффектов.
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (reduced || typeof IntersectionObserver === "undefined") {
      nodes.forEach((n) => n.classList.add("stat-reveal"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target as HTMLElement;
          // Небольшая задержка по порядку — цифры появляются друг за другом,
          // это выглядит живее, чем одновременная вспышка.
          const delay = Number(el.dataset.revealDelay || 0);
          window.setTimeout(() => el.classList.add("stat-reveal"), delay);
          io.unobserve(el);
        });
      },
      { threshold: 0.35 },
    );

    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, [selector]);
}

export default useRevealOnScroll;
