---
title: 核心网页指标与优化顺序
description: LCP、INP、CLS 三个指标分别衡量加载、交互与视觉稳定。本文给出各自的阈值、最常见成因，以及按投入产出排序的优化动作。
pubDate: 2026-10-19
tags: [性能, LCP, INP, CLS, 前端]
draft: false
---

核心网页指标（Core Web Vitals）是三量化用户体验的指标，按「75 百分位用户达到」为通过标准。优化前先确认是哪一个不达标，三者的成因与解法几乎不重叠。

## 适用场景

- 页面体验报告或 Lighthouse 显示指标未达标
- 上线前的性能验收
- 移动端加载或卡顿的归因分析

## 阈值

| 指标 | 含义 | 良好 | 需改进 |
|---|---|---|---|
| LCP | 最大内容绘制完成时间 | ≤ 2.5 s | > 4 s |
| INP | 交互到下一次绘制的延迟 | ≤ 200 ms | > 500 ms |
| CLS | 累计布局偏移 | ≤ 0.1 | > 0.25 |

## 最小示例

为图片预留空间并优先加载首屏图：

```html
<img src="/hero.webp" width="1200" height="600" fetchpriority="high" alt="示意图" />
```

拆分长任务，避免单次执行阻塞主线程：

```js
async function processAll(items) {
  for (const item of items) {
    doWork(item);
    // 让出主线程，使浏览器能响应输入
    await new Promise((r) => setTimeout(r, 0));
  }
}
```

## 说明

- **LCP** 通常由首屏图片、字体或渲染阻塞脚本决定。给 `<img>` 写死 `width`/`height`，避免用 JS 决定尺寸。
- **INP** 差几乎都源于主线程长任务。把大循环切片、把计算移入 Web Worker、减少事件回调里的同步布局读取。
- **CLS** 的成因是尺寸未知的元素：无尺寸图片、动态插入的广告位、晚加载的字体导致重排。用 `min-height` 或 `font-display: optional` 规避。
- 字体与关键 CSS 内联，非关键 JS 用 `defer`，能让 LCP 提前。

## 限制

- 指标取自真实用户数据（CrUX），本地 Lighthouse 分数不能直接代表线上结果。
- 单页内 LCP 元素可能变化（如轮播图），需以实际监测为准。
- 优化动作互相牵制：预加载过多资源会改善 LCP 但拖慢 INP。

## 下一步

- [技术 SEO 检查清单](/docs/frontend/seo/technical-seo-checklist/)
- [AbortController 取消请求](/docs/programming/javascript/abort-controller/)
