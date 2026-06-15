const CACHE_NAME = "cat-detector-v2";

const FILES = [
  "./",
  "./index.html",
  "./historial.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./version.json"
];

self.addEventListener("install", event => {

  event.waitUntil(

    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(FILES))
  );
});

self.addEventListener("fetch", event => {

  event.respondWith(

    caches.match(event.request)
      .then(response => {

        return response || fetch(event.request);
      })
  );
});