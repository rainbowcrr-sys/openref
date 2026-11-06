# 08 · 收录与 SEO（完整操作指南）

---

# 第一部分：站点已经内置了什么（你不用管）

## 一、自动生成的文件

每次 `node build.mjs` 都会生成：

| 文件 | 作用 |
|---|---|
| `/sitemap.xml` | 站点地图，**带 lastmod** |
| `/robots.txt` | 爬虫规则，放行全部主流引擎 |
| `/rss.xml` | 全站订阅源 |
| `/rss/<分类>.xml` | 每个分类单独订阅 |
| `/llms.txt` | 给 AI 看的条目索引 |
| `/llms-full.txt` | 全文喂给 AI |
| `/search-index.json` | 站内搜索索引 |
| `/og/<slug>.svg` | 每篇文章的分享图 |

## 二、每页自动带的结构化数据

| 类型 | 作用 |
|---|---|
| canonical | 告诉搜索引擎"这是权威地址" |
| Open Graph | 分享到社交平台时的卡片 |
| JSON-LD（TechArticle） | 文章结构化数据 |
| JSON-LD（BreadcrumbList） | 面包屑结构化数据 |

## 三、robots.txt 放行了谁

```
Googlebot        Bingbot         Baiduspider
YandexBot        DuckDuckBot     Applebot
360Spider        Sogou web spider
GPTBot           OAI-SearchBot   ChatGPT-User
ClaudeBot        PerplexityBot   Google-Extended
```

**主流搜索引擎 + AI 爬虫全放行。**

---

# 第二部分：Google Search Console

## 一、添加属性

1. 打开 https://search.google.com/search-console
2. 用 Google 账号登录
3. 点 **添加属性**
4. 选 **网址前缀**（右边的选项）
5. 填 `https://openref.de5.net`
6. 点 **继续**

## 二、验证所有权

选 **HTML 文件** 方式：

1. Google 给你一个文件（你的是 `google5aedecd6e50def2e.html`）
2. 下载它
3. 放到仓库的 **`public/` 目录**
4. 推送：

```powershell
openref push "add: google 验证文件"
```

5. 等部署完成（1-2 分钟）
6. 浏览器打开 `https://openref.de5.net/google5aedecd6e50def2e.html` 确认能访问
7. 回 GSC 点 **验证**

## 三、⚠️ 这个文件不能丢

**Google 会定期复查。** 文件没了 → 验证失效 → 收录受影响。

它放在 `public/`，构建时自动复制到 dist 根目录。
**只要不删，推送就自动带着。**

## 四、提交 sitemap

验证通过后：

1. 左侧菜单 **索引** → **网站地图**
2. 输入框填 `sitemap.xml`
3. 点 **提交**

## 五、状态解读

| 显示 | 含义 | 怎么办 |
|---|---|---|
| **待处理** | 排队中 | 等着，**别反复提交** |
| **成功** | 读取成功 | 完成 ✅ |
| **无法读取** | 见下面 | |

## 六、⚠️ "无法读取"的常见误判（你遇到过）

**现象**：sitemap 显示"无法读取"、已发现 0 个网页，
但用 URL 检查查同一个地址，显示"可编入索引"。

**这是新站 100% 会有的正常现象**，原因是：

1. Google 把 sitemap 排进队列，**还没真正来读**
2. "无法读取"只是**排队占位状态**
3. "0"表示还没解析，**不代表页面有问题**
4. 你部署完 1 分钟就提交，Google 第一次来抓扑了空，缓存了失败结果

**正确处理**：

1. 点那条 sitemap 右边的 **移除**
2. 等 10 分钟
3. 重新添加提交
4. **等 24-72 小时**
5. **不要反复提交**（会被降权）

## 七、主动请求收录（比 sitemap 快）

顶部 **URL 检查** 搜索框：

1. 粘一个网址
2. 点检查
3. 显示"可编入索引"后 → 点 **请求编入索引**

**优先级**（一天别超 10 个）：

```
https://openref.de5.net/
https://openref.de5.net/topics/
https://openref.de5.net/topics/cloud/cloudflare/
https://openref.de5.net/docs/cloud/cloudflare/d1-index/
https://openref.de5.net/contribute/
```

**首页和分类页优先** —— 内链最多，
Google 抓首页会顺着链接自己发现全部文章，**比 sitemap 还快**。

---

# 第三部分：Bing Webmaster Tools

## 一、一键从 Google 导入（最省事）

