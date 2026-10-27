/* OpenRef 客户端脚本：阅读进度条 / 深浅色切换 / 代码复制 / 目录高亮。零依赖。 */
(function () {
  /* ---------- 深浅色切换 ---------- */
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
  apply(current(), false);

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

  /* ---------- 目录滚动高亮 ---------- */
  const tocLinks = Array.prototype.slice.call(document.querySelectorAll('.toc a'));
  if (tocLinks.length) {
    const map = {};
    tocLinks.forEach(function (a) {
      const id = decodeURIComponent((a.getAttribute('href') || '').replace('#', ''));
      const el = document.getElementById(id);
      if (el) map[id] = { a: a, el: el };
    });
    const items = Object.keys(map).map(function (k) {
      return map[k];
    });

    function highlight() {
      const top = window.scrollY + 120;
      let active = items[0];
      for (const it of items) {
        if (it.el.offsetTop <= top) active = it;
      }
      for (const it of items) {
        it.a.classList.toggle('active', it === active);
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
  }
})();
