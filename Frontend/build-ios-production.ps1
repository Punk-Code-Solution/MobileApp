# Script para gerar versao de producao do app iOS
# Uso: .\build-ios-production.ps1 [-SkipBundle] [-SkipPods] [-BundleOnly] [-BuildType Release|Debug] [-Scheme MobileTelemedicina]

param(
    [switch]$SkipBundle = $false,
    [switch]$SkipPods = $false,
    [switch]$BundleOnly = $false,
    [string]$BuildType = "Release",
    [string]$Scheme = "MobileTelemedicina",
    [string]$Configuration = "Release"
)

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Build de Producao - iOS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se estamos no diretorio correto
if (-not (Test-Path "package.json")) {
    Write-Host "ERRO: Execute este script na raiz do projeto Frontend" -ForegroundColor Red
    exit 1
}

# Detectar sistema operacional
$isWindows = $env:OS -eq "Windows_NT" -or $PSVersionTable.Platform -eq "Win32NT"
$isMacOS = (Get-Command uname -ErrorAction SilentlyContinue) -and ((uname) -eq "Darwin")

# Verificar se o Xcode esta disponivel (apenas necessario para compilacao)
if (-not $BundleOnly) {
    Write-Host "Verificando dependencias..." -ForegroundColor Yellow
    
    if ($isWindows) {
        Write-Host ""
        Write-Host "AVISO: Voce esta no Windows!" -ForegroundColor Yellow
        Write-Host "A compilacao do app iOS requer macOS com Xcode instalado." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Opcoes:" -ForegroundColor Cyan
        Write-Host "  1. Use -BundleOnly para gerar apenas o bundle (pode ser feito no Windows)" -ForegroundColor White
        Write-Host "  2. Execute a compilacao em um Mac com Xcode instalado" -ForegroundColor White
        Write-Host ""
        Write-Host "Deseja gerar apenas o bundle? (S/N)" -ForegroundColor Cyan
        $response = Read-Host
        if ($response -eq 'S' -or $response -eq 's') {
            $BundleOnly = $true
            Write-Host ""
        } else {
            Write-Host ""
            Write-Host "Compilacao cancelada. Use -BundleOnly para gerar apenas o bundle." -ForegroundColor Yellow
            exit 0
        }
    }
    
    if (-not $BundleOnly) {
        $xcodebuildPath = Get-Command xcodebuild -ErrorAction SilentlyContinue
        if (-not $xcodebuildPath) {
            Write-Host "ERRO: xcodebuild nao encontrado no PATH" -ForegroundColor Red
            Write-Host "Certifique-se de que o Xcode esta instalado e configurado" -ForegroundColor Yellow
            Write-Host "Use -BundleOnly para gerar apenas o bundle sem compilar" -ForegroundColor Yellow
            exit 1
        }
        Write-Host "  [OK] xcodebuild encontrado" -ForegroundColor Green

        # Verificar CocoaPods
        $podPath = Get-Command pod -ErrorAction SilentlyContinue
        if (-not $podPath) {
            Write-Host "ERRO: CocoaPods nao encontrado no PATH" -ForegroundColor Red
            Write-Host "Instale com: sudo gem install cocoapods" -ForegroundColor Yellow
            exit 1
        }
        Write-Host "  [OK] CocoaPods encontrado" -ForegroundColor Green
    }
} else {
    Write-Host "Modo BundleOnly: Gerando apenas o bundle (sem compilacao)" -ForegroundColor Yellow
    Write-Host ""
}

# Verificar se a pasta ios existe
if (-not (Test-Path "ios")) {
    Write-Host "ERRO: Pasta ios nao encontrada" -ForegroundColor Red
    exit 1
}
Write-Host "  [OK] Pasta ios encontrada" -ForegroundColor Green
Write-Host ""

# Limpar builds anteriores
Write-Host "Limpando builds anteriores..." -ForegroundColor Yellow
Write-Host "  Limpando cache do Metro..." -ForegroundColor Gray
if (Test-Path "node_modules\.cache") {
    Remove-Item -Recurse -Force "node_modules\.cache" -ErrorAction SilentlyContinue
}

