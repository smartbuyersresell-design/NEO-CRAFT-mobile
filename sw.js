const CACHE = 'neo-craft-cache-v4';
const ASSETS = [
  './',
  './index.html',
  './game.js',
  './world.js',
  './chunk.js',
  './player.js',
  './mobs.js',
  './inventory.js',
  './crafting.js',
  './renderer.js',
  './ui.js',
  './save.js',
  './manifest.json',
  './icon-192.png',
  './icon-384.png',
  './icon-512.png',
  './icon-512-maskable.png',
  './icon-180.png',
  './icon-152.png',
  './icon-32.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS).catch(() => {})));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(
    keys.map(key => key !== CACHE ? caches.delete(key) : null)
  )));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(response => {
      if (response) return response;
      return fetch(e.request).then(response => {
        if (!response || response.status !== 200 || response.type === 'error') return response;
        const responseToCache = response.clone();
        caches.open(CACHE).then(cache => cache.put(e.request, responseToCache));
        return response;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
