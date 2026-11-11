param([ValidateSet('local','lan')][string]$Mode)
$ErrorActionPreference = 'Stop'
$repo = Split-Path $PSScriptRoot -Parent
Set-Location -LiteralPath $repo
foreach ($command in @('php','node','npm.cmd')) { if (-not (Get-Command $command -ErrorAction SilentlyContinue)) { throw "Falta $command en PATH." } }
foreach ($file in @('Api-Rest/.env','Api-Rest/vendor/autoload.php','swiftsite-admin/node_modules/vite/bin/vite.js','swiftsite-ionic-angular/node_modules/@angular/cli/bin/ng.js')) {
    if (-not (Test-Path -LiteralPath (Join-Path $repo $file))) { throw "Falta $file. Completa la instalacion del README primero." }
}
if (-not $Mode) {
    $choice = Read-Host '1: solo este equipo / 2: compartir en la misma red Wi-Fi [1]'
    $Mode = if ($choice -eq '2') { 'lan' } else { 'local' }
}
$address = '127.0.0.1'
$bind = '127.0.0.1'
if ($Mode -eq 'lan') {
    $candidates = @(Get-NetIPConfiguration | Where-Object { $_.IPv4DefaultGateway -and $_.IPv4Address } | ForEach-Object { $_.IPv4Address.IPAddress } | Select-Object -Unique)
    if ($candidates.Count -eq 0) { throw 'No se encontro una IPv4 de red activa.' }
    if ($candidates.Count -eq 1) { $address = $candidates[0] } else {
        Write-Host ('Direcciones disponibles: ' + ($candidates -join ', '))
        $address = Read-Host 'Introduce la IPv4 que deseas compartir'
        if ($address -notin $candidates) { throw 'La IP debe pertenecer a un adaptador activo.' }
    }
    $bind = '0.0.0.0'
}
foreach ($port in @(8000,5173,8100)) {
    $client = New-Object System.Net.Sockets.TcpClient
    try { $client.Connect('127.0.0.1',$port); throw "Puerto $port ocupado. Cierra tu servidor anterior antes de iniciar." }
    catch [System.Net.Sockets.SocketException] {} finally { $client.Dispose() }
}
# Los valores solo afectan a los nuevos procesos; no modifican archivos .env.
$env:APP_URL = "http://${address}:8000"
$env:APP_DEBUG = if ($Mode -eq 'lan') { 'false' } else { 'true' }
$env:ADMIN_ALLOWED_ORIGINS = "http://${address}:5173,http://localhost:5173,http://127.0.0.1:5173"
$env:CLIENT_ALLOWED_ORIGINS = "http://${address}:8100,http://localhost:8100,http://127.0.0.1:8100,capacitor://localhost,http://localhost,https://localhost"
$env:VITE_API_URL = "http://${address}:8000/api"
# Una configuracion cacheada ignoraria los valores anteriores.
Push-Location (Join-Path $repo 'Api-Rest')
try { & php artisan config:clear; if ($LASTEXITCODE -ne 0) { throw 'No se pudo limpiar la configuracion Laravel.' } } finally { Pop-Location }
$logDir = Join-Path ([IO.Path]::GetTempPath()) ('swiftsite-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $logDir | Out-Null
$services = @(
    @{ Name='API'; Dir='Api-Rest'; Exe=(Get-Command php).Source; Args=@('artisan','serve',"--host=$bind",'--port=8000') },
    @{ Name='Vue'; Dir='swiftsite-admin'; Exe=(Get-Command node).Source; Args=@('node_modules/vite/bin/vite.js','--host',$bind,'--port','5173','--strictPort') },
    @{ Name='Ionic'; Dir='swiftsite-ionic-angular'; Exe=(Get-Command node).Source; Args=@('node_modules/@angular/cli/bin/ng.js','serve','--host',$bind,'--port','8100','--open=false') }
)
$processes = @()
try {
    foreach ($service in $services) {
        $processes += Start-Process -FilePath $service.Exe -ArgumentList $service.Args -WorkingDirectory (Join-Path $repo $service.Dir) -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $logDir ($service.Name+'.out.log')) -RedirectStandardError (Join-Path $logDir ($service.Name+'.err.log'))
    }
    Write-Host "Clientes:       http://${address}:8100/inicio"
    Write-Host "Administracion: http://${address}:5173"
    Write-Host "API:            http://${address}:8000/api/prueba"
    Write-Host "Logs: $logDir"
    Write-Host 'Espera a que terminen de compilar. MySQL debe estar encendido.'
    if ($Mode -eq 'lan') { Write-Host 'Usa una red privada de confianza. Permite 8000, 5173 y 8100 en el firewall privado si Windows lo solicita. No abras puertos del router.' }
    Read-Host 'Pulsa Enter para detener los tres servicios' | Out-Null
} finally {
    # taskkill /T solo afecta a los procesos que este lanzador acaba de crear y sus hijos.
    foreach ($process in $processes) { if (-not $process.HasExited) { & taskkill.exe /PID $process.Id /T /F | Out-Null } }
}
