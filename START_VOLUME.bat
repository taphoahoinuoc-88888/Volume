@echo off
setlocal
chcp 65001 >nul
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\local-demo.ps1" -Action Start
if errorlevel 1 (
  echo.
  echo VOLUME chua mo duoc. Hay xem huong dan phia tren.
  pause
  exit /b 1
)
endlocal
