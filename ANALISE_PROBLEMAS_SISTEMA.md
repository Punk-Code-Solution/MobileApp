# 🔍 Análise de Problemas do Sistema Healtec

## 📋 Resumo Executivo

Esta análise identifica **problemas críticos, médios e menores** no sistema de telemedicina, cobrindo Backend (NestJS) e Frontend (React Native).

---

## 🚨 PROBLEMAS CRÍTICOS

### 1. **Segurança: JWT Secret Hardcoded**

**Localização:**
- `Back-End/src/auth/jwt.strategy.ts:14`
- `Back-End/src/auth/auth.module.ts:15`

**Problema:**
```typescript
secretOrKey: 'SEGREDO_SUPER_SECRETO', // ❌ HARDCODED
```

**Impacto:**
- ⚠️ **CRÍTICO**: Secret exposto no código
- Qualquer pessoa com acesso ao código pode gerar tokens válidos
- Violação de segurança grave em produção

**Solução:**
```typescript
// Usar variável de ambiente
secretOrKey: process.env.JWT_SECRET || 'fallback-dev-only',
```

**Prioridade:** 🔴 **ALTA - Corrigir IMEDIATAMENTE**

---

### 2. **Race Condition: Double Booking**

**Localização:**
- `Back-End/src/appointments/appointments.service.ts:68-91`

**Problema:**
```typescript
// Verifica conflito
const conflictingAppointment = await this.prisma.appointment.findFirst({...});

if (conflictingAppointment) {
  throw new BadRequestException('...');
}

// Cria agendamento (SEM TRANSAÇÃO)
const appointment = await this.prisma.appointment.create({...});
```

**Impacto:**
- ⚠️ **CRÍTICO**: Dois usuários podem agendar no mesmo horário simultaneamente
- Race condition entre verificação e criação
- Pode resultar em double booking

**Cenário:**
1. Usuário A verifica disponibilidade → ✅ Disponível
2. Usuário B verifica disponibilidade → ✅ Disponível (Ainda não criado)
3. Usuário A cria agendamento → ✅ Criado
4. Usuário B cria agendamento → ✅ Criado (CONFLITO!)

**Solução:**
```typescript
// Usar transação com lock ou constraint única no banco
return await this.prisma.$transaction(async (tx) => {
  // Verificar conflito dentro da transação
  const conflicting = await tx.appointment.findFirst({...});
  if (conflicting) throw new BadRequestException('...');
  
  // Criar dentro da mesma transação
  return await tx.appointment.create({...});
});
```

**Alternativa:** Adicionar constraint única no Prisma Schema:
```prisma
model Appointment {
  // ...
  @@unique([professionalId, scheduledAt, status])
  // Mas isso não funciona bem com status CANCELED
}
```

**Prioridade:** 🔴 **ALTA - Corrigir ANTES DE PRODUÇÃO**

---

### 3. **Conflito de Rotas: GET 'me' vs GET ':id'**

**Localização:**
- `Back-End/src/appointments/appointments.controller.ts:32-43`

**Problema:**
```typescript
@Get('me')        // Linha 32
findAll(...)      // Rota: GET /appointments/me

@Get(':id')       // Linha 37
findOne(...)      // Rota: GET /appointments/:id
```

**Impacto:**
- ⚠️ **MÉDIO-ALTO**: Se um usuário tiver ID = "me", a rota `:id` será chamada
- NestJS resolve rotas na ordem, mas é uma prática ruim
- Pode causar confusão e bugs sutis

**Solução:**
```typescript
// Opção 1: Mover 'me' para antes de ':id' (já está, mas melhorar)
@Get('me')
findAll(...)

@Get(':id')
findOne(...)

// Opção 2: Usar query param ou sub-rota
@Get()
findAll(@Query('filter') filter?: string, ...)

// Opção 3: Validar que :id não seja 'me'
@Get(':id')
findOne(@Param('id') id: string, ...) {
  if (id === 'me') {
    throw new BadRequestException('Invalid appointment ID');
  }
  // ...
}
```

