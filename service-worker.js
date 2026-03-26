// Pet Planner 2026 – Service Worker
const CACHE_NAME = 'petplanner-2026-v1';
const ASSETS = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,700;1,600&display=swap'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Cache local assets first (these must succeed)
      return cache.addAll(['./index.html', './manifest.json'])
        .then(() => {
          // Try to cache Google Fonts (gracefully fail if offline during install)
          return cache.add('https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,700;1,600&display=swap')
            .catch(() => {});
        });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Network-first for Google Fonts (so updates come through when online)
  if (url.hostname.includes('fonts.g') || url.hostname.includes('fonts.googleapis') || url.hostname.includes('fonts.gstatic')) {
    event.respondWith(
      fetch(event.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first for everything else (app shell)
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(res => {
        if (!res || res.status !== 200 || res.type === 'opaque') return res;
        const clone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return res;
      });
    })
  );
});
