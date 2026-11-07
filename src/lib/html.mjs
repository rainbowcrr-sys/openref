import { SITE, SITE_NAME, SITE_FULLNAME, LANG, ORG_NAME, fullTitle } from '../config/site.mjs';
import { escapeHtml } from './md.mjs';

/** 静态资源版本：改动 CSS/JS 时递增，强制绕过浏览器与 SW 旧缓存 */
export const ASSET_V = '4';

export const NAV = [
  { label: '分类', href: '/topics/' },
  { label: '文章', href: '/latest/' },
  { label: '标签', href: '/tags/' },
  { label: '搜索', href: '/search/' },
  { label: '投稿', href: '/contribute/' },
];

/** 全球通用官方橙 RSS 标：固定橙色，不随深浅色变化 */
export const RSS_ICON = '/assets/icons/rss-icon.png';
export const rssIconHtml = (size = 15) =>
  `<img class="rss-icon" src="${RSS_ICON}" width="${size}" height="${size}" alt="" aria-hidden="true" />`;

/**
 * 官方 / 投稿徽章。author 留空或 rainbowcrr-sys = 官方，其余 = 投稿。
 * 深色由 CSS 变量调色，打印时保留。
 */
export function badgeHtml(post) {
  const official = post?.isOfficial !== false;
  return official
    ? '<span class="badge badge-official">OpenRef OFFICIAL</span>'
    : '<span class="badge badge-contribution">投稿</span>';
}

/** 页脚政策链接（每个页面都显示，利于信任信号与合规） */
export const POLICY_LINKS = [
  { label: '投稿', href: '/contribute/' },
  { label: '投稿协议', href: '/contribute/agreement/' },
  { label: '隐私政策', href: '/privacy/' },
  { label: '版权与免责', href: '/legal/copyright/' },
];

export const GITHUB_REPO = 'https://github.com/rainbowcrr-sys/openref';

export function layout({
  title,
  description = '按主题分组的技术参考手册：条目式写作，讲清一件事，给出可直接运行的代码与明确限制。',
  canonical = '/',
  ogType = 'website',
  jsonLd = null,
  noindex = false,
  bodyHtml = '',
  extraHead = '',
  activePath = '/',
  ogImage = null,
}) {
  const pageTitle = fullTitle(title);
  const url = new URL(canonical, SITE).href;
  /* 全站统一默认分享图：assets/icons/og-image.png（程序绘制，1200×630） */
  const image = ogImage ? new URL(ogImage, SITE).href : new URL('/assets/icons/og-image.png', SITE).href;

  const websiteLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_FULLNAME,
    url: SITE,
    inLanguage: LANG,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE}/search/?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
  const ldList = jsonLd ? [websiteLd, ...(Array.isArray(jsonLd) ? jsonLd : [jsonLd])] : [websiteLd];

  return `<!doctype html>
<html lang="${LANG}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(pageTitle)}</title>
<meta name="description" content="${escapeHtml(description)}" />
<link rel="canonical" href="${url}" />
<link rel="icon" href="/favicon.ico" sizes="16x16 32x32 48x48" />
<link rel="icon" href="/assets/icons/favicon.svg" type="image/svg+xml" />
<link rel="icon" href="/assets/icons/icon-512.png" sizes="512x512" />
<link rel="apple-touch-icon" href="/assets/icons/apple-touch-icon.png" />
<meta name="theme-color" content="#0071e3" media="(prefers-color-scheme: light)" />
<meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)" />
${noindex ? '<meta name="robots" content="noindex,nofollow" />' : ''}
<link rel="alternate" type="application/rss+xml" title="${SITE_NAME}" href="/rss/rss.xml" />
<meta property="og:site_name" content="${escapeHtml(SITE_FULLNAME)}" />
<meta property="og:type" content="${ogType}" />
<meta property="og:title" content="${escapeHtml(title ?? SITE_FULLNAME)}" />
<meta property="og:description" content="${escapeHtml(description)}" />
<meta property="og:url" content="${url}" />
<meta property="og:image" content="${image}" />
<meta property="og:locale" content="zh_CN" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escapeHtml(title ?? SITE_FULLNAME)}" />
<meta name="twitter:description" content="${escapeHtml(description)}" />
<meta name="twitter:image" content="${image}" />
<link rel="stylesheet" href="/assets/global.css?v=${ASSET_V}" />
<script is:inline>try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme:dark)').matches))document.documentElement.dataset.theme='dark'}catch(e){}</script>
${ldList.map((ld) => `<script type="application/ld+json">${JSON.stringify(ld)}</script>`).join('\n')}
${extraHead}
</head>
<body>
<div class="progress" id="progress" aria-hidden="true"></div>
<header class="site-header">
  <div class="wrap">
    <a class="brand" href="/">${escapeHtml(SITE_NAME)}</a>
    <nav class="nav" aria-label="主导航">
      ${NAV.map(
        (l) =>
          `<a href="${l.href}"${
            activePath === l.href || activePath.startsWith(l.href) ? ' aria-current="page"' : ''
          }>${l.label}</a>`
      ).join('')}
      <a class="nav-subscribe" href="/rss/rss.xml" title="订阅本站更新">${rssIconHtml(14)}<span>订阅</span></a>
      <button class="theme-toggle" id="theme-toggle" type="button" aria-label="切换深浅色" title="切换深浅色">
        <svg class="icon-sun" viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
          <circle cx="12" cy="12" r="4.2" fill="currentColor"/>
          <g stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
            <path d="M12 2.4v2.2M12 19.4v2.2M2.4 12h2.2M19.4 12h2.2"/>
            <path d="M5.2 5.2l1.6 1.6M17.2 17.2l1.6 1.6M18.8 5.2l-1.6 1.6M6.8 17.2l-1.6 1.6"/>
          </g>
        </svg>
        <svg class="icon-moon" viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
          <path d="M20.5 14.3A8.6 8.6 0 1 1 9.7 3.5a7 7 0 0 0 10.8 10.8z" fill="currentColor"/>
        </svg>
      </button>
    </nav>
  </div>
</header>
<main>
${bodyHtml}
</main>
<footer class="site-footer">
  <div class="wrap">
    <div>
      <strong>${escapeHtml(SITE_FULLNAME)}</strong>
      <div class="mt">条目式技术参考 · 内容可自由引用</div>
    </div>
    <div class="right">
      <div class="footer-sub">
        <a href="/rss/rss.xml">${rssIconHtml(13)}全站 RSS</a>
        <a href="/rss/opml.xml">${rssIconHtml(13)}OPML 一键导入全部</a>
        <a href="/rss/">${rssIconHtml(13)}全部订阅地址</a>
        <button type="button" class="cache-btn" data-cache-btn data-done="已缓存本页" data-label="缓存本页">
          <svg class="ci-download" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M12 3v12m0 0l-4-4m4 4l4-4M4 18v2h16v-2" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <svg class="ci-check" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M5 13l4 4L19 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <span class="cache-label">缓存本页</span>
        </button>
      </div>
      <div class="mt"><a href="/sitemap.xml">Sitemap</a> · <a href="/llms.txt">LLMs</a> · <a href="https://status.openref.de5.net">服务状态</a></div>
      <div class="mt"><span class="cache-count">尚未缓存文章</span></div>
      <div class="mt">© ${new Date().getFullYear()} ${escapeHtml(ORG_NAME)}</div>
    </div>
  </div>
  <div class="wrap footer-policy">
    ${POLICY_LINKS.map((l) => `<a href="${l.href}">${l.label}</a>`).join('<span class="sep">·</span>')}
    <span class="sep">·</span>
    <a href="${GITHUB_REPO}" target="_blank" rel="noopener">站点开源</a>
  </div>
</footer>

<script defer src="/assets/app.js?v=${ASSET_V}"></script>
<script defer src="/assets/cache.js?v=${ASSET_V}"></script>
<script defer src="/assets/version.js?v=${ASSET_V}"></script>
<script>
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function (rs) {
    rs.forEach(function (r) { r.update().catch(function () {}); });
  }).catch(function () {});
}
</script>
</body>
</html>
`;
}

