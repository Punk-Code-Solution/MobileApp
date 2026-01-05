# Script para verificar dispositivos Android conectados via ADB
# Uso: .\verificar-dispositivos.ps1

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
adb kill-server
Start-Sleep -Seconds 2
adb start-server
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
Write-Host 'Agora voce pode executar: npm run android' -ForegroundColor Yellow
Write-Host ""

exit 0
