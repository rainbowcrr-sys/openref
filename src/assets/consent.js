/* Cookie 同意：三类开关，状态同时写 cookie 和 localStorage，缺一处就重新弹。
   清掉 cookie 后再次进站必然重弹。浏览器原生功能一律不拦截。 */
(function () {
  var KEY = 'openref_consent_v1';

  function cookieVal() {
    var m = document.cookie.match(new RegExp('(?:^|; )' + KEY + '=([^;]*)'));
    if (!m) return null;
    try { return decodeURIComponent(m[1]); } catch (e) { return null; }
  }
  function lsVal() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }

  /* 两处都在、且内容一致，才算已经做过选择 */
  function get() {
    var c = cookieVal(), l = lsVal();
    if (!c || !l || c !== l) return null;
    try {
      var o = JSON.parse(c);
      return o && typeof o.prefs === 'boolean' && typeof o.stats === 'boolean' ? o : null;
    } catch (e) { return null; }
  }

  function save(s) {
    var str = JSON.stringify({ necessary: true, prefs: !!s.prefs, stats: !!s.stats, ts: Date.now() });
    document.cookie = KEY + '=' + encodeURIComponent(str) + '; path=/; max-age=31536000; SameSite=Lax';
    try { localStorage.setItem(KEY, str); } catch (e) {}
    var banner = document.getElementById('consent-banner');
    if (banner) banner.hidden = true;
    document.dispatchEvent(new CustomEvent('openref:consent', { detail: JSON.parse(str) }));
  }

  function open() {
    var banner = document.getElementById('consent-banner');
    if (!banner) return;
    var s = get() || { prefs: true, stats: false };
    var p = document.getElementById('cp-prefs');
    var t = document.getElementById('cp-stats');
    if (p) p.checked = !!s.prefs;
    if (t) t.checked = !!s.stats;
    document.getElementById('consent-panel').hidden = false;
    banner.hidden = false;
  }

  var banner = document.getElementById('consent-banner');
  if (banner) {
    banner.addEventListener('click', function (e) {
      var b = e.target.closest('[data-consent]');
      if (!b) return;
      var act = b.getAttribute('data-consent');
      if (act === 'accept') save({ prefs: true, stats: true });
      else if (act === 'reject') save({ prefs: false, stats: false });
      else if (act === 'manage') {
        var panel = document.getElementById('consent-panel');
        panel.hidden = !panel.hidden;
      }
    });
    var saveBtn = document.getElementById('cp-save');
    if (saveBtn) saveBtn.addEventListener('click', function () {
      save({
        prefs: (document.getElementById('cp-prefs') || {}).checked !== false,
        stats: !!(document.getElementById('cp-stats') || {}).checked,
      });
    });
    var gear = document.getElementById('consent-gear');
    if (gear) gear.addEventListener('click', open);
    if (!get()) {
      /* 首次进站：默认偏好开、统计关，但不自动写入，等用户点 */
      var p0 = document.getElementById('cp-prefs');
      var t0 = document.getElementById('cp-stats');
      if (p0) p0.checked = true;
      if (t0) t0.checked = false;
      banner.hidden = false;
    }
  }

  window.OpenRefConsent = { get: get, open: open, save: save };
})();
