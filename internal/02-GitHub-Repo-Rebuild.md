# 02 · GitHub 仓库与删库重建（第二重要）

包含：**首次建仓库、日常配置、删仓库重建的完整流程、Actions 设置、域名绑定**。

---

# 第一部分：首次建仓库（第一次做）

## 一、在 GitHub 网页上建

1. 打开 https://github.com，登录
2. 右上角 **+** → **New repository**
3. 填写：

| 项目 | 填什么 |
|---|---|
| Repository name | `openref` |
| Description | 随便写，比如 `OpenRef 技术参考` |
| Public / Private | 选 **Public**（Pages 免费版要求） |
| ☑ Add a README file | **不要勾** |
| ☑ Add .gitignore | **不要勾** |
| ☑ Choose a license | **不要勾** |

4. 点 **Create repository**

⚠️ 三个都不要勾，保持**完全空的仓库**，不然本地推代码会冲突。

## 二、把本地代码推上去

如果你本地已经有代码目录：

```powershell
cd C:\Users\zhangyang\openref
git init                      # 如果还没初始化
git remote add origin https://github.com/rainbowcrr-sys/openref.git
git branch -M main
git add .
git commit -m "init"
git push -u origin main
```

如果目录还没有，先克隆：

```powershell
cd C:\Users\zhangyang
git clone https://github.com/rainbowcrr-sys/openref.git
cd openref
```

---

# 第二部分：删仓库重建（重点，你问过的）

## 为什么要"先解绑域名"

GitHub 会记录"哪个仓库占用了 `openref.de5.net` 这个域名"。

**如果旧仓库没解绑就删掉，新仓库绑域名时会报：**

```
The custom domain is already taken
```

所以顺序很重要：**解绑 → 删除 → 重建 → 重绑**。

---

## 完整八步流程

### 第 0 步：备份本地代码（必做）

```powershell
cd C:\Users\zhangyang\openref
git pull origin main
```

确认本地有完整代码，特别是：

- `src/` 整个目录
- `public/google5aedecd6e50def2e.html`（Google 验证文件）
- `internal/`（如果不想公开，先复制到网盘）

**删仓库不影响本地文件**，但保险起见先确认一遍。

### 第 1 步：旧仓库解绑自定义域

1. 打开旧仓库 `github.com/rainbowcrr-sys/openref`
2. **Settings** → 左侧 **Pages**
3. 找到 **Custom domain** 输入框，里面有 `openref.de5.net`
4. 右边点 **Remove**
5. 等页面提示已移除

### 第 2 步：删除旧仓库

1. 旧仓库 → **Settings**
2. 左侧 **General**
3. 拉到**最底部** → **Danger Zone**（危险区域）
4. 点 **Delete this repository**
5. 弹窗里输入完整仓库名 `openref` 确认
6. 点删除

### 第 3 步：建新仓库

按"第一部分"的步骤建一个**同名空仓库** `openref`，三个勾都不要勾。

### 第 4 步：把本地代码推上去

```powershell
cd C:\Users\zhangyang\openref
git remote -v
```

看输出是不是 `https://github.com/rainbowcrr-sys/openref.git`。

- **是** → 直接推：

```powershell
git push -u origin main
```

- **不是或报错** → 重设远程地址：

```powershell
git remote set-url origin https://github.com/rainbowcrr-sys/openref.git
git push -u origin main
```

### 第 5 步：配置 Actions 的两个密钥

现在部署目标是 Cloudflare Workers，Actions 需要凭证才能上传。

1. 新仓库 → **Settings** → **Secrets and variables** → **Actions**
2. 确认在 **Secrets** 标签下
3. 点 **New repository secret**，加两个：

| Name | 值 |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Cloudflare 的 API Token |
| `CLOUDFLARE_ACCOUNT_ID` | 你的 Account ID |

**怎么拿这两个值**：见 [01-Cloudflare-Setup.md](01-Cloudflare-Setup.md) 第二部分步骤 8，有逐步说明。

⚠️ **不需要**再开仓库的 Pages 功能——站点已经不在 GitHub 上了，在 Cloudflare。

### 第 6 步：等第一次 Actions 跑完

1. 仓库顶部点 **Actions** 标签
2. 会看到一次运行在跑（🟡 黄点）
3. 点进去能看实时日志
4. 等 1-3 分钟变 🟢 绿勾

