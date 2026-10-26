---
title: 技术 SEO 检查清单
description: 让页面能被 Google 与 Bing 正常收录的最低要求：预渲染 HTML、唯一元信息、站点地图、结构化数据，以及上线后主动提交索引。按清单逐项核验即可。
pubDate: 2026-10-21
tags: [SEO, 收录, 站点地图, 结构化数据]
draft: false
---

搜索引擎收录依赖三件事：抓得到、读得懂、判得重。技术 SEO 就是围绕这三点做保证，与内容质量无关。

## 适用场景

- 新站上线前的逐项核验
- 页面改版后收录异常的排查
- 纯前端框架项目（SPA）的收录修复

## 最小示例

每个页面输出的元信息：

```html
<title>页面标题 · 站点名</title>
<meta name="description" content="50–120 字，说明这一页解决什么问题" />
<link rel="canonical" href="https://example.com/docs/a/" />
<meta property="og:title" content="页面标题" />
```

站点根目录：

```txt
# robots.txt
User-agent: *
Allow: /

Sitemap: https://example.com/sitemap-index.xml
```

```xml
<!-- sitemap.xml -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://example.com/docs/a/</loc></url>
  <url><loc>https://example.com/docs/b/</loc></url>
</urlset>
```

## 说明

- **预渲染优先**：静态 HTML 让爬虫无需执行 JS 即可拿到正文。客户端渲染的 SPA 常出现「收录了空壳」。
- **canonical 必须唯一**：同一内容存在多个 URL 时，用 canonical 指定权威版本；否则权重被分散。
- **description 不参与排名但影响点击率**，每页应不同。
- **结构化数据**用 JSON-LD 声明文章类型与发布时间，帮助生成搜索结果摘要：

```html
<script type="application/ld+json">
  {"@context":"https://schema.org","@type":"TechArticle","headline":"标题",
   "datePublished":"2026-10-21","dateModified":"2026-10-21"}
</script>
```

- **上线后主动提交**：在 Google Search Console 与 Bing Webmaster Tools 提交站点地图；Bing 支持 IndexNow，发布新页后立即推送可显著缩短收录时间。

## 限制

- 新域名通常需要数天到数周才建立信任，提交站点地图只加速抓取，不保证收录。
- 预览环境（`*.pages.dev`、`*.workers.dev` 的部署预览）应加 `noindex`，避免与正式页重复；正式环境上线前记得移除。
- 站点地图只放希望收录的 URL，不要包含搜索页、标签聚合页等重复内容页。

## 下一步

- [核心网页指标与优化顺序](/docs/frontend/performance/core-web-vitals/)
- [用 Workers 静态资源托管站点](/docs/cloud/cloudflare/workers-static-assets/)
