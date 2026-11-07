# 12 · 从零搭建全自动发布（⭐ 最重要，第一次就照这份做）

这份是**主教程**。假设你电脑上除了 Node / Java / Python / Git，
**什么都没有**——没有 openref 文件夹、没装 wrangler、没登录过 Cloudflare。

照着做一遍，大约 40–60 分钟，做完之后：

> **你以后在手机上改文章、点提交，1–3 分钟网站自动更新，不用碰电脑。**

---

## 零、开始前先确认三件事

### 0-1. 怎么打开 PowerShell

三种方法任选一种：

| 方法 | 操作 |
|---|---|
| 开始菜单 | 点 Windows 图标 → 直接打 `PowerShell` → 回车 |
| 右键 | 桌面空白处右键 → 「在终端中打开」 |
| 文件夹里 | 打开任意文件夹 → 地址栏删掉内容 → 打 `powershell` → 回车 |

打开后是一个蓝色窗口，光标前面有 `PS C:\...>` 这样的字样。

⚠️ **不要用 cmd**，虽然也能跑，但本教程的命令都按 PowerShell 写。
实际上两者大部分命令通用，PowerShell 更现代。

### 0-2. 确认 Node 装好了

在 PowerShell 里输入（输完按回车）：

```powershell
node --version
```

**应该看到**：`v20.x.x` 或 `v22.x.x` 之类的版本号。

**如果显示"不是内部或外部命令"**：说明 Node 没装或没加到 PATH。
去 https://nodejs.org 下载 LTS 版本安装，装完**重开 PowerShell** 再试。

### 0-3. 确认 npm 能用

```powershell
npm --version
```

**应该看到**：`10.x.x` 之类的版本号。

npm 是 Node 自带的，装了 Node 一般就有它。

### 0-4. 确认 Git 装好了

```powershell
git --version
```

**应该看到**：`git version 2.x.x`

### 0-5. 关于 Git 的配置（你已经配过了）

你说 Git 在另一个项目配过 —— 那说明**全局用户名和邮箱已经设好了**，
这个新项目会自动继承，不用重配。

想确认的话跑这两条：

```powershell
git config --global user.name
git config --global user.email
```

会显示你之前设的用户名和邮箱。**只要是你的信息就不用管。**

如果是空的，跑这两条设一下（把引号里换成你自己的）：

```powershell
git config --global user.name "rainbowcrr-sys"
git config --global user.email "你的邮箱@gmail.com"
```

### 0-6. 关于免密（重要，先做掉）

你说不想每次输用户名密码。跑这一条：

```powershell
git config --global credential.helper manager
```

跑完**没有任何输出**就是成功了。

作用：第一次 push 时输一次凭证，之后 Windows 帮你记住，永久免密。

---

## 一、把代码弄到电脑上

你电脑上现在还没有 `openref` 文件夹，所以要"克隆"（下载）一份。

### 1-1. 进入用户目录

```powershell
cd C:\Users\zhangyang
```

`cd` 是"进入某个文件夹"的意思。

⚠️ 如果你的用户名不是 `zhangyang`，先跑这条看看真实路径：

```powershell
echo $env:USERPROFILE
```

它会显示类似 `C:\Users\zhangyang`，用显示出来的那个路径。

### 1-2. 克隆仓库

```powershell
git clone https://github.com/rainbowcrr-sys/openref.git
```

**会发生什么**：屏幕上滚过一堆 `remote: ...` 的文字。

**看到什么算成功**：最后出现 `done`，并且不再有红色的 `fatal:`。

**检查**：

```powershell
ls openref
```

应该能看到 `build.mjs`、`src`、`package.json` 等文件。

### 1-3. 如果 clone 让你输密码

现在 GitHub **不支持用登录密码**了，要用 **Personal Access Token（个人令牌）**。

**怎么拿 token**：

1. 浏览器打开 https://github.com/settings/tokens
2. 右上角 **Generate new token** → 选 **Generate new token (classic)**
3. **Note** 随便填，比如 `openref-pc`
4. **Expiration** 选 `No expiration`（不过期）
5. 勾选 **`repo`**（第一组，全勾上）
6. 拉到底点 **Generate token**
7. **立刻复制那串 `ghp_` 开头的字符**（关掉就看不见了）