if (-not $BundleOnly) {
    Write-Host "  Limpando build do iOS..." -ForegroundColor Gray
    Set-Location ios

    # Limpar build do Xcode
    if (Test-Path "build") {
        Remove-Item -Recurse -Force "build" -ErrorAction SilentlyContinue
    }

    # Limpar DerivedData (apenas no macOS)
    if ($isMacOS) {
        $derivedDataPath = "$env:HOME/Library/Developer/Xcode/DerivedData"
        if (Test-Path $derivedDataPath) {
            $projectDerivedData = Get-ChildItem -Path $derivedDataPath -Filter "*MobileTelemedicina*" -ErrorAction SilentlyContinue
            if ($projectDerivedData) {
                Write-Host "  Limpando DerivedData..." -ForegroundColor Gray
                Remove-Item -Recurse -Force $projectDerivedData.FullName -ErrorAction SilentlyContinue
            }
        }
    }

    Set-Location ..
}

Write-Host "  Build limpo com sucesso!" -ForegroundColor Green
Write-Host ""

# Instalar CocoaPods (apenas se nao for BundleOnly)
if (-not $BundleOnly -and -not $SkipPods) {
    Write-Host "Instalando dependencias do CocoaPods..." -ForegroundColor Yellow
    Set-Location ios
    
    Write-Host "  Executando: pod install..." -ForegroundColor Gray
    $podOutput = & pod install 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ERRO ao instalar pods!" -ForegroundColor Red
        Write-Host $podOutput -ForegroundColor Red
        Set-Location ..
        exit 1
    }
    
    Write-Host "  Pods instalados com sucesso!" -ForegroundColor Green
    Write-Host ""
    Set-Location ..
} elseif (-not $BundleOnly) {
    Write-Host "Pulando instalacao de pods (usando pods existentes)..." -ForegroundColor Yellow
    Write-Host ""
}

# Gerar bundle de producao
if (-not $SkipBundle) {
    Write-Host "Gerando bundle de producao..." -ForegroundColor Yellow
    $bundlePath = "ios\MobileTelemedicina"
    
    # Criar diretorio se nao existir
    if (-not (Test-Path $bundlePath)) {
        New-Item -ItemType Directory -Path $bundlePath -Force | Out-Null
    }
    
    # Gerar bundle
    Write-Host "  Executando: npx react-native bundle..." -ForegroundColor Gray
    
    # Executar bundle e capturar output
    $bundleOutput = & npx react-native bundle --platform ios --dev false --entry-file index.js --bundle-output "$bundlePath\main.jsbundle" --assets-dest $bundlePath --minify 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ERRO ao gerar bundle!" -ForegroundColor Red
        Write-Host $bundleOutput -ForegroundColor Red
        exit 1
    }
    
    # Verificar se o bundle foi criado
    if (-not (Test-Path "$bundlePath\main.jsbundle")) {
        Write-Host "  ERRO: Bundle nao foi gerado!" -ForegroundColor Red
        exit 1
    }
    
    $bundleSize = (Get-Item "$bundlePath\main.jsbundle").Length / 1KB
    Write-Host "  Bundle gerado com sucesso!" -ForegroundColor Green
    Write-Host "  Tamanho: $([math]::Round($bundleSize, 2)) KB" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "Pulando geracao de bundle (usando bundle existente)..." -ForegroundColor Yellow
    Write-Host ""
}

# Compilar app iOS (apenas se nao for BundleOnly)
if ($BundleOnly) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  Bundle Gerado com Sucesso!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Bundle gerado em:" -ForegroundColor Yellow
    Write-Host "  ios\MobileTelemedicina\main.jsbundle" -ForegroundColor White
    Write-Host ""
    Write-Host "Para compilar o app, execute este script em um Mac com Xcode:" -ForegroundColor Yellow
    Write-Host "  .\build-ios-production.ps1 -SkipBundle" -ForegroundColor White
    Write-Host ""
    exit 0
}

# Compilar app iOS
Write-Host "Compilando app iOS ($Configuration)..." -ForegroundColor Yellow
Set-Location ios

# Verificar se o workspace existe (apos pod install)
$workspacePath = "MobileTelemedicina.xcworkspace"
if (-not (Test-Path $workspacePath)) {
    Write-Host "ERRO: Workspace nao encontrado: $workspacePath" -ForegroundColor Red
    Write-Host "Execute 'pod install' na pasta ios primeiro" -ForegroundColor Yellow
    Set-Location ..
    exit 1
}

# Definir caminho de saida
$outputPath = "build"
$archivePath = "$outputPath\MobileTelemedicina.xcarchive"
$exportPath = "$outputPath\Export"

