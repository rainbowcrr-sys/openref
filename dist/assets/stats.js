/* 阅读统计：统计开关关掉时一个字节都不上报；页脚总量与「本周焦点」照常显示全站累计。
   上报终点是自建 Worker（stats.openref.de5.net），数据落进单独的公开仓库，由 raw 读回。 */
(function () {
  var ENDPOINT = 'https://stats.openref.de5.net/hit';
  var STATS_RAW = 'https://raw.githubusercontent.com/rainbowcrr-sys/openref-stats/main/stats.json';
  var WEEKLY_RAW = 'https://raw.githubusercontent.com/rainbowcrr-sys/openref-stats/main/weekly.json';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* 真实全站总量：读仓库里的 stats.json，Worker 读-改-写累加，数字只增不减 */
  fetch(STATS_RAW, { cache: 'no-store' })
    .then(function (r) { return r.json(); })
    .then(function (d) {
      var n = Number((d && d.total) || 0);
      document.querySelectorAll('.stats-total').forEach(function (el) {
        el.textContent = '本站已被阅读 ' + n.toLocaleString('zh-CN') + ' 次';
      });
    })
    .catch(function () {});

  /* 本周焦点：Worker 提交时顺手算好的 Top 榜，苹果式措辞 */
  var btn = document.getElementById('weekly-btn');
  var pop = document.getElementById('weekly-pop');
  fetch(WEEKLY_RAW, { cache: 'no-store' })
    .then(function (r) { return r.json(); })
    .then(function (d) {
      var top = (d && d.top) || [];
      var list = document.getElementById('weekly-list');
      if (list) {
        list.innerHTML = top.length
          ? top.map(function (x, i) {
              return '<li><span class="wk-rank">' + (i + 1) + '</span><a href="' + esc(x.url) + '">' + esc(x.title) + '</a><span class="wk-num">' + Number(x.count || 0).toLocaleString('zh-CN') + ' 次</span></li>';
            }).join('')
          : '<li class="wk-empty">本周还没有足够的数据</li>';
      }
      if (btn && top.length) btn.hidden = false;
    })
    .catch(function () {});

  if (btn && pop) {
    btn.addEventListener('click', function () { pop.hidden = !pop.hidden; });
    var close = document.getElementById('weekly-close');
    if (close) close.addEventListener('click', function () { pop.hidden = true; });
  }

  /* 同一浏览器、同一篇文章、同一会话只上报一次 */
  function report() {
    var C = window.OpenRefConsent;
    var st = C && C.get && C.get();
    if (!st || st.stats !== true) return;
    var key = 'openref_hit_' + location.pathname;
    try { if (sessionStorage.getItem(key)) return; } catch (e) {}
    try { sessionStorage.setItem(key, '1'); } catch (e) {}
    var payload = {
      path: location.pathname,
      title: document.title,
      ref: document.referrer || '',
      lang: navigator.language || '',
    };
    fetch(ENDPOINT, {
      method: 'POST', mode: 'cors', credentials: 'omit', keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(function () {});
  }

  report();
  document.addEventListener('openref:consent', report);
})();
