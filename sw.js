/* ==========================================================
   BarrioYa — Service Worker
   Estrategias: Cache First (assets), Network First (HTML)
   ========================================================== */

const CACHE_NAME = 'barrioYa-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/servicios.html',
  '/afiliados.html',
  '/offline.html',
  '/css/styles.css',
  '/js/main.js',
  '/BarrioYalogo.png',
  '/manifest.json'
];

// ── Install: Pre-cache static assets ──
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Pre-caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// ── Activate: Clean old caches ──
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// ── Fetch: Network First for HTML, Cache First for assets ──
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET and external requests
  if (request.method !== 'GET') return;
  if (!request.url.startsWith(self.location.origin)) return;

  // HTML pages → Network First
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone and cache the fresh response
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => {
          // Try cache, fallback to offline page
          return caches.match(request).then((cached) => {
            return cached || caches.match('/offline.html');
          });
        })
    );
    return;
  }

  // Static assets → Cache First
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request).then((response) => {
        // Cache new static assets
        if (response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      }).catch(() => {
        // For images, return a placeholder if offline
        if (request.url.match(/\.(png|jpg|jpeg|svg|gif|webp)$/)) {
          return new Response(
            '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect fill="#f0f0f0" width="200" height="200"/><text fill="#999" font-family="sans-serif" font-size="14" x="50%" y="50%" text-anchor="middle" dy=".3em">Offline</text></svg>',
            { headers: { 'Content-Type': 'image/svg+xml' } }
          );
        }
      });
    })
  );
});
