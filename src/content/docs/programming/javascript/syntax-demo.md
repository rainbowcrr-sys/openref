---
title: 内嵌语法演示
description: 展示提示框、折叠块、卡片、按钮、视频、图片、徽标与 GitHub 引用在正文中的写法与渲染效果。
pubDate: 2026-10-27
tags: [写作指南, 语法]
draft: true
---

这一页用来演示正文里所有可用的内嵌语法。

## 提示框

:::note
普通说明，用来补充背景信息。
:::

:::tip{小技巧}
绿色提示，用来给出建议做法。
:::

:::warn
黄色注意，用来提示容易出错的地方。
:::

## 折叠块

:::details{点开看完整参数}
折叠起来的内容默认不显示，点击标题才展开。适合放长代码或补充说明。
:::

## 卡片与按钮

::card{/docs/cloud/cloudflare/d1-index/|D1 索引与查询成本|D1 按扫描行数计费，缺索引会耗尽额度}

::btn{查看 Cloudflare 官方文档|https://developers.cloudflare.com/d1/}

## 视频

::video{https://www.bilibili.com/video/BV1xx411c7mD|B站演示}

::video{https://www.youtube.com/watch?v=dQw4w9WgXcQ|YouTube 演示}

## 图片与徽标

::figure{/img/example.png|图片说明文字}

::badge{Cloudflare|tech}
::badge{已验证|ok}
::badge{Node 20+|ver}

::github{rainbowcrr-sys/openref}

## 代码

```js
const controller = new AbortController();
// 超时后自动取消
setTimeout(() => controller.abort(), 5000);
const res = await fetch('/api/data', { signal: controller.signal });
```

## 表格

| 指标 | 良好 | 需改进 |
|---|---|---|
| LCP | ≤ 2.5 s | > 4 s |
| INP | ≤ 200 ms | > 500 ms |
