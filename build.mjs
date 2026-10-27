#!/usr/bin/env node
/**
 * OpenRef 构建器 —— 零依赖，只用 Node 自带模块。
 *   node build.mjs          生成 dist/
 *   node build.mjs --serve   生成后起本地预览 http://localhost:4321
 *
 * 产物 dist/ 是纯静态目录（HTML/CSS/JS/JSON/TXT），
 * 可直接拖进 Cloudflare 网页端「创建应用 → 上传文件」。
 */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter, renderMarkdown, colorize, escapeHtml } from './src/lib/md.mjs';
import { layout, crumbsHtml, cardHtml, postRowHtml, prevNextHtml } from './src/lib/html.mjs';
import { SITE, SITE_NAME, SITE_FULLNAME, SITE_TAGLINE, SITE_DESC, ORG_NAME, LANG } from './src/config/site.mjs';
import { taxonomy, getCategory, getSub } from './src/data/taxonomy.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const DOCS = path.join(ROOT, 'src/content/docs');
const DIST = path.join(ROOT, 'dist');

/* ============================================================
 * 1. 收集文章
 * ========================================================== */
function walk(dir, base = '') {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const rel = base ? `${base}/${name}` : name;
    if (fs.statSync(p).isDirectory()) out.push(...walk(p, rel));
    else if (name.endsWith('.md')) out.push({ file: p, id: rel.replace(/\.md$/, '') });
  }
  return out;
}

const fmtDate = (d) => (d instanceof Date ? d.toISOString().slice(0, 10) : String(d ?? '').slice(0, 10));

