import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { installSecureFetch } from '@/lib/secureFetch'

// Подпись запросов ключом устройства. Ставим до отрисовки приложения,
// чтобы ни один запрос не ушёл без защиты.
installSecureFetch();

createRoot(document.getElementById("root")!).render(<App />);

// Регистрируем service worker — необходим для установки приложения (PWA)
// и офлайн-доступа. Работает в любом современном браузере по HTTPS.
// ВАЖНО: не регистрируем в live-редакторе (preview--*.poehali.dev) и в dev-режиме —
// там сервер разработки часто пересобирает модули с новыми хэшами, и Service Worker
// может подменить часть файлов на старые закэшированные версии, что ломает страницу
// сообщением о рассинхронизации React. На реальном опубликованном сайте это не проблема.
const isLiveEditorPreview = typeof window !== 'undefined' && /^preview--/.test(window.location.hostname);
if ('serviceWorker' in navigator && !import.meta.env.DEV && !isLiveEditorPreview) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
} else if ('serviceWorker' in navigator && (import.meta.env.DEV || isLiveEditorPreview)) {
  // На всякий случай снимаем ранее зарегистрированный SW и чистим его кэш —
  // если он успел зарегистрироваться в предыдущих сессиях редактирования.
  navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister())).catch(() => {});
  if ('caches' in window) caches.keys().then((keys) => keys.forEach((k) => caches.delete(k))).catch(() => {});
}