# 05 · 配置文件详解（所有 .json / .mjs 结构）

这份讲仓库里**每个配置文件**的每一个字段。想改任何东西先看这里。

---

# 第一部分：配置文件总览

| 文件 | 作用 | 改的频率 |
|---|---|---|
| `src/config/site.mjs` | 站点名、地址、描述 | 换域名时必改 |
| `src/data/taxonomy.json` | 分类树 | 加分类时改 |
| `src/data/authors.json` | 投稿人名录 | 有投稿时改 |
| `package.json` | 项目元信息、命令 | 基本不改 |
| `.gitignore` | Git 忽略规则 | 偶尔改 |
| `.nojekyll` | 让 GitHub 跳过 Jekyll | **不要删** |
| `.node-version` | 指定 Node 版本 | 不改 |
| `.github/workflows/deploy.yml` | 自动部署流程 | 基本不改 |
| `public/` 目录 | 静态资源（favicon、OG 图、验证文件） | 传图片时改 |

---

# 第二部分：src/config/site.mjs（最重要）

## 一、完整内容

```js
/**
 * 站点唯一信息源。换地址 / 换站名，只改这里。
 */
export const SITE = 'https://openref.de5.net';

export const SITE_NAME = 'OpenRef';
export const SITE_FULLNAME = 'OpenRef 技术参考';
export const SITE_TAGLINE = '直白、可检索、能直接照着做的技术参考手册。';
export const SITE_DESC =
  'OpenRef 是一份开放的技术参考：按主题分组，条目式写作，覆盖 Cloudflare 边缘计算、前端工程、编程与系统基础。每篇讲清一件事，给出可直接运行的代码与明确的限制。';

export const LANG = 'zh-CN';
export const ORG_NAME = 'OpenRef';

export function fullTitle(title) {
  if (!title) return `${SITE_FULLNAME} — ${SITE_TAGLINE}`;
  return `${title} · ${SITE_FULLNAME}`;
}
```

## 二、每个字段干什么

| 字段 | 作用 | 改了影响什么 |
|---|---|---|
| `SITE` | **站点地址（最重要）** | canonical、sitemap、RSS、OG 图、llms.txt 里所有链接 |
| `SITE_NAME` | 短名 `OpenRef` | 页眉 logo、OG 图上的名字 |
| `SITE_FULLNAME` | 全名 `OpenRef 技术参考` | 浏览器标签后缀、页脚 |
| `SITE_TAGLINE` | 副标题 | 首页大标语 |
| `SITE_DESC` | 站点描述 | 首页 meta description、RSS 描述 |
| `LANG` | 语言 `zh-CN` | HTML lang 属性 |
| `ORG_NAME` | 组织名 | 页脚版权、结构化数据 |

## 三、⚠️ 改域名的完整步骤

换域名时**必须**做：

1. 改这里：

```js
export const SITE = 'https://你的新域名';
```

2. 重新构建：

```powershell
node build.mjs
```

3. 推送：

```powershell
openref push "chore: 更新站点地址"
```

4. 去各搜索引擎**重新提交** sitemap

**不改的后果**：canonical 指向旧域名，Google 判站点异常，收录全废。

## 四、⚠️ 地址格式要求

```js
// ✅ 正确
export const SITE = 'https://openref.de5.net';

// ❌ 错误：末尾有斜杠
export const SITE = 'https://openref.de5.net/';

// ❌ 错误：http
export const SITE = 'http://openref.de5.net';

// ❌ 错误：带路径
export const SITE = 'https://openref.de5.net/blog';
```

**必须：https、无末尾斜杠、无路径。**

---

# 第三部分：src/data/taxonomy.json

## 一、完整结构

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
        }
      ]
    }
  ]
}
```

## 二、字段表

| 层级 | 字段 | 含义 | 约束 |
|---|---|---|---|
| 顶层 | `categories` | 大类数组 | 必须有 |
| 大类 | `id` | 英文标识 | **必须和目录名一致**，小写+短横线 |
| 大类 | `name` | 中文名 | 显示在页面 |
| 大类 | `desc` | 一句话说明 | 分类页和首页显示 |
| 大类 | `children` | 子类数组 | 至少一个 |
| 子类 | `id` | 英文标识 | 必须和子类目录名一致 |
| 子类 | `name` | 中文名 | |
| 子类 | `desc` | 一句话说明 | |

## 三、对应关系图

```
taxonomy.json:
  categories[0].id = "cloud"
  categories[0].children[0].id = "cloudflare"
              ↓
