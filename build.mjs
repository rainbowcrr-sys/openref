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
import { ASSET_V, layout, crumbsHtml, cardHtml, postRowHtml, prevNextHtml, badgeHtml, rssIconHtml } from './src/lib/html.mjs';
import { SITE, SITE_NAME, SITE_FULLNAME, SITE_TAGLINE, SITE_DESC, ORG_NAME, LANG, REPO, REPO_BRANCH, CONTENT_DIR } from './src/config/site.mjs';
import { taxonomy, getCategory, getSub } from './src/data/taxonomy.mjs';
import { feedListMarkdown, tagSlug, generateRss } from './scripts/gen-rss.mjs';
import { collectVersionGroups, versionBarHtml } from './src/lib/versions.mjs';

/* CJK 字符范围：常用汉字 + 扩展汉字 + 兼容汉字 + 日文假名。
   统一成常量，避免多处正则写法不一致导致统计偏差。 */
const CJK_RE = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff\u3040-\u30ff]/g;


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

/* 《使用 RSS 来订阅 OpenRef》里有一行 <!-- FEED_LIST -->，
   build 时替换成自动生成的五层地址清单，新增文章永不漏。 */
const FEED_LIST_MD = feedListMarkdown({ DOCS, SITE, taxonomy, tagSlugFn: tagSlug });

const VERSION_GROUPS = collectVersionGroups(DOCS);
const VERSION_FILE_IDS = new Set(VERSION_GROUPS.flatMap((g) => [...g.fileIds]));

