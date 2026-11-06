# 01 · Cloudflare 设置详解与故障排查（参考手册）

> ⚠️ **第一次搭建请先看 [12-Setup-From-Scratch.md](12-Setup-From-Scratch.md)。**
> 那份是主教程，从"电脑上什么都没有"一步步讲到"手机改文章自动上线"。
>
> **这份是参考手册**：讲 Cloudflare 里每个开关、每条 DNS 记录的原理，
> 以及出问题怎么查。搭建过程中卡壳了，来这里查原因。

---

# 第一部分：Cloudflare 设置详解

## 一、DNS 记录最终应该长什么样

| 类型 | 名称 | 内容 | 云朵 | 谁建的 |
|---|---|---|---|---|
| CNAME | `@` | 指向 workers.dev | ☁️ **橙**（带小锁） | 绑域时自动 |
| CNAME | `www` | 指向 workers.dev | ☁️ **橙**（带小锁） | 你绑的，可选 |
| MX | 各种 | 邮件 | 🌑 **灰** | Email Routing 自动 |
| TXT | `_dmarc` 等 | 邮件安全 | 🌑 **灰** | Email Routing 自动 |

**规律**：站点橙、邮件灰。

## 二、SSL/TLS 设置

左侧 **SSL/TLS** → **概述**

| 模式 | 选不选 |
|---|---|
| 关闭 | ❌ 绝对不要 |
| 灵活 | ❌ 会重定向死循环 |
| 完全 | ✅ 可用 |
| **完全（严格）** | ✅ **推荐，保持这个** |

现在网站真的经过 Cloudflare 了，这个设置**真的在起作用**。

然后左侧 **SSL/TLS** → **边缘证书** → 打开 **始终使用 HTTPS**。

⚠️ 边缘证书页面右上角有"订购高级证书""上传自定义证书"按钮，**都是付费的**，点了会弹"无访问权限"，关掉弹窗就行。

## 三、邮箱配置（Email Routing）

你之前已经配好了 `no-reply@openref.de5.net`，这里补全其他几个。

### 建新邮箱

1. 左侧 **电子邮件** → **电子邮件路由**
2. **路由规则** 标签 → **创建地址**
3. 自定义地址填前缀，比如 `submit`
4. 操作选 **发送到电子邮件**
5. 目标填你的 Gmail
6. 保存
7. ⚠️ **去 Gmail 找验证邮件，点链接确认**（不确认不生效）

### 建议的邮箱清单

| 地址 | 用途 |
|---|---|
| `no-reply@openref.de5.net` | 只发不收（已有） |
| `submit@openref.de5.net` | 收投稿 |
| `contact@openref.de5.net` | 收读者来信、转载申请 |
| `report@openref.de5.net` | 收内容勘误 |

### no-reply 设成 Drop

1. 路由规则 → 找 `no-reply` → 编辑
2. 操作改成 **Drop（丢弃）**
3. 保存

效果：别人发过来静默消失，你 Gmail 干净。

### 关掉 Catch-all

Catch-all 会让所有没配置的地址都转发给你，垃圾邮件会爆。
建议关掉或设成 Drop。

### 让 Gmail 能用 no-reply 身份发信

1. Gmail → 齿轮 → **查看所有设置** → **账号和导入**
2. "用这个地址发送邮件" → **添加其他电子邮件地址**
3. 名称填 `OpenRef`，地址填 `no-reply@openref.de5.net`
4. 勾选"视为别名" → **发送验证**
5. 收验证邮件点链接确认

之后写邮件时，发件人下拉能选 `no-reply@openref.de5.net`。

## 四、其他推荐开关

| 开关 | 位置 | 建议 |
|---|---|---|
| **Crawler Hints** | 缓存 → 配置 | ✅ 开，帮助搜索引擎更快发现更新 |
| **机器人防护** | 安全 → Bots | ⚠️ 选"不阻止"，否则 AI 读不到你的内容 |
| **DNSSEC** | DNS → 设置 | ✅ 建议开（需要去 DNSHE 后台填 DS 记录） |
| **GitHub 域名验证** | GitHub 账户 Settings → Pages | ✅ 做一次，防止域名被别人抢绑 |

---

# 第二部分：额度说明（你基本用不完）

