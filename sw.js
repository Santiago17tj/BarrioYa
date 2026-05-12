/* ==========================================================
   BarrioYa — Service Worker (v3)
   Strategy: Network First for everything critical
   Automatic cache invalidation on version change
   ========================================================== */

const CACHE_NAME = 'barrioYa-v11';

// ── Install: Skip waiting immediately to activate new SW ──
self.addEventListener('install', (event) => {
  console.log('[SW] Installing new version:', CACHE_NAME);
  self.skipWaiting();
});

// ── Activate: Clean ALL old caches aggressively ──
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
    }).then(() => {
      console.log('[SW] Activated and claimed clients');
      return self.clients.claim();
    })
  );
});

// ── Fetch: Network First for everything ──
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET and external requests
  if (request.method !== 'GET') return;
  if (!request.url.startsWith(self.location.origin)) return;
  if (request.url.includes('/api/')) return;

  // Network First strategy for ALL resources
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache the fresh response
        if (response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache if offline
        return caches.match(request).then((cached) => {
          if (cached) return cached;
          // If it's an HTML page, show offline page
          if (request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/offline.html');
          }
          // Placeholder for images
          if (request.url.match(/\.(png|jpg|jpeg|svg|gif|webp)$/)) {
            return new Response(
              '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect fill="#f0f0f0" width="200" height="200"/><text fill="#999" font-family="sans-serif" font-size="14" x="50%" y="50%" text-anchor="middle" dy=".3em">Offline</text></svg>',
              { headers: { 'Content-Type': 'image/svg+xml' } }
            );
          }
        });
      })
  );
});
