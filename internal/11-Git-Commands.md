# 11 · Git 命令速查（忘记命令时查这里）

---

# 第一部分：日常三条（90% 的情况够用）

```powershell
git pull                      # 拉最新代码（开始前做）
git add .                     # 把所有改动加入暂存区
git commit -m "说明"           # 提交到本地
git push                      # 推到 GitHub
```

或者用你的快捷命令：

```powershell
openref pull                  # 拉最新
openref push "说明"            # add + commit + push 一条龙
```

---

# 第二部分：openref 命令全表

| 命令 | 作用 |
|---|---|
| `openref` | 进入工作目录 `C:\Users\zhangyang\openref` |
| `openref help` | 显示帮助 |
| `openref clone` | 首次拉取源码 |
| `openref pull` | 拉最新代码 |
| `openref status` | 看改了哪些文件 |
| `openref build` | 构建站点到 `dist/` |
| `openref serve` | 本地预览 http://localhost:4321 |
| `openref push "说明"` | add + commit + push |
| `openref new` | 交互式新建文章 |
| `openref code` | VS Code 打开项目 |

**安装**：把 `tools/openref.cmd` 放到 `C:\Users\zhangyang\bin\`，
再把该路径加到系统 PATH，重开终端。

---

# 第三部分：查看状态

```powershell
git status                    # 看哪些文件改了、哪些没提交
git log --oneline             # 看提交历史（简洁）
git log                       # 看提交历史（详细）
git diff                      # 看具体改了什么内容
git branch                    # 看当前分支
git remote -v                 # 看远程仓库地址
```

---

# 第四部分：提交相关

```powershell
git add .                          # 加入所有改动
git add 文件名                      # 只加某个文件
git commit -m "说明"                # 提交
git commit --amend -m "新说明"      # 改上一次提交的说明（还没 push 时）
git reset                          # 取消 git add（保留文件改动）
git checkout -- 文件名              # 撤销某个文件的改动
```

⚠️ **危险命令**（会丢东西，慎用）：

```powershell
git reset --hard              # 撤销所有改动，回到上次提交状态
git clean -fd                 # 删除所有未跟踪的文件
```

---

# 第五部分：推送与拉取

```powershell
git push                      # 推送到远程
git push -u origin main       # 首次推送（设置上游分支）
git pull                      # 拉取并合并
git pull --rebase             # 拉取并变基（避免多余合并提交）
git fetch                     # 只拉取不合并（看看有没有更新）
```

## 首次推送报"没有 upstream"

```powershell
git push --set-upstream origin main
```

之后直接 `git push` 就行。

---

# 第六部分：分支

```powershell
git branch                    # 看所有分支（* 是当前）
git branch 分支名              # 创建分支
git checkout 分支名            # 切换分支
git checkout -b 分支名         # 创建并切换
git branch -m 旧名 新名        # 重命名分支
git branch -d 分支名           # 删除分支
```

## 把 master 改成 main

```powershell
git branch -m master main
git push -u origin main
```

---

# 第七部分：远程仓库

```powershell
git remote -v                              # 看远程地址
git remote add origin 地址                  # 添加远程
git remote set-url origin 新地址            # 修改远程地址
git remote remove origin                   # 删除远程
```

换仓库名后：

```powershell
git remote set-url origin https://github.com/rainbowcrr-sys/openref.git
```

---

# 第八部分：撤销与回滚

## 还没 push

```powershell
git commit --amend -m "新说明"    # 改提交说明
git reset HEAD~1                 # 撤销上次提交，保留改动
```

## 已经 push（安全方式）

```powershell
git revert HEAD                # 生成一个反向提交
git push
```

## 临时看某个历史版本

```powershell
git log --oneline              # 复制某条前 7 位哈希
git checkout abc1234           # 切过去看
git checkout main              # 回来
```

⚠️ **不要用** `git push -f`（强制推送），会破坏历史。

---

# 第九部分：冲突处理

```powershell
git pull
# 如果报冲突：
# 1. 打开冲突文件，搜 <<<<<<<
# 2. 手动改成你要的内容，删掉 <<<<<<< ======= >>>>>>> 这些标记
git add .
git commit -m "解决冲突"
git push
```

**VS Code 对冲突有可视化界面**，点"接受当前更改/传入更改"很方便。

---

# 第十部分：凭据（免密）

```powershell
git config --global credential.helper manager    # Windows 凭据管理器（推荐）
git config --global credential.helper store      # 明文存本地（备选）

git config --global user.name "rainbowcrr-sys"
git config --global user.email "rainbowcrr.sys@gmail.com"

git config --global --list                       # 看所有配置
```

## token 过期了

1. 去 GitHub 重新生成 token
2. Windows 搜索"凭据管理器" → **Windows 凭据**
3. 找 `git:https://github.com` → 编辑 → 密码换新 token

---

# 第十一部分：常见报错对照

| 报错 | 原因 | 解决 |
|---|---|---|
| `Invalid username or token` | 用了账号密码 | 用 token 当密码 |
| `has no upstream branch` | 首次推送没设上游 | `git push -u origin main` |
| `Permission denied` | token 过期/无权限 | 重新生成 token |
| `failed to push some refs` | 远程有新提交 | 先 `git pull` |
| `CONFLICT (content)` | 文件冲突 | 手动改冲突文件 |
| `not a git repository` | 不在 git 目录里 | `cd` 到项目目录 |
| `src refspec main does not match` | 分支名不对 | `git branch` 看实际名字 |

---

# 第十二部分：完整日常流程

```powershell
# 开始工作前
cd C:\Users\zhangyang\openref
git pull                      # 或 openref pull

# 写文章
node scripts/new-post.mjs     # 或手动建文件
code src/content/docs/...     # VS Code 写

# 本地验证
node build.mjs

# 提交
git add .
git commit -m "add: 文章标题"
git push

# 看部署
# 去 GitHub 仓库 Actions 标签，等绿勾
```

**简化版**（用 openref 命令）：

```powershell
openref pull
# 写文章
openref push "add: 文章标题"
```
