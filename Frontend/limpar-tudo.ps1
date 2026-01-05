# Script para limpar completamente o projeto e reconstruir
# Execute: .\limpar-tudo.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Limpeza Completa do Projeto" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Parar processos do Metro Bundler
Write-Host "1. Parando processos do Metro Bundler..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*metro*" } | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# 2. Limpar bundles antigos
Write-Host "2. Removendo bundles antigos..." -ForegroundColor Yellow
$bundlePaths = @(
    "android\app\src\main\assets\index.android.bundle",
    "android\android\app\src\main\assets\index.android.bundle"
)

foreach ($path in $bundlePaths) {
    if (Test-Path $path) {
        Remove-Item -Path $path -Force -ErrorAction SilentlyContinue
        Write-Host "  OK Removido: $path" -ForegroundColor Green
    }
}

# 3. Limpar pasta assets se existir
$assetsDir = "android\app\src\main\assets"
if (Test-Path $assetsDir) {
    Remove-Item -Path "$assetsDir\*" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "  OK Pasta assets limpa" -ForegroundColor Green
}

# 4. Limpar cache do Metro
Write-Host "3. Limpando cache do Metro..." -ForegroundColor Yellow
if (Test-Path "node_modules\.cache") {
    Remove-Item -Path "node_modules\.cache" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "  OK Cache do Metro limpo" -ForegroundColor Green
}

# 5. Limpar build do Android
Write-Host "4. Limpando build do Android..." -ForegroundColor Yellow
Set-Location android
& .\gradlew clean 2>&1 | Out-Null
Set-Location ..
Write-Host "  OK Build do Android limpo" -ForegroundColor Green

# 6. Limpar node_modules/.cache/react-native
Write-Host "5. Limpando cache do React Native..." -ForegroundColor Yellow
$rnCache = "node_modules\.cache\react-native"
if (Test-Path $rnCache) {
    Remove-Item -Path $rnCache -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "  OK Cache do React Native limpo" -ForegroundColor Green
}

# 7. Verificar app.json
Write-Host "6. Verificando configuracao do app..." -ForegroundColor Yellow
$appJson = Get-Content "app.json" | ConvertFrom-Json
if ($appJson.name -eq "Frontend") {
    Write-Host "  OK app.json esta correto (name: Frontend)" -ForegroundColor Green
} else {
    Write-Host "  ERRO: app.json tem name: $($appJson.name)" -ForegroundColor Red
    Write-Host "    Deve ser 'Frontend' (sem hifen)" -ForegroundColor Yellow
}

# 8. Verificar MainActivity.kt
Write-Host "7. Verificando MainActivity.kt..." -ForegroundColor Yellow
$mainActivityPath = "android\app\src\main\java\com\mobiletelemedicina\MainActivity.kt"
if (Test-Path $mainActivityPath) {
    $mainActivity = Get-Content $mainActivityPath -Raw
    if ($mainActivity -match "Frontend") {
        Write-Host "  OK MainActivity.kt esta correto" -ForegroundColor Green
    } else {
        Write-Host "  ERRO: MainActivity.kt pode estar incorreto" -ForegroundColor Red
    }
} else {
    Write-Host "  AVISO: MainActivity.kt nao encontrado" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Limpeza Concluida!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Proximos passos:" -ForegroundColor Yellow
Write-Host '  1. npm start -- --reset-cache' -ForegroundColor White
Write-Host '  2. Em outro terminal: npm run android' -ForegroundColor White
Write-Host ""
