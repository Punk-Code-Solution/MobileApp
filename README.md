# 🏥 Sistema de Telemedicina - Healtec

Sistema completo de telemedicina desenvolvido com React Native (mobile) e NestJS (backend), permitindo que pacientes agendem consultas online com profissionais de saúde, realizem videochamadas e gerenciem seus históricos médicos.

## 📋 Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Tecnologias](#tecnologias)
- [Funcionalidades](#funcionalidades)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Executando o Projeto](#executando-o-projeto)
- [API Endpoints](#api-endpoints)
- [Estrutura de Dados](#estrutura-de-dados)
- [Documentação Adicional](#documentação-adicional)
- [Contribuindo](#contribuindo)
- [Licença](#licença)

## 🎯 Sobre o Projeto

O **Healtec** é uma plataforma de telemedicina que conecta pacientes a profissionais de saúde de forma rápida e segura. O sistema permite:

- **Agendamento de Consultas**: Pacientes podem buscar e agendar consultas com profissionais de saúde
- **Comunicação em Tempo Real**: Sistema completo de mensagens e chat entre pacientes e profissionais
- **Gestão de Agendamentos**: Visualização de consultas agendadas, histórico detalhado e cancelamento
- **Avaliações**: Sistema de avaliação de consultas com ratings e comentários
- **Notificações**: Sistema de notificações em tempo real para eventos importantes
- **Perfis Diferenciados**: Interface personalizada para pacientes e profissionais
- **Autenticação Segura**: Sistema de autenticação com JWT e validação de tipo de usuário

## 🛠 Tecnologias

### Frontend (Mobile)
- **React Native** 0.83.1
- **TypeScript** 5.8.3
- **Axios** 1.13.2 - Cliente HTTP
- **React Native Linear Gradient** 2.8.3 - Gradientes
- **React Native Safe Area Context** 5.5.2 - Áreas seguras
- **AsyncStorage** - Cache local
- **React Native Reanimated** - Animações

### Backend
- **NestJS** 11.0.1 - Framework Node.js
- **TypeScript** 5.7.3
- **Prisma** 5.10.0 - ORM
- **PostgreSQL** - Banco de dados
- **JWT** - Autenticação
- **Bcrypt** 6.0.0 - Hash de senhas
- **Passport** 0.7.0 - Estratégias de autenticação
- **Fastify** - Servidor HTTP (compatível com Vercel)

## ✨ Funcionalidades

### Autenticação
- ✅ Login e registro de usuários (Paciente e Profissional)
- ✅ Validação de tipo de usuário no login
- ✅ Recuperação de senha
- ✅ Verificação de email
- ✅ Autenticação JWT
- ✅ Diferenciação de interface por tipo de usuário

### Agendamentos
- ✅ Busca de profissionais por especialidade
- ✅ Agendamento de consultas
- ✅ Visualização de agendamentos (próximos e histórico)
- ✅ Cancelamento de consultas
- ✅ Detalhes completos da consulta
- ✅ Avaliação de consultas (rating 1-5 + comentário)
- ✅ Cálculo automático de média de avaliações por profissional

### Comunicação
- ✅ Sistema completo de mensagens
- ✅ Chat em tempo real
- ✅ Conversas vinculadas a consultas
- ✅ Contadores de mensagens não lidas
- ✅ Marcação automática de mensagens como lidas
- ✅ Chamadas de áudio (interface)
- ✅ Videochamadas (interface)

### Notificações
- ✅ Sistema de notificações em tempo real
- ✅ Notificações para eventos de consulta
- ✅ Notificações para novas mensagens
- ✅ Marcação de notificações como lidas
- ✅ Contador de notificações não lidas
- ✅ Diferentes tipos de notificação (APPOINTMENT, MESSAGE, REMINDER, SYSTEM)

### Perfil
- ✅ Perfil do paciente
- ✅ Perfil do profissional
- ✅ Edição de dados
- ✅ Configurações
- ✅ Interface diferenciada por tipo de usuário

### Performance e UX
- ✅ Cache local de dados (AsyncStorage)
- ✅ Animações suaves (fade in, slide, scale, bounce)
- ✅ Loading states
- ✅ Tratamento de erros gracioso
- ✅ Pull-to-refresh
- ✅ Offline mode (visualização de dados em cache)

## 📁 Estrutura do Projeto

```
.
├── Frontend/              # Aplicativo React Native
│   ├── src/
│   │   ├── components/     # Componentes reutilizáveis
│   │   ├── screens/         # Telas do aplicativo
│   │   ├── services/       # Serviços de API
│   │   ├── hooks/          # Custom hooks
│   │   ├── config/         # Configurações
│   │   ├── utils/          # Utilitários (cache, etc)
│   │   ├── types/          # Tipos TypeScript
│   │   └── theme/          # Tema e cores
│   ├── android/            # Configurações Android
│   ├── ios/                # Configurações iOS
│   └── package.json
│
├── Backend/               # API NestJS
│   ├── src/
│   │   ├── auth/           # Módulo de autenticação
│   │   ├── users/          # Módulo de usuários
│   │   ├── professionals/  # Módulo de profissionais
│   │   ├── appointments/    # Módulo de agendamentos
│   │   ├── notifications/  # Módulo de notificações
│   │   ├── messages/       # Módulo de mensagens
│   │   ├── common/         # Recursos compartilhados
│   │   ├── config/         # Configurações
│   │   └── utils/          # Utilitários
│   ├── prisma/             # Schema e migrations Prisma
│   │   ├── schema.prisma   # Schema do banco
│   │   ├── neon-schema.sql # SQL completo para Neon
│   │   └── neon-inserts.sql # Dados iniciais
│   ├── api/                # Entry point para Vercel
│   └── package.json
│
└── README.md
```

## 📦 Pré-requisitos

Antes de começar, você precisa ter instalado:

- **Node.js** >= 20
- **npm** ou **yarn**
- **PostgreSQL** (para o backend) ou **Neon PostgreSQL** (cloud)
- **React Native CLI** (para desenvolvimento mobile)
- **Android Studio** (para Android) ou **Xcode** (para iOS)

## 🚀 Instalação

### 1. Clone o repositório

```bash
git clone <url-do-repositorio>
cd <nome-do-repositorio>
```

### 2. Instale as dependências do Backend

```bash
cd Backend
npm install
```

### 3. Instale as dependências do Frontend

```bash
cd Frontend
npm install
```

### 4. Para iOS (apenas macOS)

```bash
cd Frontend/ios
pod install
cd ../..
```

## ⚙️ Configuração

### Backend

1. Crie um arquivo `.env` na raiz do diretório `Backend`:

```env
# Database
DATABASE_URL="postgresql://usuario:senha@localhost:5432/telemedicina?schema=public"

# JWT
JWT_SECRET="seu-secret-jwt-super-seguro-aqui"

# Server
PORT=3000
NODE_ENV=development
```

2. **Opção 1: Usando Prisma Migrations**

```bash
cd Backend
npx prisma migrate dev
npx prisma generate
```

3. **Opção 2: Usando SQL direto (Neon PostgreSQL)**

Execute os arquivos SQL na ordem:
```bash
# 1. Schema completo
psql "sua-connection-string" -f prisma/neon-schema.sql

# 2. Dados iniciais (opcional)
psql "sua-connection-string" -f prisma/neon-inserts.sql
```

4. (Opcional) Popule o banco com dados de exemplo:

```bash
npx prisma db seed
```

### Frontend

1. Configure a URL da API em `Frontend/src/config/api.config.ts`:

```typescript
export const API_BASE_URL = __DEV__
  ? 'http://10.0.2.2:3000' // Android Emulator
  : 'http://localhost:3000'; // iOS Simulator ou dispositivo físico
```

**Nota**: Para dispositivos físicos, use o IP da sua máquina na rede local.

## 🏃 Executando o Projeto

### Backend

```bash
cd Backend

# Desenvolvimento (com hot reload)
npm run start:dev

# Produção
npm run build
npm run start:prod

# Deploy Vercel
vercel deploy
```

O backend estará rodando em `http://localhost:3000`

### Frontend

#### Android

```bash
cd Frontend

# Inicie o Metro Bundler
npm start

# Em outro terminal, execute:
npm run android
```

#### iOS

```bash
cd Frontend

# Inicie o Metro Bundler
npm start

# Em outro terminal, execute:
npm run ios
```

## 📡 API Endpoints

### Autenticação

```
POST   /auth/login              # Login (valida tipo de usuário)
POST   /auth/register           # Registro
POST   /auth/forgot-password    # Recuperar senha
POST   /auth/reset-password     # Redefinir senha
POST   /auth/verify-email       # Verificar email
```

### Profissionais

```
GET    /professionals           # Listar profissionais (com média de ratings)
```

**Resposta inclui:**
- `averageRating`: Média de avaliações (0-5)
- `reviewsCount`: Quantidade de avaliações

### Agendamentos

```
GET    /appointments/me         # Listar meus agendamentos
GET    /appointments/:id        # Detalhes do agendamento
POST   /appointments            # Criar agendamento
PATCH  /appointments/:id/cancel # Cancelar agendamento
POST   /appointments/:id/rate   # Avaliar consulta (1-5 estrelas + comentário)
```

### Notificações

```
GET    /notifications/me         # Listar minhas notificações
PATCH  /notifications/:id/read  # Marcar notificação como lida
PATCH  /notifications/read-all  # Marcar todas como lidas
```

### Mensagens

```
GET    /messages/conversations                    # Listar conversas (com contador de não lidas)
GET    /messages/conversations/:conversationId    # Mensagens de uma conversa
POST   /messages/conversations/:conversationId    # Enviar mensagem
GET    /messages/appointments/:appointmentId/conversation # Buscar/criar conversa por consulta
```

**Nota**: Todos os endpoints (exceto login e registro) requerem autenticação via Bearer Token no header `Authorization`.

## 🗄️ Estrutura de Dados

### Principais Entidades

- **User**: Usuário base (email, senha, role)
- **Patient**: Perfil do paciente (CPF, telefone, data de nascimento)
- **Professional**: Perfil do profissional (CRM, especialidades, preço, média de avaliações)
- **Appointment**: Agendamento (data, status, preço)
- **AppointmentRating**: Avaliação de consulta (rating 1-5, comentário)
- **Specialty**: Especialidades médicas
- **MedicalRecord**: Prontuário médico
- **Conversation**: Conversas entre paciente e profissional
- **Message**: Mensagens individuais
- **Notification**: Notificações do sistema

### Status de Agendamento

- `PENDING_PAYMENT` - Aguardando pagamento
- `SCHEDULED` - Agendado
- `IN_PROGRESS` - Em andamento
- `COMPLETED` - Finalizado
- `CANCELED` - Cancelado

### Tipos de Notificação

- `APPOINTMENT` - Relacionada a consultas
- `MESSAGE` - Relacionada a mensagens
- `REMINDER` - Lembretes
- `SYSTEM` - Notificações do sistema

### Tipos de Usuário

- `PATIENT` - Paciente (acessa tela inicial com busca de profissionais)
- `PROFESSIONAL` - Profissional (acessa diretamente tela de consultas)
- `ADMIN` - Administrador

Para mais detalhes, consulte o schema Prisma em `Backend/prisma/schema.prisma`.

## 🎨 Funcionalidades de Interface

### Diferenciação por Tipo de Usuário

- **Pacientes**: Veem tela inicial com busca de profissionais e serviços em destaque
- **Profissionais**: Acessam diretamente a tela de consultas (sem tela inicial)
- **Validação de Login**: Usuários só podem fazer login selecionando o tipo correto

### Cache e Performance

- Cache local de profissionais (TTL: 10 minutos)
- Cache local de notificações (TTL: 1 minuto)
- Cache local de agendamentos
- Animações suaves em todas as telas
- Pull-to-refresh em listas

### Animações

- Fade in em telas principais
- Slide in para modais
- Scale para botões
- Bounce para feedback visual

## 📚 Documentação Adicional

- [Backend - Endpoints Implementados](./Backend/ENDPOINTS_IMPLEMENTADOS.md) - Documentação completa dos endpoints
- [Backend - Setup Completo](./Backend/SETUP_COMPLETO.md) - Guia de setup e testes
- [Backend - Schema SQL](./Backend/prisma/neon-schema.sql) - SQL completo do banco
- [Backend - Dados Iniciais](./Backend/prisma/neon-inserts.sql) - Dados de exemplo

## 🤝 Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Padrões de Código

- Use TypeScript em todo o código
- Siga os padrões de código definidos
- Escreva testes para novas funcionalidades
- Documente funções e componentes complexos
- Use `react-native-safe-area-context` ao invés de `SafeAreaView` do React Native

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](./LICENSE) para mais detalhes.

## 👥 Autores

- **Equipe Healtec** - Desenvolvimento inicial

## 🙏 Agradecimentos

- Comunidade React Native
- Comunidade NestJS
- Todos os contribuidores do projeto

---

## ©️ Copyright

**© 2025-2026 Punk Code Solution - Todos os direitos reservados**

**CNPJ:** 61.805.210/0001-41  
**Endereço:** Rua do Aconchego, Ilhéus - BA  
**CEP:** 45656-627

Este software é propriedade da Punk Code Solution e está protegido pelas leis de direitos autorais brasileiras e internacionais. O uso, cópia, modificação ou distribuição deste software só é permitido de acordo com os termos da licença MIT incluída neste projeto.

---

**Desenvolvido com ❤️ pela Punk Code Solution para facilitar o acesso à saúde**
