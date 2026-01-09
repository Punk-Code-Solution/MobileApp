# Script para ver logs de agendamento em tempo real
# Uso: .\ver-logs.ps1

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Visualizador de Logs - Agendamento" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se adb está disponível
$adbPath = Get-Command adb -ErrorAction SilentlyContinue
if (-not $adbPath) {
    Write-Host "ERRO: ADB não encontrado!" -ForegroundColor Red
    Write-Host "Instale o Android SDK Platform Tools ou o Android Studio" -ForegroundColor Yellow
    Write-Host "Download: https://developer.android.com/studio/releases/platform-tools" -ForegroundColor Yellow
    exit 1
}

# Verificar se dispositivo está conectado
Write-Host "Verificando dispositivos conectados..." -ForegroundColor Yellow
$devicesOutput = adb devices
$devices = $devicesOutput | Select-String -Pattern "device$"

if (-not $devices) {
    Write-Host ""
    Write-Host "ERRO: Nenhum dispositivo conectado!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Siga estes passos:" -ForegroundColor Yellow
    Write-Host "  1. Conecte o dispositivo Android via USB" -ForegroundColor White
    Write-Host "  2. Ative a Depuração USB:" -ForegroundColor White
    Write-Host "     - Configurações > Sobre o telefone" -ForegroundColor Gray
    Write-Host "     - Toque 7 vezes em 'Número da compilação'" -ForegroundColor Gray
    Write-Host "     - Configurações > Opções do desenvolvedor" -ForegroundColor Gray
    Write-Host "     - Ative 'Depuração USB'" -ForegroundColor Gray
    Write-Host "  3. Execute este script novamente" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host "  [OK] Dispositivo conectado" -ForegroundColor Green
Write-Host ""

# Perguntar se quer limpar logs antigos
Write-Host "Deseja limpar logs antigos antes de começar? (S/N)" -ForegroundColor Yellow
$clearLogs = Read-Host
if ($clearLogs -eq "S" -or $clearLogs -eq "s" -or $clearLogs -eq "Y" -or $clearLogs -eq "y") {
    Write-Host "Limpando logs antigos..." -ForegroundColor Gray
    adb logcat -c | Out-Null
    Write-Host "  [OK] Logs limpos" -ForegroundColor Green
    Write-Host ""
}

# Perguntar se quer salvar em arquivo
Write-Host "Deseja salvar os logs em arquivo? (S/N)" -ForegroundColor Yellow
$saveToFile = Read-Host
$logFile = $null
if ($saveToFile -eq "S" -or $saveToFile -eq "s" -or $saveToFile -eq "Y" -or $saveToFile -eq "y") {
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $logFile = "logs_agendamento_$timestamp.txt"
    Write-Host "Logs serão salvos em: $logFile" -ForegroundColor Green
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Mostrando logs em tempo real..." -ForegroundColor Cyan
Write-Host "  Pressione Ctrl+C para parar" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Filtro: [APPOINTMENT]" -ForegroundColor Gray
Write-Host ""

# Função para processar linha de log
function Process-LogLine {
    param([string]$line)
    
    if ($line -match "\[APPOINTMENT") {
        # Colorir diferentes tipos de log (sem emojis para compatibilidade)
        if ($line -match "ERRO|ERROR|falhou|falhou|invalido|invalido") {
            Write-Host $line -ForegroundColor Red
        } elseif ($line -match "SUCESSO|SUCCESS|concluido|concluido|valido|valido") {
            Write-Host $line -ForegroundColor Green
        } elseif ($line -match "WARN|AVISO|warning") {
            Write-Host $line -ForegroundColor Yellow
        } elseif ($line -match "INICIO|FIM|Enviando|Recebido|Validando|Preparando") {
            Write-Host $line -ForegroundColor Cyan
        } else {
            Write-Host $line
        }
        
        # Salvar em arquivo se solicitado
        if ($logFile) {
            Add-Content -Path $logFile -Value $line
        }
    }
}

# Capturar logs
try {
    if ($logFile) {
        # Com arquivo
        adb logcat -v time | ForEach-Object {
            Process-LogLine $_
        }
    } else {
        # Sem arquivo
        adb logcat -v time | ForEach-Object {
            Process-LogLine $_
        }
    }
} catch {
    Write-Host ""
    Write-Host "Logs interrompidos pelo usuário" -ForegroundColor Yellow
    if ($logFile) {
        Write-Host "Logs salvos em: $logFile" -ForegroundColor Green
    }
}

