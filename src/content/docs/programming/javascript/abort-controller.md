---
title: AbortController 取消请求
description: fetch 一旦发出无法撤回，但可以通过 signal 提前中止。本文给出超时、组件卸载取消、以及一次取消多个请求的写法，并说明中止后错误的处理方式。
pubDate: 2026-10-17
tags: [JavaScript, fetch, 异步]
draft: false
---

`AbortController` 提供一个 `signal`，把它传给 `fetch` 后，调用 `controller.abort()` 即可中止请求。被中止的请求会抛出一个 `AbortError`，需要在 `catch` 中区分处理。

## 适用场景

- 请求超时控制
- 页面切换或组件卸载时取消未完成的请求
- 搜索框输入时取消上一次请求，只保留最新结果

## 最小示例

```js
const controller = new AbortController();

setTimeout(() => controller.abort(), 5000);

try {
  const res = await fetch('/api/data', { signal: controller.signal });
  const data = await res.json();
} catch (err) {
  if (err.name === 'AbortError') {
    console.log('请求已取消');
  } else {
    throw err;
  }
}
```

Node 18+ 与主流浏览器可直接生成超时信号：

```js
const res = await fetch('/api/data', { signal: AbortSignal.timeout(5000) });
```

## 说明

- `abort()` 可以传原因：`controller.abort(new Error('页面已离开'))`，在 `catch` 中通过 `err.cause` 读取。
- 一个 controller 的 signal 可以传给多个 `fetch`，一次 `abort()` 取消全部请求。
- 中止发生在响应体读取阶段同样有效：`res.body` 的流会被关闭。
- 已完成的请求再调用 `abort()` 不会产生任何效果。

## 限制

- 取消是客户端行为，服务端可能已经处理完该请求。
- `AbortSignal.timeout` 在旧版 Safari 不可用，需要降级到手动 `setTimeout`。
- 不要复用同一个 controller 发起下一轮请求，每次请求应新建。

## 下一步

- [核心网页指标与优化顺序](/docs/frontend/performance/core-web-vitals/)
- [技术 SEO 检查清单](/docs/frontend/seo/technical-seo-checklist/)
