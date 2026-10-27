/* 站内搜索：加载 /search-index.json，支持中文按字/词切分匹配。纯前端，无依赖。 */
(function () {
  const input = document.getElementById('q');
  const box = document.getElementById('results');
  const empty = document.getElementById('empty');
  if (!input || !box) return;

  const params = new URLSearchParams(location.search);
  const initial = params.get('q') || '';
  let docs = [];

  const esc = function (s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  };

  /**
   * 把查询串切成词：
   * - 英文/数字按空格和标点切词
   * - 中文按 2 字滑窗切（"D1建索引" → "D1"、"建索"、"索引"…），
   *   这样长句也能命中，不会因为整串不匹配就搜不到
   */
  function tokenize(q) {
    const out = [];
    const lower = q.toLowerCase();
    // 英文 / 数字词
    const en = lower.match(/[a-z0-9][a-z0-9_.+-]*/g) || [];
    en.forEach(function (w) {
      if (w.length >= 2) out.push(w);
    });
    // 中文滑窗
    const zh = lower.replace(/[^一-龥]/g, '');
    if (zh.length <= 4) {
      if (zh.length >= 2) out.push(zh);
    } else {
      for (let i = 0; i + 2 <= zh.length; i++) out.push(zh.slice(i, i + 2));
      if (zh.length >= 3) out.push(zh);
    }
    return Array.from(new Set(out));
  }

  function snippet(text, terms) {
    const t = String(text);
    const lower = t.toLowerCase();
    let at = -1;
    for (const term of terms) {
      const i = lower.indexOf(term);
      if (i >= 0) {
        at = i;
        break;
      }
    }
    if (at < 0) return esc(t.slice(0, 110));
    const start = Math.max(0, at - 40);
    let out = esc((start > 0 ? '…' : '') + t.slice(start, start + 150));
    for (const term of terms) {
      if (term.length < 1) continue;
      out = out.replace(
        new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'),
        function (m) {
          return '<mark>' + m + '</mark>';
        }
      );
    }
    return out;
  }

  function render() {
    const q = input.value.trim();
    if (!q) {
      box.innerHTML = '';
      empty.hidden = true;
      return;
    }
    const terms = tokenize(q);
    if (!terms.length) {
      box.innerHTML = '';
      empty.hidden = false;
      return;
    }

    const hits = [];
    for (const d of docs) {
      const title = String(d.t).toLowerCase();
      const desc = String(d.d).toLowerCase();
      const body = String(d.b).toLowerCase();
      const tags = (d.g || []).join(' ').toLowerCase();
      const cat = (d.c || '') + ' ' + (d.s || '');
      let score = 0;
      let matched = 0;
      for (const term of terms) {
        let hit = false;
        if (title.indexOf(term) >= 0) {
          score += 8;
          hit = true;
        }
        if (desc.indexOf(term) >= 0) {
          score += 4;
          hit = true;
        }
        if (tags.indexOf(term) >= 0 || cat.toLowerCase().indexOf(term) >= 0) {
          score += 3;
          hit = true;
        }
        if (body.indexOf(term) >= 0) {
          score += 1;
          hit = true;
        }
        if (hit) matched++;
      }
      // 要求大部分词命中，避免只靠一个常见字就匹配一大堆
      if (score > 0 && matched / terms.length >= 0.5) hits.push({ d: d, score: score, matched: matched });
    }

    hits.sort(function (a, b) {
      return b.matched - a.matched || b.score - a.score;
    });

    empty.hidden = hits.length > 0;
    box.innerHTML = hits
      .slice(0, 30)
      .map(function (h) {
        const d = h.d;
        return '<a class="search-result" href="' + d.u + '">' +
          '<h3>' + esc(d.t) + '</h3>' +
          '<p>' + snippet(d.b, terms) + '</p>' +
          '<div class="meta">' +
          (d.c ? '<span class="pill">' + esc(d.c) + '</span>' : '') +
          (d.s ? '<span class="pill">' + esc(d.s) + '</span>' : '') +
          '</div></a>';
      })
      .join('');
  }

  fetch('/search-index.json')
    .then(function (r) {
      return r.json();
    })
    .then(function (data) {
      docs = data;
      input.value = initial;
      render();
    })
    .catch(function () {
      empty.hidden = false;
      empty.textContent = '索引加载失败。';
    });

  input.addEventListener('input', render);
})();
