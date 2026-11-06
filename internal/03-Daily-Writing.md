# 03 · 日常写作（从想法到上线，每一步）

---

# 第一部分：一篇文章是什么

## 一、本质

就是一个 **`.md` 后缀的纯文本文件**，放在 `src/content/docs/` 下面某个文件夹里。

## 二、它怎么变成网页

```
你写 src/content/docs/cloud/cloudflare/d1-index.md
        ↓ 构建器 node build.mjs 处理
生成 dist/docs/cloud/cloudflare/d1-index/index.html
        ↓ 部署
https://openref.de5.net/docs/cloud/cloudflare/d1-index/
```

**目录位置同时决定：网址 + 分类。**

## 三、文件命名规则

| 规则 | 例子 |
|---|---|
| 只能用小写字母、数字、短横线 | ✅ `d1-index.md`、✅ `core-web-vitals.md` |
| 不能有大写 | ❌ `D1-Index.md` |
| 不能有空格 | ❌ `d1 index.md` |
| 不能中文 | ❌ `索引.md`（会变成一串百分号乱码） |

**⚠️ 上线后不要改文件名** —— 改了网址就变，之前收录的链接全 404。

---

# 第二部分：三种新建方式

## 方式 A：命令行（推荐，最快）

### A1 交互式

```powershell
node scripts/new-post.mjs
```

依次会问你：

1. **选大类** → 输入序号回车
2. **选子类** → 输入序号回车
3. **文件名** → 输入英文，如 `d1-index`
4. **文章标题** → 输入中文，如 `D1 索引与查询成本`

完成后自动建好文件，并打印出最终网址。

### A2 一步到位

```powershell
node scripts/new-post.mjs cloud/cloudflare/d1-index "D1 索引与查询成本"
```

中文名也认：

```powershell
node scripts/new-post.mjs 云原生与基础设施/Cloudflare/d1-index "D1 索引与查询成本"
```

### A3 用 VS Code 打开写

```powershell
code src/content/docs/cloud/cloudflare/d1-index.md
```

## 方式 B：GitHub 网页（手机上也能用）

1. 打开 `github.com/rainbowcrr-sys/openref`
2. 进 `src/content/docs/` → 再进大类 → 子类
3. 右上 **Add file** → **Create new file**
4. 文件名框填 `d1-index.md`
   - 想顺便建新目录，文件名里带斜杠：`ai/rag/vector-db.md`（目录自动建）
5. 内容框粘贴正文
6. 拉到底 **Commit changes**

## 方式 C：手动建文件

在 VS Code 或资源管理器里直接新建文件，放对目录就行。

---

# 第三部分：frontmatter（开头那段）

## 一、长什么样

在文件最开头，用两个 `---` 包起来：

```yaml
---
title: Cloudflare D1 索引设计与查询成本控制
description: 讲解 D1 的索引机制、查询成本计算方式，以及如何避免扫描行数超标。
pubDate: 2026-10-27
updated: 2026-10-28
tags: [Cloudflare, D1, 数据库]
draft: false
category: cloud
subcategory: cloudflare
---
```

## 二、每个字段干什么

| 字段 | 作用 | 不写会怎样 | 建议 |
|---|---|---|---|
| `title` | 页面大标题、浏览器标签、搜索结果标题 | 用文件名（`d1-index` → `D1 Index`） | **建议写** |
| `description` | Google 搜索结果里那段摘要 | 自动取正文第一句（前 110 字） | **强烈建议写**，决定别人看到什么 |
| `pubDate` | 发布日期，决定排序 | 用今天 | 可省 |
| `updated` | 显示"更新于" | 不显示 | 有修改就填 |
| `tags` | 标签，文章底部显示 | 无标签 | 建议写 2-3 个 |
| `draft` | `true` 则不生成页面 | 默认发布 | 写稿时设 `true` |
| `category` | 覆盖目录推断的大类 | 从目录推断 | **一般别写** |
| `subcategory` | 覆盖目录推断的子类 | 从目录推断 | **一般别写** |

## 三、最小写法

**一个字都不写也行**，直接开始写正文：

```markdown
一句话定义：R2 是……

## 适用场景
...
```

系统会自动：标题用文件名、摘要取第一句、日期用今天。

**建议至少写 `title` 和 `description`** —— 这两个决定搜索结果长什么样。

## 四、draft 的用法

写一半不想发布：

```yaml
---
title: 正在写的文章
draft: true
---
```

构建时会跳过，不生成页面。写完改成 `false` 或直接删掉这行。

---

# 第四部分：正文六段骨架

## 一、完整模板（照抄）

```markdown
一句话定义：D1 是 Cloudflare 的边缘 SQLite 数据库，按查询扫描行数计费。

## 适用场景

- ✅ 适合：用户数据、配置存储、内容管理
- ❌ 不适合：高频计数器（每次 +1 都算一次写）

## 最小示例

```js
export const onRequest = async ({ env }) => {
  const stmt = env.DB.prepare('SELECT * FROM users WHERE id = ?')
  return Response.json(await stmt.bind(1).first())
}
```

## 说明

- `prepare()` 预编译 SQL，防注入
- `bind()` 传参数
- `first()` 取第一行，没有返回 null

## 限制

- 免费计划每天 500 万次读、10 万次写
- 单次查询最多扫描 1000 行
- 没有原生自增 ID，用 ROWID

## 下一步

- ::card{/docs/cloud/cloudflare/kv-free-limits/|KV 免费额度|写入很贵，别当数据库用}
```

