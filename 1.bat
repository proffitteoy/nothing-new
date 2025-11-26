@echo off
REM =================================================================
chcp 65001 >nul
setlocal enabledelayedexpansion

echo.
echo =================================================================
echo Quartz Deploy Script Initializing...
echo =================================================================
echo.

REM -----------------------------------------------------------------
REM 1. 切换目录并获取提交信息
REM -----------------------------------------------------------------
cd /d "%~dp0"
echo Current Directory: %cd%
echo.

set /p commit_msg="Enter Git Commit Message: "
echo.

REM -----------------------------------------------------------------
REM 2. 执行 Git ADD
REM -----------------------------------------------------------------
echo Running: git add .
git add .
if errorlevel 1 (
    echo.
    echo ERROR: git add failed. Exiting.
    goto :end
)
echo Git Add Complete
echo.

REM -----------------------------------------------------------------
REM 3. 执行 Git COMMIT
REM -----------------------------------------------------------------
echo Running: git commit -m "%commit_msg%"
git commit -m "%commit_msg%"
set commit_status=!errorlevel!

if %commit_status% neq 0 (
    echo.
    echo WARNING: git commit failed (Nothing to commit).
    echo Attempting Git Push now...
    goto :push
) else (
    echo Git Commit Complete
    echo.
)

REM -----------------------------------------------------------------
REM 4. 执行 Git PUSH
REM -----------------------------------------------------------------
:push
echo Running: git push origin main
git push origin main
if errorlevel 1 (
    echo.
    echo =================================================================
    echo X FATAL ERROR: Git Push Failed. Check network/auth.
    echo =================================================================
) else (
    echo.
    echo =================================================================
    echo V SUCCESS: Deployment Triggered!
    echo Site will update shortly.
    echo =================================================================
)

:end
echo.
pause
endlocal