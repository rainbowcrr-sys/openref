# 00 · 开始之前（先看这一页）

本目录是**给你自己看的说明书**，不会出现在网站上。

---

## 一、这些文件会被发布吗？

**不会。**

构建器（`build.mjs`）只扫描两个目录：

- `src/content/docs/` → 文章
- `src/content/pages/` → 投稿页、政策页

`internal/` 不在其中，所以 `dist/` 里不会有它，网站访客永远看不到。

⚠️ **但是**：仓库是 public 的，任何人打开 GitHub 都能看到本目录。
如果你希望连 GitHub 上都看不到，在 `.gitignore` 里加一行：

```
internal/
```

代价：换电脑时这些文档不会跟着走（先复制到网盘备份一份）。

---

## 二、文档顺序（按重要程度排）

**如果你只打算看两份，看这两份：**

| 顺序 | 文件 | 什么时候看 |
|---|---|---|
| 1 | **[12-Setup-From-Scratch.md](12-Setup-From-Scratch.md)** | ⭐⭐ **主教程**：电脑上什么都没有时，从零配到自动发布，照着做 |
| 2 | **[03-Daily-Writing.md](03-Daily-Writing.md)** | 配好之后，写文章、发布文章 |

**配置完日常对照看的：**

| 文件 | 什么时候看 |
|---|---|
| [13-Quick-Card.md](13-Quick-Card.md) | ⭐ 一页纸勾选版，周末操作时放旁边对照 |
| [01-Cloudflare-Setup.md](01-Cloudflare-Setup.md) | Cloudflare 里每个开关、每条 DNS 记录讲透 |
| [11-Git-Commands.md](11-Git-Commands.md) | 忘记 git 命令 |

其余按需要查：

| 文件 | 什么时候看 |
|---|---|
| [02-GitHub-Repo-Rebuild.md](02-GitHub-Repo-Rebuild.md) | 建仓库、删仓库重建、推代码 |
| [04-Categories.md](04-Categories.md) | 加新分类、搞不清文章放哪 |
| [05-Config-Files.md](05-Config-Files.md) | 想改站点信息、分类树、作者名录等任何 `.json` / `.mjs` |
| [06-Submissions.md](06-Submissions.md) | 收到投稿邮件、转载申请 |
| [07-Email-Setup.md](07-Email-Setup.md) | 建邮箱、配置转发、no-reply |
| [08-SEO.md](08-SEO.md) | 提交搜索引擎、查收录 |
| [09-Troubleshooting.md](09-Troubleshooting.md) | 网站打不开、样式丢了、报错 |
| [10-Syntax-Cheatsheet.md](10-Syntax-Cheatsheet.md) | 忘了某个内嵌语法怎么写 |
| [11-Git-Commands.md](11-Git-Commands.md) | 忘记 git 命令 |

---

## 三、四条铁律（违反了会出大问题）

### 铁律 0：所有文件名必须是英文（ASCII），不能有中文

**这是本仓库的硬性规定。**

| 类型 | 对 ✅ | 错 ❌ |
|---|---|---|
| 文章文件 | `d1-index.md` | `D1索引.md` |
| 目录 | `cloud/cloudflare/` | `云/Cloudflare/` |
| 图片 | `diagram-flow.png` | `流程图.png` |
| 手册 | `03-Daily-Writing.md` | `03-日常写作.md` |

**为什么**：

1. **Windows 上解压 zip 会乱码** —— zip 格式对中文文件名的编码支持很乱，
   Windows 自带解压器经常解出一堆问号或乱字符
2. **命令行里中文路径容易出错** —— PowerShell / cmd 对中文路径处理不稳定
3. **网址会变成一长串百分号** —— `https://.../%E7%B4%A2%E5%BC%95`，
   搜索引擎和浏览器都嫌弃，收录效果差
4. **GitHub Actions 在 Linux 上跑**，中英文编码不一致时可能找不到文件

**文件名规范**：

```
只用：小写字母 a-z、数字 0-9、短横线 -
不要用：中文、空格、大写字母、下划线、特殊符号
```

内容里的中文**完全没问题** —— 只有**文件名和目录名**必须是英文。

详见 [03-Daily-Writing.md](03-Daily-Writing.md)。

### 铁律 1：改域名必须改 `src/config/site.mjs`

```js
export const SITE = 'https://openref.de5.net'
```

这个文件决定 canonical、sitemap、RSS、OG 图里的**所有链接**。
地址和实际不符，Google 会判站点异常，**收录直接废掉**。

### 铁律 2：`wrangler.toml` 里绝对不要加 `main`

```toml
name = "openref"
compatibility_date = "2026-10-29"

[assets]
directory = "./dist"
not_found_handling = "404-page"
```

就是这个样子，**没有 `main`**。

加了 `main` 之后每个请求都会先跑 Worker 脚本，
开始消耗 Workers 免费版的「10 万次/天」限额，站点的请求量就不再是免费无限的了。

### 铁律 3：邮件记录永远灰云，站点记录别手动改

- **MX / TXT（邮件）**：必须**灰云**。橙云会让邮件转发直接失效。
- **站点记录**：由 Workers 后台绑自定义域时**自动创建**（橙云，带小锁），
  你**不要手动建、也不要手动改**。

⚠️ 如果你之前用过 GitHub Pages，DNS 里可能还留着指向
`rainbowcrr-sys.github.io` 的 CNAME 或指向 `185.199.x.x` 的 A 记录。
**全部删掉**，否则会和 Workers 的记录打架，导致 522。

详见 [01-Cloudflare-Setup.md](01-Cloudflare-Setup.md)。

---

## 四、日常最短路径

```powershell
openref pull                  # 拉最新
# 写文章
openref push "说明"            # 推送，1-2 分钟后网站更新
```

没有 `openref` 命令时：

```powershell
cd C:\Users\zhangyang\openref
git pull
# 写文章
git add .
git commit -m "说明"
git push
```

---

## 五、你的站点信息速查

| 项目 | 值 |
|---|---|
| 站点地址 | `https://openref.de5.net` |
| 域名来源 | DNSHE 免费（https://my.dnshe.com） |
| DNS 托管 | Cloudflare |
| 站点托管 | Cloudflare Workers（静态资源） |
| GitHub 仓库 | `github.com/rainbowcrr-sys/openref` |
| 默认分支 | `main` |
| 本地目录 | `C:\Users\zhangyang\openref` |
| 邮件 | Cloudflare Email Routing |
| Google 验证文件 | `google5aedecd6e50def2e.html` |

---

## 六、遇到问题先做这个

```
1. 本地 node build.mjs        → 能不能过？
2. git status                 → 改动都加了吗？
3. 仓库 Actions               → 绿勾吗？
4. 无痕模式打开网站            → 更新了吗？
5. Cloudflare DNS             → 邮件记录是灰云吗？
```

详细版见 [09-Troubleshooting.md](09-Troubleshooting.md)。


## 文档索引补充

**[12-Setup-From-Scratch.md](12-Setup-From-Scratch.md)** ← **首次搭建从这里开始，照着做**
