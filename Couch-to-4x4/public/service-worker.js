const CACHE_NAME = "couch-to-4x4-v5";
const PRECACHE_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icons/icon.svg",
];

const AUDIO_ASSETS = [
  "/audio/warmup_start.mp3",
  "/audio/work_start_coached.mp3",
  "/audio/rest_start_coached.mp3",
  "/audio/warning_10.mp3",
  "/audio/warning_redline.mp3",
  "/audio/cooldown_start.mp3",
  "/audio/workout_complete.mp3",
  "/audio/work_halfway.mp3",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll([...PRECACHE_ASSETS, ...AUDIO_ASSETS]).catch(err => {
        console.warn("Precache failed, some assets may be missing until fetched:", err);
      })
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);

  // Only handle GET requests and same-origin requests
  if (event.request.method !== "GET" || requestUrl.origin !== self.location.origin) {
    return;
  }

  // Audio assets: Cache-First
  if (requestUrl.pathname.startsWith("/audio/")) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse.ok) {
            const cacheCopy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cacheCopy));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // Other assets (including HTML, JS, CSS): Stale-While-Revalidate
  // This allows the app to load from cache immediately but update in the background
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse.ok) {
          const cacheCopy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cacheCopy));
        }
        return networkResponse;
      }).catch(() => {
        // If offline and not in cache, we just fail gracefully
        return cachedResponse;
      });
      return cachedResponse || fetchPromise;
    })
  );
});