/** 今天（上海时区），用作缺省发布日期 */
function today() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/** 缺省 description：取正文第一段有意义的文字 */
function autoDescription(body, fallback = '') {
  for (const rawLine of String(body).split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;
    if (line.startsWith('#') || line.startsWith('```') || line.startsWith('---')) continue;
    if (line.startsWith('<!--')) continue;
    const text = line
      .replace(/^>\s?/, '')
      .replace(/^[-*]\s+/, '')
      .replace(/\*\*/g, '')
      .replace(/`/g, '')
      .replace(/^一句话定义[：:]\s*/, '')
      .trim();
    if (text.length < 8) continue;
    return text.length > 110 ? text.slice(0, 110) + '…' : text;
  }
  return fallback;
}

const posts = walk(DOCS)
  .map(({ file, id }) => {
    const raw = fs.readFileSync(file, 'utf8');
    const { data, body } = parseFrontmatter(raw);
    if (data.draft === true) return null;
    const { html, headings, text } = renderMarkdown(body);

    const parts = id.split('/');
    const categoryId = data.category ?? parts[0] ?? 'uncategorized';
    const subId = data.subcategory ?? (parts.length >= 3 ? parts[1] : undefined);
    const category = getCategory(categoryId);
    const subcategory = subId && category ? getSub(category.id, subId) : undefined;

    const pubRaw = data.pubDate ? new Date(String(data.pubDate)) : null;
    const pubValid = pubRaw && !Number.isNaN(pubRaw.valueOf());
    const pubDate = pubValid ? pubRaw : new Date(today());
    const updatedRaw = data.updated ? new Date(String(data.updated)) : null;
    const updated = updatedRaw && !Number.isNaN(updatedRaw.valueOf()) ? updatedRaw : null;

    return {
      id,
      slug: parts[parts.length - 1],
      url: `/docs/${id}/`,
      // 手写作弊位：三个字段全都能省
      title: String(data.title ?? parts[parts.length - 1]),
      description: String(data.description ?? autoDescription(body, '')),
      tags: Array.isArray(data.tags) ? data.tags : [],
      pubDate,
      updated,
      iso: fmtDate(pubDate),
      date: fmtDate(pubDate),
      updatedIso: updated ? fmtDate(updated) : null,
      html: colorize(html),
      headings: headings.filter((h) => h.depth === 2 || h.depth === 3),
      text,
      words: countWords(text),
      minutes: readingTime(countWords(text)),
      categoryId,
      subId,
      category,
      subcategory,
    };
  })
  .filter(Boolean)
  .sort((a, b) => b.pubDate.valueOf() - a.pubDate.valueOf());

/* ============================================================
 * 2. 工具
 * ========================================================== */
const taxOf = (p) => ({ categoryId: p.categoryId, subId: p.subId, category: p.category, subcategory: p.subcategory });

function crumbsOf(post) {
  const out = [{ label: '首页', href: '/' }];
  if (post.category) {
    out.push({ label: post.category.name, href: `/topics/${post.category.id}/` });
    if (post.subcategory) {
      out.push({ label: post.subcategory.name, href: `/topics/${post.category.id}/${post.subcategory.id}/` });
    }
  }
  return out;
}

function grouped() {
  return taxonomy.map((cat) => {
    const inCat = posts.filter((p) => p.categoryId === cat.id);
    return {
      category: cat,
      total: inCat.length,
      subs: cat.children
        .map((sub) => ({ sub, posts: inCat.filter((p) => p.subId === sub.id) }))
        .filter((s) => s.posts.length > 0),
    };
  });
}

function relatedOf(post, limit = 4) {
  const tags = new Set(post.tags);
  const scored = posts
    .filter((p) => p.id !== post.id)
    .map((p) => {
      let s = 0;
      if (p.subId && p.subId === post.subId) s += 5;
      if (p.categoryId === post.categoryId) s += 3;
      for (const t of p.tags) if (tags.has(t)) s += 1;
      return { p, s };
    })
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || b.p.pubDate.valueOf() - a.p.pubDate.valueOf());
  return scored.slice(0, limit).map((x) => x.p);
}

/** 中文按字计、英文按词计 */
function countWords(text) {
  const cjk = (String(text).match(/[\u4e00-\u9fa5\u3040-\u30ff]/g) || []).length;
  const en = (String(text).replace(/[\u4e00-\u9fa5\u3040-\u30ff]/g, ' ').match(/[A-Za-z][\w'-]*/g) || [])
    .length;
  return cjk + en;
}

/** 阅读时长：中文按 350 字/分钟 */
function readingTime(words) {
  return Math.max(1, Math.round(words / 350));
}

/** 同一子类内按时间排序，取相邻两篇 */
function neighborsOf(post, list) {
  const siblings = list
    .filter((p) => p.categoryId === post.categoryId && p.subId === post.subId)
    .sort((a, b) => b.pubDate.valueOf() - a.pubDate.valueOf());
  const idx = siblings.findIndex((p) => p.id === post.id);
  if (idx < 0) return { prev: null, next: null };
  return {
    next: idx > 0 ? siblings[idx - 1] : null, // 更新的一篇
    prev: idx < siblings.length - 1 ? siblings[idx + 1] : null, // 更早的一篇
  };
}

function allTags() {
  const map = new Map();
  for (const p of posts) for (const t of p.tags) map.set(t, (map.get(t) ?? 0) + 1);
  return [...map.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

/** 写入 dist 下的文件，自动建目录 */
function write(relPath, content) {
  const target = path.join(DIST, relPath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content, 'utf8');
}

/* ============================================================
 * 3. 生成页面
 * ========================================================== */
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });

const groups = grouped();
const tags = allTags();

/* ---- 首页 ---- */
{
  const recent = posts.slice(0, 6);
  let body = `
<section class="hero">
  <div class="wrap">
    <h1>${escapeHtml(SITE_FULLNAME)}</h1>
    <p>${escapeHtml(SITE_TAGLINE)}</p>
    <form class="hero-search" action="/search/" method="get" role="search">
      <input class="search-box" type="search" name="q" placeholder="搜索主题、接口、报错信息…" aria-label="搜索文章" />
    </form>
  </div>
</section>

<section class="section alt">
  <div class="wrap">
    <div class="section-head">
      <h2>最新条目</h2>
      <p>共 ${posts.length} 篇，按发布时间排列。</p>
    </div>
    <div class="grid">${recent.map((p) => cardHtml(p, taxOf(p))).join('')}</div>
  </div>
</section>`;

  groups
    .filter((g) => g.subs.length > 0)
    .forEach((g, i) => {
      body += `
<section class="${i % 2 === 0 ? 'section' : 'section alt'}">
  <div class="wrap">
    <div class="section-head">
      <h2><a href="/topics/${g.category.id}/">${escapeHtml(g.category.name)}</a></h2>
      <p>${escapeHtml(g.category.desc)} · ${g.total} 篇</p>
      <div class="meta mt">${g.subs
        .map((s) => `<a class="pill" href="/topics/${g.category.id}/${s.sub.id}/">${escapeHtml(s.sub.name)} · ${s.posts.length}</a>`)
        .join('')}</div>
    </div>
    <div class="grid">${g.subs
      .flatMap((s) => s.posts)
      .slice(0, 4)
      .map((p) => cardHtml(p, taxOf(p)))
      .join('')}</div>
  </div>
</section>`;
    });

  write('index.html', layout({ title: undefined, description: SITE_DESC, canonical: '/', bodyHtml: body, activePath: '/' }));
}

/* ---- 全部文章 ---- */
{
  const body = `
<section class="section">
  <div class="wrap">
    <div class="section-head"><h1>全部文章</h1><p>按发布时间倒序排列，共 ${posts.length} 篇。</p></div>
    <ul class="post-list">${posts.map((p) => postRowHtml(p, taxOf(p))).join('')}</ul>
  </div>
</section>`;
  write('latest/index.html', layout({ title: '全部文章', description: `全部技术条目，共 ${posts.length} 篇。`, canonical: '/latest/', bodyHtml: body, activePath: '/latest/' }));
}

/* ---- 分类总览 ---- */
{
  const body = `
<section class="section">
  <div class="wrap">
    <div class="section-head"><h1>全部分类</h1><p>按主题分组浏览：每个大类下按子类细分。</p></div>
    ${groups
      .map(
        (g) => `<div class="cat-block">
      <h2><a href="/topics/${g.category.id}/">${escapeHtml(g.category.name)}</a></h2>
      <p class="cat-desc">${escapeHtml(g.category.desc)}</p>
      <div class="grid">${
        g.subs.length === 0
          ? '<article class="card"><p>该分类下暂无条目。</p></article>'
          : g.subs
              .map(
                (s) => `<a class="card sub-card" href="/topics/${g.category.id}/${s.sub.id}/">
          <h3>${escapeHtml(s.sub.name)}</h3><p>${escapeHtml(s.sub.desc ?? '')}</p>
          <div class="meta"><span>${s.posts.length} 篇</span></div></a>`
              )
              .join('')
      }</div>
    </div>`
      )
      .join('')}
  </div>
</section>`;
  write('topics/index.html', layout({ title: '全部分类', description: '按主题分组浏览全部技术条目。', canonical: '/topics/', bodyHtml: body, activePath: '/topics/' }));
}

/* ---- 分类页 / 子类页 ---- */
for (const cat of taxonomy) {
  const inCat = posts.filter((p) => p.categoryId === cat.id);
  if (inCat.length === 0) continue; // 空大类不生成页面，避免空内容页影响收录
  const pages = [
    { sub: null, list: inCat },
    ...cat.children
      .map((sub) => ({ sub, list: inCat.filter((p) => p.subId === sub.id) }))
      .filter((x) => x.list.length > 0),
  ];

  for (const { sub, list } of pages) {
    const name = sub ? sub.name : cat.name;
    const rel = sub ? `topics/${cat.id}/${sub.id}/index.html` : `topics/${cat.id}/index.html`;
    const canonical = sub ? `/topics/${cat.id}/${sub.id}/` : `/topics/${cat.id}/`;
    const desc = sub
      ? `${cat.name} · ${sub.name}：${sub.desc ?? ''}`
      : `${cat.desc} 共 ${list.length} 篇。`;

    const crumbs = [{ label: '首页', href: '/' }, { label: '分类', href: '/topics/' }];
    if (sub) crumbs.push({ label: cat.name, href: `/topics/${cat.id}/` });

    const subPills = !sub
      ? `<div class="meta mb-lg">${cat.children
          .map((s) => `<a class="pill" href="/topics/${cat.id}/${s.id}/">${escapeHtml(s.name)}</a>`)
          .join('')}</div>`
      : '';

    const body = `
<section class="section">
  <div class="wrap">
    ${crumbsHtml(crumbs)}
    <div class="section-head" style="margin-top:14px"><h1>${escapeHtml(name)}</h1><p>${escapeHtml(desc)}</p></div>
    ${subPills}
    ${
      list.length === 0
        ? '<p>该分类下暂无条目。</p>'
        : `<ul class="post-list">${list.map((p) => postRowHtml(p, taxOf(p))).join('')}</ul>`
    }
  </div>
</section>`;

    write(rel, layout({ title: name, description: desc, canonical, bodyHtml: body, activePath: '/topics/' }));
  }
}

/* ---- 文章页 ---- */
for (const p of posts) {
  const crumbs = crumbsOf(p);
  const related = relatedOf(p);
  const { prev, next } = neighborsOf(p, posts);
  const url = new URL(p.url, SITE).href;
  const ogPath = fs.existsSync(path.join(ROOT, 'public/og', `${p.slug}.png`))
    ? `/og/${p.slug}.png`
    : `/og/${p.slug}.svg`;

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: p.title,
      description: p.description,
      datePublished: p.iso,
      dateModified: p.updatedIso ?? p.iso,
      articleSection: [p.category?.name, p.subcategory?.name].filter(Boolean).join(' / '),
      keywords: p.tags.join(', '),
      inLanguage: 'zh-CN',
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      author: { '@type': 'Organization', name: ORG_NAME, url: SITE },
      publisher: { '@type': 'Organization', name: ORG_NAME, url: SITE },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        ...crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.label, item: new URL(c.href, SITE).href })),
        { '@type': 'ListItem', position: crumbs.length + 1, name: p.title, item: url },
      ],
    },
  ];

  const toc = p.headings.length > 1
    ? `<aside class="toc"><div class="toc-title">本页内容</div><ul>${p.headings
        .map((h) => `<li class="${h.depth === 3 ? 'h3' : ''}"><a href="#${encodeURIComponent(h.id)}">${escapeHtml(h.text)}</a></li>`)
        .join('')}</ul></aside>`
    : '';

  const body = `
<article class="article">
  <div class="wrap">
    ${crumbsHtml(crumbs)}
    <header class="article-header">
      <h1>${escapeHtml(p.title)}</h1>
      <p class="lede">${escapeHtml(p.description)}</p>
      <div class="meta">
        ${p.category ? `<a class="pill accent" href="/topics/${p.category.id}/">${escapeHtml(p.category.name)}</a>` : ''}
        ${p.subcategory ? `<a class="pill" href="/topics/${p.category.id}/${p.subId}/">${escapeHtml(p.subcategory.name)}</a>` : ''}
        <time datetime="${p.iso}">发布于 ${p.date}</time>
        ${p.updatedIso ? `<time datetime="${p.updatedIso}">更新于 ${p.updatedIso}</time>` : ''}
        <span class="read-time">约 ${p.words} 字 · ${p.minutes} 分钟</span>
        ${p.tags.map((t) => `<span class="pill">#${escapeHtml(t)}</span>`).join('')}
      </div>
    </header>
    <div class="with-toc">
      <div class="prose">${p.html}</div>
      ${toc}
    </div>
    ${
      related.length
        ? `<section class="related"><h2>相关条目</h2><ul>${related
            .map((r) => `<li><a href="${r.url}">${escapeHtml(r.title)}</a><span>${escapeHtml(r.description)}</span></li>`)
            .join('')}</ul></section>`
        : ''
    }
    ${prevNextHtml(prev, next)}
  </div>
</article>`;

  write(
    `docs/${p.id}/index.html`,
    layout({
      title: p.title,
      description: p.description,
      canonical: p.url,
      ogType: 'article',
      ogImage: ogPath,
      jsonLd,
      bodyHtml: body,
      activePath: '/docs/',
    })
  );
}

/* ---- 标签页 ---- */
{
  const body = `
<section class="section">
  <div class="wrap">
    <div class="section-head"><h1>标签</h1><p>按关键词浏览条目，共 ${tags.length} 个标签。</p></div>
    <div class="meta mb-lg">${tags.map((t) => `<a class="pill" href="#${encodeURIComponent(t.tag)}">#${escapeHtml(t.tag)} · ${t.count}</a>`).join('')}</div>
    ${tags
      .map(
        (t) => `<div class="tag-block" id="${encodeURIComponent(t.tag)}">
      <h2>#${escapeHtml(t.tag)}</h2>
      <ul>${posts
        .filter((p) => p.tags.includes(t.tag))
        .map((p) => `<li><a href="${p.url}">${escapeHtml(p.title)}</a><time datetime="${p.iso}">${p.date}</time></li>`)
        .join('')}</ul>
    </div>`
      )
      .join('')}
  </div>
</section>`;
  write('tags/index.html', layout({ title: '标签', description: `按关键词浏览条目，共 ${tags.length} 个标签。`, canonical: '/tags/', bodyHtml: body, activePath: '/tags/' }));
}

/* ---- 搜索页 ---- */
{
  const body = `
<section class="section">
  <div class="wrap">
    <div class="section-head"><h1>搜索</h1><p>按关键词、接口名或报错信息检索全站条目。</p></div>
    <input class="search-box" id="q" type="search" placeholder="输入关键词，实时显示结果…" aria-label="搜索文章" autocomplete="off" />
    <div id="results" class="results"></div>
    <p id="empty" class="muted-text" hidden>没有匹配的条目，换个关键词试试。</p>
  </div>
</section>`;
  write(
    'search/index.html',
    layout({
      title: '搜索',
      description: '按关键词检索全站技术条目。',
      canonical: '/search/',
      bodyHtml: body,
      activePath: '/search/',
      extraHead: '<script defer src="/assets/search.js"></script>',
    })
  );
}

/* ---- 404 ---- */
{
  const recent = posts.slice(0, 5);
  const body = `
<section class="section">
  <div class="wrap">
    <div class="section-head"><h1>没有找到这个页面</h1><p>地址可能已变更，可以从下面的条目继续：</p></div>
    <ul class="plain-list">${recent.map((p) => `<li><a href="${p.url}">${escapeHtml(p.title)}</a></li>`).join('')}
      <li><a href="/topics/">浏览全部分类</a></li></ul>
  </div>
</section>`;
  write('404.html', layout({ title: '页面不存在', description: '请求的地址不存在。', canonical: '/404.html', bodyHtml: body, noindex: true }));
}

/* ============================================================
 * 4. 资源与 SEO 文件
 * ========================================================== */
fs.mkdirSync(path.join(DIST, 'assets'), { recursive: true });
fs.copyFileSync(path.join(ROOT, 'src/styles/global.css'), path.join(DIST, 'assets/global.css'));
fs.copyFileSync(path.join(ROOT, 'src/assets/search.js'), path.join(DIST, 'assets/search.js'));

if (fs.existsSync(path.join(ROOT, 'public'))) {
  fs.cpSync(path.join(ROOT, 'public'), DIST, { recursive: true });
}

/* 搜索索引 */
const index = posts.map((p) => ({
  t: p.title,
  d: p.description,
  u: p.url,
  c: p.category?.name ?? '',
  s: p.subcategory?.name ?? '',
  g: p.tags,
  b: p.text.slice(0, 1200),
}));
write('search-index.json', JSON.stringify(index));

/* ============================================================
 * 2.5 辅助：OG 图与最新日期
 * ========================================================== */
const latestIso = posts.length ? fmtDate(posts[0].pubDate) : today();

/** 把长文本按字数折行（SVG 不自动换行） */
function wrapText(text, perLine) {
  const out = [];
  let cur = '';
  for (const ch of String(text)) {
    cur += ch;
    if (cur.length >= perLine) {
      out.push(cur);
      cur = '';
    }
  }
  if (cur) out.push(cur);
  return out;
}

/** 苹果风 OG 图（1200×630）。用 SVG 生成，中文不会乱码；
 *  若 public/og/<slug>.png 已存在则优先用 PNG（社交平台兼容性更好）。 */
function ogSvg(post) {
  const titleLines = wrapText(post.title, 18).slice(0, 3);
  const descLines = wrapText(post.description, 30).slice(0, 2);
  const section = [post.category?.name, post.subcategory?.name].filter(Boolean).join(' / ');
  const titleY = 250;
  const lineH = 74;
  const titleSvg = titleLines
    .map(
      (l, i) =>
        `<text x="80" y="${titleY + i * lineH}" font-family="'PingFang SC','Helvetica Neue',Arial,sans-serif" font-size="60" font-weight="600" fill="#1d1d1f">${escapeHtml(l)}</text>`
    )
    .join('\n  ');
  const descSvg = descLines
    .map(
      (l, i) =>
        `<text x="80" y="${titleY + titleLines.length * lineH + 30 + i * 44}" font-family="'PingFang SC','Helvetica Neue',Arial,sans-serif" font-size="30" fill="#86868b">${escapeHtml(l)}</text>`
    )
    .join('\n  ');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#ffffff"/>
  <rect x="0" y="0" width="1200" height="8" fill="#0071e3"/>
  <text x="80" y="120" font-family="'PingFang SC','Helvetica Neue',Arial,sans-serif" font-size="34" font-weight="600" fill="#1d1d1f">${escapeHtml(SITE_NAME)}</text>
  <text x="80" y="170" font-family="'PingFang SC','Helvetica Neue',Arial,sans-serif" font-size="24" fill="#86868b">${escapeHtml(section || 'Technical Reference')}</text>
  ${titleSvg}
  ${descSvg}
  <text x="80" y="580" font-family="'PingFang SC','Helvetica Neue',Arial,sans-serif" font-size="24" fill="#86868b">${escapeHtml(SITE)}</text>
</svg>`;
}

/* sitemap —— 带 lastmod，搜索引擎据此判断哪些页面更新过 */
const sitemapEntries = [
  { loc: '/', last: latestIso },
  { loc: '/latest/', last: latestIso },
  { loc: '/topics/', last: latestIso },
  { loc: '/tags/', last: latestIso },
  ...groups
    .filter((g) => g.total > 0)
    .flatMap((g) => [
      {
        loc: `/topics/${g.category.id}/`,
        last: fmtDate(new Date(Math.max(...g.subs.flatMap((s) => s.posts.map((p) => p.pubDate.valueOf()))))),
      },
      ...g.subs.map((s) => ({
        loc: `/topics/${g.category.id}/${s.sub.id}/`,
        last: fmtDate(new Date(Math.max(...s.posts.map((p) => p.pubDate.valueOf())))),
      })),
    ]),
  ...posts.map((p) => ({ loc: p.url, last: p.updatedIso ?? p.iso })),
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries
  .map((e) => `  <url><loc>${new URL(e.loc, SITE).href}</loc><lastmod>${e.last}</lastmod></url>`)
  .join('\n')}
</urlset>`;
write('sitemap.xml', sitemap);

/* robots.txt —— 纯 ASCII，避免任何编码问题 */
write(
  'robots.txt',
  `# OpenRef technical reference
# All crawlers are welcome.

User-agent: *
Allow: /
Disallow: /search/

# Search engines
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Baiduspider
Allow: /

User-agent: YandexBot
Allow: /

User-agent: DuckDuckBot
Allow: /

User-agent: Applebot
Allow: /

User-agent: 360Spider
Allow: /

User-agent: Sogou web spider
Allow: /

# AI crawlers explicitly allowed
User-agent: GPTBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

Sitemap: ${new URL('/sitemap.xml', SITE).href}
`
);

/* RSS —— 全站 */
function feedXml(list, feedTitle, feedDesc, selfPath) {
  const items = list
    .map(
      (p) => `    <item>
      <title>${escapeHtml(p.title)}</title>
      <link>${new URL(p.url, SITE).href}</link>
      <guid isPermaLink="true">${new URL(p.url, SITE).href}</guid>
      <pubDate>${p.pubDate.toUTCString()}</pubDate>
      <description>${escapeHtml(p.description)}</description>
      ${p.category ? `<category>${escapeHtml(p.category.name)}</category>` : ''}
      ${p.tags.map((t) => `<category>${escapeHtml(t)}</category>`).join('\n      ')}
    </item>`
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeHtml(feedTitle)}</title>
    <link>${SITE}</link>
    <description>${escapeHtml(feedDesc)}</description>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${new URL(selfPath, SITE).href}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;
}

write('rss.xml', feedXml(posts, SITE_FULLNAME, SITE_DESC, '/rss.xml'));

/* RSS —— 每个分类单独一个订阅源 */
for (const g of groups.filter((x) => x.total > 0)) {
  const list = posts.filter((p) => p.categoryId === g.category.id);
  write(
    `rss/${g.category.id}.xml`,
    feedXml(
      list,
      `${SITE_FULLNAME} · ${g.category.name}`,
      `${g.category.desc} 共 ${list.length} 篇。`,
      `/rss/${g.category.id}.xml`
    )
  );
}

/* llms.txt —— 全英文说明 + 中文条目索引（AI 用 UTF-8 读取，不会乱码） */
const byCat = new Map();
for (const p of posts) {
  const key = [p.category?.name, p.subcategory?.name].filter(Boolean).join(' / ') || 'Uncategorized';
  const line = `- [${p.title}](${new URL(p.url, SITE).href}): ${p.description}`;
  byCat.set(key, [...(byCat.get(key) ?? []), line]);
}
write(
  'llms.txt',
  `# ${SITE_NAME}

> ${SITE_TAGLINE}

OpenRef is an open technical reference. Entries are grouped by topic; each entry documents one
specific thing with runnable code and explicit limits. Written in Chinese, plain and direct.

## Sections

${[...byCat.entries()].map(([k, v]) => `## ${k}\n\n${v.join('\n')}`).join('\n\n')}

## Optional

- Full text of all entries: ${new URL('/llms-full.txt', SITE).href}
`
);

/* llms-full.txt —— 全文喂给 AI，便于被引用 */
write(
  'llms-full.txt',
  `# ${SITE_NAME} - Full Reference

> ${SITE_TAGLINE}

${posts
  .map(
    (p) => `## ${p.title}

URL: ${new URL(p.url, SITE).href}
Section: ${[p.category?.name, p.subcategory?.name].filter(Boolean).join(' / ')}
Published: ${p.iso}

${p.text.slice(0, 3000)}
`
  )
  .join('\n---\n\n')}
`
);

/* 每篇文章自动生成 OG 图（SVG：纯文本生成，中文不会乱码） */
for (const p of posts) {
  if (fs.existsSync(path.join(ROOT, 'public/og', `${p.slug}.png`))) continue;
  write(`og/${p.slug}.svg`, ogSvg(p));
}

/* ============================================================
 * 5. 完成 / 本地预览
 * ========================================================== */
const countFiles = (() => {
  let n = 0;
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.isDirectory()) walk(path.join(d, e.name));
      else n++;
    }
  };
  walk(DIST);
  return n;
})();

console.log(`\n构建完成：dist/ 共 ${countFiles} 个文件，${posts.length} 篇文章。`);
console.log(`站点地址：${SITE}（改 src/config/site.mjs 可换）\n`);

if (process.argv.includes('--serve')) {
  const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.txt': 'text/plain; charset=utf-8',
    '.xml': 'application/xml; charset=utf-8',
  };
  http
    .createServer((req, res) => {
      const url = decodeURIComponent(req.url.split('?')[0]);
      let file = path.join(DIST, url);
      if (!path.extname(file)) file = path.join(file, 'index.html');
      if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(DIST, '404.html');
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] ?? 'application/octet-stream' });
      fs.createReadStream(file).pipe(res);
    })
    .listen(4321, () => console.log('本地预览：http://localhost:4321'));
}
