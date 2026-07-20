/*
 * OpenKhata service worker — Phase 0.
 *
 * Keeps the app shell installable and usable offline. Will be replaced by a
 * Workbox-generated worker once the ledger (Phase 1) needs finer-grained
 * caching strategies.
 */
const VERSION = "v3";
const PRECACHE = `openkhata-precache-${VERSION}`;
const RUNTIME = `openkhata-runtime-${VERSION}`;

const PRECACHE_URLS = [
  "/",
  "/contact",
  "/entry",
  "/contact-form",
  "/login",
  "/settings",
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
  // ignoreSearch lets /contact?id=… reuse the precached /contact shell —
  // screens read their params client-side, so the HTML is identical.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(RUNTIME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request, { ignoreSearch: true });
          return cached ?? caches.match("/offline");
        }),
    );
    return;
  }

  // Immutable assets (hashed build output, fonts, icons): cache first.
  const immutable =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/fonts/") ||
    url.pathname.startsWith("/icons/");

  if (immutable) {
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
    return;
  }

  // Everything else (RSC payloads etc.): network first, cache fallback,
  // so a new deploy is picked up as soon as the user is online.
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(RUNTIME).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        return cached ?? Response.error();
      }),
  );
});
