const CACHE_NAME = "couch-to-4x4-audio-v4";
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
      Promise.all(AUDIO_ASSETS.map((asset) => cache.add(asset).catch(() => undefined)))
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName))
        )
      )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);
  const isAudioRequest =
    event.request.method === "GET" &&
    requestUrl.origin === self.location.origin &&
    requestUrl.pathname.startsWith("/audio/") &&
    requestUrl.pathname.endsWith(".mp3");

  if (!isAudioRequest) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cachedResponse = await cache.match(event.request);

      if (cachedResponse) {
        return cachedResponse;
      }

      const networkResponse = await fetch(event.request);

      if (networkResponse.ok) {
        cache.put(event.request, networkResponse.clone());
      }

      return networkResponse;
    })
  );
});
