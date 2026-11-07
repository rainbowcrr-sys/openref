/**
 * OpenRef RSS 生成器 —— 零依赖，纯原生拼 XML。
 *
 * 由 build.mjs 在页面全部生成之后调用一次，产物直接写进 dist/。
 * 订阅维度共五层：全站 / 大类 / 子类 / 标签 / 单篇。
 *
 * 约定（改这里之前先看 README / 偏好设置）：
 *  - 所有文件名、目录、地址一律 ASCII；页面与 feed 标题可以显示中文。
 *  - 同一篇文章在五层 feed 里的 guid 完全相同（都是文章绝对链接），
 *    这样读者同时订多份时阅读器能自动去重。
 *  - 有 updated 用 updated，没填用发布日期；按「当天 00:00 北京时间」
 *    换算成 RFC 822 GMT（即前一日 16:00:00 GMT）。
 */
import fs from 'node:fs';
import path from 'node:path';
import { parseFrontmatter, escapeHtml } from '../src/lib/md.mjs';
import { layout } from '../src/lib/html.mjs';

/* ============================================================
 * 1. 中文标签 → ASCII 路径
 *    内置常用拼音表 + unicode 码位兜底，保证路径全是 ASCII 且不重复。
 * ========================================================== */
const PINYIN = {
  数: 'shu', 据: 'ju', 库: 'ku', 异: 'yi', 步: 'bu', 性: 'xing',
  能: 'neng', 优: 'you', 化: 'hua', 缓: 'huan2', 存: 'cun3', 静: 'jing',
  态: 'tai', 资: 'zi', 源: 'yuan', 免: 'mian2', 费: 'fei', 额: 'e',
  度: 'du', 索: 'suo3', 引: 'yin', 抓: 'zhua', 取: 'qu', 前: 'qian',
  端: 'duan', 后: 'hou', 编: 'bian', 程: 'cheng', 云: 'yun', 原: 'yuan2',
  生: 'sheng', 基: 'ji', 础: 'chu', 设: 'she', 施: 'shi', 网: 'wang',
  络: 'luo', 协: 'xie', 议: 'yi2', 安: 'an', 全: 'quan', 工: 'gong',
  具: 'ju2', 链: 'lian', 测: 'ce', 试: 'shi4', 部: 'bu2', 署: 'shu2',
  运: 'yun2', 维: 'wei', 系: 'xi', 统: 'tong', 底: 'di', 层: 'ceng',
  并: 'bing', 发: 'fa', 操: 'cao', 作: 'zuo', 储: 'chu2', 内: 'nei',
  插: 'cha', 件: 'jian3', 主: 'zhu', 题: 'ti', 阅: 'yue', 读: 'du2',
  器: 'qi', 订: 'ding', 官: 'guan', 方: 'fang', 指: 'zhi3', 南: 'nan',
  动: 'dong', 公: 'gong2', 告: 'gao', 更: 'geng', 新: 'xin', 文: 'wen',
  章: 'zhang', 标: 'biao2', 签: 'qian', 分: 'fen', 类: 'lei', 页: 'ye',
  面: 'mian', 代: 'dai', 码: 'ma', 示: 'shi3', 例: 'li', 限: 'xian',
  制: 'zhi2', 排: 'pai', 版: 'ban2', 打: 'da', 印: 'yin', 搜: 'sou',
  投: 'tou', 稿: 'gao2', 隐: 'yin2', 私: 'si', 权: 'quan2', 中: 'zhong',
  间: 'jian2', 框: 'kuang', 架: 'jia', 边: 'bian2', 缘: 'yuan3', 计: 'ji2',
  算: 'suan', 请: 'qing', 求: 'qiu2', 响: 'xiang', 应: 'ying', 头: 'tou2',
  冲: 'chong', 队: 'dui', 列: 'lie', 错: 'cuo', 误: 'wu', 调: 'diao',
  监: 'jian4', 控: 'kong', 日: 'ri', 志: 'zhi3', 加: 'jia2', 载: 'zai',
  渲: 'xuan', 染: 'ran', 可: 'ke', 用: 'yong2', 访: 'fang2', 问: 'wen2',
  速: 'su', 率: 'lv', 对: 'dui2', 象: 'xiang2', 表: 'biao3', 字: 'zi2',
  段: 'duan2', 行: 'hang', 扫: 'sao', 描: 'miao2', 配: 'pei', 置: 'zhi4',
  迁: 'qian2', 移: 'yi3',
  收: 'shou', 录: 'lu', 站: 'zhan', 点: 'dian', 地: 'di2', 图: 'tu',
  结: 'jie', 构: 'gou', 托: 'tuo', 管: 'guan2', 化: 'hua2', 式: 'shi5',
};

