# 🏥 Backend - Sistema de Telemedicina Healtec

API REST desenvolvida com NestJS para o sistema de telemedicina, fornecendo endpoints para autenticação, agendamentos, mensagens, notificações e avaliações.

## 📋 Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Tecnologias](#tecnologias)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Executando o Projeto](#executando-o-projeto)
- [Endpoints da API](#endpoints-da-api)
- [Banco de Dados](#banco-de-dados)
- [Deploy](#deploy)
- [Documentação Adicional](#documentação-adicional)

## 🎯 Sobre o Projeto

Backend completo desenvolvido com NestJS que fornece uma API REST para o aplicativo mobile de telemedicina. O sistema inclui:

- Autenticação JWT com validação de tipo de usuário
- Gerenciamento de agendamentos
- Sistema completo de mensagens e chat
- Sistema de notificações em tempo real
- Avaliações de consultas
- Cálculo automático de ratings de profissionais

## 🛠 Tecnologias

- **NestJS** 11.0.1 - Framework Node.js
- **TypeScript** 5.7.3
- **Prisma** 5.10.0 - ORM
- **PostgreSQL** - Banco de dados
- **JWT** - Autenticação
- **Bcrypt** 6.0.0 - Hash de senhas
- **Passport** 0.7.0 - Estratégias de autenticação
- **Fastify** - Servidor HTTP (compatível com Vercel)
- **Fastify CORS** - CORS para comunicação com mobile
- **Fastify Helmet** - Segurança HTTP

## 📁 Estrutura do Projeto

```
Backend/
├── src/
│   ├── auth/              # Autenticação (login, registro, JWT)
│   ├── users/             # Gerenciamento de usuários
│   ├── professionals/     # Profissionais (com cálculo de ratings)
│   ├── appointments/      # Agendamentos e avaliações
│   ├── notifications/     # Sistema de notificações
│   ├── messages/          # Sistema de mensagens e chat
│   ├── common/            # Recursos compartilhados
│   │   ├── guards/        # Guards de autenticação
│   │   ├── decorators/    # Decorators customizados
│   │   ├── filters/       # Filtros de exceção
│   │   ├── interceptors/  # Interceptors (Transform)
│   │   └── strategies/    # Estratégias Passport
│   ├── config/            # Configurações
│   ├── prisma/            # Serviço Prisma
│   └── utils/             # Utilitários
├── prisma/
│   ├── schema.prisma      # Schema do banco de dados
│   ├── migrations/        # Migrations do Prisma
│   ├── neon-schema.sql    # SQL completo para Neon
│   └── neon-inserts.sql   # Dados iniciais
├── api/
│   └── index.ts           # Entry point para Vercel
└── package.json
```

## 📦 Pré-requisitos

- **Node.js** >= 20
- **npm** ou **yarn**
- **PostgreSQL** (local) ou **Neon PostgreSQL** (cloud)
- **Prisma CLI** (instalado via npm)

## 🚀 Instalação

```bash
# Instalar dependências
npm install

# Gerar Prisma Client
npx prisma generate
```

## ⚙️ Configuração

### 1. Variáveis de Ambiente

Crie um arquivo `.env` na raiz do diretório `Backend`:

```env
# Database
DATABASE_URL="postgresql://usuario:senha@localhost:5432/telemedicina?schema=public"

# JWT
JWT_SECRET="seu-secret-jwt-super-seguro-aqui"

# Server
PORT=3000
NODE_ENV=development
```

### 2. Banco de Dados

#### Opção 1: Usando Prisma Migrations

```bash
# Criar e aplicar migrations
npx prisma migrate dev

# Gerar Prisma Client
npx prisma generate
```

#### Opção 2: Usando SQL direto (Neon PostgreSQL)

```bash
# 1. Execute o schema completo
psql "sua-connection-string" -f prisma/neon-schema.sql

# 2. (Opcional) Execute os dados iniciais
psql "sua-connection-string" -f prisma/neon-inserts.sql

# 3. Gere o Prisma Client
npx prisma generate
```

### 3. Dados Iniciais (Opcional)

```bash
# Popular banco com dados de exemplo
npx prisma db seed
```

## 🏃 Executando o Projeto

### Desenvolvimento

```bash
# Modo watch (hot reload)
npm run start:dev

# Modo normal
npm run start
```

### Produção

```bash
# Build
npm run build

# Executar
npm run start:prod
```

### Prisma Studio (Interface Visual do Banco)

```bash
npx prisma studio
```

Acesse em: `http://localhost:5555`

## 📡 Endpoints da API

### Autenticação

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| POST | `/auth/login` | Login (valida tipo de usuário) | ❌ |
| POST | `/auth/register` | Registro de novo usuário | ❌ |
| POST | `/auth/forgot-password` | Solicitar recuperação de senha | ❌ |
| POST | `/auth/reset-password` | Redefinir senha | ❌ |
| POST | `/auth/verify-email` | Verificar email com código | ❌ |

### Profissionais

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | `/professionals` | Listar profissionais (com ratings) | ✅ |

**Resposta inclui:**
- `averageRating`: Média de avaliações (0-5, arredondado para 1 decimal)
- `reviewsCount`: Quantidade de avaliações

### Agendamentos

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | `/appointments/me` | Listar meus agendamentos | ✅ |
| GET | `/appointments/:id` | Detalhes do agendamento | ✅ |
| POST | `/appointments` | Criar agendamento | ✅ |
| PATCH | `/appointments/:id/cancel` | Cancelar agendamento | ✅ |
| POST | `/appointments/:id/rate` | Avaliar consulta (1-5 + comentário) | ✅ |

### Notificações

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | `/notifications/me` | Listar minhas notificações | ✅ |
| PATCH | `/notifications/:id/read` | Marcar notificação como lida | ✅ |
| PATCH | `/notifications/read-all` | Marcar todas como lidas | ✅ |

### Mensagens

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | `/messages/conversations` | Listar conversas (com contador) | ✅ |
| GET | `/messages/conversations/:conversationId` | Mensagens de uma conversa | ✅ |
| POST | `/messages/conversations/:conversationId` | Enviar mensagem | ✅ |
| GET | `/messages/appointments/:appointmentId/conversation` | Buscar/criar conversa por consulta | ✅ |

**Nota**: Todos os endpoints (exceto autenticação) requerem Bearer Token no header:
```
Authorization: Bearer <token>
```

## 🗄️ Banco de Dados

### Schema Principal

O banco de dados inclui as seguintes tabelas:

- **User**: Usuários base (autenticação)
- **Patient**: Perfis de pacientes
- **Professional**: Perfis de profissionais
- **Specialty**: Especialidades médicas
- **ProfessionalSpecialty**: Relacionamento profissional-especialidade
- **Appointment**: Agendamentos
- **AppointmentRating**: Avaliações de consultas
- **MedicalRecord**: Prontuários médicos
- **AvailabilitySlot**: Horários disponíveis
- **Conversation**: Conversas de chat
- **Message**: Mensagens individuais
- **Notification**: Notificações do sistema
- **AuditLog**: Logs de auditoria

### Enums

- **Role**: `PATIENT`, `PROFESSIONAL`, `ADMIN`
- **AppointmentStatus**: `PENDING_PAYMENT`, `SCHEDULED`, `IN_PROGRESS`, `COMPLETED`, `CANCELED`
- **NotificationType**: `APPOINTMENT`, `MESSAGE`, `REMINDER`, `SYSTEM`

### Relacionamentos

- User ↔ Patient (1:1)
- User ↔ Professional (1:1)
- Patient ↔ Appointment (1:N)
- Professional ↔ Appointment (1:N)
- Appointment ↔ AppointmentRating (1:1)
- Appointment ↔ Conversation (1:1)
- Conversation ↔ Message (1:N)
- User ↔ Notification (1:N)
- Message ↔ Notification (1:N)

### Índices Otimizados

- `Notification`: `(userId, read)`, `(userId, createdAt)`
- `AppointmentRating`: `(appointmentId)`
- `Conversation`: `(patientId, professionalId)`, `(appointmentId)`
- `Message`: `(conversationId, createdAt)`, `(senderId)`

## 🚀 Deploy

### Vercel

O projeto está configurado para deploy no Vercel:

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel deploy
```

O arquivo `api/index.ts` converte requisições do Vercel para o formato Fastify.

### Variáveis de Ambiente no Vercel

Configure no painel do Vercel:
- `DATABASE_URL`
- `JWT_SECRET`
- `NODE_ENV=production`

## 📚 Documentação Adicional

- [Endpoints Implementados](./ENDPOINTS_IMPLEMENTADOS.md) - Documentação completa dos endpoints
- [Setup Completo](./SETUP_COMPLETO.md) - Guia de setup e testes
- [Schema SQL](./prisma/neon-schema.sql) - SQL completo do banco
- [Dados Iniciais](./prisma/neon-inserts.sql) - Dados de exemplo
- [Migration Messages](./MIGRATION_MESSAGES.md) - Documentação do sistema de mensagens

## 🧪 Testes

```bash
# Testes unitários
npm run test

# Testes e2e
npm run test:e2e

# Cobertura de testes
npm run test:cov
```

## 🔧 Comandos Úteis

```bash
# Prisma
npx prisma migrate dev          # Criar e aplicar migration
npx prisma migrate deploy       # Aplicar migrations em produção
npx prisma generate             # Gerar Prisma Client
npx prisma studio               # Abrir interface visual
npx prisma db seed              # Popular banco com dados

# Build
npm run build                   # Compilar TypeScript

# Desenvolvimento
npm run start:dev               # Modo watch
npm run start:debug             # Modo debug
```

## 📝 Licença

Este projeto está sob a licença MIT.

---

## ©️ Copyright

**© 2025-2026 Punk Code Solution - Todos os direitos reservados**

**CNPJ:** 61.805.210/0001-41  
**Endereço:** Rua do Aconchego, Ilhéus - BA  
**CEP:** 45656-627

Este software é propriedade da Punk Code Solution e está protegido pelas leis de direitos autorais brasileiras e internacionais.

---

**Desenvolvido com ❤️ pela Punk Code Solution para facilitar o acesso à saúde**
