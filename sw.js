const CACHE_NAME = 'iklim-kontrol-cache-v23';  // V4.9.6 (Rehber'de oda seçici geri geldi; önceki: V4.9.5 Ayarlar sadeleştirme, görsel denetim paketleri 1-8; önceki: V4.9.4 rehber koşul değişikliği, V4.9.3 Yetiştirme Rehberi, katalog dosyası, İngilizce sözlükler)
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  './bitki_katalogu.json',  // V4.9: Yetiştirme Rehberi kataloğu ayrı dosya (çevrimdışı da açılsın)
  './dil_en.js',            // V4.9: İngilizce sözlük (yönetici sürümündeki dil düğmesi)
  './dil_en_katalog.js'     // V4.9: bitki kataloğunun İngilizcesi
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  // ThingSpeak veya yerel cihaz API isteklerini her zaman ağdan çek
  if (req.url.includes('api.thingspeak.com') || req.url.includes('/backup_json')) {
    return;
  }
  // Network-first (önce güncel dosyayı çek, çevrimdışıysa önbellekten sun)
  event.respondWith(
    fetch(req)
      .then(networkRes => {
        const resClone = networkRes.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, resClone)).catch(() => {});
        return networkRes;
      })
      .catch(() => caches.match(req).then(cached => cached || caches.match('./index.html')))
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return self.clients.openWindow('./index.html');
    })
  );
});
