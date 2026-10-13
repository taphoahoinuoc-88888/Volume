@echo off
setlocal
chcp 65001 >nul
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\telegram-setup.ps1"
if errorlevel 1 pause
endlocal
