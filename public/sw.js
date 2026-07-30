const CACHE_NAME = 'mercadocomapp-system-v2';
const CORE_ASSETS = [
  '/offline.html',
  '/icon/icon-mercado-192.png',
  '/icon/icon-mercado-512.png',
  '/manifest/lojacomapp.webmanifest',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;

  if (request.method !== 'GET') {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/offline.html'))
    );
    return;
  }

  const url = new URL(request.url);

  if (url.origin !== self.location.origin || !CORE_ASSETS.includes(url.pathname)) {
    return;
  }

  event.respondWith(caches.match(url.pathname).then((cached) => cached || fetch(request)));
});
