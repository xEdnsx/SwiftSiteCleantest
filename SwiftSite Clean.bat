@echo off
cd /d "%~dp0"
 
start "Laravel API - 8000" cmd /k "cd /d Api-Rest && php artisan serve --host=127.0.0.1 --port=8000"
 
start "Vue Admin - 5173" cmd /k "cd /d swiftsite-admin && npm.cmd run dev -- --host 127.0.0.1 --port 5173"
 
start "Ionic Angular - 8100" cmd /k "cd /d swiftsite-ionic-angular && npm.cmd run dev"
 
echo Los tres proyectos se han iniciado.
pause