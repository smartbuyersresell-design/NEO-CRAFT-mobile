const CACHE = 'neo-craft-cache-v3';
const ASSETS = ['./','./index.html','./game.js','./world.js','./chunk.js','./player.js','./mobs.js','./inventory.js','./crafting.js','./renderer.js','./ui.js','./save.js','./manifest.json','./icon-192.png','./icon-384.png','./icon-512.png','./icon-512-maskable.png','./icon-180.png','./icon-152.png','./icon-32.png'];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS))));
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => e.respondWith(caches.match(e.request).then(r => r || fetch(e.request))));
