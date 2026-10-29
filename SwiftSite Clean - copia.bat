@echo off
setlocal EnableExtensions
chcp 65001 >nul
TITLE SwiftSite Clean - Instalador de dependencias
cd /d "%~dp0"
set "FAIL=0"
echo ==========================================================
echo       SWIFTSITE CLEAN - INSTALAR DEPENDENCIAS
echo ==========================================================
echo Carpeta: %CD%
echo.
if not exist "Api-Rest\composer.json" (
  echo [ERROR] No se encontro Api-Rest\composer.json
  set "FAIL=1"
)
if not exist "swiftsite-admin\package-lock.json" (
  echo [ERROR] No se encontro swiftsite-admin\package-lock.json
  set "FAIL=1"
)
if not exist "swiftsite-ionic-angular\package-lock.json" (
  echo [ERROR] No se encontro swiftsite-ionic-angular\package-lock.json
  set "FAIL=1"
)
if "%FAIL%"=="1" goto :end
where php >nul 2>&1
if errorlevel 1 (echo [ERROR] PHP no esta disponible en PATH.& set "FAIL=1")
where composer >nul 2>&1
if errorlevel 1 (echo [ERROR] Composer no esta disponible en PATH.& set "FAIL=1")
where node >nul 2>&1
if errorlevel 1 (echo [ERROR] Node.js no esta disponible en PATH.& set "FAIL=1")
where npm.cmd >nul 2>&1
if errorlevel 1 (echo [ERROR] npm no esta disponible en PATH.& set "FAIL=1")
if "%FAIL%"=="1" goto :end
echo [1/3] Instalando dependencias PHP de Laravel...
pushd "Api-Rest"
call composer install --no-interaction --prefer-dist
if errorlevel 1 (
  echo [ERROR] Fallo composer install en Api-Rest.
  set "FAIL=1"
) else (
  echo [OK] Dependencias Laravel instaladas.
)
popd
echo.
echo [2/3] Instalando dependencias de Vue administrativo...
pushd "swiftsite-admin"
call npm.cmd ci
if errorlevel 1 (
  echo [ERROR] Fallo npm ci en swiftsite-admin.
  set "FAIL=1"
) else (
  echo [OK] Dependencias Vue instaladas.
)
popd
echo.
echo [3/3] Instalando dependencias de Ionic Angular...
pushd "swiftsite-ionic-angular"
call npm.cmd ci
if errorlevel 1 (
  echo [ERROR] Fallo npm ci en swiftsite-ionic-angular.
  set "FAIL=1"
) else (
  echo [OK] Dependencias Ionic instaladas.
)
popd
:end
echo.
echo ==========================================================
if "%FAIL%"=="0" (
  echo [OK] Las tres instalaciones finalizaron correctamente.
  echo Nota: este instalador NO modifica .env, MySQL ni ejecuta migraciones.
) else (
  echo [ATENCION] Uno o mas pasos fallaron. Revisa los mensajes anteriores.
  echo Si Composer falla, comprueba: composer --version
  echo Si npm ci falla, comprueba la compatibilidad Node y los lockfiles.
)
echo ==========================================================
pause
if "%FAIL%"=="0" (exit /b 0) else (exit /b 1)
 