// Aurum Gold — minimal service worker for PWA installability + basic offline app-shell caching.
// Intentionally simple: caches the app shell only, always goes to network for
// Firebase/Firestore requests so live data and auth are never served stale.

const CACHE_NAME = 'aurum-gold-shell-v1';
const APP_SHELL = [
  './aurum-gold-auth.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
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

self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  // Never cache Firebase/Firestore/Auth calls — always hit the network.
  if (url.includes('firestore.googleapis.com') || url.includes('googleapis.com') || url.includes('firebaseio.com')) {
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).catch(() => cached))
  );
});
