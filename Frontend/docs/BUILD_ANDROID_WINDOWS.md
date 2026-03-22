# Build Android no Windows (Release)

## Erro: `Filename longer than 260 characters` (CMake / ninja)

O Gradle + CMake gera arquivos com caminhos muito longos. No Windows, o limite clássico é **260 caracteres**, e o build pode falhar em módulos como `react-native-safe-area-context` (codegen da Nova Arquitetura).

### Opção A — Projeto já configurado no repositório

No `android/gradle.properties` está `newArchEnabled=false`, o que costuma evitar esse erro em caminhos longos.

### Opção B — Ativar caminhos longos no Windows (recomendado se precisar da Nova Arquitetura)

1. **Editor de Política de Grupo** (Windows Pro):  
   *Configuração do Computador → Modelos Administrativos → Sistema → Sistema de arquivos → Habilitar caminhos longos do Win32* → **Habilitado**

2. **Ou registro** (PowerShell **como Administrador**):

```powershell
New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" `
  -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force
```

Reinicie o PC. Depois volte `newArchEnabled=true` se desejar.

### Opção C — Caminho curto para o projeto

Ex.: mover/clonar para `C:\rn\MobileApp\Frontend` em vez de `C:\Users\...\Documents\Repositorio\...`.

### Opção D — Unidade virtual (subst)

```cmd
subst R: C:\Users\seuusuario\Documents\Repositorio\MobileApp
cd R:\Frontend
npm run android:build:production
```

---

## Limpar build nativo após mudar `newArchEnabled`

```powershell
cd android
.\gradlew clean
Remove-Item -Recurse -Force app\.cxx -ErrorAction SilentlyContinue
cd ..
```

Depois rode de novo o script de produção.
