/*
 * OpenKhata service worker — Phase 0.
 *
 * Keeps the app shell installable and usable offline. Will be replaced by a
 * Workbox-generated worker once the ledger (Phase 1) needs finer-grained
 * caching strategies.
 */
const VERSION = "v1";
const PRECACHE = `openkhata-precache-${VERSION}`;
const RUNTIME = `openkhata-runtime-${VERSION}`;

const PRECACHE_URLS = [
  "/",
  "/offline",
  "/manifest.webmanifest",
  "/fonts/noto-sans-bengali-bengali.woff2",
  "/fonts/noto-sans-bengali-latin.woff2",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PRECACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== PRECACHE && key !== RUNTIME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  // Pages: network first, fall back to cache, then the offline page.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(RUNTIME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached ?? caches.match("/offline");
        }),
    );
    return;
  }

  // Static assets (hashed JS/CSS, fonts, icons): cache first.
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ??
        fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(RUNTIME).then((cache) => cache.put(request, copy));
          }
          return response;
        }),
    ),
  );
});
