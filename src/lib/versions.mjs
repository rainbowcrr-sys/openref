/**
 * 版本组：子类目录下放一个 meta.json + 若干篇 md，就合成「同一篇文档的多个环境版本」。
 *
 * 约定：
 *   meta.json = { "group": "组名", "files": ["node20.md", "node22.md"] }
 *   每篇 md 的 frontmatter 写 series / version / env，pubDate 沿用全站字段。
 *   按 pubDate 最大者为最新；页面壳（标题/元信息/目录/OG/sitemap）全用最新那篇。
 *   对外只有「目录名」这一个页面，点时间线只换正文，URL 和标题都不变。
 *   旧版文章不进全站列表和全站 feed，只在时间线里活着 —— 旧环境用户照样能看。
 */
import fs from 'node:fs';
import path from 'node:path';
import { parseFrontmatter, renderMarkdown, colorize, escapeHtml } from './md.mjs';
import { getCategory, getSub } from '../data/taxonomy.mjs';

const CJK_RE = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff\u3040-\u30ff]/g;
const fmtDate = (d) => (d instanceof Date ? d.toISOString().slice(0, 10) : String(d ?? '').slice(0, 10));

function countWords(text) {
  const str = String(text);
  const cjk = (str.match(CJK_RE) || []).length;
  const en = (str.replace(CJK_RE, ' ').match(/[A-Za-z][\w'-]*/g) || []).length;
  return cjk + en;
}
const readingTime = (words) => Math.max(1, Math.round(words / 350));

/** 找出所有含 meta.json 的目录 */
function scanGroupDirs(DOCS) {
  const out = [];
  const walk = (dir, base = '') => {
    if (!fs.existsSync(dir)) return;
    for (const name of fs.readdirSync(dir)) {
      const p = path.join(dir, name);
      const rel = base ? `${base}/${name}` : name;
      if (fs.statSync(p).isDirectory()) walk(p, rel);
      else if (name === 'meta.json') out.push({ dir: path.dirname(p), id: base });
    }
  };
  walk(DOCS);
  return out;
}

export function collectVersionGroups(DOCS) {
  return scanGroupDirs(DOCS)
    .map(({ dir, id }) => {
      let meta;
      try {
        meta = JSON.parse(fs.readFileSync(path.join(dir, 'meta.json'), 'utf8'));
      } catch (e) {
        console.warn(`[versions] meta.json 解析失败：${id}`);
        return null;
      }
      const files = Array.isArray(meta.files) ? meta.files : [];
      const items = files
        .filter((f) => fs.existsSync(path.join(dir, f)))
        .map((f) => {
          const raw = fs.readFileSync(path.join(dir, f), 'utf8');
          const { data, body } = parseFrontmatter(raw);
          const { html, headings, text } = renderMarkdown(body);
          const rawDate = data.pubDate ? new Date(String(data.pubDate)) : null;
          const date = rawDate && !Number.isNaN(rawDate.valueOf()) ? rawDate : new Date(0);
          const author = String(data.author ?? '').trim();
          const words = countWords(text);
          return {
            file: f,
            id: `${id}/${f.replace(/\.md$/, '')}`,
            title: String(data.title ?? f.replace(/\.md$/, '')),
            description: String(data.description ?? ''),
            version: String(data.version ?? f.replace(/\.md$/, '')),
            env: String(data.env ?? ''),
            series: String(data.series ?? id.split('/').pop()),
            tags: Array.isArray(data.tags) ? data.tags : [],
            author,
            isOfficial: author === '' || author === 'rainbowcrr-sys',
            date,
            iso: fmtDate(date),
            html: colorize(html),
            headings: headings.filter((h) => h.depth === 2 || h.depth === 3),
            text,
            words,
            minutes: readingTime(words),
          };
        })
        .sort((a, b) => a.date.valueOf() - b.date.valueOf()); // 旧 → 新

      if (!items.length) return null;
      const latest = items[items.length - 1];
      const parts = id.split('/');
      const categoryId = parts[0];
      const subId = parts.length >= 3 ? parts[1] : undefined;

      const post = {
        id,
        slug: parts[parts.length - 1],
        url: `/docs/${id}/`,
        title: latest.title,
        description: latest.description,
        tags: latest.tags,
        author: latest.author,
        isOfficial: latest.isOfficial,
        pubDate: latest.date,
        updated: null,
        iso: latest.iso,
        date: latest.iso,
        updatedIso: null,
        html: latest.html,
        headings: latest.headings,
        text: latest.text,
        words: latest.words,
        minutes: latest.minutes,
        categoryId,
        subId,
        category: getCategory(categoryId),
        subcategory: subId ? getSub(categoryId, subId) : undefined,
        series: latest.series,
        versionGroup: null,
      };

      const group = {
        id,
        name: String(meta.group ?? latest.title),
        series: latest.series,
        items,
        latest,
        post,
        fileIds: new Set(items.map((i) => i.id)),
      };
      post.versionGroup = group;
      return group;
    })
    .filter(Boolean);
}

/** 页面里插在「标题和标签下面、正文上面」的那条时间线 */
export function versionBarHtml(group) {
  const n = group.items.length;
  const last = n - 1;
  const data = group.items.map((it, i) => ({
    i,
    version: it.version,
    env: it.env,
    iso: it.iso,
    file: it.file,
    html: it.html,
    isLatest: i === last,
  }));
  const buttons = group.items
    .map(
      (it, i) => `<button type="button" class="vt-item${i === last ? ' is-active' : ''}" data-vi="${i}" aria-pressed="${i === last}">
  <span class="vt-name">${escapeHtml(it.version)}</span>
  <span class="vt-date">${escapeHtml(it.iso)}</span>
</button>`
    )
    .join('');

  return `
<div class="version-timeline" id="version-timeline" aria-label="版本时间线">
  <div class="vt-head"><span class="vt-label">版本</span><span class="vt-hint">共 ${n} 个环境版本 · 点一下换正文，旧版不会删</span></div>
  <div class="vt-track" role="tablist">${buttons}</div>
</div>
<div class="version-warn" id="version-warn" hidden></div>
<script type="application/json" id="version-data">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
}
