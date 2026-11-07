---
title: 用 require() 加载 ESM（Node 22）
description: Node 22.12+ 默认支持用 require() 同步加载 ESM，无需任何实验开关；含顶层 await 的模块仍需改用动态 import()。
pubDate: 2026-11-07
author: rainbowcrr-sys
tags: [Node.js, ESM, CommonJS]
category: dev
subcategory: node
series: node-require-esm
version: Node 22
env: Node 22.12.0 及以上（默认开启，无需 flag）
---

## 一句话结论

Node 22.12.0 起，`require(ESM)` **默认开启**，不用加任何命令行开关。这是和 Node 20 版唯一的操作差异——但两个限制一模一样。

## 1. 确认版本

```bash
node -v
# 需要 v22.12.0 或更高
```

22.0 ~ 22.11 之间仍需要 `--experimental-require-module`，请照 **Node 20** 那篇做。

## 2. 准备两个文件

`esm.mjs`：

```js
export const name = 'openref';
export function twice(n) {
  return n * 2;
}
```

`main.cjs`：

```js
const mod = require('./esm.mjs');
console.log(mod.name, mod.twice(21));
```

## 3. 直接跑

```bash
node main.cjs
# openref 42
```

没有 flag、没有 `NODE_OPTIONS`、没有警告。如果你在 22.12+ 上还看到 `ERR_REQUIRE_ESM`，先检查是不是 `nvm` 切到了别的版本：

```bash
which node && node -p "process.version"
```

## 4. 两个限制仍然存在

默认开启不等于放开限制：

- **顶层 `await` 仍不行** → `ERR_REQUIRE_ASYNC_MODULE`。`require()` 是同步调用，等不了异步初始化。
- **`import.meta` 仍不可靠** → 走同步求值路径时别用它拼路径。

要加载带顶层 `await` 的模块，还是得异步：

```js
(async () => {
  const mod = await import('./esm.mjs');
  console.log(mod.name);
})();
```

## 5. 降级到 Node 20 怎么办

同一组里的 **Node 20** 版本不会删。把命令换成：

```bash
node --experimental-require-module main.cjs
```

其余代码一行不用改。这也是为什么旧教程要留着：还在用 20.19 LTS 的机器不能突然按新写法跑。

## 6. 怎么判断自己走的是哪条路

```js
// main.cjs
try {
  const mod = require('./esm.mjs');
  console.log('同步加载成功', mod.name);
} catch (err) {
  if (err.code === 'ERR_REQUIRE_ASYNC_MODULE') {
    console.log('模块有顶层 await，改用 import()');
  } else {
    throw err;
  }
}
```

> 本文是这一组的当前最新版。以后 Node 再有变化，会新增 `node24.md` 并登记进 `meta.json`，时间线自动多一格，订阅本组的人也会收到新条目；这三篇会一直同时存在。
