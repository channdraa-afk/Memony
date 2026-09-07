/**
 * Memony Service Worker - Network-First Caching & PWA
 */
const CACHE_NAME = "memony-cache-v9";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./coin-3d-service.js",
  "./gemini-service.js",
  "./firebase-service.js",
  "./storage-service.js",
  "./audio-service.js",
  "./chart-service.js",
  "./manifest.json"
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn("Service Worker pre-cache partial fail:", err);
      });
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Network-First: selalu ambil versi terbaru saat online, fallback cache saat offline
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || event.request.url.includes("googleapis.com") || event.request.url.includes("firebase")) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

