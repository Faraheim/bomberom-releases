const CACHE = 'bomberom-pwa-v7';
const SHELL = [
  './',
  './index.html',
  './styles.css',
  './styles.css?v=6',
  './app.js',
  './app.js?v=6',
  './geonorgeShelters.js',
  './vendor/proj4.js',
  './vendor/fflate.umd.js',
  './vendor/leaflet/leaflet.css',
  './vendor/leaflet/leaflet.js',
  './vendor/leaflet/MarkerCluster.css',
  './vendor/leaflet/MarkerCluster.Default.css',
  './vendor/leaflet/leaflet.markercluster.js',
  './vendor/leaflet/images/marker-icon.png',
  './vendor/leaflet/images/marker-icon-2x.png',
  './vendor/leaflet/images/marker-shadow.png',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './data/shelters.json',
  './data/shelter-enrichment.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      Promise.all(
        SHELL.map((url) =>
          cache.add(url).catch(() => {
            /* optional shell asset */
          }),
        ),
      ),
    ),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // Never cache OSM tiles / CDN — only same-origin shell + data
  if (url.origin !== self.location.origin) {
    return;
  }
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        if (event.request.method === 'GET' && res.ok) {
          const copy = res.clone();
          void caches.open(CACHE).then((c) => c.put(event.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(event.request)),
  );
});