const allPosts = walk(DOCS)
  .map(({ file, id }) => {
    const raw = fs.readFileSync(file, 'utf8');
    const { data, body } = parseFrontmatter(raw);
    if (data.draft === true) return null;
    const author = String(data.author ?? '').trim();
    /* 留空或 rainbowcrr-sys 都算官方；写了别的名字就是投稿 */
    const isOfficial = author === '' || author === 'rainbowcrr-sys';
    if (!data.pubDate) console.warn(`[build] 缺 pubDate：${id}，本次用今天日期（${today()}）`);
    const bodyResolved = body.includes('<!-- FEED_LIST -->')
      ? body.replace('<!-- FEED_LIST -->', FEED_LIST_MD)
      : body;
    const { html, headings, text } = renderMarkdown(bodyResolved);

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
      author,
      isOfficial,
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
  .filter(Boolean);

/* 版本组：组内 md 不单独成篇，合并成「目录名」一个页面；页面壳用 pubDate 最新那版 */
const posts = allPosts
  .filter((p) => !VERSION_FILE_IDS.has(p.id))
  .concat(VERSION_GROUPS.map((g) => g.post))
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
  const str = String(text);
  const cjk = (str.match(CJK_RE) || []).length;
  const en = (str.replace(CJK_RE, ' ').match(/[A-Za-z][\w'-]*/g) || []).length;
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

/* 首页统计：总字数与距今天数 */
const totalWords = posts.reduce((n, p) => n + p.words, 0);
const totalWordsK = totalWords >= 10000 ? `${(totalWords / 10000).toFixed(1)} 万字` : `${totalWords} 字`;
const daysAgo = (() => {
  if (!posts.length) return '—';
  const d = Math.floor((Date.now() - posts[0].pubDate.valueOf()) / 86400000);
  if (d <= 0) return '今天';
  if (d === 1) return '1 天前';
  if (d < 30) return `${d} 天前`;
  if (d < 365) return `${Math.floor(d / 30)} 个月前`;
  return `${Math.floor(d / 365)} 年前`;
})();

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
    <div class="stat-row">
      <div class="stat-item"><div class="stat-num">${posts.length}</div><div class="stat-label">条目</div></div>
      <div class="stat-item"><div class="stat-num">${groups.filter((g) => g.total > 0).length}</div><div class="stat-label">大类</div></div>
      <div class="stat-item"><div class="stat-num">${groups.reduce((n, g) => n + g.subs.length, 0)}</div><div class="stat-label">子类</div></div>
      <div class="stat-item"><div class="stat-num">${tags.length}</div><div class="stat-label">标签</div></div>
      <div class="stat-item"><div class="stat-num">${totalWordsK}</div><div class="stat-label">总字数</div></div>
      <div class="stat-item"><div class="stat-num">${posts.length ? posts[0].date : '—'}</div><div class="stat-label">最后更新</div></div>
      <div class="stat-item"><div class="stat-num">${daysAgo}</div><div class="stat-label">更新于</div></div>
    </div>
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
  /* 全站 og:image 统一指向 assets/icons/og-image.png（程序绘制，1200×630） */
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
    ? `<aside class="toc" id="toc"><div class="toc-title">本页内容<span class="toc-pct" id="read-pct">0%</span></div><ul>${p.headings
        .map((h) => `<li class="${h.depth === 3 ? 'h3' : ''}"><a href="#${escapeHtml(h.id)}">${escapeHtml(h.text)}</a></li>`)
        .join('')}</ul></aside>`
    : '';

  /* 手机端目录：同一个目录内容，折叠面板形式（<860px 显示，桌面隐藏） */
  const tocMobile = p.headings.length > 1
    ? `<nav class="toc-mobile" id="toc-mobile" aria-label="本页目录">
  <button class="toc-mobile-btn" type="button" id="toc-mobile-btn" aria-expanded="false" aria-controls="toc-mobile">
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/></svg>
    <span>本页目录</span>
    <span class="toc-mobile-count">${p.headings.length} 节</span>
    <span class="toc-mobile-pct"></span>
    <svg class="chev" viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"><path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>
  </button>
  <ul id="toc-mobile-list">${p.headings
    .map((h) => `<li class="${h.depth === 3 ? 'h3' : ''}"><a href="#${escapeHtml(h.id)}">${escapeHtml(h.text)}</a></li>`)
    .join('')}</ul>
</nav>`
    : '';

  /* 「编辑此页」：直接跳到 GitHub 上这篇源文件的编辑界面 */
  const editFile = p.versionGroup ? `${p.id}/${p.versionGroup.latest.file}` : `${p.id}.md`;
  const editUrl = `${REPO}/edit/${REPO_BRANCH}/${CONTENT_DIR}/${editFile}`;
  const editBtn = `<a class="edit-btn" href="${editUrl}" target="_blank" rel="noopener" title="在 GitHub 编辑此页" aria-label="在 GitHub 编辑此页">
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
      <path d="M3 21h4.2L19.4 8.8a2 2 0 0 0 0-2.8l-1.4-1.4a2 2 0 0 0-2.8 0L3 16.8V21z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/>
      <path d="M14.6 4.6l4.8 4.8" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/>
    </svg>
  </a>`;

  const body = `
<article class="article">
  <div class="wrap">
    ${crumbsHtml(crumbs)}
    <header class="article-header">
      <div class="title-row">
        <h1>${escapeHtml(p.title)}${badgeHtml(p)}</h1>
        <div class="title-actions">
          ${editBtn}
          <button class="print-btn" type="button" onclick="window.print()" aria-label="打印本页">打印</button>
        </div>
      </div>
      <p class="lede">${escapeHtml(p.description)}</p>
      <div class="meta">
        ${badgeHtml(p)}
        <time class="meta-updated" datetime="${p.updatedIso ?? p.iso}">更新于 ${p.updatedIso ?? p.date}</time>
        ${p.category ? `<a class="pill accent" href="/topics/${p.category.id}/">${escapeHtml(p.category.name)}</a>` : ''}
        ${p.subcategory ? `<a class="pill" href="/topics/${p.category.id}/${p.subId}/">${escapeHtml(p.subcategory.name)}</a>` : ''}
        <time datetime="${p.iso}">发布于 ${p.date}</time>
        <span class="read-time">约 ${p.words} 字 · ${p.minutes} 分钟</span>
        ${p.tags.map((t) => `<span class="pill">#${escapeHtml(t)}</span>`).join('')}
      </div>
    </header>
    ${p.versionGroup ? versionBarHtml(p.versionGroup) : ''}
    ${tocMobile}
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
    <div class="article-subs">
      <a href="/rss/rss.xml">${rssIconHtml(13)}订阅本站更新</a>
      <a href="${p.url}rss.xml">${rssIconHtml(13)}订阅本文更新</a>
      ${p.versionGroup ? `<a href="/rss/series/${escapeHtml(p.versionGroup.series)}/rss.xml">${rssIconHtml(13)}订阅本组全部版本</a>` : ''}
        <button type="button" class="cache-btn" data-cache-btn data-done="已缓存本文" data-label="缓存本文">
          <svg class="ci-download" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M12 3v12m0 0l-4-4m4 4l4-4M4 18v2h16v-2" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <svg class="ci-check" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M5 13l4 4L19 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <span class="cache-label">缓存本文</span>
        </button>
    </div>
    <div class="useful-wrap">
      <button class="useful-btn" id="useful-btn" type="button" data-id="${p.id}">
        <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path d="M7 10v11H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h3zM8 21h9.6a2 2 0 0 0 2-1.7l1.4-8A1.5 1.5 0 0 0 19.6 9.6H14l1-4.6A1.6 1.6 0 0 0 13.4 3L8 10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <span class="useful-label">有用</span>
        <span class="useful-count" id="useful-count">0</span>
      </button>
      <span class="useful-hint">觉得这篇帮到你了？点一下。</span>
    </div>
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
    <div class="meta mb-lg">${tags.map((t) => `<a class="pill" href="#tag-${escapeHtml(t.tag)}">#${escapeHtml(t.tag)} · ${t.count}</a>`).join('')}</div>
    ${tags
      .map(
        (t) => `<div class="tag-block" id="tag-${escapeHtml(t.tag)}">
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
    <div class="hot-words">
      <span class="hot-label">热门：</span>
      ${tags
        .slice()
        .sort((a, b) => b.count - a.count)
        .slice(0, 8)
        .map((t) => `<button class="hot-word" type="button" data-word="${escapeHtml(t.tag)}">${escapeHtml(t.tag)}</button>`)
        .join('')}
    </div>
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
      extraHead: '<script defer src="/assets/search.js?v=' + ASSET_V + '"></script>',
    })
  );
}

/* ---- 404 ---- */
{
  const recent = posts.slice(0, 5);
  const body = `
<section class="section">
  <div class="wrap">
    <div class="section-head">
      <h1>404 未找到页面</h1>
      <p>这个地址不存在，可能已经变更或被移除了。</p>
    </div>
    <div class="notfound-actions">
      <a class="btn primary" href="/">返回首页</a>
      <a class="btn" href="/topics/">浏览全部分类</a>
      <a class="btn" href="/search/">搜索内容</a>
    </div>
    ${recent.length ? `<h2 class="notfound-sub">或者看看最近的条目</h2>
    <ul class="plain-list">${recent.map((p) => `<li><a href="${p.url}">${escapeHtml(p.title)}</a></li>`).join('')}</ul>` : ''}
  </div>
</section>`;
  write('404.html', layout({ title: '404 未找到页面', description: '请求的地址不存在。', canonical: '/404.html', bodyHtml: body, noindex: true }));
}

/* ---- 独立页面（投稿 / 政策 / 法律）----
 * 放在 src/content/pages/ 下，目录位置就是 URL：
 *   pages/contribute/index.md        -> /contribute/
 *   pages/contribute/agreement.md    -> /contribute/agreement/
 *   pages/privacy/index.md           -> /privacy/
 *   pages/legal/copyright.md         -> /legal/copyright/
 * 这些页面不进文章列表、不进分类、不算 RSS，但会进 sitemap。
 */
const PAGES_DIR = path.join(ROOT, 'src/content/pages');
const standalone = walk(PAGES_DIR)
  .map(({ file, id }) => {
    const raw = fs.readFileSync(file, 'utf8');
    const { data, body } = parseFrontmatter(raw);
    if (data.draft === true) return null;
    const { html } = renderMarkdown(body);
    const parts = id.split('/');
    const slug = parts[parts.length - 1];
    const url = slug === 'index' ? `/${parts.slice(0, -1).join('/')}/` : `/${id}/`;
    const pubRaw = data.pubDate ? new Date(String(data.pubDate)) : null;
    const pubValid = pubRaw && !Number.isNaN(pubRaw.valueOf());
    const date = fmtDate(pubValid ? pubRaw : new Date(today()));
    return {
      id,
      url,
      title: String(data.title ?? slug),
      description: String(data.description ?? autoDescription(body, '')),
      date,
      html: colorize(html),
      order: Number(data.order ?? 99),
    };
  })
  .filter(Boolean)
  .sort((a, b) => a.order - b.order || a.url.localeCompare(b.url));

/* 投稿人名录：从 src/data/authors.json 读取，替换页面里的 <!--AUTHORS_LIST--> 占位 */
const authorsData = (() => {
  try {
    return JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/authors.json'), 'utf8'));
  } catch (e) {
    return { authors: [] };
  }
})();

function authorsListHtml() {
  const list = (authorsData.authors || []).filter((a) => (a.posts || []).length > 0);
  if (list.length === 0) {
    return `<div class="x-callout x-note"><div class="x-callout-label">暂无条目</div><div class="x-callout-body">目前还没有外部投稿人。第一条投稿发布后，在 <code>src/data/authors.json</code> 里加一条，此处会自动列出署名与条目链接。</div></div>`;
  }
  return `<ul class="author-list">${list
    .map(
      (a) => `<li class="author-item">
      <div class="author-name">${escapeHtml(a.name)}</div>
      <ul class="author-posts">${(a.posts || [])
        .map(
          (pp) =>
            `<li><a href="${escapeHtml(pp.url)}">${escapeHtml(pp.title)}</a><time datetime="${escapeHtml(
              pp.date
            )}">${escapeHtml(pp.date)}</time></li>`
        )
        .join('')}</ul>
    </li>`
    )
    .join('')}</ul>`;
}

for (const pg of standalone) {
  const body = `
<article class="article">
  <div class="wrap">
    <header class="article-header">
      <h1>${escapeHtml(pg.title)}</h1>
      <p class="lede">${escapeHtml(pg.description)}</p>
      <div class="meta"><span class="read-time">生效日期 ${pg.date}</span></div>
    </header>
    <div class="prose">${pg.html
      .replace('<p>%%AUTHORS_LIST%%</p>', authorsListHtml())
      .replace('%%AUTHORS_LIST%%', authorsListHtml())}</div>
  </div>
</article>`;
  write(
    `${pg.url.replace(/^\/|\/$/g, '')}/index.html`,
    layout({
      title: pg.title,
      description: pg.description,
      canonical: pg.url,
      ogType: 'article',
      bodyHtml: body,
      activePath: pg.url,
    })
  );
}

/* ============================================================
 * 4. 资源与 SEO 文件
 * ========================================================== */
fs.mkdirSync(path.join(DIST, 'assets'), { recursive: true });
fs.copyFileSync(path.join(ROOT, 'src/styles/global.css'), path.join(DIST, 'assets/global.css'));
for (const js of ['app.js', 'search.js', 'consent.js', 'cache.js', 'stats.js', 'version.js']) {
  fs.copyFileSync(path.join(ROOT, 'src/assets', js), path.join(DIST, 'assets', js));
}
if (fs.existsSync(path.join(ROOT, 'public'))) {
  fs.cpSync(path.join(ROOT, 'public'), DIST, { recursive: true });
}

/* ---- GitHub Pages 官方要求的文件 ---- */
// CNAME：从仓库根目录同步，Pages 从 /dist 发布时也必须带着它，自定义域才不会丢
const cnameSrc = path.join(ROOT, 'CNAME');
if (fs.existsSync(cnameSrc)) write('CNAME', fs.readFileSync(cnameSrc, 'utf8'));
// .nojekyll：跳过 Jekyll，避免 _ 开头文件被吞、Markdown 被二次渲染
write('.nojekyll', '');

/* 搜索索引 */
const index = [
  ...standalone.map((p) => ({
    t: p.title,
    d: p.description,
    u: p.url,
    c: '站点信息',
    s: '',
    g: [],
    b: p.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 1200),
  })),
  ...posts.map((p) => ({
  t: p.title,
  d: p.description,
  u: p.url,
  c: p.category?.name ?? '',
  s: p.subcategory?.name ?? '',
  g: p.tags,
  b: p.text.slice(0, 1200),
})),
];
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
  { loc: '/rss/', last: latestIso },
  { loc: '/rss/rss.xml', last: latestIso },
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
  ...standalone.map((p) => ({ loc: p.url, last: p.date })),
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

/* ============================================================
 * RSS 五层订阅 —— 全站 / 大类 / 子类 / 标签 / 单篇
 * 具体逻辑在 scripts/gen-rss.mjs，产物直接写进 dist/。
 * ========================================================== */
generateRss({
  posts,
  groups,
  tags,
  taxonomy,
  DIST,
  SITE,
  SITE_FULLNAME,
  SITE_DESC,
  DOCS,
  versionGroups: VERSION_GROUPS,
});

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

/* og:image 全站统一用 public/assets/icons/og-image.png（程序绘制）。
   旧的 per-article OG 图生成器保留在上方，暂不调用。 */

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
