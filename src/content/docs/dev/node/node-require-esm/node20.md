---
title: 用 require() 加载 ESM（Node 20）
description: Node 20.19+ 可以用 require() 同步引入 ES 模块，但必须显式打开实验开关，且被加载的模块不能含顶层 await。
pubDate: 2026-11-06
author: rainbowcrr-sys
tags: [Node.js, ESM, CommonJS]
category: dev
subcategory: node
series: node-require-esm
version: Node 20
env: Node 20.19.0 及以上（需 --experimental-require-module）
---

## 一句话结论

Node 20.19 起才支持用 `require()` 同步加载 ESM，并且**必须加** `--experimental-require-module` 开关；被加载的模块里不能有顶层 `await`。

这个能力是 20.19.0 才回移植进 Node 20 的，早期 20.x 完全不支持，别在老机器上照抄本文。

## 1. 先确认版本

```bash
node -v
# 需要 v20.19.0 或更高
```

低于这个版本就直接换 Node 22 版教程，或者改用动态 `import()`，别折腾 flag。

## 2. 准备两个文件

`esm.mjs`（被加载的 ES 模块）：

```js
export const name = 'openref';
export function twice(n) {
  return n * 2;
}
```

`main.cjs`（CommonJS 侧）：

```js
const mod = require('./esm.mjs');
console.log(mod.name, mod.twice(21));
```

注意扩展名必须是 `.mjs`，或者在最近的 `package.json` 里写了 `"type": "module"`，否则 Node 会把它当 CommonJS 解析。

## 3. 运行（关键在这一步）

```bash
node --experimental-require-module main.cjs
# openref 42
```

**不加这个 flag** 会直接报：

```
Error [ERR_REQUIRE_ESM]: require() of ES Module ... not supported.
```

不想每次手打，可以写进环境变量：

```bash
NODE_OPTIONS=--experimental-require-module node main.cjs
```

## 4. 两个硬限制

- **顶层 `await` 不行。** 被 require 的模块里只要有顶层 `await`，就会抛 `ERR_REQUIRE_ASYNC_MODULE`。因为 `require()` 是同步的，没法等一个异步模块初始化完。
- **拿不到 `import.meta`。** 走 require 路径时模块是被同步求值的，别指望在模块里读 `import.meta.url` 做路径拼接。

真遇到顶层 `await`，退回异步写法：

```js
// main.cjs
(async () => {
  const mod = await import('./esm.mjs');
  console.log(mod.name);
})();
```

## 5. 什么时候该用

只在「CommonJS 老代码要引一个纯同步的 ESM 包」时用。新项目直接写 ESM，不要为了兼容再绕一圈。

> 本文对应 Node 20 环境。若你用的是 Node 22.12 及以上，请看同一组里的 **Node 22** 版本：那边默认开启，不需要任何 flag。旧版本不会删，还在用 Node 20 的人照着这篇就能跑。
