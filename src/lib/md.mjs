/**
 * 零依赖 Markdown 解析。
 * 支持：标题/列表/表格/引用/代码/行内代码/链接/图片/分隔线
 * 扩展：::: 容器（note / tip / warn / details）、:: 指令（card / btn / video / figure / badge / github）
 * 返回 { html, headings, text }
 */

export function parseFrontmatter(src) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(src);
  if (!m) return { data: {}, body: src };
  const data = {};
  for (const line of m[1].split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = line.indexOf(':');
    if (i < 0) continue;
    const key = line.slice(0, i).trim();
    let val = line.slice(i + 1).trim();
    if (val.startsWith('[') && val.endsWith(']')) {
      val = val
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean);
    } else {
      val = val.replace(/^["']|["']$/g, '');
      if (val === 'true') val = true;
      else if (val === 'false') val = false;
    }
    data[key] = val;
  }
  return { data, body: src.slice(m[0].length) };
}

export function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/[`*_[\]()#!]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}-]/gu, '');
}

/* ============================================================
 * 行内指令 ::xxx{...}
 * ========================================================== */
const DIRECTIVE = /^::(card|btn|video|figure|badge|github)\{(.+)\}\s*$/;

function splitArgs(raw) {
  return raw.split('|').map((s) => s.trim());
}

function renderDirective(kind, raw) {
  const args = splitArgs(raw);
  switch (kind) {
    case 'card': {
      const [url, title, desc] = args;
      if (!url) return '';
      return `<a class="x-card" href="${escapeHtml(url)}"><div class="x-card-body">
        <div class="x-card-title">${escapeHtml(title || url)}</div>
        ${desc ? `<div class="x-card-desc">${escapeHtml(desc)}</div>` : ''}
      </div><span class="x-card-arrow">→</span></a>`;
    }
    case 'btn': {
      const [text, url] = args;
      if (!url) return '';
      return `<a class="x-btn" href="${escapeHtml(url)}">${escapeHtml(text || url)}${
        /^https?:/.test(url) ? '<span class="x-btn-ext">↗</span>' : ''
      }</a>`;
    }
    case 'video': {
      const [url, title] = args;
      if (!url) return '';
      return renderVideo(url, title);
    }
    case 'figure': {
      const [src, caption] = args;
      if (!src) return '';
      return `<figure class="x-figure"><img src="${escapeHtml(src)}" alt="${escapeHtml(
        caption || ''
      )}" loading="lazy" data-zoomable />${caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : ''}</figure>`;
    }
    case 'badge': {
      const [text, type] = args;
      return `<span class="x-badge x-badge-${escapeHtml(type || 'tech')}">${escapeHtml(text || '')}</span>`;
    }
    case 'github': {
      const [repo, text] = args;
      if (!repo) return '';
      return `<a class="x-github" href="https://github.com/${escapeHtml(repo)}" target="_blank" rel="noopener">
        <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.07-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A7.995 7.995 0 0 0 16 8c0-4.42-3.58-8-8-8Z"/></svg>
        <span>${escapeHtml(text || repo)}</span></a>`;
    }
    default:
      return '';
  }
}

/** B站 / YouTube / 直链 mp4 */
export function renderVideo(url, title = '') {
  const u = String(url);
  // B站 BV 号
  const bv = /(?:bilibili\.com\/video\/|b23\.tv\/)(BV[0-9A-Za-z]+)/.exec(u);
  if (bv) {
    const src = `https://player.bilibili.com/player.html?bvid=${bv[1]}&high_quality=1&autoplay=0`;
    return videoFrame(src, title, '哔哩哔哩');
  }
  // YouTube
  const yt = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{6,})/.exec(u);
  if (yt) {
    const src = `https://www.youtube-nocookie.com/embed/${yt[1]}`;
    return videoFrame(src, title, 'YouTube');
  }
  // 自托管 mp4 / webm
  if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(u)) {
    return `<div class="x-video"><video controls preload="metadata" playsinline src="${escapeHtml(u)}"></video>${
      title ? `<div class="x-video-title">${escapeHtml(title)}</div>` : ''
    }</div>`;
  }
  return `<a class="x-btn" href="${escapeHtml(u)}">${escapeHtml(title || '观看视频')}</a>`;
}

