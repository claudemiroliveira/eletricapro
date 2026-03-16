const CACHE_NAME = "eletricapro-v65";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./login.html",
  "./manifest.json",
  "./app.js",
  "./js/jspdf.umd.min.js",
  "./js/jspdf.plugin.autotable.min.js",
  "./icons/icon-72.png",
  "./icons/icon-96.png",
  "./icons/icon-128.png",
  "./icons/icon-144.png",
  "./icons/icon-152.png",
  "./icons/icon-192.png",
  "./icons/icon-384.png",
  "./icons/icon-512.png"
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
          console.warn("Arquivo ignorado (não encontrado):", file);
        }
      }
    })
  );
  self.skipWaiting();
});

// ATIVAÇÃO - limpa caches antigos
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log("🗑️ Cache antigo removido:", key);
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// FETCH - Cache First, fallback para rede
self.addEventListener("fetch", event => {
  // Ignorar requisições não GET e chrome-extension
  if (event.request.method !== "GET" || event.request.url.startsWith("chrome-extension")) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Cachear respostas válidas
        if (response && response.status === 200 && response.type === "basic") {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, cloned));
        }
        return response;
      }).catch(() => {
        // Fallback offline: retorna index.html para navegação
        if (event.request.destination === "document") {
          return caches.match("./index.html");
        }
      });
    })
  );
});
