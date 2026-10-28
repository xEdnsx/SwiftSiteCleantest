param([string]$BrowserPath)
$ErrorActionPreference = 'Stop'
if (-not $BrowserPath) {
    $candidates = @(
        (Join-Path ${env:ProgramFiles(x86)} 'Microsoft/Edge/Application/msedge.exe'),
        (Join-Path $env:ProgramFiles 'Microsoft/Edge/Application/msedge.exe'),
        (Join-Path $env:ProgramFiles 'Google/Chrome/Application/chrome.exe')
    )
    $BrowserPath = $candidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
}
if (-not $BrowserPath -or -not (Test-Path -LiteralPath $BrowserPath)) {
    throw 'Indica -BrowserPath con la ruta a un navegador Chromium instalado.'
}
$workspace = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$projects = (Resolve-Path -LiteralPath (Join-Path $workspace '..')).Path
$logs = Join-Path $workspace '.sprint2/checks'
New-Item -ItemType Directory -Path $logs -Force | Out-Null
$node = (Get-Command node).Source
$admin = Join-Path $projects 'swiftsite-admin'
$ionic = Join-Path $projects 'swiftsite-ionic-angular'
$vueProcess = Start-Process -FilePath $node -ArgumentList @('node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5173', '--strictPort') -WorkingDirectory $admin -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $logs 'vue.out.log') -RedirectStandardError (Join-Path $logs 'vue.err.log')
$ionicProcess = Start-Process -FilePath $node -ArgumentList @('node_modules/@angular/cli/bin/ng.js', 'serve', '--host', '127.0.0.1', '--port', '8101', '--open=false') -WorkingDirectory $ionic -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $logs 'ionic.out.log') -RedirectStandardError (Join-Path $logs 'ionic.err.log')
$profile = Join-Path $logs 'edge-profile'
$browser = Start-Process -FilePath $BrowserPath -ArgumentList @('--headless=new', '--disable-gpu', '--no-first-run', '--remote-debugging-port=9223', "--user-data-dir=`"$profile`"", 'about:blank') -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $logs 'edge.out.log') -RedirectStandardError (Join-Path $logs 'edge.err.log')
@{ vue = $vueProcess.Id; ionic = $ionicProcess.Id; browser = $browser.Id } | ConvertTo-Json | Set-Content (Join-Path $logs 'processes.json')
Write-Output 'Started isolated verification processes: Vue 5173, Ionic 8101, Edge headless 9223.'
