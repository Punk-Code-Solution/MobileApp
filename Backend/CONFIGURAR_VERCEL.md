# 🔧 Configuração de Variáveis de Ambiente na Vercel

## ⚠️ Erro: JWT_SECRET não configurado

Se você está recebendo o erro:
```
Error: JWT_SECRET deve ser definido em produção!
```

Isso significa que a variável de ambiente `JWT_SECRET` não está configurada na Vercel.

## 📋 Como Configurar

### 1. Acesse o Painel da Vercel

1. Acesse: https://vercel.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings** → **Environment Variables**

### 2. Adicione as Variáveis Necessárias

Adicione as seguintes variáveis de ambiente:

#### Obrigatórias:

- **`JWT_SECRET`**
  - Valor: Uma string aleatória e segura (mínimo 32 caracteres)
  - Exemplo: `openssl rand -hex 32` (no terminal)
  - Ambiente: Production, Preview, Development

- **`DATABASE_URL`**
  - Valor: URL de conexão do seu banco PostgreSQL (Neon)
  - Formato: `postgresql://usuario:senha@host:porta/database?sslmode=require`
  - Ambiente: Production, Preview, Development

- **`NODE_ENV`**
  - Valor: `production`
  - Ambiente: Production

#### Opcionais:

- **`JWT_EXPIRES_IN`**
  - Valor: `1d` (1 dia) ou outro valor
  - Ambiente: Production, Preview, Development

- **`ALLOWED_ORIGINS`**
  - Valor: Lista de origens permitidas separadas por vírgula
  - Exemplo: `https://seu-app.vercel.app,https://outro-dominio.com`
  - Ambiente: Production

### 3. Gerar um JWT_SECRET Seguro

No terminal, execute:

```bash
# Linux/Mac
openssl rand -hex 32

# Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

Ou use um gerador online: https://generate-secret.vercel.app/32

### 4. Aplicar as Mudanças

Após adicionar as variáveis:

1. Clique em **Save**
2. Faça um novo deploy (ou aguarde o próximo push)
3. As variáveis serão aplicadas no próximo deploy

## ✅ Verificação

Após configurar, o erro deve desaparecer e o backend deve iniciar corretamente.

## 🔒 Segurança

- **NUNCA** commite o `JWT_SECRET` no código
- Use valores diferentes para Development, Preview e Production
- Rotacione o secret periodicamente em produção

