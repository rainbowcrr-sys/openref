# 09 · 故障排查（按现象查）

---

# 第一部分：网站打不开

| 现象 | 原因 | 解决 |
|---|---|---|
| `ERR_CONNECTION_CLOSED` | DNS 刚改 / 证书在签发 | 等 15-30 分钟，无痕模式试 |
| `ERR_CONNECTION_TIMED_OUT` | 网络问题 / 域名没解析 | 检查 DNS 记录还在不在 |
| **522 Connection timed out** | Cloudflare 找不到源站 | 删掉 Workers 残留记录 |
| **525 SSL handshake failed** | 证书握手失败 | SSL 改"完全"（非严格），等 |
| **526 Invalid SSL certificate** | 源站证书无效 | 等 GitHub 证书签发完 |
| **重定向循环** | 橙云 + 强制 HTTPS | **站点 DNS 改灰云** |
| `ERR_SSL_VERSION_OR_CIPHER_MISMATCH` | 证书没生效 | 等几小时，清浏览器缓存 |
| `DNS_PROBE_FINISHED_NXDOMAIN` | 域名没解析 | 检查 Cloudflare DNS 记录 |

---

# 第二部分：GitHub Pages 报错

| 现象 | 原因 | 解决 |
|---|---|---|
| **NotServedByPagesError** | DNS 是橙云 / 没生效 | 改灰云，等 30 分钟，点 Check again |
| **DNS check unsuccessful** | 同上 | 同上 |
| **already taken**（绑域名时） | 旧仓库没解绑 | 旧仓库 Pages 里 Remove |
| DNS 成功但打不开 | 证书还在签发 | 等几小时 |
| **自定义域一直 Initializing** | 有冲突的旧 DNS 记录 | 删掉指向 github.io 的旧记录 |
| **Actions 报 Authentication error** | API Token 错或权限不够 | 重建 token，确认 Workers Scripts: Edit |
| **Actions 报 Could not find account** | Account ID 错 | 重新复制 |
| **请求突然 429** | wrangler.toml 被加了 main | 删掉 main 重新部署 |

---

# 第三部分：样式没了 / 只剩纯文字

## 典型表现

页面能打开，但只有文字，没有苹果风排版、没有深色、没有按钮。

## 原因

**部署的是源码，不是构建产物 `dist/`。**

GitHub Pages 直接把 `.md`、`src/` 这些源文件当静态文件扔出来了，
没经过 `build.mjs` 处理，所以 CSS 和 JS 路径全错。

## 排查步骤

### 1. 看 Actions

仓库 → **Actions** → 是不是红色（失败）？

红色 → 点进去看日志。

### 2. 本地复现

```powershell
node build.mjs
```

看有没有报错。常见：

| 报错 | 原因 |
|---|---|
| JSON 解析错误 | `taxonomy.json` 或 `authors.json` 格式错 |
| Cannot find module | 文件路径不对 |
| 找不到某篇文章 | frontmatter 格式错 |

### 3. 检查 Pages 设置

Settings → **Pages** → Source 是不是 **GitHub Actions**？

现在部署走 wrangler-action，部署目标是 Cloudflare Workers，不再用 GitHub Pages。
检查 Actions 日志，以及 Workers 后台自定义域是否 Active。

### 4. 检查双轨

如果 Actions 是绿的但样式还是没有，看日志里有没有：

```
使用仓库中已构建的 dist/
```

还是：

```
仓库无 dist/，改为自动构建
```

**两种都应该没问题。** 如果显示直接部署但 dist 是旧的/空的，
说明你本地的 dist 有问题，删掉重新构建：

```powershell
rm -r dist
node build.mjs
```

---

# 第四部分：Actions 一直失败

点红色运行 → 看 `build` 任务日志。

| 报错 | 原因 | 解决 |
|---|---|---|
| `Cannot find module` | 引入不存在的包 | 本项目零依赖，检查有没有手贱加 import |
| `node: command not found` | Node 环境问题 | workflow 里已指定 node 20，检查文件在不在 |
| `JSON parse error` | json 文件格式错 | 用 https://json.cn 检查 |
| 构建脚本报错 | Markdown 或语法问题 | 本地 `node build.mjs` 复现 |

**快速定位**：本地跑 `node build.mjs`。
本地过了但 Actions 不过 → 通常是文件没推全（`git status` 看）。

---

# 第五部分：Actions 卡在"等待批准"

