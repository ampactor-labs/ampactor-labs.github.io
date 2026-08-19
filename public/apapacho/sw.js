// Offline shell for Apapacho. The deck is inlined in the page, so caching the
// page is caching the whole app; dictionary calls always go to the network and
// are never cached (a definition you looked up gets saved as your own entry,
// which lives in localStorage, not here).
const CACHE = "apapacho-202608130305";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon.svg", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  e.respondWith(
    caches.match(e.request).then(hit => {
      if (hit) {
        // refresh in the background so the next open is current
        fetch(e.request).then(r => r.ok && caches.open(CACHE).then(c => c.put(e.request, r))).catch(() => {});
        return hit;
      }
      return fetch(e.request).catch(() => caches.match("./index.html"));
    })
  );
});