function videoFrame(src, title, label) {
  return `<div class="x-video"><div class="x-video-frame">
    <iframe src="${src}" title="${escapeHtml(title || label)}" loading="lazy" allowfullscreen frameborder="0" scrolling="no"></iframe>
  </div><div class="x-video-title">${escapeHtml(title || label)}</div></div>`;
}

/* ============================================================
 * 行内解析
 * ========================================================== */
function inline(raw) {
  const codes = [];
  let s = escapeHtml(raw);
  s = s.replace(/`([^`]+)`/g, (_, c) => {
    codes.push(c);
    return `\u0000${codes.length - 1}\u0000`;
  });
  s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '<img alt="$1" src="$2" loading="lazy" />');
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, text, href) => {
    const external = /^https?:/.test(href);
    return `<a href="${href}"${external ? ' target="_blank" rel="noopener"' : ''}>${text}</a>`;
  });
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${codes[Number(i)]}</code>`);
  return s;
}

/* ============================================================
 * 主解析
 * ========================================================== */
export function renderMarkdown(src) {
  const lines = String(src).replace(/\r\n/g, '\n').split('\n');
  const out = [];
  const headings = [];
  let i = 0;
  let para = [];

  const flush = () => {
    if (para.length) {
      out.push(`<p>${inline(para.join(' '))}</p>`);
      para = [];
    }
  };

  /* 原生 HTML 块白名单：<details> 这类容器要原样输出，
     否则会被 escapeHtml 转成字面文字，页面上显示成一堆标签源码 */
  const BLOCK = /^\s*<(details|div|figure|section|table)\b([^>]*)>/i;
  const INLINE_HTML = /^\s*<(\/?)?(summary|figcaption|br|hr|span|strong|em|code|a|img|video|iframe|p|ul|ol|li|h[1-6]|blockquote)\b[^>]*>/i;

  while (i < lines.length) {
    const line = lines[i];

    // 原生 HTML 容器块：标签原样保留，内部内容仍按 Markdown 渲染
    const blk = BLOCK.exec(line);
    if (blk) {
      flush();
      const tag = blk[1].toLowerCase();
      const openTag = line.trim();
      const buf = [];
      i++;
      const closeRe = new RegExp('^\\s*</' + tag + '\\s*>', 'i');
      while (i < lines.length && !closeRe.test(lines[i])) {
        buf.push(lines[i]);
        i++;
      }
      const closeTag = i < lines.length ? lines[i].trim() : '</' + tag + '>';
      if (i < lines.length) i++;
      out.push(openTag + '\n' + renderMarkdown(buf.join('\n')) + '\n' + closeTag);
      continue;
    }

    // 单行原生 HTML（<summary> 等）：原样透传
    if (INLINE_HTML.test(line) && !line.trim().startsWith('::')) {
      flush();
      out.push(line.trim());
      i++;
      continue;
    }

    // 行内指令 ::xxx{...}
    const dir = DIRECTIVE.exec(line.trim());
    if (dir) {
      flush();
      out.push(renderDirective(dir[1], dir[2]));
      i++;
      continue;
    }

    // ::: 容器
    const open = /^:::(\s*)(note|tip|warn|details)?(.*)$/.exec(line.trim());
    if (open && line.trim().startsWith(':::')) {
      flush();
      const kind = open[2] || 'note';
      const title = (open[3] || '').replace(/^\{|\}$/g, '').trim();
      const buf = [];
      i++;
      let depth = 1;
      while (i < lines.length) {
        const cur = lines[i].trim();
        if (cur === ':::') {
          depth--;
          if (depth === 0) {
            i++;
            break;
          }
        } else if (/^:::/.test(cur)) depth++;
        buf.push(lines[i]);
        i++;
      }
      const inner = renderMarkdown(buf.join('\n'));
      if (kind === 'details') {
        out.push(
          `<details class="x-details"><summary>${escapeHtml(title || '展开')}</summary><div class="x-details-body">${inner.html}</div></details>`
        );
      } else {
        const label = { note: '说明', tip: '提示', warn: '注意' }[kind] || '说明';
        out.push(
          `<div class="x-callout x-${kind}"><div class="x-callout-label">${escapeHtml(
            title || label
          )}</div><div class="x-callout-body">${inner.html}</div></div>`
        );
      }
      continue;
    }

    // 代码块
    const fence = /^```(\w*)\s*$/.exec(line);
    if (fence) {
      flush();
      const lang = fence[1] || '';
      const buf = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) buf.push(lines[i++]);
      i++;
      const code = buf.join('\n');
      const rawLines = code.split('\n');
      const lineCount = rawLines.length;
      const COLLAPSE_AT = 30; // 超过这个行数默认折叠
      const collapsible = lineCount > COLLAPSE_AT;
      // 逐行着色，行号用 CSS counter 生成（不会被复制到剪贴板）
      const linesHtml = rawLines
        .map((l) => `<span class="code-line">${highlight(escapeHtml(l))}</span>`)
        .join('');
      out.push(
        `<div class="code-block${collapsible ? ' code-collapsed' : ''}"${
          lang ? ` data-lang="${escapeHtml(lang)}"` : ''
        }>
  <div class="code-head"><span class="code-lang">${escapeHtml(lang || 'code')}</span>
  <button class="code-copy" type="button" aria-label="复制代码">复制</button></div>
  <pre class="code" data-colored><code>${linesHtml}</code></pre>
  ${
    collapsible
      ? `<button class="code-expand" type="button">展开全部 ${lineCount} 行</button>`
      : ''
  }
</div>`
      );
      continue;
    }

    // 标题
    const h = /^(#{1,4})\s+(.*)$/.exec(line);
    if (h) {
      flush();
      const depth = h[1].length;
      const text = h[2].trim();
      const id = slugify(text) || `h-${headings.length}`;
      headings.push({ depth, text, id });
      // 不做 encodeURIComponent：中文 id 是合法的，编码后 href="#中文" 与
      // id="%E4%B8%AD%E6%96%87" 对不上，锚点跳转会失效
      out.push(`<h${depth} id="${id}">${inline(text)}</h${depth}>`);
      i++;
      continue;
    }

    // 分隔线
    if (/^---+\s*$/.test(line)) {
      flush();
      out.push('<hr />');
      i++;
      continue;
    }

    // 引用
    if (/^>\s?/.test(line)) {
      flush();
      const buf = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, ''));
      out.push(`<blockquote>${inline(buf.join(' '))}</blockquote>`);
      continue;
    }

    // 表格
    if (
      /^\s*\|/.test(line) &&
      /\|\s*$/.test(line) &&
      i + 1 < lines.length &&
      /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1])
    ) {
      flush();
      const cells = (r) =>
        r
          .trim()
          .replace(/^\||\|$/g, '')
          .split('|')
          .map((c) => c.trim());
      const head = cells(line);
      i += 2;
      const body = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) body.push(cells(lines[i++]));
      let t = '<div class="table-wrap"><table><thead><tr>' + head.map((c) => `<th>${inline(c)}</th>`).join('') + '</tr></thead><tbody>';
      for (const r of body) t += '<tr>' + r.map((c) => `<td>${inline(c)}</td>`).join('') + '</tr>';
      t += '</tbody></table></div>';
      out.push(t);
      continue;
    }

    // 列表
    if (/^\s*[-*]\s+/.test(line)) {
      flush();
      const items = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i++].replace(/^\s*[-*]\s+/, ''));
      }
      out.push('<ul>' + items.map((x) => `<li>${inline(x)}</li>`).join('') + '</ul>');
      continue;
    }
    if (/^\s*\d+[.)]\s+/.test(line)) {
      flush();
      const items = [];
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) {
        items.push(lines[i++].replace(/^\s*\d+[.)]\s+/, ''));
      }
      out.push('<ol>' + items.map((x) => `<li>${inline(x)}</li>`).join('') + '</ol>');
      continue;
    }

    // 空行
    if (!line.trim()) {
      flush();
      i++;
      continue;
    }

    para.push(line.trim());
    i++;
  }
  flush();

  const html = out.join('\n');
  const text = html
    .replace(/<pre[\s\S]*?<\/pre>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // 注意：这里返回未着色的 html，由 build.mjs 统一调用 colorize()，避免重复着色破坏标签
  return { html, headings, text };
}

/* ============================================================
 * 代码高亮：注释 / 字符串 / 关键字 / 数字 / 函数名
 * ========================================================== */
const KEYWORDS = {
  js: 'const|let|var|function|return|if|else|for|while|await|async|new|class|import|export|from|default|try|catch|throw|typeof|of|in|this|null|undefined|true|false|switch|case|break|continue|do|delete|yield|extends|super|static|get|set|instanceof',
  ts: 'const|let|var|function|return|if|else|for|while|await|async|new|class|import|export|from|default|try|catch|throw|typeof|of|in|this|null|undefined|true|false|interface|type|enum|implements|public|private|readonly|as|extends',
  python:
    'def|class|return|if|elif|else|for|while|import|from|as|with|try|except|finally|raise|lambda|None|True|False|and|or|not|in|is|pass|yield|global|async|await|self',
  go: 'func|package|import|return|if|else|for|range|var|const|type|struct|interface|go|defer|chan|select|switch|case|break|continue|nil|true|false|map',
  rust:
    'fn|let|mut|const|static|struct|enum|impl|trait|pub|use|mod|match|if|else|for|while|loop|return|self|Self|Some|None|Ok|Err|async|await|move|ref|where|crate',
  sql: 'SELECT|FROM|WHERE|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|INDEX|ON|JOIN|LEFT|RIGHT|INNER|GROUP|ORDER|BY|LIMIT|OFFSET|AND|OR|NOT|NULL|PRIMARY|KEY|DEFAULT|ALTER|DROP|EXPLAIN|QUERY|PLAN|AS|DISTINCT|COUNT',
  bash: 'if|then|else|fi|for|in|do|done|while|case|esac|function|export|local|echo|cd|sudo|npm|node|git',
  json: 'true|false|null',
  html: '',
  css: '',
};

export function colorize(html) {
  // data-colored 的代码块在 renderMarkdown 里已逐行着色（带行号结构），这里跳过，避免二次包裹
  return html.replace(
    /<pre class="code"([^>]*)><code>([\s\S]*?)<\/code><\/pre>/g,
    (match, attrs, code) => {
      if (String(attrs).includes('data-colored')) return match;
      return `<pre class="code"${attrs}><code>${highlight(code)}</code></pre>`;
    }
  );
}

function highlight(code) {
  const kw = [...new Set(Object.values(KEYWORDS).join('|').split('|').filter(Boolean))].sort(
    (a, b) => b.length - a.length
  );

  // 单遍扫描，优先级：注释 > 字符串 > 数字 > 关键字 > 函数调用
  // 这样不会把已生成的 <span class="..."> 里的英文再当作关键字二次包裹
  const re = new RegExp(
    [
      '(\\/\\/[^\\n]*|--[^\\n]*|#[^\\n]*|&lt;!--[\\s\\S]*?--&gt;|\\/\\*[\\s\\S]*?\\*\\/)', // 1 注释
      '(&quot;(?:[^&]|&(?!quot;))*&quot;|\'[^\'\\n]*\'|`[^`]*`)', // 2 字符串
      '\\b(\\d+(?:\\.\\d+)?)\\b', // 3 数字
      `\\b(${kw.join('|')})\\b`, // 4 关键字
      '([A-Za-z_$][\\w$]*)(?=\\()', // 5 函数调用
    ].join('|'),
    'g'
  );

  let out = '';
  let last = 0;
  let m;
  while ((m = re.exec(code))) {
    out += code.slice(last, m.index);
    last = re.lastIndex;
    if (m[1]) out += `<span class="tok-c">${m[1]}</span>`;
    else if (m[2]) out += `<span class="tok-s">${m[2]}</span>`;
    else if (m[3]) out += `<span class="tok-n">${m[3]}</span>`;
    else if (m[4]) out += `<span class="tok-k">${m[4]}</span>`;
    else if (m[5]) out += `<span class="tok-f">${m[5]}</span>`;
  }
  return out + code.slice(last);
}