export function crumbsHtml(items) {
  return `<nav class="crumbs" aria-label="面包屑">${items
    .map((c, i) => `${i > 0 ? '<span>/</span>' : ''}<a href="${c.href}">${escapeHtml(c.label)}</a>`)
    .join('')}</nav>`;
}

export function cardHtml(post, tax) {
  return `<article class="card">
  ${
    tax.category
      ? `<div class="meta mb"><a class="pill" href="/topics/${tax.categoryId}/">${escapeHtml(
          tax.category.name
        )}</a>${
          tax.subcategory
            ? `<a class="pill" href="/topics/${tax.categoryId}/${tax.subId}/">${escapeHtml(
                tax.subcategory.name
              )}</a>`
            : ''
        }</div>`
      : ''
  }
  <h3><a href="${post.url}">${escapeHtml(post.title)}</a>${badgeHtml(post)}</h3>
  <p>${escapeHtml(post.description)}</p>
  <div class="meta"><time datetime="${post.iso}">${post.date}</time>${(post.tags || [])
    .slice(0, 3)
    .map((t) => `<span class="pill">#${escapeHtml(t)}</span>`)
    .join('')}</div>
</article>`;
}

export function postRowHtml(post, tax) {
  return `<li><a class="post-row" href="${post.url}">
  <div>
    <h3>${escapeHtml(post.title)}${badgeHtml(post)}</h3>
    <p>${escapeHtml(post.description)}</p>
    ${
      tax.category
        ? `<div class="meta mt"><span class="pill">${escapeHtml(tax.category.name)}</span>${
            tax.subcategory ? `<span class="pill">${escapeHtml(tax.subcategory.name)}</span>` : ''
          }</div>`
        : ''
    }
  </div>
  <time datetime="${post.iso}">${post.date}</time>
</a></li>`;
}

/** 上一篇 / 下一篇 */
export function prevNextHtml(prev, next) {
  if (!prev && !next) return '';
  const item = (p, label) =>
    p
      ? `<a class="pn-item" href="${p.url}">
    <span class="pn-label">${label}</span>
    <span class="pn-title">${escapeHtml(p.title)}</span>
  </a>`
      : '<span class="pn-item empty"></span>';
  /* 上一篇在左、下一篇在右：HTML 里 prev 写前面 */
  return `<nav class="prev-next" aria-label="上下篇">
  ${item(prev, '上一篇')}
  ${item(next, '下一篇')}
</nav>`;
}
