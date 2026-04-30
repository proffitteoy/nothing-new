@echo off
chcp 65001 >nul
setlocal

cd /d "%~dp0"
call npm.cmd run sync:obsidian:review

endlocal
pause
