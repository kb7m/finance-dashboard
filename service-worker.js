// Finance Dashboard PWA v1.3.1 - online-first, offline fallback.
const CACHE = 'finance-dashboard-v1.3.1';
const ASSETS = [
  './', './index.html', './css/style.css', './js/app.js',
  './manifest.webmanifest', './assets/icons/icon-192.png',
  './assets/icons/icon-512.png'
];
const SCOPE = new URL('./', self.registration.scope);

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith('finance-dashboard-') && name !== CACHE)
      .map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(SCOPE.pathname)) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      // Always attempt the current server version first while online.
      const response = await fetch(request, { cache: 'no-store' });
      if (response.ok && response.type === 'basic') {
        await cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      const saved = await cache.match(request, { ignoreSearch: true });
      if (saved) return saved;
      if (request.mode === 'navigate') {
        const fallback = await cache.match('./index.html');
        if (fallback) return fallback;
      }
      throw error;
    }
  })());
});
