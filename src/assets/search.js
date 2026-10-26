/* 站内搜索：加载 /search-index.json，按标题/描述/正文/标签匹配。纯前端，无依赖。 */
(function () {
  const input = document.getElementById('q');
  const box = document.getElementById('results');
  const empty = document.getElementById('empty');
  if (!input || !box) return;

  const params = new URLSearchParams(location.search);
  const initial = params.get('q') || '';
  let docs = [];

  const esc = (s) =>
    String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  /** 高亮命中片段 */
  function snippet(text, terms) {
    const t = String(text);
    const lower = t.toLowerCase();
    let at = -1;
    for (const term of terms) {
      const i = lower.indexOf(term);
      if (i >= 0) { at = i; break; }
    }
    if (at < 0) return esc(t.slice(0, 110));
    const start = Math.max(0, at - 40);
    let out = esc((start > 0 ? '…' : '') + t.slice(start, start + 150));
    for (const term of terms) {
      out = out.replace(new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), (m) => `<mark>${m}</mark>`);
    }
    return out;
  }

  function render() {
    const q = input.value.trim().toLowerCase();
    if (!q) {
      box.innerHTML = '';
      empty.hidden = true;
      return;
    }
    const terms = q.split(/\s+/).filter(Boolean);
    const hits = docs
      .map((d) => {
        const hay = [d.t, d.d, d.c, d.s, (d.g || []).join(' '), d.b].join(' ').toLowerCase();
        let score = 0;
        for (const term of terms) {
          if (d.t.toLowerCase().includes(term)) score += 6;
          if (d.d.toLowerCase().includes(term)) score += 3;
          if ((d.g || []).some((g) => g.toLowerCase().includes(term))) score += 2;
          if (hay.includes(term)) score += 1;
        }
        return { d, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score);

    empty.hidden = hits.length > 0;
    box.innerHTML = hits
      .slice(0, 30)
      .map(
        ({ d }) => `<a class="search-result" href="${d.u}">
        <h3>${esc(d.t)}</h3>
        <p>${snippet(d.b, terms)}</p>
        <div class="meta">${d.c ? `<span class="pill">${esc(d.c)}</span>` : ''}${
          d.s ? `<span class="pill">${esc(d.s)}</span>` : ''
        }</div>
      </a>`
      )
      .join('');
  }

  fetch('/search-index.json')
    .then((r) => r.json())
    .then((data) => {
      docs = data;
      input.value = initial;
      render();
    })
    .catch(() => {
      empty.hidden = false;
      empty.textContent = '索引加载失败。';
    });

  input.addEventListener('input', render);
})();
