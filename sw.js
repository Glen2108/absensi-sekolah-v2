const CACHE_NAME = 'absensi-pwa-v1';

// Instalasi service worker
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

// Syarat wajib Chrome: harus ada pencegatan 'fetch'
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request).catch(() => {
            return caches.match(event.request);
        })
    );
});