## 二、每一段的目的

| 段落 | 目的 |
|---|---|
| 一句话定义 | 让人 3 秒知道这是什么 |
| 适用场景 | 明确"该用/不该用"，减少误用 |
| 最小示例 | 能直接跑的最短代码 |
| 说明 | 解释代码里发生了什么 |
| 限制 | 边界、额度、版本（技术文档最重要的部分） |
| 下一步 | 内链，增加停留时间和收录 |

---

# 第五部分：语气规则（最重要）

## 一、对照表

| ❌ 别这样写 | ✅ 要这样写 |
|---|---|
| 今天想分享下我对 D1 的小心得 | D1 是边缘 SQLite 数据库，适合存用户数据 |
| 我觉得这个特别好用！！ | 写入延迟通常 10–50ms |
| 这个东西很厉害 | 免费额度含 500MB 存储和每天 500 万次读 |
| 大家快来看看 | （删掉） |
| 好像挺少的 | 每天 1000 次写 |
| 推荐大家用 | 在需要“最终一致”的场景下用它 |

## 二、三条原则

1. **主语是技术，不是"我"**
2. **数字要具体**：写"每天 1000 次写"，不写"很少"
3. **不写主观感受、不写学习过程**

## 三、标题要含搜索词

| ❌ | ✅ |
|---|---|
| 《聊聊 D1》 | 《Cloudflare D1 索引设计与查询成本控制》 |
| 《关于缓存的一些思考》 | 《HTTP 缓存策略：Cache-Control 各指令的实际效果》 |

**后者才有人搜。这是免费提升流量的关键。**

---

# 第六部分：发布流程

## 一、写完后

```powershell
openref push "add: D1 索引设计"
```

等价的三条：

```powershell
git add .
git commit -m "add: D1 索引设计"
git push
```

## 二、等部署

1. 去仓库 **Actions** 标签
2. 等 🟡 黄点变 🟢 绿勾（1-2 分钟）
3. 用**无痕模式**打开文章网址（避开浏览器缓存）

## 三、本地先验证（建议）

```powershell
node build.mjs
```

看有没有报错。构建成功会显示：

```
构建完成：dist/ 共 XX 个文件，X 篇文章。
```

也可以本地预览：

```powershell
node build.mjs --serve
```

然后浏览器打开 http://localhost:4321

---

# 第七部分：发布前自查清单

- [ ] `description` 写了（或正文第一句能概括全文）
- [ ] `draft` 是 `false`（或没写这行）
- [ ] 代码能直接跑，不是伪代码
- [ ] "限制"段落有具体数字
- [ ] 至少有 2 条站内链接
- [ ] 标题含真实搜索词
- [ ] 本地 `node build.mjs` 能过
- [ ] 文件名全是小写+短横线

---

# 第八部分：常见问题

## Q1：推送了但网站没更新

按顺序查：

1. **Actions** 是不是绿的（红色点进去看日志）
2. 可能只是慢，等 2 分钟
3. 用**无痕模式**刷新（普通刷新会用缓存）
4. `git status` 确认改动真的提交了

## Q2：文件名写错了能改吗

**能，但有代价。**

改文件名 = 改网址。已经收录的链接会 404。

真要改：
1. 改文件名
2. 推送，等 sitemap 更新
3. 去 Google Search Console 重新提交新网址

建议：**发布前就想好文件名。**

## Q3：文章写一半想先不发布

frontmatter 里写 `draft: true`。

## Q4：图片放哪

放仓库 `public/img/` 目录。

- GitHub 网页：进 `public/img/` → Add file → Upload files
- 本地：直接复制到 `public/img/`

正文引用：

```markdown
::figure{/img/example.png|图片说明}
```

也支持外链：`::figure{https://xxx.com/a.png|说明}`

## Q5：字数多少合适

**至少 300-500 字实质内容。** 太短 Google 可能不收。

## Q6：能写中文标题吗

**能**，而且建议写中文。`title` 字段就是中文的。
只有**文件名**必须用英文。

## Q7：文件名能用中文吗

**绝对不能。** 这是硬性规定。

| 对 ✅ | 错 ❌ |
|---|---|
| `d1-index.md` | `D1索引.md` |
| `cloudflare-r2.md` | `R2存储.md` |
| `vector-db.md` | `向量数据库.md` |

**为什么不行**（四个现实原因）：

1. **Windows 解压 zip 乱码** —— 你从 GitHub 下载 zip 解压后，
   中文文件名会变成一堆问号或怪字符
2. **命令行处理不稳定** —— PowerShell / cmd 遇到中文路径容易报错
3. **网址变百分号串** —— `https://openref.de5.net/docs/%E7%B4%A2%E5%BC%95/`，
   又长又丑，搜索引擎也嫌弃
4. **Actions 在 Linux 上跑** —— 中英文编码不一致时可能直接找不到文件，构建失败

**怎么取英文文件名**：

```
中文标题：Cloudflare R2 对象存储入门
文件名：  cloudflare-r2-intro.md
规则：    全小写、单词间用短横线、不要空格
```

**内容里的中文完全没问题**，标题、正文、标签都能写中文。
限制的**只有文件名和目录名**。
