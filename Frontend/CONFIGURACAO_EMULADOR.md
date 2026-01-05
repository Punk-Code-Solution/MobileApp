# 🔧 Configuração para Emulador Android

## ✅ Alterações Realizadas

### 1. API Config (`api.config.ts`)
- ✅ Alterado para usar `http://10.0.2.2:3000` (IP padrão do emulador)
- ✅ Comentado o IP de dispositivo físico (`192.168.1.109:3000`)

### 2. Axios Config (`axios.config.ts`)
- ✅ Melhorado tratamento de erros de conexão
- ✅ Adicionado log detalhado para debug
- ✅ Mensagem de erro mais informativa

## 📋 Como Funciona

### Emulador Android
- **IP:** `10.0.2.2` (mapeia para `localhost` da máquina)
- **Porta:** `3000` (porta padrão do backend)
- **URL Completa:** `http://10.0.2.2:3000`

### Dispositivo Físico
- **IP:** `192.168.1.109` (IP da máquina na rede local)
- **Porta:** `3000`
- **URL Completa:** `http://192.168.1.109:3000`

## ⚠️ Importante

### Para Usar no Emulador:
A configuração atual está pronta para emulador. Certifique-se de que:
1. ✅ Backend está rodando em `localhost:3000`
2. ✅ Emulador está conectado
3. ✅ Metro bundler está rodando

### Para Usar em Dispositivo Físico:
1. Descubra o IP da sua máquina: `ipconfig` (Windows) ou `ifconfig` (Linux/Mac)
2. Descomente a linha do dispositivo físico em `api.config.ts`
3. Comente a linha do emulador

## 🔍 Debug

Se ainda houver erro de conexão:
1. Verifique se o backend está rodando: `cd Backend && npm run start:dev`
2. Verifique a URL no console: `console.log('API URL:', API_BASE_URL)`
3. Teste a URL no navegador: `http://localhost:3000/auth/login` (deve retornar erro de método, não erro de conexão)
4. Verifique os logs do axios no console

## 📝 Checklist

- [x] URL configurada para emulador (`10.0.2.2:3000`)
- [x] Tratamento de erros melhorado
- [x] Logs detalhados adicionados
- [ ] Backend rodando em `localhost:3000`
- [ ] Metro bundler rodando
- [ ] Emulador conectado