回到 PowerShell 重新 clone，密码那里**粘贴这个 token**。

> 输密码时屏幕**不会显示任何字符**（不显示 `*`，连光标都不动），这是正常的，
> 粘完直接回车就行。

### 1-4. 进入项目目录（以后每次都从这里开始）

```powershell
cd C:\Users\zhangyang\openref
```

**记住这条命令**，后面每一步都要先进入这个目录。

**以后每次打开 PowerShell，第一件事就是跑这条。**

---

## 二、把新版本的文件放进去（如果你下载了我给的 zip）

如果你从我这里拿到了一个新的 `openref.zip`，需要用它覆盖刚 clone 下来的旧文件：

1. 解压 `openref.zip`，得到一个 `openref` 文件夹
2. 把它复制到 `C:\Users\zhangyang\` 下面
3. 提示"合并"或"替换"时 → 选**全部替换**

⚠️ **不要删掉 `.git` 文件夹**（它是隐藏文件夹，默认可能看不到）。
覆盖操作不会动它，只要你不手动删就没事。

**验证新文件在不在**：

```powershell
cd C:\Users\zhangyang\openref
ls wrangler.toml
```

能看到 `wrangler.toml` 这个文件说明新版本到位了。

---

## 三、装 Wrangler（上传到 Cloudflare 的工具）

### 3-1. 安装

```powershell
npm install -g wrangler
```

**会发生什么**：屏幕滚过一堆安装信息，可能要等 1–3 分钟。

`-g` 表示"全局安装"，装完之后在任何目录都能用。

**看到什么算成功**：最后有 `added xxx packages` 之类的字样，没有红色的 `ERR!`。

### 3-2. 验证

```powershell
wrangler --version
```

**应该看到**：`3.x.x` 或更高的版本号。

### 3-3. 常见问题

| 现象 | 原因 | 怎么办 |
|---|---|---|
| 卡住不动很久 | 网络慢 | 等着，或者换手机热点 |
| 报 `EACCES` 权限错误 | 权限不够 | 用管理员身份重开 PowerShell 再跑 |
| 报 `npm ERR!` | 网络问题 | 再跑一次，多数情况重试就好 |
| `wrangler 不是命令` | 没加到 PATH | 重开 PowerShell；还不行就重启电脑 |

---

## 四、登录 Cloudflare

```powershell
npx wrangler login
```

⚠️ **必须在 `C:\Users\zhangyang\openref` 目录下跑**（前面已经 cd 过了）。

**会发生什么**：

1. 命令行显示 `Attempting to login via OAuth...`
2. **自动弹出浏览器**（如果没弹，命令行会显示一个网址，手动复制到浏览器打开）
3. 浏览器显示 Cloudflare 登录页 → 没登录就先登录
4. 出现授权页，写着 Wrangler 想要访问你的账户 → 点 **Allow（允许）**
5. 浏览器显示 `Successfully logged in`
6. 回到 PowerShell，显示 `Successfully logged in`

**看到什么算成功**：PowerShell 里出现 **`Successfully logged in`**。

⚠️ **这个登录不需要信用卡，不会扣任何钱。**

### 常见问题

| 现象 | 怎么办 |
|---|---|
| 浏览器没弹出来 | 手动复制命令行里的网址到浏览器 |
| 点了 Allow 但命令行没反应 | 等 10 秒；还不行就重新跑一次命令 |
| 报 `timeout` | 网络问题，重试 |

---

## 五、第一次部署：创建 Workers 项目

这一步会做两件事：**构建网站** + **在 Cloudflare 上创建项目并上传**。

### 5-1. 跑部署命令

```powershell
openref deploy
```

⚠️ 如果你还没装 `openref` 命令（第一次肯定没有），直接用原始命令：

```powershell
node build.mjs
npx wrangler deploy
```

这两条等价于 `openref deploy`。

### 5-2. 会发生什么

**第一段**（构建）：

```
构建完成：dist/ 共 46 个文件，6 篇文章。
站点地址：https://openref.de5.net
```

**第二段**（上传），会问你：

```
? No project found. Create a new one? (Y/n)
```

**输入 `Y` 然后回车。**

**第三次可能问**：

```
? Enter the name of your new project: ›
```

**输入 `openref` 然后回车。**

**第四次可能问**（是否部署到生产环境）：

```
? Would you like to deploy to production? (Y/n)
```

**输入 `Y` 回车。**

### 5-3. 看到什么算成功

最后出现类似：

```
Total Upload: 46 files
Uploaded openref (x.xx sec)
Deployed openref triggers
  https://openref.xxxxx.workers.dev
