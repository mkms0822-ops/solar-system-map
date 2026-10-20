// 太陽系周期マップ Service Worker（アプリ本体をオフラインでも開けるようにします）
const CACHE = 'solar-map-v10';
const SHELL = ['./', './index.html', './manifest.webmanifest', './poster.jpg',
  './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-512.png', './icons/apple-touch-icon.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  // 動画・BGMは容量が大きく部分取得(Range)も使うため、キャッシュせず通常通り取得
  if (req.headers.has('range') || url.pathname.endsWith('.mp4') || url.pathname.endsWith('.mp3')) return;
  // 画面(HTML)は、オンラインなら最新を優先し、つながらないときは保存分を使う
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put('./index.html', cp)); return r; })
      .catch(() => caches.match('./index.html')));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
    const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); return r;
  })));
});
