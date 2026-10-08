@echo off
setlocal
chcp 65001 >nul
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\local-demo.ps1" -Action Stop
if errorlevel 1 (
  echo.
  echo VOLUME chua tat xong. Khong tu tat Docker hoac Pi Node.
  pause
  exit /b 1
)
endlocal
