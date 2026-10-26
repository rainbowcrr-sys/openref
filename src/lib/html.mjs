import { SITE, SITE_NAME, SITE_FULLNAME, LANG, ORG_NAME, fullTitle } from '../config/site.mjs';
import { escapeHtml } from './md.mjs';

export const NAV = [
  { label: '分类', href: '/topics/' },
  { label: '全部文章', href: '/latest/' },
  { label: '标签', href: '/tags/' },
  { label: '搜索', href: '/search/' },
];

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
}) {
  const pageTitle = fullTitle(title);
  const url = new URL(canonical, SITE).href;

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
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
<meta name="theme-color" content="#ffffff" />
${noindex ? '<meta name="robots" content="noindex,nofollow" />' : ''}
<link rel="alternate" type="application/rss+xml" title="${SITE_NAME}" href="/rss.xml" />
<link rel="sitemap" href="/sitemap.xml" />
<meta property="og:site_name" content="${escapeHtml(SITE_FULLNAME)}" />
<meta property="og:type" content="${ogType}" />
<meta property="og:title" content="${escapeHtml(title ?? SITE_FULLNAME)}" />
<meta property="og:description" content="${escapeHtml(description)}" />
<meta property="og:url" content="${url}" />
<meta property="og:locale" content="zh_CN" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escapeHtml(title ?? SITE_FULLNAME)}" />
<meta name="twitter:description" content="${escapeHtml(description)}" />
<link rel="stylesheet" href="/assets/global.css" />
${ldList.map((ld) => `<script type="application/ld+json">${JSON.stringify(ld)}</script>`).join('\n')}
${extraHead}
</head>
<body>
<header class="site-header">
  <div class="wrap">
    <a class="brand" href="/">${SITE_NAME}</a>
    <nav class="nav" aria-label="主导航">
      ${NAV.map(
        (l) =>
          `<a href="${l.href}"${
            activePath === l.href || activePath.startsWith(l.href) ? ' aria-current="page"' : ''
          }>${l.label}</a>`
      ).join('')}
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
      <a href="/rss.xml">RSS</a> · <a href="/sitemap.xml">Sitemap</a> · <a href="/llms.txt">llms.txt</a>
      <div class="mt">© ${new Date().getFullYear()} ${ORG_NAME}</div>
    </div>
  </div>
</footer>
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
  <h3><a href="${post.url}">${escapeHtml(post.title)}</a></h3>
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
    <h3>${escapeHtml(post.title)}</h3>
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