**Prioridade:** 🟡 **MÉDIA**

---

## ⚠️ PROBLEMAS MÉDIOS

### 4. **UX: Botão Cancelar dentro de Card Clicável**

**Localização:**
- `Front-End/src/screens/MyAppointments.tsx:200-270`

**Problema:**
```typescript
<TouchableOpacity
  style={styles.card}
  onPress={() => setSelectedAppointment(item)}  // Card clicável
>
  {/* ... conteúdo ... */}
  <TouchableOpacity
    style={styles.cancelButton}
    onPress={() => handleCancel(...)}  // Botão dentro do card
  >
    Cancelar Consulta
  </TouchableOpacity>
</TouchableOpacity>
```

**Impacto:**
- ⚠️ **MÉDIO**: Ao tocar no botão "Cancelar", pode acionar o `onPress` do card
- UX confusa: usuário quer cancelar mas abre detalhes
- Pode causar frustração

**Solução:**
```typescript
// Opção 1: Usar View ao invés de TouchableOpacity no card
// E adicionar TouchableOpacity apenas nas áreas clicáveis

// Opção 2: Usar onStartShouldSetResponder no botão
<TouchableOpacity
  style={styles.cancelButton}
  onPress={() => handleCancel(...)}
  onStartShouldSetResponder={() => true}
>

// Opção 3: Separar o botão do card (melhor UX)
// Colocar botão fora do card ou usar swipe action
```

**Prioridade:** 🟡 **MÉDIA**

---

### 5. **Validação de Role no Create**

**Localização:**
- `Back-End/src/appointments/appointments.service.ts:15`

**Problema:**
```typescript
async create(createAppointmentDto: CreateAppointmentDto, userId: string) {
  // Não valida se o user.role é PATIENT antes de buscar Patient
  const patient = await this.prisma.patient.findUnique({
    where: { userId },
  });
  
  if (!patient) {
    throw new ForbiddenException('...');
  }
}
```

**Impacto:**
- ⚠️ **MÉDIO**: Profissional ou Admin podem tentar criar agendamento
- Faz query desnecessária no banco antes de validar role
- Mensagem de erro menos clara

**Solução:**
```typescript
async create(createAppointmentDto: CreateAppointmentDto, userId: string, userRole: string) {
  // Validar role primeiro
  if (userRole !== 'PATIENT') {
    throw new ForbiddenException('Apenas pacientes podem criar agendamentos.');
  }
  
  // Depois buscar patient
  const patient = await this.prisma.patient.findUnique({...});
}
```

**Nota:** Precisa passar `userRole` do controller.

**Prioridade:** 🟡 **MÉDIA**

---

### 6. **Problema de Timezone nas Datas**

**Localização:**
- `Back-End/src/appointments/appointments.service.ts:19-20`
- `Front-End/src/screens/AppointmentBooking.tsx`

**Problema:**
```typescript
const appointmentDate = new Date(scheduledAt); // Pode ter problemas de timezone
const now = new Date(); // Timezone do servidor
```

**Impacto:**
- ⚠️ **MÉDIO**: Comparações de data podem falhar com timezones diferentes
- Cliente envia UTC, servidor pode estar em outro timezone
- Validações de "passado" podem falhar

**Solução:**
```typescript
// Normalizar tudo para UTC
const appointmentDate = new Date(scheduledAt);
const now = new Date();

// Ou usar biblioteca como date-fns-tz ou moment-timezone
import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';
```

**Prioridade:** 🟡 **MÉDIA**

---

## 🔧 PROBLEMAS MENORES / MELHORIAS

### 7. **Validação de Double Booking Incompleta**

**Localização:**
- `Back-End/src/appointments/appointments.service.ts:74-85`

**Problema:**
```typescript
const conflictingAppointment = await this.prisma.appointment.findFirst({
  where: {
    scheduledAt: {
      gte: appointmentStart,
      lt: appointmentEnd,  // ❌ Não verifica se outro appointment começa antes mas termina durante
    },
  },
});
```

