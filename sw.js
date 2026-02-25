const CACHE_NAME = "eletricopro-v3";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./style.css",
  "./app.js"
];

// INSTALAÇÃO SEGURA
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {

      for (const file of FILES_TO_CACHE) {
        try {
          await cache.add(file);
          console.log("Cache OK:", file);
        } catch (err) {
          console.warn("Arquivo ignorado:", file);
        }
      }

    })
  );

  self.skipWaiting();
});

// ATIVAÇÃO
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );

  self.clients.claim();
});

// FETCH (modo offline seguro)
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response =>
      response || fetch(event.request)
    )
  );
});
