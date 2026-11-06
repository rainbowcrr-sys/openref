# 13 · 配置速查卡（周末操作时放旁边对照）

**这是一页纸速查版。** 详细解释见 [12-Setup-From-Scratch.md](12-Setup-From-Scratch.md)。

配完之后：**手机上改文章 → 提交 → 等 1-3 分钟 → 网站自动更新** ✅

---

## 9 步流程（勾选式）

```
□ 步骤 1  拿到代码（电脑上还没有 openref 文件夹时）
          cd C:\Users\zhangyang
          git clone https://github.com/rainbowcrr-sys/openref.git
          看到 "done" 就算成

□ 步骤 1b 如果拿到了新的 openref.zip
          解压 → 覆盖到 C:\Users\zhangyang\openref\
          ⚠️ 别删 .git 文件夹（隐藏的）

□ 步骤 2  cd C:\Users\zhangyang\openref
          git add . && git commit -m "迁移 Workers" && git push
          看到 "main -> main" 就算成

□ 步骤 3  npm install -g wrangler
          wrangler --version   （有版本号就行）

□ 步骤 4  npx wrangler login
          浏览器点 Allow → 显示 Successfully logged in

□ 步骤 5  openref deploy
          问 Create a new one? → 输 Y
          记下给你的 https://openref.xxxxx.workers.dev

□ 步骤 6  ⚠️ 先绑域（顺序不能错）
          Cloudflare → Workers 和 Pages → openref
          → 设置 → 域和路由 → 添加 → 自定义域
          → 填 openref.de5.net → 等状态变 Active

□ 步骤 7  Cloudflare → DNS → 记录
          ❌ 删：含 rainbowcrr-sys.github.io 的 CNAME
          ❌ 删：185.199. 开头的 A 记录
          ❌ 删：旧的 docs 记录
          ✅ 留：MX 和 TXT（必须灰云）

□ 步骤 8  拿两串字符 → 交给 GitHub
          · API Token：Cloudflare 头像 → My Profile
                       → API Tokens → Create Token
                       → 用 Edit Cloudflare Workers 模板
                       → ⚠️ 立刻复制，只显示一次
          · Account ID：Workers 和 Pages 页面右侧栏

          GitHub 仓库 → Settings → Secrets and variables → Actions
          → Secrets 标签：
             CLOUDFLARE_API_TOKEN     = 那串 token
             CLOUDFLARE_ACCOUNT_ID    = Account ID

□ 步骤 9  openref push "测试"
          → Actions 页面等绿勾 🟢
          → 无痕模式打开 https://openref.de5.net
```

---

## 三张关键截图对照（文字版）

### wrangler.toml 应该长这样

```toml
name = "openref"
compatibility_date = "2026-10-29"

[assets]
directory = "./dist"
not_found_handling = "404-page"
```

**🚫 绝对不要有 `main` 这一行。**
加了就变成每个请求跑代码，开始消耗 10 万次/天额度。

### DNS 最终应该长这样

| 类型 | 名称 | 云朵 | 说明 |
|---|---|---|---|
| CNAME | `@` | ☁️ **橙（带锁）** | 绑域时自动建 |
| CNAME | `www` | ☁️ **橙（带锁）** | 可选 |
| MX ×3 | 各种 | 🌑 **灰** | 邮件，永远别动 |
| TXT | `_dmarc` 等 | 🌑 **灰** | 邮件安全，永远别动 |

**口诀：站点橙、邮件灰。**

### GitHub Secrets 应该有两个

```
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
```

名字一字不差，多了空格都不行。

---

## 常用命令

| 命令 | 作用 |
|---|---|
| `openref pull` | 拉最新代码 |
| `openref build` | 只构建 |
| `openref serve` | 本地预览 localhost:4321 |
| `openref push "说明"` | 提交+推送（**触发自动部署**） |
| `openref deploy` | 本地构建+直接上传 |
| `openref new` | 新建文章（交互式） |
| `openref code` | VS Code 打开 |

---

## 出问题先查这三处

```
1. Actions 是不是绿勾？
   ├─ 红叉 → 点进去看日志
   └─ 绿勾 → 下一步

2. Workers 后台自定义域是不是 Active？
   ├─ 不是 → DNS 有冲突记录，删掉
   └─ 是 → 下一步

3. 无痕模式打开网站
   ├─ 404 → 重新 openref deploy
   ├─ 没样式 → 检查传的是不是 dist
   └─ 正常 → 可能是浏览器缓存
```

## 高频故障速查

| 现象 | 解决 |
|---|---|
| `522 超时` | 删旧 DNS 记录，等 5 分钟 |
| 绑域一直转圈 | 有冲突 CNAME，删掉 |
| Actions 认证失败 | 重建 token，确认 Workers Scripts: Edit |
| `Could not find account` | Account ID 复制错了 |
| 样式没了 | 传的是源码不是 dist |
| 改了没变化 | 没 push，或 Actions 没跑 |
| 邮件收不到 | MX 变橙云了，改回灰 |

---

## 一句话记住

**不加 main → 先绑域 → 站点橙邮件灰 → push 即上线**
