// Service Worker для ЩИТ — обеспечивает установку PWA и офлайн-доступ.
// Версию кэша меняем при обновлениях, чтобы старый кэш очищался.
const CACHE = 'shchit-v1';
const OFFLINE_URLS = ['/', '/index.html', '/manifest.webmanifest', '/favicon.svg'];

// Установка: предварительно кэшируем базовую оболочку приложения.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(OFFLINE_URLS)).catch(() => {})
  );
  self.skipWaiting();
});

// Активация: удаляем устаревшие версии кэша.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Запросы:
// - навигация (открытие страниц) — сначала сеть, при офлайне отдаём кэш;
// - остальное (статика) — сначала кэш, иначе сеть с докэшированием.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // Не вмешиваемся в запросы к API/бэкенду и сторонним доменам.
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match('/index.html').then((r) => r || caches.match('/')))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy)).catch(() => {});
        }
        return res;
      });
    })
  );
});
