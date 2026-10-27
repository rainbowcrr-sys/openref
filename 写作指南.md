# OpenRef 写作指南

手机上打开 GitHub → 进 `src/content/docs/<大类>/<子类>/` → **Add file → Create new file** →
文件名写 `xxx.md` → 粘贴内容 → **Commit changes**。1–2 分钟自动上线。

---

## 一、文件名

- 只能用**小写字母、数字、短横线**：`d1-index`、`abort-controller`
- 文件名就是网址：`d1-index` → `/docs/cloud/cloudflare/d1-index/`
- **上线后不要改文件名**，改了链接会失效、收录会掉

---

## 二、frontmatter（开头那段）

可以**一个字都不写**，直接开始写正文。写了就按下面格式：

```
---
title: 用 Workers 静态资源托管站点
description: 一句话说明解决什么问题（50–120 字）
pubDate: 2026-10-26
updated: 2026-10-27
tags: [Cloudflare, Workers]
draft: false
---
```

| 字段 | 不写会怎样 | 说明 |
|---|---|---|
| `title` | 用文件名 | 页面大标题 + 搜索结果标题 |
| `description` | 自动取正文第一句 | **最重要**，就是 Google 结果里那段摘要 |
| `pubDate` | 用今天 | 发布日期 |
| `updated` | 不显示"更新于" | 有修改就填 |
| `tags` | 无标签 | 用英文逗号分隔 |
| `draft` | 正常发布 | 填 `true` 则**不生成页面**，写稿时用 |

---

## 三、正文结构（固定六段）

照抄这个骨架，每篇都这么写：

```
一句话定义：X 是……（先给结论，再解释）

## 适用场景
- 在什么情况下该用它
- 什么情况下不该用

## 最小示例
```js
// 可直接运行的最短代码
```

## 说明
逐条解释上面代码里发生了什么。

## 限制
- 边界、额度、版本要求

## 下一步
- 站内其他文章链接
```

**语气规则**（微软 / 苹果文档那套）：

| 要这样 | 不要这样 |
|---|---|
| KV 是最终一致的键值存储 | 今天想分享下我对 KV 的小心得 |
| 写入额度为每天 1000 次 | 写入额度好像挺少的 |
| 不适合计数器类高频写入 | 大家注意别用错了哦 |

- 一句话一个意思，主语是**技术**不是"我"
- 数字要具体：写"每天 1000 次写"，不写"很少"
- 不写主观感受、不写学习过程

---

## 四、内嵌语法（写在正文里，自动渲染成组件）

### 提示框

```
:::note
普通说明，补充背景。
:::

:::tip{小技巧}
绿色，建议做法。
:::

:::warn
黄色，容易出错的地方。
:::
```

`{}` 里是标题，不写就显示默认（说明 / 提示 / 注意）。

### 折叠块

```
:::details{点开看完整参数}
默认收起的内容。
:::
```

### 站内文章卡片

```
::card{/docs/cloud/cloudflare/d1-index/|D1 索引与查询成本|D1 按扫描行数计费}
```

格式：`::card{链接|标题|描述}`，标题和描述可省略（省略标题会显示链接本身）。

### 按钮

```
::btn{查看官方文档|https://developers.cloudflare.com/d1/}
```

### 视频

```
::video{https://www.bilibili.com/video/BV1xx411c7mD|演示}
::video{https://www.youtube.com/watch?v=dQw4w9WgXcQ|演示}
::video{/video/demo.mp4|自托管}
```

B站、YouTube、自托管 mp4 都能自动识别。

### 图片

```
::figure{/img/example.png|图片说明}
```

图片放仓库 `public/img/` 目录（GitHub 网页可直接上传）。也支持外链完整 https 地址。

### 徽标

```
::badge{Cloudflare|tech}     蓝色，技术栈
::badge{已验证|ok}           绿色，状态
::badge{Node 20+|ver}        灰色，版本/范围
```

### GitHub 仓库

```
::github{rainbowcrr-sys/openref}
```

渲染成一个带 GitHub 图标的胶囊按钮。

### 普通 Markdown 也都支持

标题、粗体、行内代码、列表、表格、引用、代码块、分隔线、链接、图片。
代码块自动带语言标签和**复制按钮**。

---

## 五、分类：目录位置决定

```
src/content/docs/cloud/cloudflare/xxx.md
                  ↑      ↑
                大类    子类
```

放进哪个目录就归入哪个分类，导航、面包屑、sitemap、RSS 全自动。

**加新分类**：编辑 `src/data/taxonomy.json`，加一段：

```json
{
  "id": "ai",
  "name": "AI 工程",
  "desc": "推理、检索、评测。",
  "children": [
    { "id": "rag", "name": "RAG 与检索", "desc": "向量库、召回、重排。" }
  ]
}
```

然后新建目录 `src/content/docs/ai/rag/` 就能往里放文章了。

---

## 六、发布前检查

- [ ] `description` 写了吗（或正文第一句能概括全文）
- [ ] `draft` 是 `false`
- [ ] 代码能直接跑
- [ ] "限制"段落写了具体数字
- [ ] 至少有 2–3 条站内链接
- [ ] 标题里带真实搜索词（写"Cloudflare D1 索引设计"，不写"聊聊 D1"）

---

## 七、本地预览（有电脑时）

```bash
node build.mjs            # 生成 dist/
node build.mjs --serve    # 预览 http://localhost:4321
python3 scripts/og.py --all   # 给每篇文章生成 PNG 版分享图（需 Pillow）
```