目录:
  src/content/docs/cloud/cloudflare/xxx.md
              ↓
网址:
  /topics/cloud/
  /topics/cloud/cloudflare/
  /docs/cloud/cloudflare/xxx/
```

## 四、加分类的完整步骤

见 [04-Categories.md](04-Categories.md) 第三部分。

## 五、JSON 语法要点（写错就构建失败）

| 规则 | 说明 |
|---|---|
| 逗号 | 最后一项**不能**有逗号，其余都要有 |
| 引号 | 必须用英文双引号 `"`，不能用中文引号 |
| 括号 | `{ }` 和 `[ ]` 必须配对 |
| 注释 | **不能写注释**（JSON 不支持） |

**检查工具**：把内容粘到 https://json.cn

---

# 第四部分：src/data/authors.json

## 一、完整结构

```json
{
  "_说明": [
    "投稿人名录数据源。新投稿人加一条到 authors 数组即可。",
    "name: 署名（写「匿名投稿人」表示匿名）",
    "posts: 该投稿人的条目列表，可多条"
  ],
  "authors": [
    {
      "name": "张三",
      "posts": [
        {
          "title": "R2 对象存储入门",
          "url": "/docs/cloud/cloudflare/r2-storage/",
          "date": "2026-10-29"
        }
      ]
    }
  ]
}
```

## 二、字段表

| 字段 | 含义 | 必填 |
|---|---|---|
| `_说明` | 给自己看的备注，**不参与渲染**，可删 | 否 |
| `authors` | 投稿人数组 | 是 |
| `authors[].name` | 署名 | 是 |
| `authors[].posts` | 该投稿人的条目列表 | 是 |
| `posts[].title` | 条目标题 | 是 |
| `posts[].url` | 站内完整路径，**以 `/docs/` 开头，末尾带 `/`** | 是 |
| `posts[].date` | 发布日期 `YYYY-MM-DD` | 是 |

## 三、怎么加新投稿人

在 `authors` 数组里加一条：

```json
{
  "name": "李四",
  "posts": [
    { "title": "文章标题", "url": "/docs/大类/子类/文件名/", "date": "2026-11-02" }
  ]
}
```

**注意逗号**：如果加在数组中间，前一条末尾要有逗号。

保存推送后，`/contribute/authors/` 页面自动更新，**不用改 Markdown**。

## 四、同一人有多个条目

```json
{
  "name": "张三",
  "posts": [
    { "title": "第一篇", "url": "/docs/xxx/aaa/", "date": "2026-10-29" },
    { "title": "第二篇", "url": "/docs/xxx/bbb/", "date": "2026-11-02" }
  ]
}
```

## 五、数组为空时

```json
{ "authors": [] }
```

名录页会显示"暂无条目"的提示框。

## 六、⚠️ url 格式

```json
// ✅ 正确
"url": "/docs/cloud/cloudflare/r2-storage/"

// ❌ 错误：带了域名
"url": "https://openref.de5.net/docs/..."

// ❌ 错误：末尾没斜杠
"url": "/docs/cloud/cloudflare/r2-storage"
```

---

# 第五部分：package.json

## 完整内容

```json
{
  "name": "openref-tech-blog",
  "type": "module",
  "version": "1.0.0",
  "private": true,
  "description": "零依赖静态技术站",
  "scripts": {
    "build": "node build.mjs",
    "dev": "node build.mjs --serve",
    "new": "node scripts/new-post.mjs"
  }
}
```

## 字段说明

| 字段 | 含义 |
|---|---|
| `name` | 项目名（随便） |
| `type: "module"` | 用 ES 模块语法，**别改** |
| `private: true` | 防止误发布到 npm |
| `scripts` | 命令别名 |

## scripts 怎么用

