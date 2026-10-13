@echo off
setlocal
chcp 65001 >nul
echo VOLUME: Sao luu va cap nhat database VOLUME da xac minh. Khong reset du lieu.
echo Dung bot Telegram bang Ctrl+C truoc khi cap nhat.
node "%~dp0scripts\local-demo-admin.mjs" upgrade
if errorlevel 1 (
 echo Chua cap nhat duoc. Giu nguyen du lieu va xem thong bao phia tren.
 pause
 exit /b 1
)
echo Da cap nhat. Bam START_VOLUME.bat de mo lai.
pause
endlocal
