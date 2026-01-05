# Script para liberar a porta 3000
# Execute: .\liberar-porta.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Liberando Porta 3000" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar processos usando a porta 3000
Write-Host "Verificando processos na porta 3000..." -ForegroundColor Yellow
$processes = netstat -ano | Select-String ":3000" | Select-String "LISTENING"

if ($processes) {
    Write-Host "Processos encontrados na porta 3000:" -ForegroundColor Yellow
    $processes | ForEach-Object {
        $line = $_.Line
        $pid = ($line -split '\s+')[-1]
        Write-Host "  PID: $pid" -ForegroundColor White
        
        # Tentar obter nome do processo
        try {
            $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
            if ($proc) {
                Write-Host "    Processo: $($proc.ProcessName)" -ForegroundColor Gray
            }
        } catch {
            Write-Host "    (Não foi possível obter nome do processo)" -ForegroundColor Gray
        }
    }
    Write-Host ""
    
    # Perguntar se deseja encerrar
    $response = Read-Host "Deseja encerrar esses processos? (S/N)"
    
    if ($response -eq 'S' -or $response -eq 's') {
        $processes | ForEach-Object {
            $line = $_.Line
            $pid = ($line -split '\s+')[-1]
            
            try {
                Write-Host "Encerrando processo PID: $pid..." -ForegroundColor Yellow
                taskkill /PID $pid /F 2>&1 | Out-Null
                Write-Host "✓ Processo $pid encerrado" -ForegroundColor Green
            } catch {
                Write-Host "✗ Erro ao encerrar processo $pid" -ForegroundColor Red
            }
        }
        Write-Host ""
        Write-Host "Porta 3000 liberada!" -ForegroundColor Green
    } else {
        Write-Host "Operação cancelada." -ForegroundColor Yellow
    }
} else {
    Write-Host "Nenhum processo encontrado na porta 3000." -ForegroundColor Green
    Write-Host "A porta está livre!" -ForegroundColor Green
}

Write-Host ""
Write-Host "Para verificar novamente:" -ForegroundColor Cyan
Write-Host "  netstat -ano | findstr :3000" -ForegroundColor White
Write-Host ""