/** 中文/非 ASCII 标签转成全 ASCII 短横路径；兜底用 unicode 码位，绝不重复 */
export function tagSlug(tag) {
  const s = String(tag).trim();
  const segs = [];
  let buf = '';
  const flush = () => {
    if (buf) {
      segs.push(buf.toLowerCase());
      buf = '';
    }
  };
  for (const ch of s) {
    const code = ch.codePointAt(0);
    if (code < 128 && /[A-Za-z0-9]/.test(ch)) {
      buf += ch;
      continue;
    }
    flush();
    if (code < 128) continue; // 空格、点、斜杠等只当分隔符
    const py = PINYIN[ch];
    segs.push(py ? py.replace(/\d+$/, '') : 'u' + code.toString(16));
  }
  flush();
  const slug = segs.join('-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  return slug || 'tag';
}

/* ============================================================
 * 2. 时间
 * ========================================================== */
/** YYYY-MM-DD → RFC 822 GMT（当天 00:00 北京时间 = 前一日 16:00 GMT） */
function rfc822(dateStr) {
  const d = new Date(`${dateStr}T00:00:00+08:00`);
  return Number.isNaN(d.valueOf()) ? new Date().toUTCString() : d.toUTCString();
}

/* ============================================================
 * 3. 徽章（内联 style 写死，阅读器 / 无 CSS 环境都不变形）
 * ========================================================== */
export function badgeInlineHtml(post) {
  const official = post.isOfficial !== false;
  const bg = official ? '#0071e3' : '#6b7280';
  const text = official ? 'OpenRef OFFICIAL' : '投稿';
  return `<p style="margin:0 0 14px"><span style="display:inline-block;background:${bg};color:#ffffff;font:600 12px/1.7 Arial,Helvetica,sans-serif;padding:2px 10px;border-radius:999px;letter-spacing:.02em">${text}</span></p>`;
}

/* ============================================================
 * 4. feed XML
 * ========================================================== */
function cdata(html) {
  return `<![CDATA[${String(html).replace(/\]\]>/g, ']]]]><![CDATA[>')}]]>`;
}

function itemXml(p, SITE) {
  const link = new URL(p.url, SITE).href;
  const guid = p.guid ? new URL(p.guid, SITE).href : link;
  const dateStr = p.updatedIso ?? p.iso ?? p.date;
  const tocHtml = (p.headings || []).length
    ? `<nav class="feed-toc"><strong>本页内容</strong><ul>${p.headings
        .map((h) => `<li><a href="${link}#${escapeHtml(h.id)}">${escapeHtml(h.text)}</a></li>`)
        .join('')}</ul></nav>`
    : '';
  const full = badgeInlineHtml(p) + tocHtml + `<div class="feed-content">${p.html}</div>`;
  const cats = [
    p.category ? `<category>${escapeHtml(p.category.name)}</category>` : '',
    p.subcategory ? `<category>${escapeHtml(p.subcategory.name)}</category>` : '',
    ...(p.tags || []).map((t) => `<category>${escapeHtml(t)}</category>`),
  ].filter(Boolean);

  return `    <item>
      <title>${escapeHtml(p.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="${p.guid ? 'false' : 'true'}">${guid}</guid>
      <pubDate>${rfc822(dateStr)}</pubDate>
      <description>${escapeHtml(p.description)}</description>
      ${cats.join('\n      ')}
      <content:encoded>${cdata(full)}</content:encoded>
      <openref:badge>${p.isOfficial === false ? 'contribution' : 'official'}</openref:badge>
    </item>`;
}

function feedXml({ title, desc, linkPath, selfPath, list, SITE, SITE_FULLNAME }) {
  const xsl = new URL('/rss/rss.xsl', SITE).href;
  const imageUrl = new URL('/rss/rss-icon.png', SITE).href;
  const self = new URL(selfPath, SITE).href;
  const channelLink = new URL(linkPath, SITE).href;
  return `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="${xsl}"?>
<rss version="2.0"
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:openref="https://openref.de5.net/ns/rss/1.0">
  <channel>
    <title>${escapeHtml(title)}</title>
    <link>${channelLink}</link>
    <description>${escapeHtml(desc)}</description>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <copyright>© ${new Date().getFullYear()} rainbowcrr-sys / OpenRef</copyright>
    <managingEditor>rainbowcrr-sys</managingEditor>
    <webMaster></webMaster>
    <atom:link href="${self}" rel="self" type="application/rss+xml" />
    <image>
      <url>${imageUrl}</url>
      <title>${escapeHtml(SITE_FULLNAME)}</title>
      <link>${channelLink}</link>
      <width>144</width>
      <height>144</height>
    </image>
${list.map((p) => itemXml(p, SITE)).join('\n')}
  </channel>
</rss>`;
}

/* ============================================================
 * 5. OPML（五层分组，单篇一个不漏）
 * ========================================================== */
function opmlXml({ groups, tags, posts, tagSlugFn, SITE, series = [] }) {
  const abs = (p) => new URL(p, SITE).href;
  const outline = (text, xmlUrl, htmlUrl) =>
    `      <outline type="rss" text="${escapeHtml(text)}" title="${escapeHtml(text)}" xmlUrl="${escapeHtml(abs(xmlUrl))}" htmlUrl="${escapeHtml(abs(htmlUrl))}" />`;
  const group = (name, items) =>
    `    <outline text="${escapeHtml(name)}" title="${escapeHtml(name)}">\n${items.join('\n')}\n    </outline>`;

  const all = [group('全站', [outline('OpenRef 全站', '/rss/rss.xml', '/')])];

  const cats = groups
    .filter((g) => g.total > 0)
    .map((g) => outline(`OpenRef · ${g.category.name}`, `/rss/topics/${g.category.id}/rss.xml`, `/topics/${g.category.id}/`));
  all.push(group('大类', cats));

  const subs = [];
  for (const g of groups.filter((x) => x.total > 0)) {
    for (const s of g.subs) {
      subs.push(
        outline(
          `OpenRef · ${g.category.name} / ${s.sub.name}`,
          `/rss/topics/${g.category.id}/${s.sub.id}/rss.xml`,
          `/topics/${g.category.id}/${s.sub.id}/`
        )
      );
    }
  }
  all.push(group('子类', subs));

  all.push(
    group(
      '标签',
      tags.map((t) =>
        outline(`OpenRef · #${t.tag}`, `/rss/tags/${tagSlugFn(t.tag)}/rss.xml`, `/tags/`)
      )
    )
  );

  if (series.length) {
    all.push(
      group(
        '版本组',
        series.map((s) => outline(s.name, `/rss/series/${s.series}/rss.xml`, `/docs/${s.id}/`))
      )
    );
  }

  all.push(
    group(
      '单篇',
      posts.map((p) => outline(`OpenRef · ${p.title}`, `/docs/${p.id}/rss.xml`, p.url))
    )
  );

  return `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>OpenRef 订阅列表</title>
    <dateCreated>${new Date().toUTCString()}</dateCreated>
    <ownerName>rainbowcrr-sys</ownerName>
  </head>
  <body>
${all.join('\n')}
  </body>
</opml>`;
}

/* ============================================================
 * 6. rss.xsl —— 浏览器打开 xml 时的友好页面（跟站点同款）
 * ========================================================== */
function xslXml(SITE) {
  const rssIcon = new URL('/rss/rss-icon.png', SITE).href;
  const home = new URL('/', SITE).href;
  return `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:openref="https://openref.de5.net/ns/rss/1.0"
  exclude-result-prefixes="atom content openref">
  <xsl:output method="html" encoding="UTF-8" indent="yes" />
  <xsl:template match="/">
    <html lang="zh-CN">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title><xsl:value-of select="/rss/channel/title" /></title>
      <style>
        :root { color-scheme: light dark; }
        body { margin:0; background:#f5f5f7; color:#1d1d1f;
               font:16px/1.7 -apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif; }
        .wrap { max-width:780px; margin:0 auto; padding:32px 20px 60px; }
        .top { display:flex; align-items:center; gap:14px; border-bottom:1px solid #d2d2d7; padding-bottom:20px; }
        .top img { width:44px; height:44px; border-radius:10px; flex:0 0 auto; }
        h1 { font-size:24px; margin:0; }
        .hint { margin:18px 0 26px; padding:14px 16px; border-radius:12px;
                background:#fff; border:1px solid #d2d2d7; font-size:14px; }
        .hint code { background:#f0f0f2; padding:2px 6px; border-radius:5px; word-break:break-all; }
        .item { background:#fff; border:1px solid #d2d2d7; border-radius:14px;
                padding:18px 20px; margin-bottom:14px; }
        .item h2 { font-size:18px; margin:0 0 8px; }
        .item h2 a { color:#0071e3; text-decoration:none; }
        .item h2 a:hover { text-decoration:underline; }
        .meta { font-size:13px; color:#6e6e73; margin:0 0 10px; }
        .item p { margin:0; }
        .badge { display:inline-block; color:#fff; font-size:11px; font-weight:600;
                 padding:2px 9px; border-radius:999px; vertical-align:middle; margin-left:8px; }
        .badge-official { background:#0071e3; }
        .badge-contribution { background:#6b7280; }
        footer { margin-top:30px; font-size:13px; color:#6e6e73; }
        footer a { color:#0071e3; }
        @media (prefers-color-scheme: dark) {
          body { background:#000; color:#f5f5f7; }
          .hint, .item { background:#1c1c1e; border-color:#38383a; }
          .hint code { background:#2c2c2e; }
          .meta, footer { color:#98989d; }
        }
      </style>
    </head>
    <body>
      <div class="wrap">
        <div class="top">
          <img src="${rssIcon}" alt="RSS" />
          <div>
            <h1><xsl:value-of select="/rss/channel/title" /></h1>
            <div class="meta"><xsl:value-of select="/rss/channel/description" /></div>
          </div>
        </div>
        <div class="hint">
          这是一个 <strong>RSS 订阅源</strong>，不是普通网页。把地址栏里的地址
          <code><xsl:value-of select="/rss/channel/atom:link[@rel='self']/@href" /></code>
          复制到任意 RSS 阅读器即可订阅；阅读器会自动读取里面的文章。
        </div>
        <xsl:for-each select="/rss/channel/item">
          <div class="item">
            <h2>
              <a href="{link}"><xsl:value-of select="title" /></a>
              <xsl:if test="openref:badge='official'"><span class="badge badge-official">OpenRef OFFICIAL</span></xsl:if>
              <xsl:if test="openref:badge='contribution'"><span class="badge badge-contribution">投稿</span></xsl:if>
            </h2>
            <div class="meta"><xsl:value-of select="pubDate" /></div>
            <p><xsl:value-of select="description" /></p>
          </div>
        </xsl:for-each>
        <footer><a href="${home}">返回 OpenRef 首页</a> · <a href="${new URL('/rss/', SITE).href}">查看全部订阅地址</a></footer>
      </div>
    </body>
    </html>
  </xsl:template>
</xsl:stylesheet>`;
}

/* ============================================================
 * 7. 地址清单（Markdown 版，注入到《使用 RSS 来订阅 OpenRef》里）
 *    自己扫一遍 docs，不依赖 build.mjs 的 posts，避免循环依赖。
 * ========================================================== */
function scanDocs(DOCS) {
  const out = [];
  const series = [];
  const walk = (dir, base = '') => {
    if (!fs.existsSync(dir)) return;
    /* 目录里有 meta.json = 版本组：组内 md 不单独成篇，只登记组页 */
    const hasMeta = fs.existsSync(path.join(dir, 'meta.json'));
    for (const name of fs.readdirSync(dir)) {
      const p = path.join(dir, name);
      const rel = base ? `${base}/${name}` : name;
      if (fs.statSync(p).isDirectory()) walk(p, rel);
      else if (name === 'meta.json') {
        let meta = {};
        try { meta = JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) {}
        const parts = base.split('/');
        const label = String(meta.group || parts[parts.length - 1]);
        series.push({ id: base, name: label, series: parts[parts.length - 1] });
        out.push({
          id: base,
          title: label,
          categoryId: parts[0],
          subId: parts.length >= 3 ? parts[1] : undefined,
          tags: [],
        });
      } else if (name.endsWith('.md') && !hasMeta) {
        const { data } = parseFrontmatter(fs.readFileSync(p, 'utf8'));
        if (data.draft === true) continue;
        const parts = rel.replace(/\.md$/, '').split('/');
        out.push({
          id: rel.replace(/\.md$/, ''),
          title: String(data.title ?? parts[parts.length - 1]),
          categoryId: data.category ?? parts[0],
          subId: data.subcategory ?? (parts.length >= 3 ? parts[1] : undefined),
          tags: Array.isArray(data.tags) ? data.tags : [],
        });
      }
    }
  };
  walk(DOCS);
  return { docs: out, series };
}

export function feedListMarkdown({ DOCS, SITE, taxonomy, tagSlugFn }) {
  const { docs, series } = scanDocs(DOCS);
  const abs = (p) => new URL(p, SITE).href;
  const line = (label, url) => `- **${label}**　\`${abs(url)}\``;
  const rows = [];

  rows.push('### 全站\n');
  rows.push(line('全站订阅（最常用）', '/rss/rss.xml') + '\n');
  rows.push(line('全站备用地址', '/rss/feed.xml') + '\n');
  rows.push('### OPML 一键导入\n');
  rows.push(line('全部订阅地址清单', '/rss/opml.xml') + '\n');

  rows.push('### 按大类\n');
  for (const cat of taxonomy) {
    if (!docs.some((d) => d.categoryId === cat.id)) continue;
    rows.push(line(cat.name, `/rss/topics/${cat.id}/rss.xml`));
  }
  rows.push('\n### 按子类\n');
  for (const cat of taxonomy) {
    for (const sub of cat.children) {
      if (!docs.some((d) => d.categoryId === cat.id && d.subId === sub.id)) continue;
      rows.push(line(`${cat.name} / ${sub.name}`, `/rss/topics/${cat.id}/${sub.id}/rss.xml`));
    }
  }
  rows.push('\n### 按标签\n');
  const tagSet = new Map();
  for (const d of docs) for (const t of d.tags) tagSet.set(t, (tagSet.get(t) ?? 0) + 1);
  for (const t of [...tagSet.keys()].sort()) {
    rows.push(line(`#${t}`, `/rss/tags/${tagSlugFn(t)}/rss.xml`));
  }

  if (series.length) {
    rows.push('\n### 按版本组（同一篇文档的新旧环境版本）\n');
    for (const s of series) rows.push(line(s.name, `/rss/series/${s.series}/rss.xml`));
    rows.push('\n> 订阅版本组后，这个文档新增版本（例如以后出 Node 24）会推送新条目；旧版文章始终保留，不删。\n');
  }

  rows.push('\n### 按单篇（每篇一个，一篇不漏）\n');
  for (const d of docs) {
    rows.push(line(d.title, `/docs/${d.id}/rss.xml`));
  }
  rows.push('\n> 单篇订阅的规律：文章地址后面加 `rss.xml`。例如本文就是 `/docs/official/guide/rss-subscribe/rss.xml`。\n');
  return rows.join('\n');
}

/* ============================================================
 * 8. /rss/ 落地页（跟站点同款，五组带标题，单篇折叠）
 * ========================================================== */
function landingHtml({ posts, groups, tags, taxonomy, SITE, tagSlugFn, series = [] }) {
  const abs = (p) => new URL(p, SITE).href;
  const li = (label, url, extra = '') =>
    `<li><a href="${escapeHtml(url)}">${escapeHtml(label)}</a><code>${escapeHtml(url)}</code>${extra}</li>`;
  const section = (id, title, intro, items) => `
    <section class="section rss-section" id="${id}">
      <div class="wrap">
        <div class="section-head"><h2>${escapeHtml(title)}</h2><p>${escapeHtml(intro)}</p></div>
        <ul class="rss-list">${items.join('\n')}</ul>
      </div>
    </section>`;

  const catItems = taxonomy
    .filter((c) => posts.some((p) => p.categoryId === c.id))
    .map((c) => li(c.name, abs(`/rss/topics/${c.id}/rss.xml`)));
  const subItems = [];
  for (const g of groups.filter((x) => x.total > 0)) {
    for (const s of g.subs) {
      subItems.push(li(`${g.category.name} / ${s.sub.name}`, abs(`/rss/topics/${g.category.id}/${s.sub.id}/rss.xml`)));
    }
  }
  const tagItems = tags.map((t) => li(`#${t.tag}`, abs(`/rss/tags/${tagSlugFn(t.tag)}/rss.xml`)));
  const articleItems = posts.map((p) => li(p.title, abs(`/docs/${p.id}/rss.xml`)));

  const body = `
<section class="section">
  <div class="wrap">
    <div class="rss-hero">
      <img src="/assets/icons/rss-icon.png" width="44" height="44" alt="RSS" />
      <div>
        <h1>订阅 OpenRef</h1>
        <p>复制任意一条地址，粘贴到 RSS 阅读器即可。粒度：全站、大类、子类、标签、单篇，以及同一文档的版本组。</p>
        <button type="button" class="cache-btn" data-cache-btn data-done="已缓存本页" data-label="缓存本页">
          <svg class="ci-download" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M12 3v12m0 0l-4-4m4 4l4-4M4 18v2h16v-2" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <svg class="ci-check" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M5 13l4 4L19 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <span class="cache-label">缓存本页</span>
        </button>
      </div>
    </div>
  </div>
</section>
${section('all', '全站', '最常用的一份。备用地址内容完全相同。', [
  li('全站订阅', abs('/rss/rss.xml')),
  li('备用地址', abs('/rss/feed.xml')),
  li('OPML 一键导入全部', abs('/rss/opml.xml')),
])}
${section('categories', '按大类', '只想看某个主题时用。', catItems)}
${section('subs', '按子类', '更细一层，例如 Cloudflare、SEO。', subItems)}
${section('tags', '按标签', '按关键词跨分类聚合。', tagItems)}
${series.length ? section('series', '按版本组', '同一篇文档的新旧环境版本都收；出新版本会推送，旧版不删。',
    series.map((s) => li(s.name, abs(`/rss/series/${s.series}/rss.xml`)))) : ''}
<section class="section rss-section" id="articles">
  <div class="wrap">
    <div class="section-head"><h2>按单篇</h2><p>订阅后只收这一篇的更新；点开查看全部地址。</p></div>
    <details class="rss-fold"><summary>展开全部单篇订阅地址（${posts.length} 篇）</summary>
      <ul class="rss-list">${articleItems.join('\n')}</ul>
    </details>
  </div>
</section>
<section class="section">
  <div class="wrap"><p>使用说明见 <a href="/docs/official/guide/rss-subscribe/">《使用 RSS 来订阅 OpenRef》</a>。</p></div>
</section>`;

  return layout({
    title: '订阅 OpenRef',
    description: '全站 / 大类 / 子类 / 标签 / 单篇五层 RSS 订阅地址清单。',
    canonical: '/rss/',
    bodyHtml: body,
    activePath: '/rss/',
  });
}

/* ============================================================
 * 9. 主入口
 * ========================================================== */
export function generateRss({ posts, groups, tags, taxonomy, DIST, SITE, SITE_FULLNAME, SITE_DESC, DOCS, versionGroups = [] }) {
  const tagSlugFn = tagSlug;
  const { series } = scanDocs(DOCS);
  const write = (rel, content) => {
    const target = path.join(DIST, rel);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content, 'utf8');
  };
  const mk = (title, desc, linkPath, selfPath, list) =>
    feedXml({ title, desc, linkPath, selfPath, list, SITE, SITE_FULLNAME });

  /* 9.1 全站：全部文章一篇不漏；feed.xml 内容完全相同；根 /rss.xml 兼容旧地址 */
  const allFeed = mk(SITE_FULLNAME, SITE_DESC, '/', '/rss/rss.xml', posts);
  write('rss/rss.xml', allFeed);
  write('rss/feed.xml', allFeed);
  write('rss.xml', allFeed);

  /* 9.2 大类 + 子类 */
  for (const g of groups.filter((x) => x.total > 0)) {
    const catList = posts.filter((p) => p.categoryId === g.category.id);
    write(
      `rss/topics/${g.category.id}/rss.xml`,
      mk(
        `OpenRef · ${g.category.name}`,
        `${g.category.desc} 共 ${catList.length} 篇。`,
        `/topics/${g.category.id}/`,
        `/rss/topics/${g.category.id}/rss.xml`,
        catList
      )
    );
    for (const s of g.subs) {
      write(
        `rss/topics/${g.category.id}/${s.sub.id}/rss.xml`,
        mk(
          `OpenRef · ${g.category.name} / ${s.sub.name}`,
          `${s.sub.desc} 共 ${s.posts.length} 篇。`,
          `/topics/${g.category.id}/${s.sub.id}/`,
          `/rss/topics/${g.category.id}/${s.sub.id}/rss.xml`,
          s.posts
        )
      );
    }
  }

  /* 9.3 标签 */
  for (const t of tags) {
    const slug = tagSlugFn(t.tag);
    const list = posts.filter((p) => (p.tags || []).includes(t.tag));
    write(
      `rss/tags/${slug}/rss.xml`,
      mk(
        `OpenRef · #${t.tag}`,
        `标签 #${t.tag} 下的全部条目，共 ${list.length} 篇。`,
        '/tags/',
        `/rss/tags/${slug}/rss.xml`,
        list
      )
    );
  }

  /* 9.4 单篇：贴着文章同路径，永远只这一篇 */
  for (const p of posts) {
    write(
      `docs/${p.id}/rss.xml`,
      mk(
        `OpenRef · ${p.title}`,
        p.description,
        p.url,
        `/docs/${p.id}/rss.xml`,
        [p]
      )
    );
  }

  /* 9.5 版本组：一份 feed 收齐同一文档的所有环境版本，新增版本会推新条目 */
  for (const g of versionGroups) {
    const sid = g.id.split('/').pop();
    const list = g.items.map((it) => ({
      url: g.post.url,
      guid: `${g.post.url}#${it.file}`,
      title: `${g.name} · ${it.version}`,
      description: `${it.env} · 发布于 ${it.iso}`,
      iso: it.iso,
      date: it.iso,
      updatedIso: null,
      headings: it.headings,
      html: it.html,
      tags: it.tags,
      isOfficial: it.isOfficial,
    }));
    write(
      `rss/series/${sid}/rss.xml`,
      mk(
        `OpenRef · ${g.name}（全部版本）`,
        `同一文档的 ${g.items.length} 个环境版本，旧版始终保留。`,
        `/docs/${g.id}/`,
        `/rss/series/${sid}/rss.xml`,
        list
      )
    );
  }

  /* 9.6 OPML / XSL / 落地页 / 橙标 PNG */
  write('rss/opml.xml', opmlXml({ groups, tags, posts, tagSlugFn, SITE, series }));
  write('rss/rss.xsl', xslXml(SITE));
  write('rss/index.html', landingHtml({ posts, groups, tags, taxonomy, SITE, tagSlugFn, series }));

  const iconSrc = path.join(path.dirname(DIST), 'public', 'assets', 'icons', 'rss-icon.png');
  if (fs.existsSync(iconSrc)) {
    fs.mkdirSync(path.join(DIST, 'rss'), { recursive: true });
    fs.copyFileSync(iconSrc, path.join(DIST, 'rss', 'rss-icon.png'));
  }

  const n = 1 + 1 + 1 + groups.filter((g) => g.total > 0).length +
    groups.filter((g) => g.total > 0).reduce((a, g) => a + g.subs.length, 0) +
    tags.length + posts.length + 3 + versionGroups.length;
  console.log(`RSS：已生成 ${n} 个文件（全站 / 大类 / 子类 / 标签 / 单篇 / OPML / XSL / 落地页）。`);
}