```powershell
npm run build     # 等同 node build.mjs
npm run dev       # 等同 node build.mjs --serve
npm run new       # 等同 node scripts/new-post.mjs
```

⚠️ 注意：`package.json` 里**没有 dependencies** —— 这个项目零依赖，
不需要 `npm install`。别手贱加依赖。

---

# 第六部分：.gitignore

## 当前内容

```
node_modules/
.DS_Store
*.log
.astro/
.wrangler/
```

## 每一行什么意思

| 行 | 作用 |
|---|---|
| `node_modules/` | 忽略依赖目录（虽然你不用装） |
| `.DS_Store` | 忽略 Mac 系统文件 |
| `*.log` | 忽略日志文件 |
| `.astro/` `.wrangler/` | 忽略旧框架残留 |

## ⚠️ 不要加 dist/

**`dist/` 不能被忽略！**

因为 Actions 的双轨逻辑会检测 `dist/index.html` 是否存在。
如果你把 dist 忽略了，它永远不会被提交，云端每次都要重新构建（慢一点但也能用）。

但如果你想本地构建后连 dist 一起推（更快），就不能忽略它。

## 想隐藏 internal/ 目录

加一行：

```
internal/
```

代价：换电脑时这些文档不会跟着走（先备份）。

---

# 第七部分：.nojekyll

## 是什么

**一个空文件**，文件名就叫 `.nojekyll`（前面有个点）。

## 干什么

告诉 GitHub Pages："不要用 Jekyll 处理这个站点"。

## 为什么必须有

GitHub Pages 默认用 Jekyll 引擎，它会：

- 忽略 `_` 开头的文件夹
- 把 Markdown 再渲染一遍
- 吞掉某些文件

你的站点是自己用 `build.mjs` 构建的，不需要 Jekyll。
**没有这个文件，网站可能样式错乱或资源 404。**

## ⚠️ 不要删

构建器会自动生成到 `dist/`，仓库根目录也有一份。
**两份都留着。**

---

# 第八部分：.github/workflows/deploy.yml

## 完整内容

```yaml
name: Build and Deploy

on:
  push:
    branches: [main, master]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Detect committed dist
        id: mode
        run: |
          if [ -f dist/index.html ]; then
            echo "value=upload" >> "$GITHUB_OUTPUT"
          else
            echo "value=build" >> "$GITHUB_OUTPUT"
          fi
      - uses: actions/setup-node@v4
        if: steps.mode.outputs.value == 'build'
        with:
          node-version: '20'
      - name: Build
        if: steps.mode.outputs.value == 'build'
        run: node build.mjs
      # 打包备份（可下载查看，不用于部署）
      - name: Package dist
        run: |
          cd dist
          zip -r ../openref-dist.zip .
          cd ..

      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: openref-dist
          path: openref-dist.zip
          retention-days: 90

      # 核心：自动部署
      # 只有变量 AUTO_DEPLOY 明确等于 false 时才跳过
      - name: Deploy to Cloudflare Workers
        if: vars.AUTO_DEPLOY != 'false'
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: deploy
```

## 逐段解释

| 段 | 作用 |
|---|---|
| `on: push: branches: [main, master]` | 推到 main 或 master 时触发 |
| `workflow_dispatch` | 允许在网页手动点"运行" |
| `concurrency` | 同时只有一个部署任务，不打架 |
| `Detect committed dist` | **双轨判断**：有没有已构建的 dist |
| `setup-node` + `Build` | 没 dist 时才装 Node 并构建 |
| `Package dist` | 把 dist 打成 zip（**在 dist 内部打包**，index.html 在根目录） |
| `Upload artifact` | 存为构建产物，可下载查看，保留 90 天 |
| `wrangler-action` | **核心**：把 dist 上传到 Cloudflare Workers |

### 可选的刹车

如果临时不想自动部署：

仓库 **Settings** → **Secrets and variables** → **Actions** → **Variables** 标签
→ 新建变量 `AUTO_DEPLOY`，值填 `false`

变量不存在或填其他值，都会正常自动部署。

## 需要的 Secrets

