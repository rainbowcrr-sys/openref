# OpenRef 技术参考

零依赖静态技术站。**手机上就能写、就能发，不需要电脑，不需要 Node。**

文章推到 GitHub → Cloudflare Pages 自动构建 → 全球 CDN 上线。

站点地址：**https://docs.openref.workers.dev**（写在 `src/config/site.mjs` 的 `SITE`）

## 一次性配置

### 1. 传到 GitHub

新建仓库 `openref`，把本目录全部文件传上去。

### 2. 连 Cloudflare Pages

Cloudflare 后台 → **Workers 和 Pages** → **创建** → **Pages** → **连接到 Git**：

| 配置项 | 值 |
|---|---|
| 框架预设 | **无**（None） |
| 构建命令 | `node build.mjs` |
| 输出目录 | `dist` |
| 环境变量 | `NODE_VERSION` = `20` |

### 3. 核对地址

`src/config/site.mjs` 里的 `SITE` 必须和实际地址一致，否则 canonical、sitemap、RSS 里的链接全错，直接影响收录。

## 日常发文

1. GitHub 仓库 → `src/content/docs/<大类>/<子类>/`
2. **Add file → Create new file**
3. 文件名 `xxx.md`，内容从 `写作模板.md` 复制后改 → **Commit changes**

1–2 分钟自动上线。完整语法见 **`写作指南.md`**。

## 命令（有电脑时才用）

```bash
node build.mjs             # 生成 dist/
node build.mjs --serve     # 预览 http://localhost:4321
node scripts/new-post.mjs  # 命令行新建文章
python3 scripts/og.py --all   # 生成 PNG 版分享图（需 Pillow，可选）
```

## 目录

| 路径 | 用途 |
|---|---|
| `src/content/docs/<大类>/<子类>/` | 文章，**目录位置决定分类** |
| `src/data/taxonomy.json` | 分类树，唯一数据源 |
| `src/config/site.mjs` | 站点名、地址、描述 |
| `src/styles/global.css` | 苹果风样式 + 深色模式 |
| `build.mjs` | 构建器，零依赖 |
| `写作指南.md` | **完整写作与语法说明** |
| `写作模板.md` | 发文时复制的模板 |

## 自动生成

首页 / 全部文章 / 分类总览 / 各分类页 / 标签页 / 搜索页 / 404，
以及 `sitemap.xml`（带 lastmod）、`robots.txt`、`rss.xml`、分类 RSS、
`llms.txt`、`llms-full.txt`、搜索索引、每页 OG 图与结构化数据。

## 收录

1. Google Search Console 提交 `https://docs.openref.workers.dev/sitemap.xml`
2. Bing Webmaster Tools 提交同一地址（建议开 IndexNow）
3. 中文搜索引擎（百度/360/搜狗）在各自站长平台提交
