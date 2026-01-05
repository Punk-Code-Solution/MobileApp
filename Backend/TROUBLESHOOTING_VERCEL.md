# 🔧 Troubleshooting - Erro 500 na Vercel

## ❌ Erro: "This Serverless Function has crashed" (500)

### 🔍 Verificações Essenciais

#### 1. Variáveis de Ambiente

Certifique-se de que TODAS as variáveis de ambiente estão configuradas na Vercel:

1. Acesse: **Settings** > **Environment Variables**
2. Verifique se estão configuradas para **Production** (e Preview/Development se necessário)

**Variáveis Obrigatórias:**
```env
DATABASE_URL="postgresql://usuario:senha@host:5432/telemedicina?schema=public"
JWT_SECRET="seu-secret-jwt-super-seguro-aqui"
NODE_ENV="production"
```

**Variáveis Opcionais:**
```env
PORT=3000
ALLOWED_ORIGINS="https://seu-frontend.vercel.app"
JWT_EXPIRES_IN="1d"
```

#### 2. Verificar Logs na Vercel

1. Acesse o projeto na Vercel
2. Vá em **Deployments**
3. Clique no deployment que falhou
4. Veja os **Function Logs** para identificar o erro específico

#### 3. Problemas Comuns

##### A. DATABASE_URL não configurada
**Sintoma:** Erro ao conectar ao banco
**Solução:** Configure a variável `DATABASE_URL` na Vercel

##### B. Prisma Client não gerado
**Sintoma:** "Cannot find module '@prisma/client'"
**Solução:** O `postinstall` deve gerar automaticamente. Verifique se o script está no `package.json`

##### C. Timeout da função
**Sintoma:** Função demora muito para responder
**Solução:** 
- Verifique se há queries lentas
- Considere usar Prisma Accelerate para connection pooling
- Aumente o timeout no plano Pro (60s vs 10s no gratuito)

##### D. Erro de importação
**Sintoma:** "Cannot find module" ou erros de TypeScript
**Solução:** 
- Verifique se todas as dependências estão em `dependencies` (não apenas `devDependencies`)
- Execute `npm run build:vercel` localmente para verificar

##### E. CORS bloqueando
**Sintoma:** Erro de CORS em requisições
**Solução:** 
- Apps mobile não têm origin, então devem funcionar
- Se usar web, configure `ALLOWED_ORIGINS`

#### 4. Testar Localmente

Para simular o ambiente da Vercel:

```bash
# 1. Configure as variáveis de ambiente
export DATABASE_URL="sua-url-do-banco"
export JWT_SECRET="seu-secret"
export NODE_ENV="production"

# 2. Instale dependências
npm install --include=dev

# 3. Gere Prisma Client
npx prisma generate

# 4. Build
npm run build:vercel

# 5. Teste o handler
node -e "
const handler = require('./dist/api/index.js').default;
const http = require('http');
const server = http.createServer((req, res) => {
  handler(req, res);
});
server.listen(3000, () => console.log('Server running on port 3000'));
"
```

#### 5. Verificar Estrutura de Arquivos

Certifique-se de que a estrutura está correta:

```
Backend/
├── api/
│   └── index.ts          # Handler serverless
├── src/
│   └── ...               # Código fonte
├── dist/
│   ├── api/
│   │   └── index.js      # Handler compilado
│   └── src/              # Código compilado
├── prisma/
│   └── schema.prisma
├── vercel.json
└── package.json
```

#### 6. Prisma em Serverless

Para melhor performance em serverless, considere:

1. **Prisma Accelerate** (recomendado):
   - Connection pooling automático
   - Cache de queries
   - Melhor para serverless

2. **Configuração do PrismaClient**:
   ```typescript
   new PrismaClient({
     datasources: {
       db: {
         url: process.env.DATABASE_URL,
       },
     },
   })
   ```

#### 7. Verificar Build Logs

Na Vercel, verifique os logs de build:
- Se o Prisma Client foi gerado
- Se o build completou sem erros
- Se há warnings que podem causar problemas

## 🔍 Debug Passo a Passo

1. **Verifique as variáveis de ambiente** na Vercel
2. **Veja os Function Logs** no deployment
3. **Teste localmente** com as mesmas variáveis
4. **Verifique o build** - se compilou sem erros
5. **Teste uma rota simples** primeiro (ex: `/api` ou `/api/health`)

## 📝 Checklist de Deploy

- [ ] Variáveis de ambiente configuradas
- [ ] `DATABASE_URL` está correta e acessível
- [ ] `JWT_SECRET` está configurado
- [ ] `NODE_ENV=production` está configurado
- [ ] Build completa sem erros
- [ ] Prisma Client foi gerado (`postinstall` executado)
- [ ] Handler serverless está em `api/index.ts`
- [ ] `vercel.json` está configurado corretamente
- [ ] Root Directory está correto (se backend está em subpasta)

## 🆘 Ainda com Problemas?

1. Verifique os logs detalhados na Vercel
2. Teste localmente com as mesmas configurações
3. Verifique se o banco de dados está acessível publicamente
4. Considere usar Prisma Accelerate para melhor performance

