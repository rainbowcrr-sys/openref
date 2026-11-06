/**
 * 站点唯一信息源。换地址 / 换站名，只改这里。
 *
 * SITE 必须和你实际拿到的地址一致，否则 canonical、sitemap、RSS 里的链接会错，
 * 直接影响 Google / Bing 收录。
 *
 * 部署到 Cloudflare Workers 静态资源托管，地址形如：
 *   默认地址  → https://openref.<你的子域>.workers.dev
 *   自定义域  → https://openref.de5.net（在 Workers 后台 Add Custom Domain）
 *
 * 换域名后必须改这里并重新构建，否则 canonical / sitemap / RSS 里的链接全错，
 * 直接影响 Google、Bing 收录。
 */
export const SITE = 'https://openref.de5.net';

export const SITE_NAME = 'OpenRef';
export const SITE_FULLNAME = 'OpenRef 技术参考';
export const SITE_TAGLINE = '直白、可检索、能直接照着做的技术参考手册。';
export const SITE_DESC =
  'OpenRef 是一份开放的技术参考：按主题分组，条目式写作，覆盖 Cloudflare 边缘计算、前端工程、编程与系统基础。每篇讲清一件事，给出可直接运行的代码与明确的限制。';

/* GitHub 仓库地址。用于文章页「编辑此页」按钮，也用于页脚的开源链接。
   换仓库或改默认分支时改这里。 */
export const REPO = 'https://github.com/rainbowcrr-sys/openref';
export const REPO_BRANCH = 'main';
/* 源文件在仓库里的根目录 */
export const CONTENT_DIR = 'src/content/docs';

export const LANG = 'zh-CN';
export const ORG_NAME = 'OpenRef';

export function fullTitle(title) {
  if (!title) return `${SITE_FULLNAME} — ${SITE_TAGLINE}`;
  return `${title} · ${SITE_FULLNAME}`;
}
