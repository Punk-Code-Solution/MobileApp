# 🔧 Soluções para Erro 'app.router' is deprecated

## ❌ Problema

O `ExpressAdapter` do NestJS tenta acessar `app.router` que foi removido no Express 4.x, causando erro:
```
Error: 'app.router' is deprecated!
```

## 🔍 Abordagens Testadas

### 1. ✅ Patch no Prototype (Atual)
**Status:** Implementado, mas pode não funcionar em todos os casos

**Código:**
```typescript
const expressAppModule = require('express/lib/application');
const originalGet = expressAppModule.prototype.get;
expressAppModule.prototype.get = function(key: string) {
  if (key === 'router') return { stack: [] };
  try {
    return originalGet.call(this, key);
  } catch (error: any) {
    if (error?.message?.includes('app.router')) {
      return { stack: [] };
    }
    throw error;
  }
};
```

### 2. ⚠️ Downgrade do Express (Temporário)
**Status:** Funciona, mas não recomendado para produção

**Solução:**
```json
// package.json
"express": "4.17.1"  // Versão que ainda suporta app.router
```

### 3. 🔄 Usar FastifyAdapter
**Status:** Requer mudanças maiores no código

**Vantagens:**
- Fastify é mais rápido que Express
- Não tem o problema do app.router
- Suportado oficialmente pelo NestJS

**Desvantagens:**
- Requer mudar todos os middlewares
- Pode quebrar código existente

### 4. 🛠️ Criar Adapter Customizado
**Status:** Complexo, mas pode funcionar

Criar um adapter que não tenta acessar app.router.

### 5. ⬆️ Atualizar NestJS
**Status:** Verificar se versão mais recente já corrigiu

Verificar se `@nestjs/platform-express` versão mais recente já corrigiu o problema.

## 🎯 Solução Recomendada (Imediata)

### Opção A: Downgrade Temporário do Express

```bash
npm install express@4.17.1
```

Esta versão ainda suporta `app.router` e deve funcionar com o NestJS 11.

### Opção B: Patch Mais Agressivo

Adicionar no início do `api/index.ts`:

```typescript
// Patch antes de qualquer import
const expressApp = require('express/lib/application');
const originalGet = expressApp.prototype.get;

expressApp.prototype.get = function(key: string) {
  if (key === 'router') {
    return { stack: [] };
  }
  try {
    return originalGet.call(this, key);
  } catch (err: any) {
    if (err?.message?.includes('app.router')) {
      return { stack: [] };
    }
    throw err;
  }
};
```

### Opção C: Usar Versão Específica do @nestjs/platform-express

Verificar se há uma versão que já corrigiu o problema:

```bash
npm install @nestjs/platform-express@latest
```

## 📝 Solução Definitiva (Longo Prazo)

1. **Aguardar correção oficial** do NestJS
2. **Migrar para FastifyAdapter** se apropriado
3. **Usar versão específica** do Express que funciona

## 🔍 Verificação

Após aplicar qualquer solução, verificar:

```bash
# Build local
npm run build:vercel

# Testar localmente (se possível)
node dist/api/index.js
```

## 📚 Referências

- [NestJS ExpressAdapter Docs](https://docs.nestjs.com/faq/http-adapter)
- [Express 4.x Migration Guide](https://expressjs.com/en/guide/migrating-4.html)
- [NestJS GitHub Issues](https://github.com/nestjs/nest/issues)

