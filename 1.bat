@echo off
chcp 65001 >nul
setlocal

cd /d "%~dp0"

set /p commit_msg="Commit Message: "

git add .
git commit -m "%commit_msg%"
git push origin main

endlocal
pause