1. 打开 https://www.bing.com/webmasters
2. 用 Microsoft 账号登录
3. 选 **"从 Google Search Console 导入"**
4. 授权 Google 账号
5. Bing 自动把验证和 sitemap 都搬过来

## 二、手动（如果导入失败）

1. 添加站点 `https://openref.de5.net`
2. 验证方式选 **XML 文件** 或 **meta 标签**
3. 左侧 **配置我的站点** → **Sitemaps** → 提交 `sitemap.xml`

## 三、为什么 Bing 很重要

Bing 的索引会喂给：

- **ChatGPT Search**
- **Microsoft Copilot**
- **Perplexity**

**现在 AI 搜索流量越来越大，别跳过。**

## 四、开 IndexNow（即时推送）

### 方法 A：Cloudflare Crawler Hints（推荐）

1. Cloudflare → 选你的域名
2. 左侧 **缓存** → **配置**
3. 找 **Crawler Hints** → **打开**

Cloudflare 会自动把更新推给 Bing、Yandex 等。

### 方法 B：手动 IndexNow

在 Bing Webmaster Tools 生成 API Key，把 key 文件放站点根目录。
（方法 A 开了就不用管这个。）

---

# 第四部分：中文搜索引擎

| 引擎 | 入口 |
|---|---|
| 百度 | https://ziyuan.baidu.com |
| 360 | https://zhanzhang.so.com |
| 搜狗 | https://zhanzhang.sogou.com |

## ⚠️ 现实预期

**免费后缀（`de5.net`）在中文搜索引擎收录会比较慢。**

百度对这类免费/小众后缀信任度低，可能需要更久，甚至不收。

**这是域名本身的限制，不是你配置的错。**

以后有预算买个 `.com` 或 `.xyz`，中文收录会好很多。

---

# 第五部分：Cloudflare 侧配合

## 一、开 Crawler Hints

缓存 → 配置 → **Crawler Hints → On**

## 二、别拦爬虫

安全 → **Bots** → **控制 AI 爬虫** → 选 **不阻止**

⚠️ 别开"阻止 AI 训练爬虫"，
否则 ChatGPT / Perplexity / Claude 读不到你的内容。

---

# 第六部分：时间预期（别焦虑）

| 阶段 | 时间 |
|---|---|
| Google 首次抓取 | 几小时 ~ 3 天 |
| 出现在搜索结果 | 3 天 ~ 2 周 |
| 有稳定搜索词排名 | 1 ~ 3 个月 |
| 稳定流量 | **持续写 20+ 篇之后** |

**头两周显示 0 完全正常。**

这段时间你该做的是：**继续写文章。**

## 自查命令

Google 搜索框输入：

```
site:openref.de5.net
```

能看到结果就说明被收录了。

---

# 第七部分：日常发文后的动作

1. 推送文章 → 自动部署（1-2 分钟）
2. Crawler Hints 自动通知 Bing
3. Google 靠 sitemap 定期抓（1-3 天发现新文章）
4. **重要文章**才去 GSC 点一次"请求编入索引"

**不用每篇都手动提交。**

---

# 第八部分：提升收录的内容侧技巧

| 技巧 | 说明 |
|---|---|
| **标题含搜索词** | 《Cloudflare D1 索引设计》而不是《聊聊 D1》 |
| **每篇 300-500 字以上** | 太短 Google 可能不收 |
| **内链 2-3 条** | 用 `::card` 更好看，也利于爬虫发现 |
| **description 手写** | 这是搜索结果里那段摘要 |
| **分类页别空** | 空分类不生成页面（构建器已处理） |
| **别发草稿** | `draft: true` 不生成页面 |
| **更新 `updated` 字段** | 让搜索引擎知道内容新鲜 |

---

# 第九部分：收录自查清单

- [ ] `/robots.txt` 能打开，没有 `Disallow: /`
- [ ] `/sitemap.xml` 能打开，URL 都是 `https://openref.de5.net/...`
- [ ] `/google5aedecd6e50def2e.html` 能访问
- [ ] 页面源码里有 `<link rel="canonical">`
- [ ] GSC 里 sitemap 状态是"成功"
- [ ] URL 检查首页显示"可编入索引"
- [ ] Bing 里 sitemap 已提交
- [ ] Cloudflare Crawler Hints 已开
- [ ] Cloudflare 没拦 AI 爬虫

---

## 一句话

**提交一次 sitemap，然后靠内容积累。别天天盯后台。**
