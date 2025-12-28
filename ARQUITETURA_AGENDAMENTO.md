# 🏗️ Arquitetura do Sistema de Agendamento - Healtec

## 📋 Índice
1. [Análise do Schema Atual](#análise-do-schema-atual)
2. [Modelagem do Banco de Dados](#modelagem-do-banco-de-dados)
3. [Fluxo de Dados Completo](#fluxo-de-dados-completo)
4. [Endpoints REST](#endpoints-rest)
5. [Estrutura de Arquivos](#estrutura-de-arquivos)
6. [Validações e Regras de Negócio](#validações-e-regras-de-negócio)

---

## 🔍 Análise do Schema Atual

### ✅ Modelo `Appointment` (Já Existente)

```prisma
model Appointment {
  id             String            @id @default(uuid())
  patientId      String
  professionalId String
  patient        Patient           @relation(fields: [patientId], references: [id])
  professional   Professional      @relation(fields: [professionalId], references: [id])
  
  scheduledAt    DateTime          // Data e hora da consulta
  status         AppointmentStatus @default(PENDING_PAYMENT)
  price          Decimal           @db.Decimal(10, 2)
  
  videoRoomUrl   String?           // URL da sala de vídeo (futuro)
  
  medicalRecord  MedicalRecord?
  createdAt      DateTime          @default(now())
}

enum AppointmentStatus {
  PENDING_PAYMENT  // Criado, aguardando pagamento
  SCHEDULED        // Pago e agendado
  IN_PROGRESS      // Consulta em andamento
  COMPLETED        // Consulta finalizada
  CANCELED         // Cancelado (por qualquer motivo)
}
```

### 📊 Avaliação do Schema

**✅ Pontos Fortes:**
- Modelo completo e bem estruturado
- Relacionamentos corretos (Patient ↔ Professional)
- Enum de status apropriado para o fluxo
- Campos de auditoria (createdAt)
- Campo preparado para vídeo conferência

**⚠️ Considerações:**
- O campo `price` pode ser duplicado do `Professional.price` - **DECISÃO**: Manter no Appointment para permitir preços promocionais futuros
- Campo `updatedAt` ausente - **RECOMENDAÇÃO**: Adicionar para rastreamento de mudanças

### 🔧 Sugestão de Melhoria (Opcional)

```prisma
model Appointment {
  // ... campos existentes ...
  updatedAt      DateTime          @updatedAt  // Adicionar
  canceledAt     DateTime?         // Timestamp de cancelamento (opcional)
  canceledReason String?           // Motivo do cancelamento (opcional)
}
```

**Nota:** Por enquanto, manteremos o schema atual e podemos adicionar `updatedAt` em uma migration futura.

---

## 🗄️ Modelagem do Banco de Dados

### Diagrama de Relacionamentos

```
┌─────────────┐
│    User     │
│  (JWT sub)  │
└──────┬──────┘
       │
       ├──────────────┬──────────────┐
       │              │              │
┌──────▼──────┐  ┌───▼──────────┐  ┌▼───────────┐
│   Patient   │  │ Professional │  │ AuditLog   │
│             │  │              │  │            │
└──────┬──────┘  └───┬──────────┘  └────────────┘
       │             │
       │             │
       └─────┬───────┘
             │
      ┌──────▼─────────┐
      │  Appointment   │
      │                │
      │ - scheduledAt  │
      │ - status       │
      │ - price        │
      └────────┬───────┘
               │
        ┌──────▼──────────┐
        │ MedicalRecord   │
        │ (1:1)           │
        └─────────────────┘
```

### Relacionamentos

1. **Patient → Appointment**: 1:N (Um paciente pode ter múltiplos agendamentos)
2. **Professional → Appointment**: 1:N (Um profissional pode ter múltiplos agendamentos)
3. **Appointment → MedicalRecord**: 1:1 (Um agendamento pode ter um prontuário)

---

## 🔄 Fluxo de Dados Completo

### Fluxo Principal: Criação de Agendamento

```
┌──────────────┐
│ Mobile App   │
│ (React Native)│
└──────┬───────┘
       │
       │ 1. Usuário clica em "Agendar"
       │    (card do médico em DoctorsList)
       │
       ▼
┌─────────────────────────┐
│ Modal/Tela de Agendamento│
│ - Seleção de Data/Hora  │
│ - Confirmação de Preço  │
└──────┬──────────────────┘
       │
       │ 2. Usuário seleciona data/hora
       │    e confirma agendamento
       │
       ▼
┌─────────────────────────┐
│ POST /appointments      │
│ Headers:                │
│   Authorization: Bearer │
│   {token}               │
│ Body:                   │
│   {                     │
│     professionalId: str │
│     scheduledAt: ISO    │
│   }                     │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│ NestJS Backend          │
│                         │
│ 1. AuthGuard('jwt')     │
│    → Extrai userId do   │
│      token (req.user)   │
│                         │
│ 2. AppointmentsController│
│    → Valida DTO         │
│                         │
│ 3. AppointmentsService  │
│    → Busca Patient por  │
│       userId            │
│    → Valida Professional│
│    → Valida disponibi-  │
│       lidade            │
│    → Cria Appointment   │
│       (status: PENDING_)│
│       PAYMENT)          │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│ Prisma ORM              │
│                         │
│ INSERT INTO Appointment │
│ (id, patientId,         │
│  professionalId,        │
│  scheduledAt, price,    │
│  status)                │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│ PostgreSQL              │
│                         │
│ Persiste Appointment    │
│                         │
│ Retorna registro criado │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│ Response JSON           │
│ {                       │
│   id: "uuid",           │
│   patientId: "...",     │
│   professionalId: "...",│
│   scheduledAt: "...",   │
│   status: "PENDING_",   │
│         "PAYMENT",      │
│   price: 200.00,        │
│   professional: {       │
│     fullName: "...",    │
│     ...                 │
│   }                     │
│ }                       │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│ Mobile App              │
│                         │
│ - Exibe sucesso         │
│ - Navega para tela de   │
│   "Meus Agendamentos"   │
│   (futuro)              │
└─────────────────────────┘
```

### Fluxo Secundário: Listar Agendamentos do Usuário

```
Mobile App → GET /appointments/me
           ↓
Backend: Busca Patient/Professional por userId
         → Retorna appointments relacionados
           com includes (professional/patient)
```

---

## 🌐 Endpoints REST

### Base URL
```
http://10.0.2.2:3000 (Android Emulator)
```

### Autenticação
Todos os endpoints de agendamento requerem autenticação JWT via header:
```
Authorization: Bearer {token}
```

---

### 1. POST /appointments
**Criar novo agendamento**

**Request:**
```typescript
Headers: {
  Authorization: "Bearer {jwt_token}"
}
Body: {
  professionalId: string;  // UUID do profissional
  scheduledAt: string;     // ISO 8601: "2024-01-15T14:30:00Z"
}
```

**Response 201 Created:**
```typescript
{
  id: string;
  patientId: string;
  professionalId: string;
  scheduledAt: string;        // ISO 8601
  status: "PENDING_PAYMENT";
  price: number;              // Decimal como number
  createdAt: string;          // ISO 8601
  professional: {
    id: string;
    fullName: string;
    licenseNumber: string;
    specialties: Array<{
      specialty: {
        id: number;
        name: string;
      };
    }>;
  };
}
```

**Validações:**
- ✅ Usuário autenticado (PATIENT role)
- ✅ professionalId válido e existe
- ✅ scheduledAt é data futura
- ✅ Não há conflito de horário (professional já tem appointment nesse horário)
- ✅ scheduledAt está dentro do horário de trabalho do profissional (se AvailabilitySlot configurado)

**Erros:**
- `401 Unauthorized`: Token inválido/ausente
- `403 Forbidden`: Usuário não é PATIENT
- `400 Bad Request`: Dados inválidos ou conflito de horário
- `404 Not Found`: Professional não encontrado

---

### 2. GET /appointments/me
**Listar agendamentos do usuário logado**

**Request:**
```typescript
Headers: {
  Authorization: "Bearer {jwt_token}"
}
Query Params (opcionais): {
  status?: "PENDING_PAYMENT" | "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELED";
  upcoming?: boolean;  // true = apenas futuros, false = todos
}
```

**Response 200 OK:**
```typescript
Array<{
  id: string;
  scheduledAt: string;
  status: AppointmentStatus;
  price: number;
  professional: {
    id: string;
    fullName: string;
    licenseNumber: string;
    avatarUrl?: string;
    specialties: Array<{
      specialty: {
        name: string;
      };
    }>;
  };
  // Se for profissional logado, inclui também:
  patient?: {
    id: string;
    fullName: string;
    phone: string;
  };
}>
```

**Lógica:**
- Se `req.user.role === 'PATIENT'`: Retorna appointments onde `patientId === req.user.patient.id`
- Se `req.user.role === 'PROFESSIONAL'`: Retorna appointments onde `professionalId === req.user.professional.id`
- Se `req.user.role === 'ADMIN'`: Retorna todos os appointments

---

### 3. GET /appointments/:id
**Obter detalhes de um agendamento específico**

**Request:**
```typescript
Headers: {
  Authorization: "Bearer {jwt_token}"
}
Params: {
  id: string;  // UUID do appointment
}
```

**Response 200 OK:**
```typescript
{
  id: string;
  scheduledAt: string;
  status: AppointmentStatus;
  price: number;
  videoRoomUrl?: string;
  createdAt: string;
  professional: {
    id: string;
    fullName: string;
    licenseNumber: string;
    bio?: string;
    avatarUrl?: string;
    specialties: Array<{
      specialty: {
        name: string;
      };
    }>;
  };
  patient: {
    id: string;
    fullName: string;
    phone: string;
  };
  medicalRecord?: {
    id: string;
    anamnesis: string;
    diagnosis?: string;
    createdAt: string;
  };
}
```

**Validações:**
- ✅ Usuário autenticado
- ✅ Usuário é o dono do appointment (PATIENT ou PROFESSIONAL relacionado) OU é ADMIN

**Erros:**
- `404 Not Found`: Appointment não encontrado
- `403 Forbidden`: Usuário não tem permissão para ver este appointment

---

### 4. PATCH /appointments/:id/cancel
**Cancelar um agendamento**

**Request:**
```typescript
Headers: {
  Authorization: "Bearer {jwt_token}"
}
Params: {
  id: string;
}
Body (opcional): {
  reason?: string;  // Motivo do cancelamento
}
```

**Response 200 OK:**
```typescript
{
  id: string;
  status: "CANCELED";
  // ... outros campos do appointment
}
```

**Validações:**
- ✅ Usuário autenticado
- ✅ Appointment existe e não está CANCELED ou COMPLETED
- ✅ Usuário é o dono (PATIENT ou PROFESSIONAL) OU é ADMIN

**Erros:**
- `400 Bad Request`: Appointment já cancelado ou finalizado
- `404 Not Found`: Appointment não encontrado
- `403 Forbidden`: Sem permissão

---

### 5. GET /professionals/:id/availability
**Verificar disponibilidade de um profissional (Futuro - Opcional)**

**Request:**
```typescript
Headers: {
  Authorization: "Bearer {jwt_token}"
}
Params: {
  id: string;  // UUID do professional
}
Query: {
  date: string;  // "2024-01-15" (YYYY-MM-DD)
}
```

**Response 200 OK:**
```typescript
{
  professionalId: string;
  date: string;
  availableSlots: Array<{
    time: string;        // "14:30"
    isAvailable: boolean;
  }>;
}
```

**Nota:** Este endpoint pode ser implementado em fase futura quando o sistema de AvailabilitySlot estiver completo.

---

## 📁 Estrutura de Arquivos

### Backend (NestJS)

```
backend-telemedicina/src/
├── appointments/
│   ├── appointments.module.ts
│   ├── appointments.service.ts
│   ├── appointments.controller.ts
│   ├── dto/
│   │   ├── create-appointment.dto.ts
│   │   ├── update-appointment.dto.ts
│   │   └── filter-appointments.dto.ts
│   ├── entities/
│   │   └── appointment.entity.ts
│   └── appointments.controller.spec.ts
│
├── auth/
│   ├── decorators/
│   │   └── current-user.decorator.ts  ← NOVO: Decorator para pegar user do JWT
│   └── ...
│
└── common/
    ├── guards/
    │   └── roles.guard.ts  ← FUTURO: Guard para verificar roles
    └── ...
```

### Mobile (React Native)

```
MobileTelemedicina/src/
├── screens/
│   ├── DoctorsList.tsx  (já existe)
│   └── AppointmentBooking.tsx  ← NOVO: Tela/Modal de agendamento
│
├── components/
│   └── AppointmentCard.tsx  ← FUTURO: Card de agendamento
│
├── services/
│   └── api.ts  ← NOVO: Centralizar chamadas da API
│
└── types/
    └── appointment.types.ts  ← NOVO: Types TypeScript
```

---

## ✅ Validações e Regras de Negócio

### Regras de Criação (POST /appointments)

1. **Autenticação:**
   - Usuário deve estar autenticado
   - Role deve ser `PATIENT`

2. **Validação de Dados:**
   - `professionalId`: Deve existir e ser UUID válido
   - `scheduledAt`: 
     - Deve ser uma data/hora futura (pelo menos 2 horas de antecedência)
     - Formato ISO 8601 válido
     - Não pode ser no passado

3. **Validação de Disponibilidade:**
   - Profissional não pode ter appointment no mesmo horário (`scheduledAt`)
   - (Futuro) Horário deve estar dentro da disponibilidade do profissional (AvailabilitySlot)

4. **Preço:**
   - Preço é copiado do `Professional.price` no momento da criação
   - Permite futuras promoções/personalizações

5. **Status Inicial:**
   - Sempre criado com `PENDING_PAYMENT`
   - Após pagamento (futuro), muda para `SCHEDULED`

### Regras de Cancelamento

1. Apenas PATIENT, PROFESSIONAL relacionado ou ADMIN podem cancelar
2. Não pode cancelar appointment já `COMPLETED`
3. Não pode cancelar appointment já `CANCELED`
4. (Futuro) Cancelamento dentro de 24h pode ter regras diferentes

### Regras de Listagem

1. PATIENT vê apenas seus próprios appointments
2. PROFESSIONAL vê apenas appointments onde é o profissional
3. ADMIN vê todos os appointments
4. Ordenação padrão: `scheduledAt ASC` (mais próximos primeiro)

---

## 🔐 Segurança

### JWT Token
- Token é extraído do header `Authorization: Bearer {token}`
- Payload contém: `{ sub: userId, email, role }`
- Token expira em 1 dia (configurado no AuthModule)

### Autorização
- Decorator `@UseGuards(AuthGuard('jwt'))` protege rotas
- Decorator customizado `@CurrentUser()` extrai usuário do token
- Validação de ownership antes de operações sensíveis

### Validação de Dados
- DTOs com `class-validator` para validação de entrada
- Sanitização de dados antes de persistência
- Proteção contra SQL Injection (Prisma ORM)

---

## 📊 Resumo Executivo

### Endpoints Prioritários (MVP)
1. ✅ **POST /appointments** - Criar agendamento
2. ✅ **GET /appointments/me** - Listar meus agendamentos
3. ✅ **GET /appointments/:id** - Ver detalhes
4. ⏳ **PATCH /appointments/:id/cancel** - Cancelar (Pode ser v2)

### Próximos Passos de Implementação

1. **Backend:**
   - Criar módulo `appointments`
   - Implementar decorator `@CurrentUser()`
   - Implementar service com validações
   - Implementar controller com endpoints

2. **Mobile:**
   - Criar tela/modal `AppointmentBooking`
   - Integrar DatePicker
   - Implementar chamada à API
   - Adicionar feedback visual

3. **Testes:**
   - Testes unitários dos services
   - Testes de integração dos endpoints
   - Testes E2E do fluxo completo

---

**Documento criado por:** Arquitetura Healtec  
**Data:** 2024  
**Versão:** 1.0

