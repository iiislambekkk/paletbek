
const CACHE_PREFIX = "paletbek-";
const CACHE_NAME = "paletbek-shell-v3";
const OFFLINE_URL = "/offline.html";

const APP_SHELL = [
  OFFLINE_URL,
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );

  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
      Promise.all([
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter(
                        (key) =>
                            key.startsWith(CACHE_PREFIX) &&
                            key !== CACHE_NAME
                    )
                    .map((key) => caches.delete(key))
            )
        ),
        self.clients.claim(),
      ])
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  // Navigation: network first, offline fallback
  if (request.mode === "navigate") {
    event.respondWith(
        fetch(request).catch(
            async () =>
                (await caches.match(OFFLINE_URL)) ||
                Response.error()
        )
    );
    return;
  }

  // Next.js assets: always fetch from network
  if (url.pathname.startsWith("/_next/")) {
    event.respondWith(fetch(request));
    return;
  }

  // Icons: cache first
  if (url.pathname.startsWith("/icons/")) {
    event.respondWith(
        caches.match(request).then(async (cached) => {
          if (cached) return cached;

          const response = await fetch(request);

          if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(request, response.clone());
          }

          return response;
        })
    );
  }
});
