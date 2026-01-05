# Estrutura do Projeto Back-End

Este documento descreve a estrutura do projeto backend NestJS e as melhores práticas de organização do código.

## 📁 Estrutura de Diretórios

```
src/
├── app.module.ts          # Módulo raiz da aplicação
├── app.controller.ts      # Controller raiz
├── app.service.ts         # Service raiz
├── main.ts               # Arquivo de entrada da aplicação
│
├── config/               # Configurações centralizadas
│   ├── app.config.ts     # Configuração geral da aplicação (porta, CORS)
│   ├── jwt.config.ts     # Configuração JWT
│   ├── database.config.ts # Configuração do banco de dados
│   └── index.ts          # Barrel export
│
├── common/               # Recursos compartilhados
│   ├── decorators/       # Decorators customizados
│   │   ├── current-user.decorator.ts
│   │   └── index.ts
│   ├── guards/          # Guards de autenticação/autorização
│   │   ├── jwt-auth.guard.ts
│   │   └── index.ts
│   ├── strategies/      # Estratégias de autenticação
│   │   ├── jwt.strategy.ts
│   │   └── index.ts
│   ├── filters/         # Filtros de exceção
│   │   ├── http-exception.filter.ts
│   │   └── index.ts
│   ├── interceptors/    # Interceptors
│   │   ├── transform.interceptor.ts
│   │   └── index.ts
│   └── index.ts         # Barrel export
│
├── utils/               # Funções utilitárias
│   ├── hash.util.ts     # Utilitários de hash (bcrypt)
│   └── index.ts         # Barrel export
│
├── prisma/              # Módulo Prisma
│   ├── prisma.module.ts
│   └── prisma.service.ts
│
├── auth/                # Módulo de autenticação
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── dto/
│   │   ├── login.dto.ts
│   │   ├── create-auth.dto.ts
│   │   └── update-auth.dto.ts
│   └── entities/
│       └── auth.entity.ts
│
├── users/               # Módulo de usuários
│   ├── users.module.ts
│   ├── users.controller.ts
│   ├── users.service.ts
│   ├── dto/
│   │   ├── create-user.dto.ts
│   │   └── update-user.dto.ts
│   └── entities/
│       └── user.entity.ts
│
├── professionals/       # Módulo de profissionais
│   ├── professionals.module.ts
│   ├── professionals.controller.ts
│   ├── professionals.service.ts
│   ├── dto/
│   │   ├── create-professional.dto.ts
│   │   └── update-professional.dto.ts
│   └── entities/
│       └── professional.entity.ts
│
└── appointments/        # Módulo de agendamentos
    ├── appointments.module.ts
    ├── appointments.controller.ts
    ├── appointments.service.ts
    ├── dto/
    │   ├── create-appointment.dto.ts
    │   └── update-appointment.dto.ts
    └── entities/
        └── appointment.entity.ts
```

## 📋 Convenções

### Configuração
- **Configs**: Centralizadas em `config/`
- **Variáveis de ambiente**: Acessadas apenas nos arquivos de config
- **Valores padrão**: Definidos nos arquivos de config

### Common
- **Decorators**: Em `common/decorators/` para reutilização
- **Guards**: Em `common/guards/` para proteção de rotas
- **Strategies**: Em `common/strategies/` para autenticação
- **Filters**: Em `common/filters/` para tratamento de erros
- **Interceptors**: Em `common/interceptors/` para transformação de respostas

### Módulos
- Cada módulo segue a estrutura: `module.ts`, `controller.ts`, `service.ts`
- DTOs em subpasta `dto/`
- Entities em subpasta `entities/`
- Testes ao lado dos arquivos (`.spec.ts`)

### Utils
- Funções puras (sem side effects)
- Bem testadas e documentadas
- Organizadas por categoria

## 🚀 Como Usar

### Configuração

```typescript
import { appConfig, jwtConfig } from './config';

// Usar configurações
const port = appConfig.port;
const secret = jwtConfig.secret;
```

### Decorators

```typescript
import { CurrentUser } from './common/decorators';

@Get('profile')
getProfile(@CurrentUser() user: CurrentUserPayload) {
  return user;
}
```

### Guards

```typescript
import { JwtAuthGuard } from './common/guards';

@UseGuards(JwtAuthGuard)
@Get('protected')
getProtected() {
  return 'This is protected';
}
```

### Utils

```typescript
import { hashPassword, comparePassword } from './utils';

// Hash de senha
const hashed = await hashPassword('senha123');

// Comparar senha
const isValid = await comparePassword('senha123', hashed);
```

## 🔄 Próximos Passos

1. **DTOs compartilhados**: Criar pasta `common/dto/` para DTOs reutilizáveis
2. **Pipes customizados**: Criar pipes em `common/pipes/`
3. **Constants**: Criar pasta `constants/` para constantes reutilizáveis
4. **Enums**: Organizar enums em `common/enums/`
5. **Middleware**: Criar pasta `common/middleware/` se necessário

