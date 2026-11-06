# OpenRef 技术参考

零依赖静态技术站。**样式与功能不变，部署完全走 GitHub 官方流程。**

站点地址：**https://openref.de5.net**（写在 `src/config/site.mjs` 的 `SITE`）

---

## 部署方式：GitHub Actions（官方推荐）

已配置 `.github/workflows/deploy.yml`，**双轨**：

| 你做了什么 | Actions 会做什么 |
|---|---|
| 本地跑过 `node build.mjs`，把 `dist/` 一起提交 | 检测到 `dist/index.html`，**直接部署** |
| 只推了源码，没提交 `dist/` | 自动 `node build.mjs`，再部署 |

### 首次设置（只做一次）

1. GitHub 仓库 → **Settings → Pages**
2. **Build and deployment** → Source 选 **GitHub Actions**
3. **Custom domain** 填 `openref.de5.net`，保存
4. 在 Workers 后台绑定自定义域，状态变 Active
5. 配好 Actions 的两个 Secrets，之后 push 即自动部署

### 日常发文

```
写 Markdown → git add . && git commit && git push → Actions 自动构建 → 1-2 分钟上线
```

---

## 已满足 GitHub Pages 官方规范

| 官方要求 | 文件 | 状态 |
|---|---|---|
| 跳过 Jekyll 处理 | `.nojekyll` | ✅ 构建时输出到 `dist/` |
| 自定义域声明 | `CNAME` | ✅ 内容为 `openref.de5.net` |
| 404 页面 | `404.html` | ✅ 根目录，带 7 秒快闪动画 |
| 站点地图 | `sitemap.xml` | ✅ 带 lastmod |
| 爬虫规则 | `robots.txt` | ✅ |
| Google 验证 | `google5aedecd6e50def2e.html` | ✅ 放在 `public/`，勿删 |

---

## 本地命令

```bash
node build.mjs            # 构建到 dist/
node build.mjs --serve    # 构建并预览 http://localhost:4321
node scripts/new-post.mjs # 命令行新建文章
python3 scripts/og.py --all   # 生成 PNG 版分享图（可选，需 Pillow）
```

本地构建后**把 `dist/` 一起提交**，Push 后 Actions 直接部署，不用云端再构建一次。

---

## 目录

| 路径 | 用途 |
|---|---|
| `src/content/docs/<大类>/<子类>/` | 文章，**目录位置决定分类** |
| `src/data/taxonomy.json` | 分类树，唯一数据源 |
| `src/config/site.mjs` | 站点名、地址、描述 |
| `src/styles/global.css` | 苹果风样式 + 深色模式 |
| `src/assets/guard.js` | 前端防护（禁右键 / 屏蔽 DevTools 快捷键） |
| `build.mjs` | 构建器，零依赖 |
| `WRITING-GUIDE.md` | **完整写作与语法说明** |
| `WRITING-TEMPLATE.md` | 发文时复制的模板 |
| `EMAIL-TEMPLATES.md` | 投稿审核通过后的通知邮件模板（自用） |
| `internal/` | **内部手册，不会发布到网站**（迁移、投稿处理、故障排查等） |

---

## 自动生成

首页 / 全部文章 / 分类总览 / 各分类页 / 标签页 / 搜索页 / 404，
以及 `sitemap.xml`（带 lastmod）、`robots.txt`、`rss.xml`、分类 RSS、
`llms.txt`、`llms-full.txt`、搜索索引、每页 OG 图与结构化数据。

---

## ⚠️ 关于「F12 看不到源码」

`guard.js` 已做到：禁用右键菜单、屏蔽 F12 / Ctrl+Shift+I / Ctrl+U 等快捷键、
检测到 DevTools 打开时覆盖页面。

**但要清楚**：浏览器必须先下载 HTML/CSS/JS 才能渲染，任何访客都能通过
「右键查看源代码 / curl / 保存网页」拿到内容；仓库又是 public，源码本身就在 GitHub 上。
这属于**提高门槛**，不是加密，无法真正禁止。

---

## 收录

1. Google Search Console 提交 `https://openref.de5.net/sitemap.xml`
2. Bing Webmaster Tools 提交同一地址（建议开 IndexNow）
3. 中文搜索引擎（百度 / 360 / 搜狗）在各自站长平台提交
