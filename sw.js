const CACHE = 'calc-pro-v2';
const ASSETS = ['./', './index.html', './manifest.webmanifest', '.icons/icon-192.png', '.icons/icon-512.png'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(res => res || fetch(event.request).then(networkRes => {
      const copy = networkRes.clone();
      caches.open(CACHE).then(cache => cache.put(event.request, copy));
      return networkRes;
    }).catch(() => caches.match('./index.html')))
  );
});
