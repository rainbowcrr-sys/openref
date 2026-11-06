/* OpenRef 客户端脚本：阅读进度条 / 深浅色切换 / 代码复制 / 目录高亮。零依赖。 */
(function () {
  /* ---------- 深浅色切换 + URL 参数 ---------- */
  const root = document.documentElement;
  const btn = document.getElementById('theme-toggle');

  function current() {
    return root.dataset.theme === 'dark' ? 'dark' : 'light';
  }
  function apply(theme, persist) {
    if (theme === 'dark') root.dataset.theme = 'dark';
    else delete root.dataset.theme;
    if (btn) {
      btn.setAttribute('aria-label', theme === 'dark' ? '切换到浅色' : '切换到深色');
      btn.dataset.theme = theme;
    }
    if (persist) {
      try {
        localStorage.setItem('theme', theme);
      } catch (e) {}
    }
  }

  /* 优先级：URL 参数 ?theme=dark|light > localStorage > 系统偏好
     URL 参数会同时写入 localStorage，之后一直生效，刷新和换页都不变回 */
  const urlTheme = new URLSearchParams(location.search).get('theme');
  if (urlTheme === 'dark' || urlTheme === 'light') {
    apply(urlTheme, true);
    // 把参数从地址栏去掉，保持网址干净（选择已记住，不会丢）
    const clean = new URL(location.href);
    clean.searchParams.delete('theme');
    history.replaceState(null, '', clean.pathname + clean.search + clean.hash);
  } else {
    apply(current(), false);
  }

  if (btn) {
    btn.addEventListener('click', function () {
      apply(current() === 'dark' ? 'light' : 'dark', true);
    });
  }

  /* ---------- 阅读进度条 ---------- */
  const bar = document.getElementById('progress');
  if (bar) {
    let ticking = false;
    function update() {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      const pct = h > 0 ? Math.min(100, Math.max(0, (window.scrollY / h) * 100)) : 0;
      bar.style.width = pct + '%';
      ticking = false;
    }
    window.addEventListener(
      'scroll',
      function () {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(update);
        }
      },
      { passive: true }
    );
    window.addEventListener('resize', update);
    update();
  }

  /* ---------- 代码复制 ---------- */
  document.querySelectorAll('.code-copy').forEach(function (b) {
    b.addEventListener('click', function () {
      const block = b.closest('.code-block');
      const code = block && block.querySelector('code');
      if (!code) return;
      const text = code.innerText;
      const done = function () {
        b.textContent = '已复制';
        b.classList.add('copied');
        setTimeout(function () {
          b.textContent = '复制';
          b.classList.remove('copied');
        }, 1600);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () {});
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try {
          document.execCommand('copy');
          done();
        } catch (e) {}
        document.body.removeChild(ta);
      }
    });
  });

  /* ---------- 超长代码块展开 ---------- */
  document.querySelectorAll('.code-expand').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const block = btn.closest('.code-block');
      if (!block) return;
      const collapsed = block.classList.toggle('code-collapsed');
      btn.textContent = collapsed ? btn.dataset.label || '展开全部' : '收起';
      if (collapsed) block.scrollIntoView({ block: 'start', behavior: 'smooth' });
    });
    btn.dataset.label = btn.textContent;
  });

  /* ---------- ::figure 图片点击放大 ---------- */
  (function () {
    let overlay = null;
    function ensure() {
      if (overlay) return overlay;
      overlay = document.createElement('div');
      overlay.className = 'lightbox';
      overlay.innerHTML =
        '<img alt="" /><button class="lightbox-close" type="button" aria-label="关闭">&times;</button>';
      document.body.appendChild(overlay);
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay || e.target.classList.contains('lightbox-close')) {
          overlay.classList.remove('open');
          document.body.style.overflow = '';
        }
      });
      return overlay;
    }
    document.querySelectorAll('img[data-zoomable]').forEach(function (img) {
      img.style.cursor = 'zoom-in';
      img.addEventListener('click', function () {
        const box = ensure();
        box.querySelector('img').src = img.src;
        box.querySelector('img').alt = img.alt || '';
        box.classList.add('open');
        document.body.style.overflow = 'hidden';
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay && overlay.classList.contains('open')) {
        overlay.classList.remove('open');
        document.body.style.overflow = '';
      }
    });
  })();

  /* ---------- 手机端目录折叠面板 ---------- */
  (function () {
    const nav = document.getElementById('toc-mobile');
    const btn = document.getElementById('toc-mobile-btn');
    const list = document.getElementById('toc-mobile-list');
    if (!nav || !btn || !list) return;

    function close() {
      nav.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    }

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      const open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    /* 点目录项跳转后自动收起，别挡着正文 */
    list.addEventListener('click', function (e) {
      if (e.target.closest('a')) close();
    });

    /* 点页面别处也收起 */
    document.addEventListener('click', function (e) {
      if (nav.classList.contains('open') && !nav.contains(e.target)) close();
    });
  })();

  /* ---------- 目录滚动高亮 + 目录自动滚动 ---------- */
  (function () {
    /* 桌面侧栏目录 + 手机折叠目录一起高亮，两套 DOM 同步 */
    const links = Array.prototype.slice.call(
      document.querySelectorAll('.toc a, #toc-mobile-list a')
    );
    if (!links.length) return;

    const items = [];
    links.forEach(function (a) {
      const id = (a.getAttribute('href') || '').replace('#', '');
      const el = document.getElementById(id);
      if (el) items.push({ a: a, el: el });
    });
    if (!items.length) return;

    const sideToc = document.querySelector('.toc');
    let lastActive = null;

    function highlight() {
      const top = window.scrollY + 120;
      let active = items[0];
      for (const it of items) {
        if (it.el.offsetTop <= top) active = it;
      }
      if (active === lastActive) return;
      lastActive = active;

      /* 同名章节在两套目录里都点亮 */
      const href = active.a.getAttribute('href');
      items.forEach(function (it) {
        it.a.classList.toggle('active', it.a.getAttribute('href') === href);
      });

      /* 桌面端：目录自身也滚动，保证当前章节一直看得见 */
      if (sideToc && window.innerWidth > 860) {
        const box = sideToc.getBoundingClientRect();
        const link = active.a.getBoundingClientRect();
        if (link.top < box.top + 8 || link.bottom > box.bottom - 8) {
          sideToc.scrollTop += link.top - box.top - box.height / 2 + link.height / 2;
        }
      }
    }

    let t = false;
    window.addEventListener(
      'scroll',
      function () {
        if (!t) {
          t = true;
          requestAnimationFrame(function () {
            highlight();
            t = false;
          });
        }
      },
      { passive: true }
    );
    highlight();
  })();

  /* ---------- 折叠块：桌面收起，手机强制展开 ---------- */
  (function () {
    const folds = Array.prototype.slice.call(document.querySelectorAll('.fold-desktop'));
    if (!folds.length) return;
    function sync() {
      const narrow = window.innerWidth <= 860;
      folds.forEach(function (d) {
        if (narrow) d.setAttribute('open', '');
        else if (!d.dataset.touched) d.removeAttribute('open');
      });
    }
    /* 用户手动点过之后，尊重用户的选择，不再强制收起 */
    folds.forEach(function (d) {
      d.addEventListener('toggle', function () {
        if (window.innerWidth > 860) d.dataset.touched = '1';
      });
    });
    sync();
    window.addEventListener('resize', sync);
  })();

  /* ---------- 「有用」按钮：本地计数，纯视觉反馈 ---------- */
  (function () {
    const btn = document.getElementById('useful-btn');
    if (!btn) return;
    const cnt = document.getElementById('useful-count');
    const label = btn.querySelector('.useful-label');
    const key = 'useful:' + (btn.dataset.id || location.pathname);
    let n = 0;
    let voted = false;
    try {
      n = parseInt(localStorage.getItem(key) || '0', 10) || 0;
      voted = localStorage.getItem(key + ':voted') === '1';
    } catch (e) {}
    function render() {
      if (cnt) { cnt.textContent = n; cnt.style.display = n > 0 ? '' : 'none'; }
      if (voted) {
        btn.classList.add('done');
        if (label) label.textContent = '已标记有用';
      }
    }
    render();
    btn.addEventListener('click', function () {
      if (voted) {
        n = Math.max(0, n - 1);
        voted = false;
        btn.classList.remove('done');
        if (label) label.textContent = '有用';
      } else {
        n += 1;
        voted = true;
        btn.classList.add('done');
        if (label) label.textContent = '已标记有用';
      }
      try {
        localStorage.setItem(key, String(n));
        localStorage.setItem(key + ':voted', voted ? '1' : '0');
      } catch (e) {}
      render();
    });
  })();

  /* ---------- 手机端：长折叠块默认收起，别占满首屏 ---------- */
  (function () {
    if (window.innerWidth > 860) return;
    document.querySelectorAll('.fold-desktop[open]').forEach(function (d) {
      d.removeAttribute('open');
    });
  })();

  /* ---------- 阅读进度百分比 ---------- */
  (function () {
    const pct = document.getElementById('read-pct');
    if (!pct) return;
    const bar = document.getElementById('progress');
    let ticking = false;
    function update() {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      const v = h > 0 ? Math.min(100, Math.max(0, (window.scrollY / h) * 100)) : 0;
      const txt = Math.round(v) + '%';
      pct.textContent = txt;
      const mp = document.querySelector('.toc-mobile-pct');
      if (mp) mp.textContent = txt;
      if (bar) bar.style.width = v + '%';
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  })();
})();
