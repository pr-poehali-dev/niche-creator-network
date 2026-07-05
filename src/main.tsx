import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

createRoot(document.getElementById("root")!).render(<App />);

// Регистрируем service worker — необходим для установки приложения (PWA)
// и офлайн-доступа. Работает в любом современном браузере по HTTPS.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}