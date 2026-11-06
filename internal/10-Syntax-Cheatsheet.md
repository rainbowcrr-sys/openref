# 10 · 语法速查（写文章时查这里）

⚠️ **最重要的一条规则**：所有 `::` 指令必须**单独占一行**，前后各留一个空行，否则不渲染。

---

# 第一部分：提示框

## 写法

```markdown
:::note
普通说明，补充背景信息。
:::

:::tip{小技巧}
绿色，建议做法。
:::

:::warn
黄色，容易出错的地方。
:::
```

## 说明

- `{}` 里是**自定义标题**，不写就显示默认（说明 / 提示 / 注意）
- **必须闭合**：开头 `:::xxx`，结尾 `:::`
- 里面可以放任何 Markdown（列表、代码、链接）

## 三种类型

| 类型 | 颜色 | 用途 |
|---|---|---|
| `note` | 蓝色 | 普通说明 |
| `tip` | 绿色 | 建议 |
| `warn` | 黄色 | 警告 |

---

# 第二部分：折叠块

## 写法

```markdown
:::details{点开看完整参数}
默认收起的内容，点标题才展开。
:::
```

## 说明

- `{}` 里是**折叠标题**（必填，否则显示"展开"）
- 适合放长代码、补充说明、参数表
- 手机上也能点开

---

# 第三部分：站内文章卡片

## 写法

```markdown
::card{/docs/cloud/cloudflare/d1-index/|D1 索引与查询成本|D1 按扫描行数计费}
```

## 参数格式

```
::card{链接|标题|描述}
```

| 参数 | 必填 | 不写会怎样 |
|---|---|---|
| 链接 | ✅ | — |
| 标题 | 否 | 显示链接本身 |
| 描述 | 否 | 不显示 |

## 链接怎么写

```
✅ /docs/cloud/cloudflare/d1-index/     ← 站内路径，开头 /docs/，末尾 /
❌ https://openref.de5.net/docs/...     ← 不要带域名
❌ /docs/cloud/cloudflare/d1-index      ← 末尾没斜杠
```

## 比普通链接好在哪

渲染成一张带标题+摘要的卡片，**更醒目、点击率更高、利于内链**。

---

# 第四部分：按钮

## 写法

```markdown
::btn{查看官方文档|https://developers.cloudflare.com/d1/}
```

## 说明

- 站外链接会自动加一个 `↗` 小图标
- 站内外都支持

---

# 第五部分：视频

## 写法

```markdown
::video{https://www.bilibili.com/video/BV1xx411c7mD|演示}
::video{https://www.youtube.com/watch?v=dQw4w9WgXcQ|演示}
::video{/video/demo.mp4|自托管}
```

## 支持的来源

| 来源 | 自动识别 |
|---|---|
| B站（bilibili.com / b23.tv） | ✅ |
| YouTube（youtube.com / youtu.be） | ✅ |
| 自托管 mp4 / webm | ✅ |
| 其他链接 | 渲染成普通按钮 |

## 说明

- **默认点击才加载播放器**（省流量、利于页面速度和 SEO）
- 第二个参数是标题，显示在播放器下方

---

# 第六部分：图片（可点击放大）

## 写法

```markdown
::figure{/img/example.png|图片说明}
```

## 说明

- 图片放仓库 **`public/img/`** 目录
- 也支持外链完整 https 地址
- **只有 `::figure` 插入的图能点击放大**
- 普通 Markdown 图片 `![](...)` **不能放大**

## 上传图片

1. GitHub 网页：进 `public/img/` → **Add file → Upload files**
2. 本地：直接复制到 `public/img/`
3. 引用：`::figure{/img/文件名.png|说明}`

---

# 第七部分：徽标

## 写法

```markdown
::badge{Cloudflare|tech}
::badge{已验证|ok}
::badge{Node 20+|ver}
```

## 三种类型

