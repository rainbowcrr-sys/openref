---
title: 用 Workers 静态资源托管站点
description: 不需要 Pages，也不用对象存储：把构建产物目录交给 Workers 的 assets 配置，一条命令发布成静态站点，并拿到 <name>.<subdomain>.workers.dev 地址。
pubDate: 2026-10-26
updated: 2026-10-26
tags: [Cloudflare, Workers, 静态托管]
draft: false
---

Workers 的静态资源（Static Assets）让单个 Worker 同时具备「文件托管」和「可编程」两种能力：命中路径时直接返回磁盘上的文件，未命中时交给 Worker 代码处理。一个项目即可发布整站，无需另建 Pages。

## 适用场景

- 想把静态站点发布到 `<name>.<subdomain>.workers.dev` 子域
- 静态页面为主，同时需要少量动态接口
- 不想维护 Pages 与 Worker 两个项目

不适合：需要按分支预览、需要 Pages 内置构建流水线的场景。

## 最小示例

配置 `wrangler.jsonc`：

```jsonc
{
  "name": "docs",
  "compatibility_date": "2025-09-25",
  "assets": {
    "directory": "./dist",
    "not_found_handling": "404-page"
  }
}
```

发布：

```bash
npx wrangler deploy
```

## 说明

- `name` 决定最终地址。账户子域为 `openref.workers.dev` 时，`"name": "docs"` 得到 `https://docs.openref.workers.dev`。
- `assets.directory` 指向构建产物目录，Astro 默认为 `dist/`。
- `not_found_handling` 有两种取值：`"404-page"` 返回目录内已生成的 `404.html`；`"single-page-application"` 把所有未命中路径回退到 `index.html`，用于前端路由。
- 只配 `assets` 而不配 `main`，Wrangler 会部署为纯静态站点；之后需要接口时再加 `main`，静态文件仍然优先命中。

## 限制

- 单个 Worker 打包后上限 10 MB（免费计划，压缩后）；静态资源不计入，但走同一份配置。
- `*.workers.dev` 子域由 Cloudflare 统一提供，策略可能调整；正式站点建议绑定自有域名，在「设置 → 触发器 → 自定义域」中添加。
- 绑定自有域要求该域名的 DNS 托管在 Cloudflare。

## 下一步

- [D1 索引与查询成本](/docs/cloud/cloudflare/d1-index/)
- [KV 免费额度与写入策略](/docs/cloud/cloudflare/kv-free-limits/)