Current Version ID: xxxxxxxx
```

**把 `https://openref.xxxxx.workers.dev` 这个地址记下来**（复制到记事本）。

这是 Cloudflare 给你的临时地址。后面绑了你自己的域名后，主要用自己域名，
但这个地址也能访问，可以留着当备用。

### 5-4. 如果名字被占了

如果报 `project name already exists`，说明 `openref` 这个名字被用了
（可能是你之前建过别的项目）。

**解决办法**：改 `wrangler.toml` 里的名字：

```toml
name = "openref-site"
```

然后重新跑 `npx wrangler deploy`。

⚠️ 改了之后，后面 GitHub Actions 里的项目名也要一致——
但因为我们用的是 `wrangler.toml` 里的名字，Actions 会自动读，所以不用改别的。

---

## 六、绑定你的域名（⚠️ 必须在传更多内容之前做）

### 6-1. 为什么要先做这个

如果你先手动建了 DNS 记录指向 `xxx.workers.dev`，
Cloudflare 再绑域名就会报 **522 连接超时**——因为已存在的记录会挡住它。

**先绑域，Cloudflare 自己把 DNS 建好，就不会打架。**

### 6-2. 操作步骤

1. 浏览器打开 **https://dash.cloudflare.com** 并登录
2. 左侧菜单点 **Workers 和 Pages**
3. 在列表里找到 **`openref`**（或你改过的名字），**点它名字**
4. 点页面上方的 **设置**（Settings）标签
5. 往下找，点 **域和路由**（Domains & Routes）
6. 点 **添加**（Add）按钮
7. 弹出的选项里选 **自定义域**（Custom Domain）
8. 输入框里填：**`openref.de5.net`**
9. 点 **添加域**（Add domain）或 **提交**

### 6-3. 会发生什么

Cloudflare 自动做三件事：

- 在 DNS 里创建正确的记录（橙云，带小锁图标）
- 申请并签发 SSL 证书
- 配置路由

**等待 1–5 分钟**，状态从 **`Initializing`（初始化中）** 变成 **`Active`（活跃）**。

**看到什么算成功**：状态显示 **`Active`**，旁边有绿色的勾。

### 6-4. 顺手把 www 也绑上（可选）

重复一遍 6-2 的步骤，第 8 步改成填 **`www.openref.de5.net`**。

好处：`www.openref.de5.net` 也能访问，有人习惯打 www。

### 6-5. 如果一直卡在 Initializing

| 原因 | 怎么办 |
|---|---|
| 有冲突的旧 DNS 记录 | 见第七步，删掉旧的再等 |
| 刚改完 DNS，还在生效 | 等 10 分钟再看 |
| CAA 记录挡住了 | 检查 DNS 里有没有 CAA 记录，有的话删掉 |

---

## 七、清理旧 DNS 记录（重要）

你之前用过 GitHub Pages，DNS 里很可能还留着指向 GitHub 的旧记录。
**不删会和 Workers 打架，导致 522 超时。**

### 7-1. 打开 DNS 页面

1. Cloudflare 首页，左侧点你的域名 **`openref.de5.net`**
2. 点左侧菜单 **DNS**
3. 点 **记录**

### 7-2. 要删掉的（看到就删）

| 类型 | 名称 | 内容里有什么 |
|---|---|---|
| CNAME | `@` | `rainbowcrr-sys.github.io` |
| CNAME | `www` | `rainbowcrr-sys.github.io` |
| A | `@` | `185.199.` 开头的 IP（可能有 4 条） |
| CNAME | `docs` | 任何指向 workers.dev 的旧记录 |
| CNAME | 其他 | 任何指向 `github.io` 的 |

