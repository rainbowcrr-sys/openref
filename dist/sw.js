/* OpenRef 离线口袋：默认不预缓存，点哪个「缓存」按钮才存哪个。
   HTML 页面走 network-first，站点一更新立刻生效；断网时用已缓存页面兜底。
   其它同源静态资源走 cache-first。 */
var CACHE = 'openref-articles-v2';

self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) {
  e.waitUntil((async function () {
    var names = await caches.keys();
    await Promise.all(names.filter(function (n) {
      return n.indexOf('openref-articles-') === 0 && n !== CACHE;
    }).map(function (n) { return caches.delete(n); }));
    await self.clients.claim();
  })());
});

function reply(port, data) { if (port) port.postMessage(data); }

self.addEventListener('message', function (e) {
  var d = e.data || {};
  var port = e.ports && e.ports[0];

  if (d.type === 'CACHE_ARTICLE') {
    e.waitUntil((async function () {
      var c = await caches.open(CACHE);
      await c.add(new Request(d.url, { credentials: 'same-origin' }));
      var keys = await c.keys();
      reply(port, { type: 'CACHED', count: keys.length });
    })().catch(function () { reply(port, { type: 'CACHED', count: 0, error: true }); }));
    return;
  }
  if (d.type === 'CACHE_COUNT' || d.type === 'HAS') {
    e.waitUntil((async function () {
      var c = await caches.open(CACHE);
      var keys = await c.keys();
      if (d.type === 'CACHE_COUNT') reply(port, { type: 'COUNT', count: keys.length });
      else {
        var hit = await c.match(d.url);
        reply(port, { type: 'HAS', has: !!hit });
      }
    })());
  }
});

function offlinePage() {
  return new Response(
    '<!doctype html><meta charset="utf-8"><title>离线</title><p style="font:16px/1.7 system-ui;padding:24px">本页还没缓存。联网打开后点一下页面底部的「缓存本文」，断网就能看了。</p>',
    { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  var isPage = req.mode === 'navigate' ||
    (req.headers.get('accept') || '').indexOf('text/html') !== -1;

  e.respondWith((async function () {
    var c = await caches.open(CACHE);

    if (isPage) {
      try {
        var fresh = await fetch(req);
        if (fresh && fresh.ok) c.put(req, fresh.clone());
        return fresh;
      } catch (err) {
        var cachedPage = await c.match(req);
        return cachedPage || offlinePage();
      }
    }

    var hit = await c.match(req);
    if (hit) return hit;
    try {
      return await fetch(req);
    } catch (err) {
      return offlinePage();
    }
  })());
});
