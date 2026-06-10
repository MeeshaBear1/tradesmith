/* Tradesmith service worker — dependency-free. Field-first: keep the app shell
   usable on a roof with spotty signal. Network-first for pages so contractors
   always get fresh data when online, cached shell + /offline when not. */
const CACHE = "tradesmith-v1";
const SHELL = ["/", "/dashboard", "/offline", "/manifest.webmanifest", "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      // Cache each independently so one 404 never aborts the whole install.
      await Promise.all(SHELL.map((u) => cache.add(u).catch(() => {})));
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  let url;
  try {
    url = new URL(req.url);
  } catch {
    return;
  }
  if (url.origin !== self.location.origin) return; // skip cross-origin + extensions

  // App pages: network-first, fall back to cache, then the offline page.
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          const cache = await caches.open(CACHE);
          cache.put(req, fresh.clone()).catch(() => {});
          return fresh;
        } catch {
          const cached = await caches.match(req);
          return cached || (await caches.match("/offline")) || Response.error();
        }
      })()
    );
    return;
  }

  // Hashed build assets are immutable: cache-first.
  if (url.pathname.startsWith("/_next/static")) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(req);
        if (cached) return cached;
        try {
          const fresh = await fetch(req);
          const cache = await caches.open(CACHE);
          cache.put(req, fresh.clone()).catch(() => {});
          return fresh;
        } catch {
          return Response.error();
        }
      })()
    );
    return;
  }

  // Everything else same-origin: stale-while-revalidate.
  event.respondWith(
    (async () => {
      const cached = await caches.match(req);
      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            caches.open(CACHE).then((c) => c.put(req, res.clone())).catch(() => {});
          }
          return res;
        })
        .catch(() => null);
      return cached || (await network) || Response.error();
    })()
  );
});
