# 📱 Como Ver Logs em Produção - Android

## Método 1: Usando ADB Logcat (Recomendado)

### Pré-requisitos
1. **Android Debug Bridge (ADB)** instalado
   - Geralmente vem com o Android Studio
   - Ou instale o [Android SDK Platform Tools](https://developer.android.com/studio/releases/platform-tools)

2. **Dispositivo conectado via USB** com **Depuração USB ativada**
   - Vá em: Configurações > Sobre o telefone > Toque 7 vezes em "Número da compilação"
   - Depois: Configurações > Opções do desenvolvedor > Ativar "Depuração USB"

### Comandos para Ver Logs

#### Ver todos os logs do app:
```bash
adb logcat | grep -i "APPOINTMENT"
```

#### Ver apenas logs do React Native:
```bash
adb logcat | grep -E "ReactNativeJS|APPOINTMENT"
```

#### Salvar logs em arquivo:
```bash
adb logcat | grep -i "APPOINTMENT" > logs_agendamento.txt
```

#### Ver logs em tempo real e salvar:
```bash
adb logcat | grep -i "APPOINTMENT" | tee logs_agendamento.txt
```

#### Limpar logs antigos e ver apenas novos:
```bash
adb logcat -c && adb logcat | grep -i "APPOINTMENT"
```

### Filtros Úteis

**Ver apenas logs de agendamento:**
```bash
adb logcat | grep "\[APPOINTMENT"
```

**Ver logs de erro:**
```bash
adb logcat *:E | grep -i "APPOINTMENT"
```

**Ver logs com timestamp:**
```bash
adb logcat -v time | grep -i "APPOINTMENT"
```

## Método 2: Usando Android Studio Logcat

1. Abra o **Android Studio**
2. Conecte o dispositivo via USB
3. Vá em: **View > Tool Windows > Logcat**
4. No filtro, digite: `APPOINTMENT`
5. Os logs aparecerão em tempo real

## Método 3: Via Terminal do Dispositivo (Root necessário)

Se o dispositivo tiver root, você pode acessar os logs diretamente:

```bash
adb shell
su
logcat | grep -i "APPOINTMENT"
```

## Método 4: Script PowerShell para Facilitar

Crie um arquivo `ver-logs.ps1` na raiz do projeto Frontend:

```powershell
# Ver logs de agendamento em tempo real
Write-Host "Conectando ao dispositivo e mostrando logs..." -ForegroundColor Cyan
Write-Host "Pressione Ctrl+C para parar" -ForegroundColor Yellow
Write-Host ""

# Verificar se dispositivo está conectado
$devices = adb devices
if ($devices -notmatch "device$") {
    Write-Host "ERRO: Nenhum dispositivo conectado!" -ForegroundColor Red
    Write-Host "Conecte o dispositivo via USB e ative a depuração USB" -ForegroundColor Yellow
    exit 1
}

# Limpar logs antigos e mostrar novos
adb logcat -c
adb logcat -v time | Select-String -Pattern "APPOINTMENT"
```

Execute com:
```powershell
.\ver-logs.ps1
```

## Método 5: Salvar Logs Automaticamente no App (Futuro)

Para uma solução mais robusta, podemos adicionar uma biblioteca que salva logs em arquivo no dispositivo. Isso permitiria:
- Ver logs mesmo sem USB conectado
- Compartilhar logs facilmente
- Analisar logs offline

## 🔍 Dicas de Debug

### Ver logs apenas durante o processo de agendamento:

1. **Antes de iniciar o agendamento:**
   ```bash
   adb logcat -c
   ```

2. **Durante o agendamento, execute:**
   ```bash
   adb logcat | grep "\[APPOINTMENT"
   ```

3. **Após o problema ocorrer, salve os logs:**
   ```bash
   adb logcat -d | grep "\[APPOINTMENT" > logs_erro.txt
   ```

### Ver logs de um período específico:

```bash
# Limpar logs
adb logcat -c

# Aguardar o problema ocorrer...

# Depois, salvar todos os logs do período
adb logcat -d > logs_completo.txt
```

## 📋 Exemplo de Saída dos Logs

Quando você executar o comando, verá algo assim:

```
01-08 20:52:07.123 12345 12345 I ReactNativeJS: [APPOINTMENT] ===== INÍCIO DO PROCESSO DE AGENDAMENTO =====
01-08 20:52:07.124 12345 12345 I ReactNativeJS: [APPOINTMENT] Timestamp: 2024-01-08T20:52:07.123Z
01-08 20:52:07.125 12345 12345 I ReactNativeJS: [APPOINTMENT] Professional ID: abc-123-def-456
01-08 20:52:07.126 12345 12345 I ReactNativeJS: [APPOINTMENT] 📅 Validando data e horário...
01-08 20:52:07.200 12345 12345 I ReactNativeJS: [APPOINTMENT-SERVICE] ===== INÍCIO createAppointment =====
01-08 20:52:07.201 12345 12345 I ReactNativeJS: [APPOINTMENT-SERVICE] 📤 Enviando requisição POST...
```

## ⚠️ Importante

- **Em produção, os logs do console.log() ainda funcionam** - eles vão para o logcat do Android
- **Não esqueça de ativar a Depuração USB** no dispositivo
- **Os logs podem conter informações sensíveis** - tenha cuidado ao compartilhar
- **Para dispositivos sem root**, você precisa conectar via USB para ver os logs

## 🚀 Próximos Passos

Se quiser uma solução mais avançada, podemos:
1. Adicionar uma biblioteca de logging que salva em arquivo
2. Criar uma tela de debug no app para ver logs
3. Integrar com serviços como Sentry ou Firebase Crashlytics

