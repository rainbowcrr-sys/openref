---
title: D1 索引与查询成本
description: D1 按「扫描行数」计费而不是按请求数。缺索引的查询会把整表行数算进额度，本文说明如何建索引、如何写查询、以及免费额度的实际边界。
pubDate: 2026-10-24
tags: [Cloudflare, D1, SQLite, 数据库]
draft: false
---

D1 是运行在 Cloudflare 边缘的 SQLite 数据库。它的计费单位是**扫描行数**：一条 `SELECT` 实际读取了多少行，就计多少行。没有索引的查询会全表扫描，1 万行的表查一次即计 1 万行。

## 适用场景

- 文章、用户、配置等结构化数据
- 读多写少、单表规模在百万行以内
- 需要 SQL 语义但不想维护数据库实例

不适合：高频写入（如计数器、实时日志），写入额度比读取额度小两个数量级。

## 最小示例

建表同时建索引：

```sql
CREATE TABLE posts (
  id INTEGER PRIMARY KEY,
  slug TEXT NOT NULL,
  status TEXT NOT NULL,
  pub_date TEXT NOT NULL
);
CREATE INDEX idx_posts_status_date ON posts(status, pub_date);
```

查询必须使用参数化语句：

```js
const { results } = await env.DB.prepare(
  'SELECT id, slug FROM posts WHERE status = ? ORDER BY pub_date DESC LIMIT 20'
).bind('published').all();
```

批量写入用 `batch`，只计一次往返：

```js
await env.DB.batch([
  env.DB.prepare('INSERT INTO posts(slug, status, pub_date) VALUES(?, ?, ?)')
    .bind('a', 'published', '2026-10-24'),
  env.DB.prepare('UPDATE posts SET status = ? WHERE slug = ?')
    .bind('draft', 'b'),
]);
```

## 说明

- 索引要覆盖 `WHERE` 与 `ORDER BY` 用到的列；`idx_posts_status_date` 同时满足筛选和排序，避免额外排序扫描。
- 用 `EXPLAIN QUERY PLAN` 确认是否走索引，输出中出现 `SCAN` 即表示全表扫描。
- `bind()` 不只是防注入，也能让语句被复用，减少解析开销。
- 单行查询用 `.first('column')`，避免返回整行再用 JS 拆字段。

## 限制

- 免费计划额度：5 GB 总存储，每天 500 万行读、10 万行写。额度按账户统计，非按库。
- 单条查询返回大小有限制，不要用 `SELECT *` 拉大字段。
- 数据库跟随区域部署，跨境访问延迟会上升。
- 没有连接概念，每次 `prepare` 都是一次独立执行；事务用 `batch` 或 `withSession`。

## 下一步

- [KV 免费额度与写入策略](/docs/cloud/cloudflare/kv-free-limits/)
- [用 Workers 静态资源托管站点](/docs/cloud/cloudflare/workers-static-assets/)
