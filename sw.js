// Suraksha service worker – offline app shell
const CACHE = 'suraksha-v2.5.0';
const ASSETS = ['./', './index.html', './operator.html', './app.js', './operator.js', './bus.js', './styles.css', './manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Always fetch HTML, JS, CSS fresh from network first to ensure updates are instant
  if (e.request.method === 'GET' && (e.request.url.endsWith('.js') || e.request.url.endsWith('.html') || e.request.url.endsWith('.css') || e.request.url.includes('unpkg.com'))) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request))
  );
});
