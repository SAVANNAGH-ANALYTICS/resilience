self.addEventListener('install', (event) => {
  event.waitUntil(caches.open('resilience-v1').then((cache) => cache.addAll(['/','/index.html'])));
  self.skipWaiting();
});
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
self.addEventListener('fetch', (event) => {
  event.respondWith(caches.match(event.request).then((resp) => resp || fetch(event.request)));
});