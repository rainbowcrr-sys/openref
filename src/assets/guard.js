/* 前端防护：禁用右键菜单、屏蔽开发者工具快捷键、检测到 DevTools 时覆盖页面。
 * 说明：浏览器必须先下载 HTML/CSS/JS 才能渲染，所以任何访客理论上都能拿到源码；
 * 这里做的是「提高门槛」，不是加密。 */
(function () {
  function isDevKey(e) {
    var k = (e.key || '').toLowerCase();
    if (k === 'f12') return true;
    if (e.ctrlKey && e.shiftKey && (k === 'i' || k === 'j' || k === 'c')) return true;
    if (e.ctrlKey && !e.shiftKey && (k === 'u' || k === 's')) return true;
    if (e.metaKey && e.altKey && (k === 'i' || k === 'j' || k === 'c')) return true;
    return false;
  }

  document.addEventListener('contextmenu', function (e) {
    e.preventDefault();
    return false;
  });

  document.addEventListener(
    'keydown',
    function (e) {
      if (isDevKey(e)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    },
    true
  );

  /* DevTools 打开检测（窗口尺寸差异法）：打开时遮罩，关闭后自动恢复，不影响正常浏览 */
  var overlay = null;
  function ensureOverlay() {
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.id = 'dev-guard';
    overlay.innerHTML =
      '<div class="dev-guard-box"><h2>开发者工具已禁用</h2>' +
      '<p>本站不提供源码查看。请关闭开发者工具后继续浏览。</p></div>';
    document.body.appendChild(overlay);
    return overlay;
  }
  function check() {
    var w = window.outerWidth - window.innerWidth > 160;
    var h = window.outerHeight - window.innerHeight > 160;
    if (w || h) ensureOverlay().style.display = 'flex';
    else if (overlay) overlay.style.display = 'none';
  }
  setInterval(check, 1000);
  window.addEventListener('resize', check);
})();
