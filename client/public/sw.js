const CACHE_NAME = 'void-v2';
const OFFLINE_URL = '/offline.html';

const PRECACHE_URLS = [
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/offline.html'
];

const CACHEABLE_EXTENSIONS = /\.(js|css|png|jpg|jpeg|svg|gif|woff|woff2|ttf|eot|ico|webp)$/;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  const isStaticAsset = CACHEABLE_EXTENSIONS.test(url.pathname) || url.pathname.startsWith('/assets/');

  if (!isStaticAsset) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
