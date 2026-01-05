# 🚀 Deploy na Vercel - Guia Completo

Este guia explica como fazer deploy do backend NestJS na Vercel.

## 📋 Pré-requisitos

1. Conta na Vercel
2. Repositório no GitHub
3. Banco de dados PostgreSQL (recomendado: Vercel Postgres, Neon, ou Supabase)

## 🔧 Configuração

### 1. Variáveis de Ambiente

Configure as seguintes variáveis de ambiente na Vercel:

1. Acesse o projeto na Vercel
2. Vá em **Settings** > **Environment Variables**
3. Adicione as seguintes variáveis:

```env
# Database
DATABASE_URL="postgresql://usuario:senha@host:5432/telemedicina?schema=public"

# JWT
JWT_SECRET="seu-secret-jwt-super-seguro-aqui"

# Server
PORT=3000
NODE_ENV="production"

# CORS (opcional - URLs permitidas separadas por vírgula)
ALLOWED_ORIGINS="https://seu-frontend.vercel.app,https://outro-dominio.com"
```

### 2. Build Settings

A Vercel detecta automaticamente as configurações do `vercel.json`, mas você pode verificar:

- **Framework Preset**: Other
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 3. Root Directory

Se o backend estiver em uma subpasta (ex: `Backend/`), configure o **Root Directory** na Vercel:

1. Vá em **Settings** > **General**
2. Configure **Root Directory** como `Backend`

## 📁 Arquivos Criados

### `vercel.json`
Configuração principal do Vercel que define:
- Comando de build
- Diretório de saída
- Rewrites para rotear todas as requisições para `/api`

### `api/index.ts`
Handler serverless que:
- Cria uma instância do NestJS
- Configura middlewares (CORS, validação, etc.)
- Cacheia a aplicação para melhor performance

### `.vercelignore`
Arquivos e pastas ignorados no deploy

## 🚀 Deploy

### Opção 1: Via GitHub (Recomendado)

1. Conecte seu repositório GitHub à Vercel
2. Configure as variáveis de ambiente
3. Faça push para a branch `main` (ou a branch configurada)
4. A Vercel fará o deploy automaticamente

### Opção 2: Via CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Fazer login
vercel login

# Deploy
cd Backend
vercel

# Deploy de produção
vercel --prod
```

## 🔍 Verificando o Deploy

Após o deploy, você pode testar a API:

```bash
# Substitua pela URL fornecida pela Vercel
curl https://seu-projeto.vercel.app/api/auth/login
```

## ⚠️ Problemas Comuns

### Erro: "Cannot find module"
- Certifique-se de que todas as dependências estão em `dependencies` (não `devDependencies`)
- Execute `npm install --production` localmente para verificar

### Erro: "Database connection failed"
- Verifique se a `DATABASE_URL` está correta
- Certifique-se de que o banco permite conexões externas
- Para Vercel Postgres, use a connection string fornecida

### Erro: "Build failed"
- Verifique os logs de build na Vercel
- Certifique-se de que `npm run build` funciona localmente
- Verifique se há erros de TypeScript

### CORS bloqueando requisições
- Configure `ALLOWED_ORIGINS` com as URLs do frontend
- Ou ajuste o CORS no código para aceitar todas as origens em produção (não recomendado para produção)

## 📝 Notas Importantes

1. **Prisma**: Se estiver usando Prisma, você precisará gerar o cliente antes do build:
   ```json
   "build": "prisma generate && nest build"
   ```

2. **Migrations**: Execute as migrations no banco de dados antes do primeiro deploy:
   ```bash
   npx prisma migrate deploy
   ```

3. **Cold Start**: A primeira requisição pode ser mais lenta devido ao cold start das serverless functions

4. **Timeout**: Funções serverless têm timeout (10s no plano gratuito, 60s no Pro)

## 🔗 Links Úteis

- [Documentação Vercel](https://vercel.com/docs)
- [NestJS na Vercel](https://vercel.com/guides/deploying-nestjs-to-vercel)
- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)

