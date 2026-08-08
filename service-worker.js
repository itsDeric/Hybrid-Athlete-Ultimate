// Bump this version string on every deploy that changes app behavior — forces old installed
// PWAs/APKs to pick up the new code instead of silently serving a stale cached index.html forever.
const CACHE_NAME = 'hybrid-athlete-v2';
const ASSETS = ['./index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first: always try to fetch the latest version when online, and only fall back to the
// cached copy if the network is unavailable. Previously this was cache-first, which meant an
// installed app could keep running old code indefinitely even after new versions were deployed.
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((fresh) => {
        const copy = fresh.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return fresh;
      })
      .catch(() => caches.match(event.request))
  );
});
