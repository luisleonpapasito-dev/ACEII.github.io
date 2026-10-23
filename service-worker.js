// =====================================================================
// Service Worker · ACEII Cafetería
// Cachea la "cáscara" de la app para que abra sin internet
// =====================================================================

const VERSION = 'aceii-286  ';
const CACHE_STATIC = VERSION + '-static';

const ARCHIVOS_ESTATICOS = [
  './',
  './index.html',
  './caja.html',
  './ventas.html',
  './venta_rapida.html',
  './recepcion.html',
  './inventario.html',
  './productos.html',
  './categorias.html',
  './devoluciones.html',
  './codigos.html',
  './dashboard.html',
  './historial-caja.html',
  './estilos.css',
  './comun.js',
  './iconos.js',
  './manifest.json',
  './logo_ACEII.png',
  './icon-192.png',
  './icon-512.png'
];

// ---------- Instalar: pre-cachear todo ----------
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_STATIC).then(function (cache) {
      // addAll falla si UNO falla. Usamos add individual con catch
      return Promise.all(
        ARCHIVOS_ESTATICOS.map(function (url) {
          return cache.add(url).catch(function () {
            console.warn('[SW] No se pudo cachear:', url);
          });
        })
      );
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

// ---------- Activar: limpiar cachés viejas ----------
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) {
          return k.startsWith('aceii-') && k !== CACHE_STATIC;
        }).map(function (k) {
          return caches.delete(k);
        })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

// ---------- Fetch: estrategia mixta ----------
self.addEventListener('fetch', function (event) {
  const req = event.request;
  const url = new URL(req.url);

  // 1) NO cachear Apps Script (script.google.com) → siempre red
  if (url.hostname.indexOf('script.google.com') >= 0) return;

  // 2) NO cachear CDNs externos (ZXing, Chart.js) → dejar que el navegador maneje
  if (url.hostname.indexOf('cdn.jsdelivr.net') >= 0) return;
  if (url.hostname.indexOf('fonts.googleapis.com') >= 0) return;
  if (url.hostname.indexOf('fonts.gstatic.com') >= 0) return;

  // 3) Solo GET
  if (req.method !== 'GET') return;

  // 4) Mismo origen (tu GitHub Pages) → Cache First con fallback a red
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then(function (cached) {
        if (cached) {
          // Refresca en background (stale-while-revalidate)
          fetch(req).then(function (res) {
            if (res && res.status === 200) {
              caches.open(CACHE_STATIC).then(function (cache) {
                cache.put(req, res.clone());
              });
            }
          }).catch(function () {});
          return cached;
        }
        return fetch(req).then(function (res) {
          if (res && res.status === 200) {
            const copia = res.clone();
            caches.open(CACHE_STATIC).then(function (cache) {
              cache.put(req, copia);
            });
          }
          return res;
        }).catch(function () {
          // Si es navegación de HTML y no hay caché, mostrar index
          if (req.mode === 'navigate') return caches.match('./index.html');
        });
      })
    );
  }
});

// ---------- Escuchar mensajes (para forzar actualización) ----------
self.addEventListener('message', function (event) {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});