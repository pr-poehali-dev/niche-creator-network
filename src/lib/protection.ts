import { useEffect } from "react";

// Строгая защита контента: блок копирования, выделения, перетаскивания,
// контекстного меню и горячих клавиш DevTools.
export function useContentProtection() {
  useEffect(() => {
    const isEditable = (el: EventTarget | null): boolean => {
      const node = el as HTMLElement | null;
      if (!node || !node.closest) return false;
      return !!node.closest('input, textarea, [contenteditable="true"], [data-allow-select]');
    };

    const onContextMenu = (e: MouseEvent) => {
      if (!isEditable(e.target)) e.preventDefault();
    };

    const onCopyCut = (e: ClipboardEvent) => {
      if (!isEditable(e.target)) e.preventDefault();
    };

    const onDragStart = (e: DragEvent) => {
      e.preventDefault();
    };

    const onSelectStart = (e: Event) => {
      if (!isEditable(e.target)) e.preventDefault();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (!e.key) return;
      const k = e.key.toLowerCase();
      // F12
      if (e.key === "F12") { e.preventDefault(); return; }
      // Ctrl/Cmd + Shift + I / J / C  (DevTools)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && ["i", "j", "c"].includes(k)) {
        e.preventDefault(); return;
      }
      // Ctrl/Cmd + U (view source), + S (save), + P (print)
      if ((e.ctrlKey || e.metaKey) && ["u", "s", "p"].includes(k)) {
        e.preventDefault(); return;
      }
      // Ctrl/Cmd + C / X / A вне полей ввода
      if ((e.ctrlKey || e.metaKey) && ["c", "x", "a"].includes(k) && !isEditable(e.target)) {
        e.preventDefault();
      }
    };

    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("copy", onCopyCut);
    document.addEventListener("cut", onCopyCut);
    document.addEventListener("dragstart", onDragStart);
    document.addEventListener("selectstart", onSelectStart);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("copy", onCopyCut);
      document.removeEventListener("cut", onCopyCut);
      document.removeEventListener("dragstart", onDragStart);
      document.removeEventListener("selectstart", onSelectStart);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);
}