在仓库 **Settings → Secrets and variables → Actions** 里加两个：

| 名称 | 值 | 从哪来 |
|---|---|---|
| `CLOUDFLARE_API_TOKEN` | 一串 token | Cloudflare → 头像 → My Profile → API Tokens → Create Token（用 `Edit Cloudflare Workers` 模板） |
| `CLOUDFLARE_ACCOUNT_ID` | 32 位字符 | Cloudflare → Workers 和 Pages → 右侧栏 Account ID |

⚠️ token 只显示一次，创建时立刻复制保存。

详细步骤见 `01-Cloudflare-Setup.md` 第四部分。

## wrangler.toml（新增，同样重要）

```toml
name = "openref"
compatibility_date = "2026-10-29"

[assets]
directory = "./dist"
not_found_handling = "404-page"
```

| 字段 | 作用 | 能不能改 |
|---|---|---|
| `name` | Workers 项目名 | 改了要同步 GitHub Actions，建议不动 |
| `compatibility_date` | 运行时兼容日期 | 不动 |
| `assets.directory` | 构建产物目录 | 不动（就是 ./dist） |
| `assets.not_found_handling` | 404 处理方式 | `404-page` = 用你的 404.html |

⚠️ **绝对不要加 `main` 字段。**

加了 main 之后，每个请求都会先执行 Worker 脚本，
就会开始消耗 Workers 免费版的「10 万次/天」额度。
不加 main = 纯静态直出 = 免费无限。

## 双轨逻辑图

```
你 push
  ↓
仓库里有 dist/index.html 吗？
  ├─ 有  → 直接部署（快）
  └─ 没有 → 自动 node build.mjs 再部署
```

## 要改吗

**基本不用改。**

唯一可能改的：如果你只用 `master` 分支，把 `branches: [main, master]` 里的 `main` 删掉。
但保留也无害。

---

# 第九部分：public/ 目录

## 里面有什么

| 文件 | 作用 | 能删吗 |
|---|---|---|
| `favicon.svg` | 浏览器标签上的小图标 | 可换，别删 |
| `og-default.png` | 默认分享图（1200×630） | 可换，别删 |
| `google5aedecd6e50def2e.html` | **Google 验证文件** | ⚠️ **绝对不能删** |
| `img/` | 文章里的图片 | 你自己加 |
| `og/` | 每篇文章的 PNG 分享图（可选） | 可选 |

## ⚠️ Google 验证文件

`google5aedecd6e50def2e.html` 内容只有一行：

```
google-site-verification: google5aedecd6e50def2e.html
```

Google 会**定期复查这个文件**。删了或访问不到 → 验证失效 → 收录受影响。

**位置**：放在 `public/` 下，构建时自动复制到 `dist/` 根目录。

## 加图片

1. 把图片放进 `public/img/`
2. 文章里引用：`::figure{/img/xxx.png|说明}`

---

# 第十部分：build.mjs（构建器，了解即可）

## 它做什么

```
读 src/content/docs/ 的文章
      ↓
解析 Markdown + frontmatter
      ↓
套用模板（苹果风样式）
      ↓
生成 dist/ 里的 HTML
      ↓
同时生成 sitemap、RSS、robots、llms、OG 图、搜索索引
```

## 常用命令

```powershell
node build.mjs           # 构建
node build.mjs --serve   # 构建 + 本地预览 localhost:4321
```

## 要改吗

**一般不用改。** 除非你要加新功能。

里面的关键位置（想改的话）：

| 位置 | 作用 |
|---|---|
| 搜索 `const COLLAPSE_AT` | 代码折叠的行数阈值（当前 30） |
| 搜索 `COLLAPSE_AT` 在 md.mjs | 同上，实际在 `src/lib/md.mjs` |
| `src/lib/md.mjs` | Markdown 解析 + 内嵌语法 |
| `src/lib/html.mjs` | 页面模板 |
| `src/styles/global.css` | 所有样式 |

---

## 一句话总结

**最常改的三个：**

1. `src/config/site.mjs` —— 换域名时
2. `src/data/taxonomy.json` —— 加分类时
3. `src/data/authors.json` —— 有投稿时
