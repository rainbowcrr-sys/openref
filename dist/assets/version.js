/* 版本时间线：只替换 .prose 正文；URL、标题、元信息、目录一律不动。
   旧版显示环境警告并指向最新，切回最新版警告收起。 */
(function () {
  var el = document.getElementById('version-data');
  if (!el) return;
  var data;
  try { data = JSON.parse(el.textContent); } catch (e) { return; }
  if (!Array.isArray(data) || !data.length) return;

  var track = document.querySelector('#version-timeline .vt-track');
  var prose = document.querySelector('.prose');
  var warn = document.getElementById('version-warn');
  var latest = data.reduce(function (a, d) { return d.isLatest ? d.i : a; }, data.length - 1);

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function show(i) {
    var d = data[i];
    if (!d) return;
    if (prose) prose.innerHTML = d.html;
    if (track) {
      track.querySelectorAll('.vt-item').forEach(function (b, k) {
        b.classList.toggle('is-active', k === i);
        b.setAttribute('aria-pressed', k === i ? 'true' : 'false');
      });
      if (track.scrollWidth > track.clientWidth) {
        var a = track.querySelector('.vt-item.is-active');
        if (a && a.scrollIntoView) a.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
      }
    }
    if (warn) {
      if (d.isLatest) {
        warn.hidden = true;
      } else {
        warn.hidden = false;
        warn.innerHTML =
          '<div class="vw-text"><strong>你正在看旧版：' + esc(d.version) + ' · ' + esc(d.iso) + '</strong>' +
          '<span>' + esc(d.env || '旧环境') + '。环境已变化，请核对版本后再照着做。</span></div>' +
          '<button type="button" id="vw-goto">去看最新（' + esc(data[latest] ? data[latest].version : '最新版') + '）</button>';
        var go = document.getElementById('vw-goto');
        if (go) go.addEventListener('click', function () { show(latest); });
      }
    }
  }

  if (track) {
    track.addEventListener('click', function (e) {
      var b = e.target.closest('.vt-item');
      if (!b) return;
      show(Number(b.getAttribute('data-vi')));
    });
  }
  show(latest);
})();
