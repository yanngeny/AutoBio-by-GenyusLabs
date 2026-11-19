const CACHE = 'autobio-v10';
const FILES = ['./','index.html','styles.css','manifest.webmanifest','icons/icon.svg','js/ui.js','js/store.js','js/storage.js','js/agenda.js','js/notify.js','js/catalog.js','js/catalog-fr.js','js/blobs.js','js/ocr.js','js/widget.js','js/version.js','js/pdf.js','js/carnet.js','js/i18n.js','js/i18n-en.js','js/lock.js','js/voice.js','js/csv.js'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (u.origin !== location.origin || e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); return r; }).catch(() => caches.match(e.request)));
});