# Criar diretorio de saida
if (-not (Test-Path $outputPath)) {
    New-Item -ItemType Directory -Path $outputPath -Force | Out-Null
}

Write-Host "  Executando: xcodebuild archive..." -ForegroundColor Gray

# Compilar e criar archive
$archiveArgs = @(
    "archive",
    "-workspace", $workspacePath,
    "-scheme", $Scheme,
    "-configuration", $Configuration,
    "-archivePath", $archivePath,
    "CODE_SIGN_IDENTITY=",
    "CODE_SIGNING_REQUIRED=NO",
    "CODE_SIGNING_ALLOWED=NO"
)

$buildProcess = Start-Process -FilePath "xcodebuild" -ArgumentList $archiveArgs -NoNewWindow -Wait -PassThru -RedirectStandardOutput "$outputPath\archive.log" -RedirectStandardError "$outputPath\archive-error.log"

if ($buildProcess.ExitCode -ne 0) {
    Write-Host ""
    Write-Host "ERRO ao compilar archive!" -ForegroundColor Red
    Write-Host "Verifique os logs em:" -ForegroundColor Yellow
    Write-Host "  $outputPath\archive.log" -ForegroundColor Gray
    Write-Host "  $outputPath\archive-error.log" -ForegroundColor Gray
    Set-Location ..
    exit 1
}

# Verificar se o archive foi criado
if (-not (Test-Path $archivePath)) {
    Write-Host ""
    Write-Host "ERRO: Archive nao foi gerado!" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Write-Host "  Archive compilado com sucesso!" -ForegroundColor Green
Write-Host "  Local: $archivePath" -ForegroundColor Gray
Write-Host ""

# Exportar IPA (opcional - requer configuracoes de assinatura)
Write-Host "Deseja exportar o IPA? (S/N)" -ForegroundColor Cyan
Write-Host "NOTA: Exportar IPA requer configuracoes de assinatura e certificados" -ForegroundColor Yellow
$response = Read-Host

if ($response -eq 'S' -or $response -eq 's') {
    Write-Host ""
    Write-Host "Exportando IPA..." -ForegroundColor Yellow
    
    # Criar diretorio de export
    if (-not (Test-Path $exportPath)) {
        New-Item -ItemType Directory -Path $exportPath -Force | Out-Null
    }
    
    # Criar arquivo ExportOptions.plist basico
    $exportOptionsPath = "$exportPath\ExportOptions.plist"
    $exportOptionsContent = @"
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>development</string>
    <key>teamID</key>
    <string>YOUR_TEAM_ID</string>
</dict>
</plist>
"@
    
    Write-Host "  AVISO: Configure o ExportOptions.plist com suas credenciais" -ForegroundColor Yellow
    Write-Host "  Local: $exportOptionsPath" -ForegroundColor Gray
    
    # Exportar IPA (comentado por padrao - requer configuracao)
    # $exportArgs = @(
    #     "-exportArchive",
    #     "-archivePath", $archivePath,
    #     "-exportPath", $exportPath,
    #     "-exportOptionsPlist", $exportOptionsPath
    # )
    # 
    # $exportProcess = Start-Process -FilePath "xcodebuild" -ArgumentList $exportArgs -NoNewWindow -Wait -PassThru
    # 
    # if ($exportProcess.ExitCode -eq 0) {
    #     Write-Host "  IPA exportado com sucesso!" -ForegroundColor Green
    #     Write-Host "  Local: $exportPath" -ForegroundColor Gray
    # } else {
    #     Write-Host "  ERRO ao exportar IPA!" -ForegroundColor Red
    # }
}

Set-Location ..

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Build de Producao Concluido!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Archive gerado em:" -ForegroundColor Yellow
Write-Host "  ios\$archivePath" -ForegroundColor White
Write-Host ""
Write-Host "Para abrir no Xcode:" -ForegroundColor Yellow
Write-Host "  open ios\$archivePath" -ForegroundColor White
Write-Host ""
Write-Host "Para exportar o IPA manualmente:" -ForegroundColor Yellow
Write-Host "  1. Abra o Xcode" -ForegroundColor White
Write-Host "  2. Window > Organizer" -ForegroundColor White
Write-Host "  3. Selecione o archive e clique em 'Distribute App'" -ForegroundColor White
Write-Host ""

