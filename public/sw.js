/* OpenRef 离线口袋：默认不预缓存，点哪个「缓存」按钮才存哪个。
   同源 GET 走 cache-first，断网时已缓存的页面照常打开。 */
var CACHE = 'openref-articles-v1';

self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });

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

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith((async function () {
    var c = await caches.open(CACHE);
    var hit = await c.match(req);
    if (hit) return hit;
    try {
      return await fetch(req);
    } catch (err) {
      return new Response(
        '<!doctype html><meta charset="utf-8"><title>离线</title><p style="font:16px/1.7 system-ui;padding:24px">本页还没缓存。联网打开后点一下页面底部的「缓存本文」，断网就能看了。</p>',
        { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }
  })());
});
