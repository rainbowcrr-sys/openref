---
title: KV 免费额度与写入策略
description: KV 的写入额度只有每天 1000 次，却常被当成数据库用。本文给出它的正确用途、记数替代方案，以及最终一致带来的读取陷阱。
pubDate: 2026-10-22
tags: [Cloudflare, KV, 缓存, 免费额度]
draft: false
---

KV 是最终一致的键值存储：读取极快、全球可用，但写入昂贵且传播有延迟。免费计划每天 10 万次读、1000 次写、1 GB 存储。

## 适用场景

- 站点配置、开关、重定向表
- 渲染结果的缓存
- 会话、令牌等低频变更状态

不适合：计数器、点赞数、实时排行榜——这类写入会立刻耗尽额度。

## 最小示例

```js
// 写入：带上 TTL，避免冷数据长期占位
await env.CACHE.put(`post:${slug}`, html, { expirationTtl: 3600 });

// 读取：拿不到就回源重建
const cached = await env.CACHE.get(`post:${slug}`);
if (cached) return new Response(cached, { headers: { 'Content-Type': 'text/html' } });

const html = await render(slug);
await env.CACHE.put(`post:${slug}`, html, { expirationTtl: 3600 });
return new Response(html, { headers: { 'Content-Type': 'text/html' } });
```

带过期时间的批量列举：

```js
const list = await env.CACHE.list({ prefix: 'post:', limit: 100 });
```

## 说明

- 键名用前缀分组（`post:`、`user:`），`list({ prefix })` 才能按组枚举。
- `expirationTtl` 单位为秒，`expiration` 接受绝对时间戳，二选一。
- 写入后在全球各点生效通常需要最多 60 秒；需要强一致的场景改用 D1。
- 值上限 25 MB，单个键的元数据上限 1024 字节。

## 限制

- 写入额度远小于读取额度，**不要把每个请求都变成一次写**。
- 同一键的连续写入会互相覆盖，没有原子自增；计数改用 D1 或 Durable Objects。
- `list` 的结果顺序按字典序，不保证实时一致。

## 下一步

- [D1 索引与查询成本](/docs/cloud/cloudflare/d1-index/)
- [用 Workers 静态资源托管站点](/docs/cloud/cloudflare/workers-static-assets/)