**怎么删**：每条记录右边点 **编辑** → 找到 **删除** → 确认。

### 7-3. 绝对不要动的（很重要）

| 类型 | 说明 |
|---|---|
| **MX**（3 条） | 管邮件接收的 |
| **TXT**（若干条） | SPF / DKIM / DMARC，管邮件安全的 |

**这几条的云朵必须是灰色（DNS only）。**
橙了邮件就收不到了。

**怎么确认是灰云**：看「代理状态」那一列，
灰色云朵 + 写着「仅 DNS」= 对的；
橙色云朵 + 写着「已代理」= 错了，点它切回灰色。

### 7-4. 保留的（Cloudflare 自动建的）

绑域之后，DNS 里会多出一条指向 workers.dev 的记录，
**带一个小锁图标**（🔒），这表示受保护。

**这条不要动，也动不了**（点了编辑会发现代理状态改不了）。

### 7-5. 清理完应该长这样

| 类型 | 名称 | 代理状态 |
|---|---|---|
| MX（3条） | 各种 | 灰云 ✅ |
| TXT（若干） | `_dmarc` 等 | 灰云 ✅ |
| CNAME | `@` → workers.dev | 橙云带锁 ✅ 不能改 |

没有指向 `github.io` 的，没有 `185.199` 的 A 记录。

---

## 八、配置 GitHub 自动部署（核心，做完就一劳永逸）

这一步做完，**你以后在手机上改文章提交，网站自动更新**。

需要往 GitHub 里放三个值：两个密匙 + 一个开关。

### 8-1. 拿 API Token

1. Cloudflare 页面，**右上角点你的头像**
2. 点 **My Profile**（我的个人资料）
3. 左侧点 **API Tokens**（API 令牌）
   - 直达网址：https://dash.cloudflare.com/profile/api-tokens
4. 右侧点 **Create Token**（创建令牌）
5. 往下找到一个叫 **`Edit Cloudflare Workers`** 的模板
6. 点它右边的 **Use template**（使用模板）
7. 页面往下，**权限部分不用改**（模板已经配好了）
8. 拉到底点 **Continue to summary**（继续到摘要）
9. 点 **Create Token**（创建令牌）
10. ⚠️ **立刻复制那串字符**（关掉页面就再也看不到了，只能重新建）

**存到记事本里**，下一步要用。

> 如果找不到 `Edit Cloudflare Workers` 模板，选 **Create Custom Token**，
> 然后按这个填：
> - 权限 1：账户 → Workers Scripts → 编辑（Edit）
> - 权限 2：区域 → Workers Routes → 编辑（Edit）
> - 账户资源：包含 → 你的账户
> - 区域资源：包含 → `openref.de5.net`

### 8-2. 拿 Account ID

1. Cloudflare 左侧点 **Workers 和 Pages**
2. 看**右侧栏**，找到 **Account ID**
3. 是一串 32 位字符，点旁边的**复制按钮**

也存到记事本。

### 8-3. 把两个密匙加到 GitHub

1. 浏览器打开 **https://github.com/rainbowcrr-sys/openref**
2. 点仓库顶部的 **Settings**（设置）
3. 左侧菜单往下找，点 **Secrets and variables**
4. 点 **Actions**
5. ⚠️ 确认你现在在 **Secrets** 标签下（页面上方有两个标签：
   **Secrets** 和 **Variables**，先看 Secrets）

**加第一个**：

点右上角 **New repository secret**（新建仓库密匙）

- **Name** 填：`CLOUDFLARE_API_TOKEN`
- **Secret** 粘贴 8-1 拿到的那串 token
- 点 **Add secret**

**加第二个**：

再点 **New repository secret**

- **Name** 填：`CLOUDFLARE_ACCOUNT_ID`
- **Secret** 粘贴 8-2 拿到的 Account ID
- 点 **Add secret**

**看到什么算成功**：页面列表里出现这两条，名字对得上就行
（值会显示成 `***`，看不到内容，这是正常的）。

