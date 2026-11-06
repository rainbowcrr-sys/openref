@echo off
setlocal EnableDelayedExpansion

rem ============================================================
rem  OpenRef 命令行工具
rem  默认工作目录：C:\Users\zhangyang\openref
rem ============================================================

set "OPENREF_DIR=C:\Users\zhangyang\openref"

rem 没有参数 -> 直接进入工作目录并停在命令行
if "%~1"=="" (
    cd /d "%OPENREF_DIR%"
    echo 已进入 %OPENREF_DIR%
    cmd /k
    exit /b 0
)

rem ---- help ----
if /i "%~1"=="help" goto :help
if /i "%~1"=="-h" goto :help
if /i "%~1"=="?" goto :help

rem ---- clone：首次拉取源码 ----
if /i "%~1"=="clone" (
    cd /d "C:\Users\zhangyang"
    git clone https://github.com/rainbowcrr-sys/openref.git
    echo.
    echo 完成。目录：%OPENREF_DIR%
    exit /b 0
)

rem ---- 以下命令都要求目录已存在 ----
if not exist "%OPENREF_DIR%" (
    echo [错误] 目录不存在：%OPENREF_DIR%
    echo 请先运行： openref clone
    exit /b 1
)

rem ---- cd：只进入目录 ----
if /i "%~1"=="cd" (
    cd /d "%OPENREF_DIR%"
    cmd /k
    exit /b 0
)

rem ---- pull：拉取最新 ----
if /i "%~1"=="pull" (
    cd /d "%OPENREF_DIR%"
    git pull
    exit /b 0
)

rem ---- status：看改了什么 ----
if /i "%~1"=="status" (
    cd /d "%OPENREF_DIR%"
    git status
    exit /b 0
)

rem ---- build：构建 ----
if /i "%~1"=="build" (
    cd /d "%OPENREF_DIR%"
    node build.mjs
    exit /b 0
)

rem ---- serve：本地预览 ----
if /i "%~1"=="serve" (
    cd /d "%OPENREF_DIR%"
    echo 本地预览： http://localhost:4321
    echo 按 Ctrl+C 停止
    node build.mjs --serve
    exit /b 0
)

rem ---- push "提交说明"：add + commit + push 一条龙 ----
if /i "%~1"=="push" (
    cd /d "%OPENREF_DIR%"
    if "%~2"=="" (
        set "MSG=update"
    ) else (
        set "MSG=%~2"
    )
    git add .
    git commit -m "!MSG!"
    git push
    echo.
    echo 已推送。GitHub Actions 会在 1-2 分钟后自动部署。
    exit /b 0
)

rem ---- login：登录 Cloudflare（只需做一次） ----
if /i "%~1"=="login" (
    cd /d "%OPENREF_DIR%"
    echo 会弹出浏览器让你授权 Cloudflare 账号，确认即可。
    echo 不用绑卡，不会扣钱。
    npx wrangler login
    exit /b 0
)

rem ---- deploy：本地构建 + 上传到 Cloudflare Workers ----
if /i "%~1"=="deploy" (
    cd /d "%OPENREF_DIR%"
    echo [1/2] 构建...
    node build.mjs
    if errorlevel 1 (
        echo [错误] 构建失败，已中止，未上传。
        exit /b 1
    )
    echo.
    echo [2/2] 上传到 Cloudflare Workers...
    npx wrangler deploy
    exit /b 0
)

rem ---- new：新建文章 ----
if /i "%~1"=="new" (
    cd /d "%OPENREF_DIR%"
    node scripts/new-post.mjs
    exit /b 0
)

rem ---- code：用 VS Code 打开 ----
if /i "%~1"=="code" (
    cd /d "%OPENREF_DIR%"
    code .
    exit /b 0
)

rem ---- 未知命令 ----
echo [错误] 未知命令： %~1
echo.
goto :help

:help
echo.
echo  OpenRef 命令行工具
echo  工作目录： %OPENREF_DIR%
echo.
echo  用法： openref ^<命令^> [参数]
echo.
echo  命令：
echo    openref              进入工作目录
echo    openref help         显示本帮助
echo    openref clone        首次拉取 GitHub 源码
echo    openref pull         拉取最新代码
echo    openref status       查看改了哪些文件
echo    openref build        构建站点到 dist/
echo    openref serve        本地预览 http://localhost:4321
echo    openref login        登录 Cloudflare（只需做一次，不绑卡）
echo    openref deploy       本地构建并上传到 Cloudflare Workers
echo    openref push "说明"   提交并推送（自动 add/commit/push）
echo    openref new          新建一篇文章（交互式）
echo    openref code         用 VS Code 打开项目
echo.
echo  常用流程：
echo    openref clone
echo    openref pull
echo    node build.mjs
echo    git add .
echo    git commit -m "写提交的东西"
echo    git push
echo.
echo  （上面 5 步可以简化成一条： openref push "写提交的东西" ）
echo.
exit /b 0
