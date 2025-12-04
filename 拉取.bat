@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM ==== 配置目录 ====
set "SOURCE=D:\桌面\math"
set "TARGET=D:\桌面\my blog\content"

REM ==== 获取今日日期 YYYYMMDD ====
for /f "usebackq delims=" %%a in (`powershell -NoProfile -Command "(Get-Date).ToString('yyyyMMdd')"`) do set "TODAY=%%a"

echo [INFO] 今日日期: %TODAY%
echo [INFO] 开始同步文件...

REM ==== 遍历 SOURCE 中所有文件 ====
for /r "%SOURCE%" %%F in (*) do (
    REM 获取文件最后修改日期 YYYYMMDD
    for /f "usebackq delims=" %%D in (`powershell -NoProfile -Command "(Get-Item '%%F').LastWriteTime.ToString('yyyyMMdd')"`) do set "FILEDATE=%%D"

    if "!FILEDATE!"=="%TODAY%" (
        REM 生成目标路径
        set "REL=%%F"
        set "REL=!REL:%SOURCE%=!"
        set "DEST=%TARGET%!REL!"

        REM 创建目标目录
        if not exist "!DEST!\.." mkdir "!DEST!\.."

        REM 复制文件
        copy /Y "%%F" "!DEST!" >nul
        echo [SYNC] %%F -> !DEST!
    )
)

REM ==== 调用上传脚本 ====
if exist "%~dp0上传.bat" (
    echo [INFO] 开始执行上传脚本...
    call "%~dp0上传.bat"
    echo [INFO] 上传完成
) else (
    echo [WARN] 上传脚本未找到
)

echo [INFO] 同步完成
pause
endlocal
