(function () {
  var WORKER = 'https://stats.openref.de5.net/health';
  var SITE = 'https://openref.de5.net/';

  function set(id, state, text) {
    var d = document.getElementById('d-' + id);
    var s = document.getElementById('s-' + id);
    if (d) d.className = 'dot ' + state;
    if (s) s.textContent = text;
  }

  function overall(states) {
    var rank = { ok: 0, warn: 1, bad: 2 };
    var worst = states.reduce(function (a, s) { return rank[s] > rank[a] ? s : a; }, 'ok');
    var dot = document.getElementById('overall-dot');
    var title = document.getElementById('overall-title');
    var sub = document.getElementById('overall-sub');
    if (dot) dot.className = 'dot ' + worst;
    if (worst === 'ok') {
      if (title) title.textContent = '全部服务正常';
      if (sub) sub.textContent = '站点、订阅与统计均在正常运行';
    } else if (worst === 'warn') {
      if (title) title.textContent = '部分服务降级';
      if (sub) sub.textContent = '有服务正在维护或响应异常，站点仍可访问';
    } else {
      if (title) title.textContent = '有服务不可用';
      if (sub) sub.textContent = '请稍后再试，或查看下方各项';
    }
  }

  function checkGithub() {
    return fetch('https://www.githubstatus.com/api/v2/status.json', { cache: 'no-store' })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        var ind = (d && d.status && d.status.indicator) || 'unknown';
        var desc = (d && d.status && d.status.description) || '';
        if (ind === 'none') set('github', 'ok', '正常');
        else if (ind === 'minor' || ind === 'maintenance') set('github', 'warn', desc || '维护中');
        else set('github', 'bad', desc || '服务异常');
        return ind === 'none' ? 'ok' : 'warn';
      })
      .catch(function () { set('github', 'warn', '状态接口暂时不可达'); return 'warn'; });
  }

  function checkWorker() {
    return fetch(WORKER, { cache: 'no-store' })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        var ok = d && d.ok && d.worker;
        set('worker', ok ? (d.github ? 'ok' : 'warn') : 'bad', ok ? (d.github ? '正常' : '统计仓库不可写') : '上报服务异常');
        return ok && d.github ? 'ok' : 'warn';
      })
      .catch(function () { set('worker', 'bad', '上报服务未响应'); return 'bad'; });
  }

  function checkSite() {
    return fetch(SITE, { mode: 'no-cors', cache: 'no-store' })
      .then(function () { set('site', 'ok', '可访问'); return 'ok'; })
      .catch(function () { set('site', 'warn', '暂时无法探测（可能离线）'); return 'warn'; });
  }

  function run() {
    set('status', 'ok', '运行中');
    overall(['warn']);
    Promise.all([checkGithub(), checkWorker(), checkSite()]).then(function (r) {
      overall(r);
    });
  }

  run();
  var btn = document.getElementById('refresh');
  if (btn) btn.addEventListener('click', run);
  setInterval(run, 60000);
})();