**绿勾 = 站点已经自动更新到 Cloudflare Workers 了。**
你不需要下载任何东西，也不需要手动上传。

### 第 7 步：确认自定义域还是 Active

1. Cloudflare → **Workers 和 Pages** → 点 `openref`
2. **设置** → **域和路由**
3. 看 `openref.de5.net` 的状态是不是 **Active**

**删仓库不影响 Cloudflare 的 Workers 项目和自定义域**——它们是两个独立平台。
域名绑在 Workers 上，跟 GitHub 仓库在不在没关系。

所以这一步你**基本什么都不用做**，只要确认状态正常。

### 第 8 步：验证

无痕模式打开 `https://openref.de5.net`，能看到站点就完成了。

从这次之后，你每次 push 都会自动部署，**再也不用手动操作**。

---

## Cloudflare 侧要不要动？

**不用动。**

删仓库不影响 DNS，记录还在。重建后自动生效。

唯一要确认的（见 [01-Cloudflare-Setup.md](01-Cloudflare-Setup.md)）：
**站点记录是灰云。**

---

# 第三部分：分支设置

## 用 main 还是 master

你已确认用 **`main`**。

如果本地是 `master`，改过来：

```powershell
git branch                     # 看当前分支
git branch -m master main      # 改名
git push -u origin main
```

以后都用 `main`。

⚠️ 好消息：`.github/workflows/deploy.yml` 里写的是
`branches: [main, master]`，**两个都触发**，所以即使忘了改也能部署。

---

# 第四部分：GitHub Actions（自动部署）

## 一、它是什么

每次你 `git push`，GitHub 自动执行你定义好的任务。

对你来说就是：**推送 → 自动构建 → 自动部署 → 网站更新**。

## 二、配置文件在哪

`.github/workflows/deploy.yml`

## 三、它的双轨逻辑

```
推送代码
   ↓
检查仓库里有没有 dist/index.html
   ├─ 有  → 直接部署 dist/（你本地构建过）
   └─ 没有 → 自动跑 node build.mjs → 部署
```

**好处**：本地构建过就连 `dist/` 一起推（更快）；
忘了构建也没关系，云端会自己补上。

## 四、看运行状态

仓库 → **Actions** 标签

| 状态 | 含义 | 怎么办 |
|---|---|---|
| 🟡 黄点（in progress） | 正在跑 | 等着 |
| 🟢 绿勾（success） | 成功 | 网站已更新 |
| 🔴 红叉（failure） | 失败 | 点进去看日志 |

**点进某次运行 → 点 `build` 任务 → 展开看具体报错。**

## 五、"卡在等待批准"怎么办

如果 Actions 显示 `waiting for approval`，说明环境设了审核人：

1. 仓库 **Settings** → 左侧 **Environments**
2. 如果里面有 `github-pages`，点进去
3. **Required reviewers** 里如果有你自己 → 删掉（留空）
4. **Save**

之后就是全自动了，不用再点任何东西。

> 注：新的部署流程（wrangler-action）不依赖 `github-pages` 环境，
> 所以这个问题通常不会再出现。真出现了就按上面清掉。

## 六、权限设置

Settings → **Actions** → **General** → 往下找 **Workflow permissions**

选 **Read and write permissions**（读写权限）→ Save

---

# 第五部分：免密推送（不用每次输 token）

## 一、为什么不能用密码

GitHub 从 2021 年起**禁止用账号密码做 Git 操作**。
你之前遇到的 `Invalid username or token. Password authentication is not supported` 就是这个。

必须用 **Personal Access Token（PAT）**。

## 二、生成 token（只做一次）

1. GitHub → 右上角头像 → **Settings**
2. 拉到最底 → **Developer settings**
3. **Personal access tokens** → **Tokens (classic)**
4. **Generate new token (classic)**
5. 填写：

| 项 | 值 |
|---|---|
| Note | `openref-pc` |
| Expiration | 选 `No expiration` 或 90 days |
| 勾选权限 | 只勾 **`repo`**（下面子项会自动全选） |

6. 拉到底点 **Generate token**
7. **⚠️ 立刻复制那串 `ghp_` 开头的字符串**（关掉页面就再也看不到了）

## 三、让 Windows 记住

```powershell
git config --global credential.helper manager
```

