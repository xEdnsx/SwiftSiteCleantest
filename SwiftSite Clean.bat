@echo off
setlocal
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-local.ps1"
if errorlevel 1 echo No se pudieron iniciar todos los servicios. Revisa el mensaje anterior.
pause
