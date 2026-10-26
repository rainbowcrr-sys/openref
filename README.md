# OpenRef 技术参考

零依赖静态技术站。**手机上就能写、就能发，不需要电脑，不需要 Node。**

原理：文章推到 GitHub → Cloudflare Pages 自动构建 → 全球 CDN 上线。
全程在浏览器里完成，一次配置好，之后发文只要「新建文件 → 粘贴 → 提交」三步。

## 一次性配置（约 5 分钟，只用做一次）

### 1. 把代码传上 GitHub

在 GitHub 新建仓库（建议名 `openref`，Public 或 Private 都行），把本目录全部文件传上去。

手机上可以用 GitHub 官方 App，或者在浏览器里用「Add file → Upload files」。

### 2. 连 Cloudflare Pages

Cloudflare 后台 → **Workers 和 Pages** → **创建** → **Pages** → **连接到 Git**：

| 配置项 | 填什么 |
|---|---|
| 仓库 | 刚建的 `openref` |
| 框架预设 | **无**（None） |
| 构建命令 | `node build.mjs` |
| 输出目录 | `dist` |
| 环境变量 | `NODE_VERSION` = `20` |

保存后会自动开始第一次构建，几分钟后拿到地址 `https://openref.pages.dev`。

### 3. 核对地址

`src/config/site.mjs` 里的 `SITE` 要和实际地址完全一致。
项目名叫 `openref` 时默认就是对的；改了项目名就要改这里，然后重新提交一次。

地址不一致会让 canonical 和 sitemap 里的链接全错，直接影响 Google / Bing 收录。

## 日常发文（手机三步）

1. 打开 GitHub 仓库 → 进入 `src/content/docs/<大类>/<子类>/`
2. 右上角 **Add file → Create new file**
3. 文件名填 `xxx.md`（英文小写+短横线），内容从根目录 `写作模板.md` 复制后改，底部 **Commit changes**

提交后约 1–2 分钟，Cloudflare 自动构建上线。**不用点任何部署按钮。**

## 分类：目录位置决定，零配置

```
src/content/docs/cloud/cloudflare/d1-index.md
                  ↑      ↑
                大类    子类
```

放进哪个目录就自动归入哪个分类，导航、面包屑、sitemap、RSS 全自动生成。

分类树在 `src/data/taxonomy.json`，加一段 JSON 就多一个分类，页面全自动生成。

## 本地预览（有电脑时才用）

```bash
node build.mjs           # 生成 dist/
node build.mjs --serve   # 生成并预览 http://localhost:4321
node scripts/new-post.mjs  # 命令行新建文章
```

## 目录

| 路径 | 用途 |
|---|---|
| `src/content/docs/<大类>/<子类>/` | 文章，**目录位置决定分类** |
| `src/data/taxonomy.json` | 分类树，唯一数据源 |
| `src/config/site.mjs` | 站点名、地址、描述 |
| `src/styles/global.css` | 苹果风样式，改变量即可换色 |
| `build.mjs` | 构建器，零依赖 |
| `写作模板.md` | 发文时复制的模板 |

## 自动生成

构建时自动产出，不用手写：

首页 / 全部文章 / 分类总览 / 各分类页 / 标签页 / 搜索页 / 404，
以及 `sitemap.xml`、`robots.txt`、`rss.xml`、`llms.txt`、搜索索引、每页结构化数据。

## 部署后手动做两件事

1. Google Search Console 提交 `https://openref.pages.dev/sitemap.xml`
2. Bing Webmaster Tools 提交同一地址（建议开 IndexNow）