然后**第一次 push 时**：

- 用户名填 `rainbowcrr-sys`
- 密码**粘贴那串 token**

之后永久免密，Windows 凭据管理器帮你记着。

## 四、如果 manager 不可用

退而求其次（明文存在本地）：

```powershell
git config --global credential.helper store
```

## 五、设置身份信息

```powershell
git config --global user.name "rainbowcrr-sys"
git config --global user.email "rainbowcrr.sys@gmail.com"
```

## 六、token 过期了怎么办

1. 重新生成一个（同第二节）
2. Windows 搜索"凭据管理器" → **Windows 凭据**
3. 找到 `git:https://github.com` → 编辑 → 密码换成新 token

或者简单粗暴：

```powershell
git credential-manager uninstall
git credential-manager install
```

下次 push 重新输一次。

---

# 第六部分：仓库设置清单（重建后逐项确认）

进仓库 **Settings**，逐项检查：

## General（拉到最底 Features）

| 功能 | 设置 |
|---|---|
| ☑ Wikis | 可关（不用） |
| ☑ Issues | 可关（或用） |
| ☑ Discussions | 可关 |
| ☑ Projects | 可关 |
| ☑ Sponsorships | 可关 |
| **Pages** | **⚠️ 绝对不要关** |
| **Actions** | **⚠️ 绝对不要关** |

## Pages

| 项 | 值 |
|---|---|
| Actions 密钥 `CLOUDFLARE_API_TOKEN` | 已添加 |
| Actions 密钥 `CLOUDFLARE_ACCOUNT_ID` | 已添加 |
| Workers 项目 `openref` | 存在 |
| 自定义域 `openref.de5.net` | Active |
| SSL 模式 | 完全（严格） |
| 始终使用 HTTPS | ✅ 开 |

（站点已不在 GitHub Pages 上，仓库的 Pages 设置可以不管。）

## Actions → General

| 项 | 值 |
|---|---|
| Workflow permissions | **Read and write** |
| Require approval for outside collaborators | **取消勾选** |

## Environments

| 项 | 值 |
|---|---|
| 任何环境的 Required reviewers | **留空** |

## Branches

| 项 | 值 |
|---|---|
| Branch protection rules | 没有（或删掉） |

---

# 第七部分：换电脑 / 本地丢了

## 换电脑

```powershell
# 1. 装 Node（≥18，推荐 20 LTS）、Git、VS Code
# 2. 克隆
cd C:\Users\新用户名
git clone https://github.com/rainbowcrr-sys/openref.git
cd openref

# 3. 配身份和免密
git config --global user.name "rainbowcrr-sys"
git config --global user.email "rainbowcrr.sys@gmail.com"
git config --global credential.helper manager

# 4. 试构建
node build.mjs
```

**Cloudflare 和 GitHub 设置都不用动**，域名、Pages、Actions 全跟着仓库走。

## 本地代码丢了

```powershell
git clone https://github.com/rainbowcrr-sys/openref.git
```

**只要 push 过，就丢不了。所以每次写完记得推。**

---

# 第八部分：回滚到历史版本

```powershell
git log --oneline        # 看提交历史，复制某条前 7 位哈希
git checkout abc1234     # 临时切过去看
git checkout main        # 回来

# 真的要退回（安全方式，不破坏历史）：
git revert abc1234
git push
```

⚠️ 不要用 `git reset --hard` + `git push -f`（强制推送），
会破坏历史，如果有多设备会全乱。

---

# 第九部分：重建后的验收清单

逐项打勾，全部通过才算完成：

- [ ] `https://openref.de5.net/` 能打开
- [ ] 样式正常（不是纯文字）
- [ ] 右键菜单被禁用
- [ ] F12 被拦截
- [ ] 首页统计数字显示正常
- [ ] `/robots.txt` 能打开
- [ ] `/sitemap.xml` 能打开，URL 都是 `https://openref.de5.net/...`
- [ ] `/contribute/` 投稿页能打开
- [ ] `/privacy/`、`/legal/copyright/`、`/contribute/agreement/` 能打开
- [ ] **Actions 是绿勾**
- [ ] **Workers 后台自定义域状态是 Active**
- [ ] `wrangler.toml` 里没有 `main` 字段
- [ ] 深色模式切换能用，刷新后不变
- [ ] 代码复制按钮能用
