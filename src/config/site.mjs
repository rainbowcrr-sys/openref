/**
 * 站点唯一信息源。换地址 / 换站名，只改这里。
 *
 * SITE 必须和你实际拿到的地址一致，否则 canonical、sitemap、RSS 里的链接会错，
 * 直接影响 Google / Bing 收录。
 *
 * 网页端上传部署后，Cloudflare 给你的地址形如：
 *   Workers 上传  → https://<你填的名字>.<账户子域>.workers.dev
 *   Pages 上传    → https://<项目名>.pages.dev
 * 拿到地址后填回这里，重新 node build.mjs 再上传一次。
 */
export const SITE = 'https://openref.de5.net';

export const SITE_NAME = 'OpenRef';
export const SITE_FULLNAME = 'OpenRef 技术参考';
export const SITE_TAGLINE = '直白、可检索、能直接照着做的技术参考手册。';
export const SITE_DESC =
  'OpenRef 是一份开放的技术参考：按主题分组，条目式写作，覆盖 Cloudflare 边缘计算、前端工程、编程与系统基础。每篇讲清一件事，给出可直接运行的代码与明确的限制。';

export const LANG = 'zh-CN';
export const ORG_NAME = 'OpenRef';

export function fullTitle(title) {
  if (!title) return `${SITE_FULLNAME} — ${SITE_TAGLINE}`;
  return `${title} · ${SITE_FULLNAME}`;
}
