# Script para gerar e instalar versao de producao no dispositivo fisico
# Uso: .\build-production.ps1

param(
    [switch]$SkipDeviceCheck = $false,
    [switch]$SkipBundle = $false
)

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Build de Producao - Android" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se estamos no diretorio correto
if (-not (Test-Path "package.json")) {
    Write-Host "ERRO: Execute este script na raiz do projeto Frontend" -ForegroundColor Red
    exit 1
}

# Verificar se o ADB esta disponivel
$adbPath = Get-Command adb -ErrorAction SilentlyContinue
if (-not $adbPath) {
    Write-Host "ERRO: ADB nao encontrado no PATH" -ForegroundColor Red
    Write-Host "Certifique-se de que o Android SDK esta instalado e o ADB esta no PATH" -ForegroundColor Yellow
    exit 1
}

# Verificar dispositivos conectados
if (-not $SkipDeviceCheck) {
    Write-Host "Verificando dispositivos conectados..." -ForegroundColor Yellow
    adb kill-server | Out-Null
    Start-Sleep -Seconds 2
    adb start-server | Out-Null
    Start-Sleep -Seconds 2
    
    $devices = adb devices
    $deviceLines = $devices | Select-Object -Skip 1 | Where-Object { $_ -match '\S' }
    $deviceCount = 0
    
    foreach ($line in $deviceLines) {
        if ($line -match '^([^\s]+)\s+(.+)') {
            $deviceId = $matches[1]
            $status = $matches[2]
            
            if ($status -eq 'device') {
                Write-Host "  [OK] $deviceId - Conectado e autorizado" -ForegroundColor Green
                $deviceCount++
            }
        }
    }
    
    if ($deviceCount -eq 0) {
        Write-Host ""
        Write-Host "NENHUM DISPOSITIVO ENCONTRADO!" -ForegroundColor Red
        Write-Host "Use -SkipDeviceCheck para pular a verificacao de dispositivos" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host "Total de dispositivos conectados: $deviceCount" -ForegroundColor Green
    Write-Host ""
}

# Limpar builds anteriores
Write-Host "Limpando builds anteriores..." -ForegroundColor Yellow
Write-Host "  Limpando cache do Metro..." -ForegroundColor Gray
if (Test-Path "node_modules\.cache") {
    Remove-Item -Recurse -Force "node_modules\.cache" -ErrorAction SilentlyContinue
}

Write-Host "  Limpando build do Android..." -ForegroundColor Gray
Set-Location android
& .\gradlew clean | Out-Null
Set-Location ..
Write-Host "  Build limpo com sucesso!" -ForegroundColor Green
Write-Host ""

# Gerar bundle de producao
if (-not $SkipBundle) {
    Write-Host "Gerando bundle de producao..." -ForegroundColor Yellow
    $bundlePath = "android\app\src\main\assets"
    
    # Criar diretorio assets se nao existir
    if (-not (Test-Path $bundlePath)) {
        New-Item -ItemType Directory -Path $bundlePath -Force | Out-Null
    }
    
    # Gerar bundle
    Write-Host "  Executando: npx react-native bundle..." -ForegroundColor Gray
    
    # Executar bundle e capturar output
    $bundleOutput = & npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output "$bundlePath\index.android.bundle" --assets-dest $bundlePath --minify 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ERRO ao gerar bundle!" -ForegroundColor Red
        Write-Host $bundleOutput -ForegroundColor Red
        exit 1
    }
    
    # Verificar se o bundle foi criado
    if (-not (Test-Path "$bundlePath\index.android.bundle")) {
        Write-Host "  ERRO: Bundle nao foi gerado!" -ForegroundColor Red
        exit 1
    }
    
    $bundleSize = (Get-Item "$bundlePath\index.android.bundle").Length / 1KB
    Write-Host "  Bundle gerado com sucesso!" -ForegroundColor Green
    Write-Host "  Tamanho: $([math]::Round($bundleSize, 2)) KB" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "Pulando geracao de bundle (usando bundle existente)..." -ForegroundColor Yellow
    Write-Host ""
}

# Compilar APK de release
Write-Host "Compilando APK de release..." -ForegroundColor Yellow
Set-Location android

Write-Host "  Executando: gradlew assembleRelease..." -ForegroundColor Gray
$buildProcess = Start-Process -FilePath ".\gradlew.bat" -ArgumentList "assembleRelease" -NoNewWindow -Wait -PassThru

if ($buildProcess.ExitCode -ne 0) {
    Write-Host ""
    Write-Host "ERRO ao compilar APK de release!" -ForegroundColor Red
    Write-Host "Verifique os logs acima para mais detalhes" -ForegroundColor Yellow
    Set-Location ..
    exit 1
}

Set-Location ..

# Verificar se o APK foi gerado
$apkPath = "android\app\build\outputs\apk\release\app-release.apk"
if (-not (Test-Path $apkPath)) {
    Write-Host ""
    Write-Host "ERRO: APK nao encontrado em $apkPath" -ForegroundColor Red
    exit 1
}

$apkSize = (Get-Item $apkPath).Length / 1MB
Write-Host "  APK compilado com sucesso!" -ForegroundColor Green
Write-Host "  Tamanho: $([math]::Round($apkSize, 2)) MB" -ForegroundColor Gray
Write-Host "  Local: $apkPath" -ForegroundColor Gray
Write-Host ""

# Instalar no dispositivo
if (-not $SkipDeviceCheck) {
    Write-Host "Instalando APK no dispositivo..." -ForegroundColor Yellow
    
    $installResult = adb install -r $apkPath
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  APK instalado com sucesso!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Deseja abrir o app agora? (S/N)" -ForegroundColor Cyan
        $response = Read-Host
        if ($response -eq 'S' -or $response -eq 's') {
            Write-Host "  Abrindo app..." -ForegroundColor Gray
            $packageName = (Get-Content "android\app\src\main\AndroidManifest.xml" | Select-String "package=" | ForEach-Object { $_ -replace '.*package="([^"]+)".*', '$1' })
            adb shell monkey -p $packageName -c android.intent.category.LAUNCHER 1 | Out-Null
        }
    } else {
        Write-Host "  AVISO: Falha ao instalar APK automaticamente" -ForegroundColor Yellow
        Write-Host "  APK disponivel em: $apkPath" -ForegroundColor Gray
        Write-Host "  Instale manualmente ou use: adb install -r `"$apkPath`"" -ForegroundColor Gray
    }
} else {
    Write-Host "APK gerado com sucesso!" -ForegroundColor Green
    Write-Host "Local: $apkPath" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Para instalar manualmente:" -ForegroundColor Yellow
    Write-Host "  adb install -r `"$apkPath`"" -ForegroundColor White
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Build de Producao Concluido!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

