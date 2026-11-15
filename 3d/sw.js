/* Only immutable 3D resources. No cart, API, HTML or USDZ prefetch. */
const CACHE = 'qadam-3d-fast-v1';
const allowed = url => url.origin === self.location.origin && (
  /\/3d\/assets\/(?:osh-fast|fruits-real-v1-fast)\.glb$/.test(url.pathname) ||
  /\/3d\/assets\/(?:osh|fruits-fast)\.usdz$/.test(url.pathname) ||
  /\/3d\/vendor\/(?:model-viewer-4\.3\.1\.min|meshopt_decoder)\.js$/.test(url.pathname)
);
const pending = new Map();
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil((async () => {
  for (const key of await caches.keys()) {
    if (key.startsWith('qadam-3d-') && key !== CACHE) await caches.delete(key);
  }
  await self.clients.claim();
})()));
async function resource(request, event) {
  let cache;
  try {
    cache = await caches.open(CACHE);
    const hit = await cache.match(request);
    if (hit) return hit;
  } catch (_) { /* Storage can be unavailable in private mode. */ }
  const key = request.url;
  if (!pending.has(key)) {
    const task = fetch(request);
    pending.set(key, task);
    const write = task.then(async response => {
      if (cache && response.ok && response.status === 200) {
        try { await cache.put(request, response.clone()); } catch (_) { /* Quota: retain network response. */ }
      }
    }).finally(() => pending.delete(key));
    event.waitUntil(write.catch(() => {}));
  }
  return (await pending.get(key)).clone();
}
self.addEventListener('fetch', event => {
  if (event.request.method === 'GET' && !event.request.headers.has('range') && allowed(new URL(event.request.url))) {
    event.respondWith(resource(event.request, event));
  }
});
