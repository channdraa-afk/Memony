/**
 * Memony Service Worker - Offline Caching & PWA
 */
const CACHE_NAME = "memony-cache-v1";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./gemini-service.js",
  "./firebase-service.js",
  "./storage-service.js",
  "./audio-service.js",
  "./chart-service.js",
  "./manifest.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn("Service Worker pre-cache partial fail:", err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Hanya tangani GET request lokal
  if (event.request.method !== "GET" || event.request.url.includes("googleapis.com") || event.request.url.includes("firebase")) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return (
        cachedResponse ||
        fetch(event.request).then((response) => {
          if (!response || response.status !== 200 || response.type !== "basic") {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        }).catch(() => cachedResponse)
      );
    })
  );
});
