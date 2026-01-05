# Estrutura do Projeto Front-End

Este documento descreve a estrutura do projeto e as melhores práticas de organização do código.

## 📁 Estrutura de Diretórios

```
src/
├── components/          # Componentes reutilizáveis
│   ├── Badge.tsx
│   ├── BottomNavigation.tsx
│   ├── Button.tsx
│   ├── Card.tsx
│   └── Header.tsx
│
├── config/             # Configurações do projeto
│   ├── api.config.ts   # Configuração da API (URLs, endpoints)
│   └── axios.config.ts # Configuração do Axios (interceptors, etc)
│
├── constants/          # Constantes reutilizáveis
│   └── timeSlots.ts    # Horários disponíveis
│
├── screens/            # Telas do aplicativo
│   ├── auth/           # Telas de autenticação (futuro)
│   ├── home/           # Telas do home (futuro)
│   ├── appointments/   # Telas de agendamentos (futuro)
│   ├── messages/       # Telas de mensagens (futuro)
│   └── profile/        # Telas de perfil (futuro)
│
├── services/           # Serviços de API
│   └── api/
│       ├── auth.service.ts         # Serviço de autenticação
│       ├── appointment.service.ts  # Serviço de agendamentos
│       ├── professional.service.ts # Serviço de profissionais
│       ├── message.service.ts      # Serviço de mensagens
│       └── index.ts                # Barrel export
│
├── theme/              # Tema e estilos
│   └── colors.ts       # Paleta de cores
│
├── types/              # Definições de tipos TypeScript
│   ├── appointment.types.ts  # Tipos relacionados a agendamentos
│   ├── auth.types.ts         # Tipos relacionados a autenticação
│   ├── message.types.ts      # Tipos relacionados a mensagens
│   └── index.ts              # Barrel export
│
└── utils/              # Funções utilitárias
    ├── formatters.ts   # Funções de formatação (data, CPF, moeda)
    ├── validators.ts   # Funções de validação (email, CPF, senha)
    └── index.ts        # Barrel export
```

## 📋 Convenções

### Configuração
- **API URLs**: Centralizadas em `config/api.config.ts`
- **Axios**: Configurado em `config/axios.config.ts` com interceptors
- **Endpoints**: Definidos como constantes em `config/api.config.ts`

### Services
- Todos os serviços de API devem estar em `services/api/`
- Cada serviço corresponde a um domínio (auth, appointments, etc)
- Services retornam Promises tipadas
- Headers de autenticação são adicionados em cada chamada

### Types
- Tipos relacionados a um mesmo domínio devem estar no mesmo arquivo
- Usar `index.ts` para barrel exports
- Interfaces devem ser exportadas para reutilização

### Utils
- Funções puras (sem side effects)
- Bem testadas e documentadas
- Organizadas por categoria (formatters, validators)

### Components
- Componentes reutilizáveis devem estar em `components/`
- Componentes específicos de tela podem ficar em `screens/`
- Usar TypeScript para tipagem de props

## 🚀 Como Usar

### Configuração da API

```typescript
import { API_BASE_URL, API_ENDPOINTS } from './config/api.config';
```

### Usando Services

```typescript
import { authService } from './services/api';
import { appointmentService } from './services/api';

// Login
const response = await authService.login({ email, password });

// Buscar agendamentos
const appointments = await appointmentService.getMyAppointments(token);
```

### Usando Utils

```typescript
import { formatDate, formatTime, formatCPF } from './utils/formatters';
import { isValidEmail, isValidCPF } from './utils/validators';

// Formatação
const formattedDate = formatDate('2024-01-15'); // "15/01/2024"
const formattedCPF = formatCPF('12345678900'); // "123.456.789-00"

// Validação
const isValid = isValidEmail('user@example.com');
```

### Usando Types

```typescript
import { Appointment, Professional } from './types';
import { LoginRequest, User } from './types';
```

## 🔄 Próximos Passos

1. **Hooks Customizados**: Criar hooks como `useAuth`, `useAppointments`
2. **Organização de Screens**: Agrupar telas em subpastas por domínio
3. **Context API**: Implementar Context para estado global (auth, etc)
4. **Error Handling**: Centralizar tratamento de erros
5. **Loading States**: Criar componente de loading reutilizável