| 类型 | 颜色 | 用途 |
|---|---|---|
| `tech` | 蓝色 | 技术栈标签 |
| `ok` | 绿色 | 状态标记 |
| `ver` | 灰色 | 版本/平台/范围 |

不写类型时默认 `tech`。

---

# 第八部分：GitHub 仓库链接

## 写法

```markdown
::github{rainbowcrr-sys/openref}
```

渲染成带 GitHub 图标的胶囊按钮，指向该仓库。

第二个参数可自定义显示文字：

```markdown
::github{rainbowcrr-sys/openref|站点源码}
```

---

# 第九部分：普通 Markdown（全支持）

```markdown
# 一级标题
## 二级标题
### 三级标题

**粗体**
*斜体*
`行内代码`

[链接文字](https://example.com)
![图片](https://example.com/a.png)

- 无序列表
- 无序列表

1. 有序列表
2. 有序列表

> 引用

---
（分隔线）

| 表头 | 表头 |
|---|---|
| 单元格 | 单元格 |

```js
代码块
```
```

## 表格说明

- 表头下面必须有 `|---|---|` 分隔行
- 手机上表格可横向滚动

---

# 第十部分：代码块自动功能

写完 ``` ``` ``` 包裹的代码块，自动获得：

| 功能 | 说明 |
|---|---|
| **语言标签** | 左上角显示 `js` / `python` / `sql` 等 |
| **行号** | 每行前面有序号，**复制时不会带上** |
| **复制按钮** | 右上角，点了变"已复制" |
| **自动折叠** | 超过 **30 行**自动折叠，点"展开全部 N 行" |
| **语法着色** | 注释、字符串、关键字、数字、函数名五种颜色 |
| **深色跟随** | 深色模式下代码块自动换深色配色 |

## 指定语言

````markdown
```js
const a = 1
```
````

语言标记写在开头的三个反引号后面。

---

# 第十一部分：frontmatter

```yaml
---
title: 标题（不写用文件名）
description: 摘要（不写取正文第一句）
pubDate: 2026-10-27
updated: 2026-10-28
tags: [标签1, 标签2]
draft: false
---
```

**全部可省。** 详见 [03-Daily-Writing.md](03-Daily-Writing.md) 第三部分。

---

# 第十二部分：最容易犯的 6 个错

| # | 错误 | 后果 |
|---|---|---|
| 1 | 指令没**单独占一行** | 显示成纯文字，不渲染 |
| 2 | `:::容器` 忘了写结尾 `:::` | 后面的内容全被吞进容器里 |
| 3 | 参数用中文竖线 `｜` 而不是 `|` | 参数解析失败 |
| 4 | 文件名含大写或空格 | 网址出现乱码 |
| 5 | 代码块用缩进而不是三个反引号 | 不渲染成代码块 |
| 6 | `::card` 链接带了域名 | 链接指向错误 |

---

# 第十三部分：完整示例

```markdown
---
title: Cloudflare R2 对象存储入门
description: R2 是零出口流量费的 S3 兼容对象存储，适合托管图片、视频和静态文件。
pubDate: 2026-10-27
tags: [Cloudflare, R2, 存储]
---

一句话定义：R2 是 Cloudflare 的 S3 兼容对象存储，最大卖点是出口流量免费。

::badge{Cloudflare|tech}
::badge{免费计划|ver}

## 适用场景

- ✅ 图片 / 视频托管
- ❌ 不适合频繁改写的文件

:::warn
免费计划只有 10GB 存储，超出需付费。
:::

## 最小示例

```js
export const onRequest = async ({ env }) => {
  const object = await env.R2.get('hello.txt')
  return new Response(object.body)
}
```

## 限制

- 免费 10GB 存储
- 单文件最大 5GB
- 没有原生文件夹，用 key 前缀模拟

## 下一步

::card{/docs/cloud/cloudflare/kv-free-limits/|KV 免费额度|写入很贵，别当数据库用}

::btn{官方文档|https://developers.cloudflare.com/r2/}
```
