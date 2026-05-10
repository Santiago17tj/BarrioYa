/* ==========================================================
   BarrioYa — Service Worker (v2)
   Estrategias: Cache First (assets), Network First (HTML)
   ========================================================== */

const CACHE_NAME = 'barrioYa-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/servicios.html',
  '/afiliados.html',
  '/checkout.html',
  '/tracking.html',
  '/bot-demo.html',
  '/offline.html',
  // CSS
  '/css/styles.css',
  '/css/cart.css',
  '/css/profile.css',
  '/css/tracking.css',
  '/css/bot-demo.css',
  // JS
  '/js/config.js',
  '/js/main.js',
  '/js/router.js',
  '/js/cart.js',
  '/js/checkout.js',
  '/js/menu-page.js',
  '/js/tracking.js',
  '/js/bot-demo.js',
  // PWA icons (livianos)
  '/assets/icon-192.png',
  '/assets/icon-512.png',
  '/assets/apple-touch-icon.png',
  '/assets/favicon-barrioya.svg',
  '/assets/logo-barrioya-horizontal.svg',
  '/manifest.json'
];

// ── Install: Pre-cache static assets ──
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Pre-caching static assets');
        // addAll falla si UN solo recurso falla → usamos add() individual con catch
        return Promise.all(
          STATIC_ASSETS.map((url) =>
            cache.add(url).catch((err) => console.warn('[SW] No se pudo cachear:', url, err))
          )
        );
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

  // Skip non-GET, external requests, y llamadas a API (siempre red)
  if (request.method !== 'GET') return;
  if (!request.url.startsWith(self.location.origin)) return;
  if (request.url.includes('/api/')) return;

  // HTML pages → Network First
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => {
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
        if (response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      }).catch(() => {
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
