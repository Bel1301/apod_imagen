const CACHE = 'nasadaily-v3';

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Dejar pasar requests cross-origin directamente al navegador.
  // El SW no puede hacer fetch() a dominios externos por la CSP,
  // y cachear respuestas opacas es unreliable.
  if (url.origin !== self.location.origin) return;

  // Nunca cachear las llamadas a la API
  if (url.pathname.startsWith('/api/')) {
    e.respondWith(fetch(e.request));
    return;
  }

  // Para assets propios, red primero, cache como fallback
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