1. 仓库 **Settings** → **Environments**
2. 点任何设了审核人的环境（旧流程叫 `github-pages`）
3. **Required reviewers** 清空
4. **Save**

---

# 第六部分：文章没出现在网站上

按顺序查：

1. **`draft` 是不是 `true`** → 改成 `false` 或删掉这行
2. **文件后缀是 `.md`** 吗
3. **在 `src/content/docs/` 下**吗（不是别的目录）
4. **分类目录名和 taxonomy.json 的 `id` 对得上**吗
5. **Actions 绿勾**吗
6. 本地 `node build.mjs` 后，`dist/docs/.../` 里有生成吗

---

# 第七部分：内嵌语法没渲染

| 现象 | 原因 |
|---|---|
| `:::note` 显示成纯文字 | 容器没闭合，缺结尾的 `:::` |
| `::card{}` 显示成纯文字 | 指令**必须单独占一行**，前后空行 |
| 参数没生效 | 用英文竖线 `|` 分隔，不是中文竖线 |
| 代码高亮乱了 | 用三个反引号包裹，别用缩进 |
| 图片不显示 | 路径错，`/img/xxx.png` 要在 `public/img/` 里 |

## 正确写法示例

```markdown
正文段落。

::card{/docs/xxx/yyy/|标题|描述}

下一段。
```

**⚠️ 指令必须独占一行，前后各有一个空行。**

---

# 第八部分：某个功能不生效

| 现象 | 原因 |
|---|---|
| 深色模式切换没反应 | `src/assets/app.js` 没被复制（已修复，确认你用的是新版） |
| 代码复制按钮不出现 | 同上 |
| 阅读进度条不动 | 同上 |
| 图片点了不能放大 | 只有 `::figure` 插入的图能放大，普通 Markdown 图片不能 |
| 代码没行号 | 确认用的是新版构建器 |

**通用解决**：

```powershell
rm -r dist
node build.mjs
```

然后看 `dist/assets/` 里应该有 `app.js`、`search.js`、`cache.js`、`version.js` 这些文件（不含任何防护脚本）。

---

# 第九部分：邮箱问题

见 [07-Email-Setup.md](07-Email-Setup.md) 第七部分。

快速版：

| 现象 | 解决 |
|---|---|
| 收不到邮件 | MX 改回灰云 |
| 收不到邮件 | Gmail 点验证链接 |
| 进垃圾箱 | 检查 SPF/DKIM |
| 大量垃圾 | 关 Catch-all |

---

# 第十部分：Google 收录问题

见 [08-SEO.md](08-SEO.md)。

**最常见的"假故障"**：

sitemap 显示"无法读取"，但 URL 检查显示"可编入索引"。

→ 这是**新站排队中的正常状态**，等 24-72 小时，别反复提交。

---

# 第十一部分：本地环境问题

| 现象 | 解决 |
|---|---|
| `node: command not found` | 装 Node.js ≥ 18（推荐 20 LTS），装完**重开终端** |
| `git: command not found` | 装 Git for Windows |
| `openref` 不是内部命令 | 确认 `C:\Users\zhangyang\bin` 已加 PATH，且重开了终端 |
| 端口 4321 被占用 | 关掉占用程序，或不用 `--serve` |
| 构建报 JSON 错误 | 检查 `taxonomy.json` / `authors.json` |
| `permission denied`（push 时） | token 过期，重新生成 |

---

# 第十二部分：通用排查顺序（不知道哪错时用）

```
1. 本地 node build.mjs
   └─ 不过 → 修源码（看报错）
   └─ 过了 → 继续

2. git status
   └─ 有未提交的改动 → git add . && git commit

3. git push
   └─ 报错 → 看是不是 token 或网络

4. 仓库 Actions
   └─ 🔴 红 → 点进去看日志
   └─ 🟡 黄 → 等着
   └─ 🟢 绿 → 继续

5. 无痕模式打开网站
   └─ 没更新 → 等 2 分钟，清缓存

6. Cloudflare DNS
   └─ 站点记录是灰云吗？

7. GitHub Pages 设置
   └─ Custom domain 还在吗？
   └─ Source 是 GitHub Actions 吗？
```

**按这个顺序走，99% 的问题能定位。**

---

# 第十三部分：实在解决不了

把这些信息一起发给别人求助：

1. **报错截图**（完整的，包括地址栏）
2. **Actions 日志**（点开红色任务的完整输出）
3. **本地 `node build.mjs` 的输出**
4. **Cloudflare DNS 记录截图**
5. **你最近改了什么文件**