### 8-4. 加开关变量（⚠️ 是 Variables，不是 Secrets）

⚠️ **点页面上方的 `Variables` 标签**（和 Secrets 并排的那个）。

点 **New repository variable**（新建仓库变量）

- **Name** 填：`AUTO_DEPLOY`
- **Value** 填：**`true`**

点 **Add variable**

**看到什么算成功**：Variables 列表里出现 `AUTO_DEPLOY = true`。

### 8-5. 这个开关是什么意思

| AUTO_DEPLOY | 行为 |
|---|---|
| `true` | 构建完**自动**上传到 Workers（**手机提交即上线**） |
| `false` | 只构建不部署，你自己下载文件手动上传 |

**我们就用 `true`。**

以后想改成手动，回到这里把值改成 `false` 就行，**不用改代码**。

---

## 九、测试整条管道

### 9-1. 推一次代码

在 PowerShell 里（记得先 `cd C:\Users\zhangyang\openref`）：

```powershell
git add .
git commit -m "配置 Workers 自动部署"
git push
```

如果有新文件（比如 wrangler.toml）没提交，这一步会带上它们。

**看到什么算成功**：最后有 `main -> main`。

> 如果让你输密码：用户名填 GitHub 用户名，密码填 **token**（不是登录密码）。
> 输过一次之后，前面配的 `credential.helper manager` 会记住，以后不用再输。

### 9-2. 看 Actions 跑没跑

1. 打开 **https://github.com/rainbowcrr-sys/openref/actions**
2. 最上面应该有一条新的运行记录
3. 前面是 🟡 **黄点**（正在跑）
4. 等 1–3 分钟变成 🟢 **绿勾**

**看到什么算成功**：🟢 绿勾。

### 9-3. 如果 Actions 报错（红叉）

点进去 → 点 `build` 任务 → 展开红色的那一步看错误信息：

| 报错文字 | 原因 | 怎么办 |
|---|---|---|
| `Authentication error` | token 错了或没权限 | 重新做 8-1，确认用的是 `Edit Cloudflare Workers` 模板 |
| `Could not find account` | Account ID 错了 | 重新复制 8-2 |
| `No project found` | 项目名对不上 | 检查 `wrangler.toml` 里的 `name` |
| `Too many requests` | 手速太快 | 等一分钟再跑 |
| `AUTO_DEPLOY` 不生效 | 加到了 Secrets 里 | 必须在 **Variables** 标签下 |

### 9-4. 验证网站

浏览器用**无痕模式**（Ctrl+Shift+N）打开：

```
https://openref.de5.net
```

**看到什么算成功**：

- ✅ 能打开，样式正常（不是纯文字）
- ✅ 首页统计数字显示
- ✅ 不拦截右键菜单
- ✅ F12 可正常打开

---

## 十、做完之后，日常怎么用

### 10-1. 平时（手机 / 任何设备）

在 GitHub 网页上改文章、新建文章 → **Commit changes** → 等 1–3 分钟 → 网站自动更新。

**你什么都不用下载，什么都不用上传。**

### 10-2. 周末（在电脑前）

```powershell
cd C:\Users\zhangyang\openref
openref pull          # 先拉最新
# 写文章
openref push "说明"    # 推送，自动部署
```

或者本地先看效果：

```powershell
openref serve         # 打开 localhost:4321 预览
```

### 10-3. 如果想手动控制发布时机

把 `AUTO_DEPLOY` 改成 `false`，然后：

1. push 代码（GitHub 只构建）
2. 去 Actions 页面 → 点那次运行 → 下拉找 **Artifacts**
3. 点 **`openref-dist`** 下载 zip（要登录 GitHub，保留 90 天）
4. Cloudflare → `openref` 项目 → **New deployment** → 选 Production
5. 上传 zip → **Save and Deploy**

---

## 十一、完整检查清单（做完逐项打勾）

### 本地

- [ ] `node --version` 有版本号
- [ ] `git --version` 有版本号
- [ ] `wrangler --version` 有版本号
- [ ] `npx wrangler login` 显示 Successfully logged in
- [ ] `C:\Users\zhangyang\openref` 目录存在，里面有 `wrangler.toml`
- [ ] `wrangler.toml` 里**没有 `main` 字段**

