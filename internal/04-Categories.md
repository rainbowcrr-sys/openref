# 04 · 分类体系（含 taxonomy.json 完整结构）

---

# 第一部分：核心规则

## 一、一句话

**目录位置 = 分类。不需要在任何地方"登记"。**

```
src/content/docs/
├── cloud/                ← 大类
│   ├── cloudflare/       ← 子类
│   │   └── d1-index.md   ← 文章
│   └── serverless/
├── programming/
│   ├── javascript/
│   └── python/
├── frontend/
│   ├── seo/
│   └── performance/
└── systems/
    └── linux/
```

## 二、放进去之后自动发生什么

把 `d1-index.md` 放进 `cloud/cloudflare/`，自动：

| 效果 | 说明 |
|---|---|
| 分类页 | 出现在 `/topics/cloud/` 和 `/topics/cloud/cloudflare/` |
| 面包屑 | 首页 › 云原生与基础设施 › Cloudflare |
| 首页分组 | 首页"云原生与基础设施"板块里出现 |
| sitemap | 自动包含 |
| RSS | 自动包含，且出现在 `/rss/cloud.xml` |
| 相关条目 | 文章底部优先推荐同类的 |
| 搜索 | 可按分类过滤 |

**你要做的只是：把文件放对目录。**

---

# 第二部分：taxonomy.json 完整结构

## 一、文件位置

`src/data/taxonomy.json`

## 二、完整结构

```json
{
  "categories": [
    {
      "id": "cloud",
      "name": "云原生与基础设施",
      "desc": "边缘计算、Serverless、部署与运维。",
      "children": [
        {
          "id": "cloudflare",
          "name": "Cloudflare",
          "desc": "Workers、Pages、D1、KV、R2。"
        },
        {
          "id": "serverless",
          "name": "Serverless",
          "desc": "函数计算、冷启动、成本模型。"
        }
      ]
    },
    {
      "id": "programming",
      "name": "编程",
      "desc": "语言特性、标准库、常见写法与陷阱。",
      "children": [
        {
          "id": "javascript",
          "name": "JavaScript / TypeScript",
          "desc": "异步、类型系统、运行时行为。"
        }
      ]
    }
  ]
}
```

## 三、每个字段什么意思

### 大类（categories 数组里的一项）

| 字段 | 类型 | 含义 | 约束 |
|---|---|---|---|
| `id` | 字符串 | 英文标识，**必须和目录名一模一样**，也出现在网址里 | 只能用小写字母、数字、短横线 |
| `name` | 字符串 | 中文名，显示在页面上 | 随便写中文 |
| `desc` | 字符串 | 一句话说明，显示在分类页和首页 | 建议 20-40 字 |
| `children` | 数组 | 子类列表 | 至少 1 个 |

### 子类（children 数组里的一项）

| 字段 | 类型 | 含义 |
|---|---|---|
| `id` | 字符串 | 英文标识，必须和子类目录名一致 |
| `name` | 字符串 | 中文名 |
| `desc` | 字符串 | 一句话说明 |

## 四、目录名必须和 id 对应

```
taxonomy.json 里： "id": "cloud"  →  "id": "cloudflare"
                        ↓                  ↓
目录：          src/content/docs/cloud/cloudflare/
```

**不对应的后果**：页面能生成，但分类名和描述显示不出来，导航里也缺。

---

# 第三部分：加一个新分类（完整四步）

## 场景：加"AI 工程"大类，下面有"RAG 与检索"子类

### 第 1 步：改 taxonomy.json

在 `categories` 数组里加一段（**注意逗号**）：

```json
{
  "categories": [
    {
      "id": "cloud",
      "name": "云原生与基础设施",
      "desc": "...",
      "children": [...]
    },
    {
      "id": "ai",
      "name": "AI 工程",
      "desc": "大模型应用、检索增强生成、提示词工程。",
      "children": [
        {
          "id": "rag",
          "name": "RAG 与检索",
          "desc": "向量数据库、召回策略、重排序。"
        }
      ]
    }
  ]
}
```

⚠️ **JSON 逗号规则**：最后一项后面**不能**有逗号，其余都要有。
写错会导致构建失败（报 JSON 解析错误）。

