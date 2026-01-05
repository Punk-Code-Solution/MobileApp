# Script para verificar dispositivos Android e executar o app
# Uso: .\android-safe.ps1

param(
    [switch]$SkipCheck = $false
)

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Verificando Ambiente Android" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se o Metro bundler esta rodando
Write-Host "Verificando Metro bundler..." -ForegroundColor Yellow
$metroRunning = $false
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8081/status" -TimeoutSec 2 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        $metroRunning = $true
        Write-Host "  [OK] Metro bundler esta rodando" -ForegroundColor Green
    }
} catch {
    Write-Host "  [AVISO] Metro bundler nao esta rodando" -ForegroundColor Yellow
    Write-Host "  Iniciando Metro bundler em background..." -ForegroundColor Yellow
    
    # Iniciar Metro bundler em uma nova janela
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm start" -WindowStyle Minimized
    Write-Host "  Aguardando Metro bundler iniciar..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    
    # Verificar novamente
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8081/status" -TimeoutSec 5 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $metroRunning = $true
            Write-Host "  [OK] Metro bundler iniciado com sucesso" -ForegroundColor Green
        }
    } catch {
        Write-Host "  [ERRO] Nao foi possivel iniciar o Metro bundler" -ForegroundColor Red
        Write-Host "  Execute manualmente: npm start" -ForegroundColor Yellow
    }
}
Write-Host ""

# Obter IP da maquina para dispositivo fisico
Write-Host "Obtendo IP da maquina..." -ForegroundColor Yellow
$ipAddress = $null
try {
    $ipConfig = ipconfig | Select-String -Pattern "IPv4" | Select-Object -First 1
    if ($ipConfig -match '(\d+\.\d+\.\d+\.\d+)') {
        $ipAddress = $matches[1]
        Write-Host "  [OK] IP encontrado: $ipAddress" -ForegroundColor Green
        Write-Host "  Certifique-se de que este IP esta configurado em src/config/api.config.ts" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  [AVISO] Nao foi possivel obter o IP automaticamente" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Verificando Dispositivos Android" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se o ADB esta disponivel
$adbPath = Get-Command adb -ErrorAction SilentlyContinue
if (-not $adbPath) {
    Write-Host "ERRO: ADB nao encontrado no PATH" -ForegroundColor Red
    Write-Host "Certifique-se de que o Android SDK esta instalado e o ADB esta no PATH" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Dica: O ADB geralmente esta em:" -ForegroundColor Yellow
    Write-Host "  %LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe" -ForegroundColor White
    exit 1
}

# Reiniciar servidor ADB (pode ajudar a resolver problemas de conexao)
Write-Host "Reiniciando servidor ADB..." -ForegroundColor Yellow
adb kill-server | Out-Null
Start-Sleep -Seconds 2
adb start-server | Out-Null
Start-Sleep -Seconds 2
Write-Host ""

# Listar dispositivos conectados
Write-Host "Dispositivos conectados:" -ForegroundColor Yellow
Write-Host ""
$devices = adb devices
$deviceLines = $devices | Select-Object -Skip 1 | Where-Object { $_ -match '\S' }

if ($deviceLines.Count -eq 0) {
    Write-Host "  NENHUM DISPOSITIVO ENCONTRADO!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Possiveis solucoes:" -ForegroundColor Yellow
    Write-Host "  1. Verifique se o dispositivo esta conectado via USB" -ForegroundColor White
    Write-Host "  2. Certifique-se de que a depuracao USB esta habilitada no dispositivo" -ForegroundColor White
    Write-Host "  3. Tente desconectar e reconectar o cabo USB" -ForegroundColor White
    Write-Host "  4. Verifique se o driver USB esta instalado corretamente" -ForegroundColor White
    Write-Host "  5. Execute: adb devices (para ver se o dispositivo aparece)" -ForegroundColor White
    Write-Host ""
    exit 1
}

# Mostrar dispositivos
$deviceCount = 0
foreach ($line in $deviceLines) {
    if ($line -match '^([^\s]+)\s+(.+)') {
        $deviceId = $matches[1]
        $status = $matches[2]
        
        if ($status -eq 'device') {
            Write-Host "  [OK] $deviceId - Conectado e autorizado" -ForegroundColor Green
            $deviceCount++
        } elseif ($status -eq 'unauthorized') {
            Write-Host "  [AVISO] $deviceId - Nao autorizado (aceite a autorizacao no dispositivo)" -ForegroundColor Yellow
        } elseif ($status -eq 'offline') {
            Write-Host "  [ERRO] $deviceId - Offline" -ForegroundColor Red
        } else {
            Write-Host "  [?] $deviceId - Status: $status" -ForegroundColor Yellow
        }
    }
}

Write-Host ""
Write-Host "Total de dispositivos conectados: $deviceCount" -ForegroundColor Cyan

if ($deviceCount -eq 0) {
    Write-Host ""
    Write-Host "Nenhum dispositivo pronto para uso!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Dispositivos prontos para uso!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se o backend esta rodando
Write-Host "Verificando backend..." -ForegroundColor Yellow
$backendRunning = $false
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 2 -ErrorAction SilentlyContinue
    $backendRunning = $true
    Write-Host "  [OK] Backend esta rodando" -ForegroundColor Green
} catch {
    Write-Host "  [AVISO] Backend nao esta rodando em http://localhost:3000" -ForegroundColor Yellow
    Write-Host "  Certifique-se de que o backend esta rodando antes de usar o app" -ForegroundColor Yellow
    if ($ipAddress) {
        Write-Host "  Para dispositivo fisico, o backend deve estar acessivel em: http://$ipAddress:3000" -ForegroundColor Yellow
    }
}
Write-Host ""

# Executar react-native run-android
Write-Host "Executando react-native run-android..." -ForegroundColor Yellow
Write-Host ""
Write-Host "IMPORTANTE:" -ForegroundColor Yellow
Write-Host "  - Se estiver usando dispositivo fisico, certifique-se de que:" -ForegroundColor White
Write-Host "    1. O IP em src/config/api.config.ts esta correto ($ipAddress)" -ForegroundColor White
Write-Host "    2. O backend esta rodando e acessivel na rede local" -ForegroundColor White
Write-Host "    3. O Metro bundler esta rodando (porta 8081)" -ForegroundColor White
Write-Host ""
& npx react-native run-android