**Impacto:**
- ⚠️ **BAIXO**: Pode não detectar todos os conflitos
- Exemplo: Appointment existente 14:00-14:30, novo 14:15-14:45 → Não detecta

**Solução:**
```typescript
// Verificar sobreposição completa
where: {
  OR: [
    // Novo começa durante existente
    {
      scheduledAt: { lte: appointmentStart },
      // Calcular fim do appointment existente (assumindo 30min)
    },
    // Novo termina durante existente
    {
      scheduledAt: { gte: appointmentStart, lt: appointmentEnd },
    },
  ],
}
```

**Prioridade:** 🟢 **BAIXA**

---

### 8. **Falta Validação de Status IN_PROGRESS no Cancel**

**Localização:**
- `Back-End/src/appointments/appointments.service.ts:283-292`

**Problema:**
```typescript
if (appointment.status === 'CANCELED') {
  throw new BadRequestException('...');
}

if (appointment.status === 'COMPLETED') {
  throw new BadRequestException('...');
}

// ❌ Não valida IN_PROGRESS explicitamente
```

**Impacto:**
- ⚠️ **BAIXO**: Consulta em andamento pode ser cancelada (pode ser intencional)

**Solução:**
```typescript
if (appointment.status === 'IN_PROGRESS') {
  throw new BadRequestException('Não é possível cancelar uma consulta em andamento.');
}
```

**Prioridade:** 🟢 **BAIXA**

---

### 9. **CORS Muito Permissivo**

**Localização:**
- `Back-End/src/main.ts:18`

**Problema:**
```typescript
app.enableCors(); // ❌ Permite todas as origens
```

**Impacto:**
- ⚠️ **MÉDIO**: Qualquer origem pode fazer requisições
- Risco de CSRF em produção

**Solução:**
```typescript
app.enableCors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
});
```

**Prioridade:** 🟡 **MÉDIA (Para Produção)**

---

### 10. **Falta Tratamento de Erro de Rede no Mobile**

**Localização:**
- `Front-End/src/screens/AppointmentBooking.tsx`
- `Front-End/src/screens/MyAppointments.tsx`

**Problema:**
```typescript
catch (error: any) {
  const errorMessage = error.response?.data?.message || '...';
  // ❌ Não trata erro de rede (sem internet)
}
```

**Impacto:**
- ⚠️ **MÉDIO**: Usuário sem internet vê mensagem genérica
- UX ruim

**Solução:**
```typescript
catch (error: any) {
  if (!error.response) {
    // Erro de rede
    Alert.alert('Sem Conexão', 'Verifique sua conexão com a internet.');
    return;
  }
  // ...
}
```

**Prioridade:** 🟡 **MÉDIA**

---

## 📊 Resumo por Prioridade

### 🔴 Críticos (Corrigir IMEDIATAMENTE)
1. JWT Secret Hardcoded
2. Race Condition em Double Booking

### 🟡 Médios (Corrigir ANTES DE PRODUÇÃO)
3. Conflito de Rotas GET 'me' vs ':id'
4. UX: Botão Cancelar dentro de Card
5. Validação de Role no Create
6. Problema de Timezone
7. CORS Muito Permissivo
8. Tratamento de Erro de Rede

### 🟢 Baixos (Melhorias)
9. Validação de Double Booking Incompleta
10. Validação de IN_PROGRESS no Cancel

---

## ✅ Recomendações Imediatas

1. **URGENTE**: Mover JWT Secret para variável de ambiente
2. **URGENTE**: Implementar transação para prevenir race condition
3. **IMPORTANTE**: Melhorar UX do botão cancelar
4. **IMPORTANTE**: Adicionar validação de role no create
5. **IMPORTANTE**: Configurar CORS adequadamente para produção

---

**Data da Análise:** 2024  
**Versão do Sistema:** 1.0  
**Analisado por:** Sistema de Análise Automática