| 项目 | 免费额度 | 你的用量 |
|---|---|---|
| 静态文件请求 | **免费、无限** | 不限（因为没写 main） |
| Workers 动态请求 | 10 万次/天 | **0**（纯静态不跑脚本） |
| 静态文件数量 | 2 万个/版本 | 46 个 |
| 单个文件大小 | 25 MiB | 几十 KB |
| Worker 项目数 | 100 个 | 1 个 |
| 部署次数 | **无限** | 随便推 |
| 带宽 | **无限** | 不限 |
| GitHub Actions | 公开仓库免费无限 | 随便用 |

**唯一前提：别给 `wrangler.toml` 加 `main`。**

---

# 第三部分：故障对照表

| 现象 | 原因 | 解决 |
|---|---|---|
| `522 连接超时` | 有旧 DNS 记录冲突 | 删掉旧记录，等 5 分钟 |
| 绑域一直 Initializing | 有冲突的 DNS 记录 | 删掉指向 github.io 的旧记录 |
| 提示"主机名已有 CNAME" | 手动建过 CNAME | 删掉它再绑 |
| Actions 报 `Authentication error` | token 错或权限不够 | 重建 token，确认 Workers Scripts: Edit |
| Actions 报 `Could not find account` | Account ID 错 | 重新复制 |
| Actions 报 `No project found` | `wrangler.toml` 的 name 对不上 | 检查 name 是不是 `openref` |
| 打开是 404 | 内容没传上去 | 重新 `openref deploy` |
| 网站能开但样式没了 | 传的是源码不是 dist | 检查 `wrangler.toml` 的 directory 是 `./dist` |
| 改了内容但网站没变 | 没 push，或 Actions 没跑 | 看 Actions 有没有绿勾 |
| 请求突然报 429 | 不小心加了 `main` | 删掉 `main` 重新部署 |
| 邮件收不到 | MX 被改成橙云 | 改回灰云 |
| 邮件进垃圾箱 | SPF/DKIM 记录丢了 | 检查 TXT 记录 |
| Actions 一直显示等待批准 | Environment 设了审核人 | Settings → Environments → 清空 Required reviewers |
| push 要输密码 | 没配凭据管理器 | 跑 `git config --global credential.helper manager` |

## 通用排查顺序

```
1. 看 Actions 是不是绿勾
   ├─ 红叉 → 点进去看日志
   └─ 绿勾 → 下一步

2. 看 Workers 后台自定义域是不是 Active
   ├─ 不是 → 检查 DNS 有没有冲突记录
   └─ 是 → 下一步

3. 无痕模式打开网站
   ├─ 404 → 重新部署
   ├─ 没样式 → 检查传的是不是 dist
   └─ 正常 → 没问题，可能是浏览器缓存
```

---

# 第四部分：定期体检（每季度一次）

- [ ] 域名没到期（去 https://my.dnshe.com 看）
- [ ] Workers 项目 `openref` 还在
- [ ] 自定义域 `openref.de5.net` 状态 **Active**
- [ ] DNS 里没有指向 `rainbowcrr-sys.github.io` 的旧记录
- [ ] MX / TXT 是**灰云**
- [ ] `wrangler.toml` 里**没有 `main`**
- [ ] SSL 模式是"完全（严格）"
- [ ] "始终使用 HTTPS"已开
- [ ] `https://openref.de5.net` 能正常打开
- [ ] `https://openref.de5.net/robots.txt` 能访问
- [ ] `https://openref.de5.net/sitemap.xml` 能访问，链接都是新域名
- [ ] GitHub Actions 最近一次是绿勾
- [ ] 邮箱能收发（给自己发一封测试）

---

# 第五部分：各项生效时间

| 事项 | 要等多久 |
|---|---|
| DNS 记录改动 | 几分钟 ~ 24 小时（通常 30 分钟内） |
| Workers 自定义域激活 | 1-5 分钟 |
| SSL 证书签发 | 自动，和绑域同时完成 |
| `openref deploy` 生效 | 几秒 ~ 1 分钟 |
| GitHub Actions 全流程 | 1-3 分钟 |
| 邮箱验证邮件 | 1-5 分钟 |

⚠️ **等待期间不要疯狂刷新**，会被限流。用无痕模式隔一会儿看一次。

---

## 一句话记住

**wrangler.toml 不加 main → 先绑域再传内容 → 站点橙云邮件灰云 → push 即上线。**