### Cloudflare

- [ ] Workers 和 Pages 里有 `openref` 项目
- [ ] 自定义域 `openref.de5.net` 状态是 **Active**
- [ ] DNS 里没有指向 `github.io` 的记录
- [ ] DNS 里没有 `185.199.` 开头的 A 记录
- [ ] MX / TXT 记录是**灰云**
- [ ] SSL 模式是「完全（严格）」
- [ ] 「始终使用 HTTPS」已开

### GitHub

- [ ] Secrets 里有 `CLOUDFLARE_API_TOKEN`
- [ ] Secrets 里有 `CLOUDFLARE_ACCOUNT_ID`
- [ ] **Variables** 里有 `AUTO_DEPLOY = true`
- [ ] Actions 最近一次是 🟢 绿勾

### 网站

- [ ] `https://openref.de5.net` 能打开，样式正常
- [ ] `https://openref.de5.net/robots.txt` 能打开
- [ ] `https://openref.de5.net/sitemap.xml` 能打开
- [ ] `https://openref.de5.net/404.html` 或随便一个不存在的页面 → 出现 404 快闪页
- [ ] 右键菜单可用（不拦截）
- [ ] F12 可正常打开
- [ ] 深色模式切换能用，刷新后不变

---

## 十二、故障速查

| 现象 | 原因 | 解决 |
|---|---|---|
| `522 连接超时` | 旧 DNS 记录冲突 | 第七步，删掉旧记录，等 5 分钟 |
| 打开是 404 | 内容没传上去 | 重新 `npx wrangler deploy` |
| 能打开但没样式 | 部署的是源码 | 检查 `wrangler.toml` 的 `directory` 是 `./dist` |
| 改了内容网站没变 | 没重新部署 | push 后看 Actions 是不是绿勾 |
| Actions 报认证错 | token 问题 | 重建 token，用 `Edit Cloudflare Workers` 模板 |
| 绑域一直 Initializing | 有冲突记录 | 删旧记录再等 |
| 请求突然 429 | 加了 `main` | 删掉 `main` 重新部署 |
| 邮件收不到 | MX 变橙云 | 改回灰云 |
| `openref` 不是命令 | 没装工具 | 见下面「怎么装 openref 命令」 |

---

## 十三、怎么装 `openref` 命令（可选但推荐）

装了之后，命令从一长串变成短短一条，很方便。

### 步骤

1. 在 `C:\Users\zhangyang\` 下面建一个文件夹，叫 **`bin`**
   （右键新建文件夹，或者 PowerShell 里跑 `mkdir C:\Users\zhangyang\bin`）

2. 把源码包里的 `tools\openref.cmd` 复制到 `C:\Users\zhangyang\bin\` 里

3. 把 `bin` 加到 PATH：
   - Windows 搜索框打「**环境变量**」
   - 点「**编辑账户的环境变量**」（不是系统的那个）
   - 上半部分「用户变量」里找到 **`Path`**，双击它
   - 点 **新建** → 输入 `C:\Users\zhangyang\bin` → 确定
   - 一路点确定关掉所有窗口

4. **重开 PowerShell**，输入 `openref help`

**看到什么算成功**：显示出命令列表。

### 装好后的命令

| 命令 | 作用 |
|---|---|
| `openref` | 直接进入工作目录 |
| `openref help` | 显示帮助 |
| `openref pull` | 拉最新代码 |
| `openref build` | 构建（不上传） |
| `openref serve` | 本地预览 localhost:4321 |
| `openref login` | 登录 Cloudflare |
| `openref deploy` | 构建 + 上传（一条龙） |
| `openref push "说明"` | add + commit + push |
| `openref new` | 新建文章 |
| `openref code` | 用 VS Code 打开 |

---

## 十四、一句话总结

```
clone 代码 → npm 装 wrangler → wrangler login → wrangler deploy 建项目
→ 后台绑域名 → 删旧 DNS → GitHub 放两个密匙 + AUTO_DEPLOY=true
→ push 测试 → 以后手机改文章自动上线
```
