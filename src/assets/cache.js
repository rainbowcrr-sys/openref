/* 缓存按钮：三处（文章底部 / 页脚 / 订阅落地页）共用。
   未做过 Cookie 选择前置灰，点它直接弹偏好面板；同意后按钮才真正写 Service Worker 缓存。 */
(function () {
  var C = window.OpenRefConsent;
  var btns = Array.prototype.slice.call(document.querySelectorAll('[data-cache-btn]'));
  if (!btns.length) return;

  function label(b, txt) { var s = b.querySelector('.cache-label'); if (s) s.textContent = txt; }
  function markDone(b) { b.classList.add('is-done'); b.disabled = true; label(b, b.getAttribute('data-done') || '已缓存'); }
  function setCount(n) {
    document.querySelectorAll('.cache-count').forEach(function (el) {
      el.textContent = n > 0 ? '已缓存 ' + n + ' 篇' : '尚未缓存文章';
    });
  }
  function swReady() {
    if (!('serviceWorker' in navigator)) return Promise.reject(new Error('no sw'));
    return navigator.serviceWorker.register('/sw.js').then(function () { return navigator.serviceWorker.ready; });
  }
  function ask(sw, msg) {
    return new Promise(function (resolve) {
      var ch = new MessageChannel();
      ch.port1.onmessage = function (e) { resolve(e.data || {}); };
      (sw.active || navigator.serviceWorker.controller).postMessage(msg, [ch.port2]);
    });
  }

  function refresh() {
    if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) return;
    ask(navigator.serviceWorker.controller, { type: 'CACHE_COUNT' }).then(function (r) {
      if (typeof r.count === 'number') setCount(r.count);
    });
    ask(navigator.serviceWorker.controller, { type: 'HAS', url: location.href }).then(function (r) {
      if (r.has) btns.forEach(markDone);
    });
  }

  function unlock() {
    btns.forEach(function (b) { b.classList.remove('is-locked'); b.disabled = false; });
    refresh();
  }

  function wire() {
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        if (b.classList.contains('is-locked')) { if (C) C.open(); return; }
        if (b.classList.contains('is-done')) return;
        b.disabled = true;
        label(b, '缓存中…');
        swReady()
          .then(function (reg) { return ask(reg.active || navigator.serviceWorker.controller, { type: 'CACHE_ARTICLE', url: location.href, title: document.title }); })
          .then(function (r) {
            markDone(b);
            if (typeof r.count === 'number') setCount(r.count);
          })
          .catch(function () { b.disabled = false; label(b, '缓存失败，点此重试'); });
      });
    });
  }

  btns.forEach(function (b) { b.classList.add('is-locked'); b.disabled = true; });
  wire();
  if (C && C.get()) unlock();
  document.addEventListener('openref:consent', unlock);
  window.addEventListener('load', refresh);
})();