### 第 2 步：建目录

命令行（推荐，会自动建目录）：

```powershell
node scripts/new-post.mjs ai/rag/vector-db "向量数据库选型对比"
```

或手动建文件夹：

```
src/content/docs/ai/rag/
```

### 第 3 步：写文章

在第一篇写完后才会生成分类页（**空分类不生成页面**）。

### 第 4 步：推送

```powershell
openref push "add: AI 工程分类 + 向量数据库条目"
```

构建后：

- `/topics/ai/` 生成
- `/topics/ai/rag/` 生成
- 首页出现"AI 工程"分组
- 导航能进

---

# 第四部分：改分类名 / 改 id

| 改什么 | 要动哪里 | 风险 |
|---|---|---|
| 只改 `name`（中文名） | 只改 taxonomy.json | ✅ 安全，网址不变 |
| 改 `desc` | 只改 taxonomy.json | ✅ 安全 |
| 改 `id` | taxonomy.json + **文件夹改名** + **所有文章链接** | ❌ **高危**，网址全变，收录掉 |

**铁律：上线后绝对不要改 `id`。**

想改中文名，只改 `name` 就行。

---

# 第五部分：文章该放哪个分类

## 判断原则

**按"读者会去哪找"放，不是按"这技术属于什么学科"。**

| 文章主题 | 放哪 | 理由 |
|---|---|---|
| Cloudflare Workers 怎么写 | `cloud/cloudflare/` | 读者搜"Workers" |
| 前端加载速度优化 | `frontend/performance/` | 读者搜"性能优化" |
| 怎么让 Google 收录 | `frontend/seo/` | 读者搜"SEO" |
| JavaScript 某个 API | `programming/javascript/` | 读者搜 API 名 |
| Linux 命令 | `systems/linux/` | 读者搜命令 |

## 属于多个分类怎么办

比如"用 Workers 做 SEO 优化"：

- 选**一个主分类**放（建议按读者主要搜索意图）
- 另一个靠 **`tags` 标签**补上

```yaml
tags: [Cloudflare, Workers, SEO]
```

---

# 第六部分：覆盖默认分类（特殊情况）

极少数情况想让文章显示在别的分类，在 frontmatter 写：

```yaml
---
title: 某篇文章
category: cloud
subcategory: cloudflare
---
```

写了就以 frontmatter 为准，**忽略目录位置**。

⚠️ **一般不建议用** —— 会让目录结构失去意义，以后你自己都找不着。

---

# 第七部分：删掉一个分类

1. taxonomy.json 里删掉那段（**注意逗号**）
2. 删掉对应目录
3. 重新构建推送

⚠️ 注意：已收录的分类页会变 404。
如果那几篇还有流量，先想好要不要保留。

---

# 第八部分：常见问题

## Q1：加了大类但没文章，会显示吗

**不会。**

构建器跳过空大类，不生成页面。这是为了避免空页面拖累 SEO 收录。

所以：**加了分类树之后，记得至少放一篇文章进去。**

## Q2：子类目录名和 id 对不上会怎样

页面能生成，但：
- 分类名显示不出来（显示 id 或空白）
- 描述显示不出来
- 导航里可能缺失

**务必保持一致。**

## Q3：能无限加子类吗

技术上能。但建议每个大类 **3-8 个子类**，太碎读者找不到。

## Q4：构建时报 JSON 错误怎么办

100% 是 taxonomy.json 格式错了。常见原因：

| 错误 | 例子 |
|---|---|
| 多了逗号 | `[...,]` 最后一项后面有 `,` |
| 少了逗号 | 两项之间没 `,` |
| 用了中文引号 | `"cloud"` 写成 `"cloud"` |
| 括号不匹配 | 少了个 `}` 或 `]` |

**排查方法**：把内容粘到 https://json.cn 检查，或用 VS Code 打开（会标红）。

## Q5：分类页的网址是什么规律

```
/topics/<大类id>/          例：/topics/cloud/
/topics/<大类id>/<子类id>/  例：/topics/cloud/cloudflare/
```

## Q6：能手动指定分类页顺序吗

目前按 taxonomy.json 里的顺序显示。**想调顺序，改 json 里的顺序。**
