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
- **Comunicação**: Sistema de mensagens e videochamadas entre pacientes e profissionais
- **Gestão de Agendamentos**: Visualização de consultas agendadas, histórico e detalhes
- **Perfis de Usuário**: Gerenciamento de perfis para pacientes e profissionais
- **Autenticação Segura**: Sistema de autenticação com JWT

## 🛠 Tecnologias

### Frontend (Mobile)
- **React Native** 0.83.1
- **TypeScript** 5.8.3
- **Axios** 1.13.2 - Cliente HTTP
- **React Native Linear Gradient** 2.8.3 - Gradientes
- **React Native Safe Area Context** 5.5.2 - Áreas seguras

### Backend
- **NestJS** 11.0.1 - Framework Node.js
- **TypeScript** 5.7.3
- **Prisma** 5.10.0 - ORM
- **PostgreSQL** - Banco de dados
- **JWT** - Autenticação
- **Bcrypt** 6.0.0 - Hash de senhas
- **Passport** 0.7.0 - Estratégias de autenticação

## ✨ Funcionalidades

### Autenticação
- ✅ Login e registro de usuários
- ✅ Recuperação de senha
- ✅ Verificação de email
- ✅ Autenticação JWT

### Agendamentos
- ✅ Busca de profissionais por especialidade
- ✅ Agendamento de consultas
- ✅ Visualização de agendamentos (próximos e histórico)
- ✅ Cancelamento de consultas
- ✅ Detalhes completos da consulta

### Comunicação
- ✅ Sistema de mensagens
- ✅ Chat em tempo real
- ✅ Chamadas de áudio (em desenvolvimento)
- ✅ Videochamadas (em desenvolvimento)

### Perfil
- ✅ Perfil do paciente
- ✅ Perfil do profissional
- ✅ Edição de dados
- ✅ Configurações

## 📁 Estrutura do Projeto

```
.
├── Front-End/              # Aplicativo React Native
│   ├── src/
│   │   ├── components/     # Componentes reutilizáveis
│   │   ├── screens/         # Telas do aplicativo
│   │   ├── services/       # Serviços de API
│   │   ├── config/          # Configurações
│   │   ├── utils/           # Utilitários
│   │   ├── types/           # Tipos TypeScript
│   │   └── theme/           # Tema e cores
│   ├── android/             # Configurações Android
│   ├── ios/                 # Configurações iOS
│   └── package.json
│
├── Back-End/               # API NestJS
│   ├── src/
│   │   ├── auth/           # Módulo de autenticação
│   │   ├── users/          # Módulo de usuários
│   │   ├── professionals/  # Módulo de profissionais
│   │   ├── appointments/   # Módulo de agendamentos
│   │   ├── common/         # Recursos compartilhados
│   │   ├── config/         # Configurações
│   │   └── utils/          # Utilitários
│   ├── prisma/             # Schema e migrations Prisma
│   └── package.json
│
└── README.md
```

Para mais detalhes sobre a estrutura, consulte:
- [Frontend Structure](./Frontend/STRUCTURE.md)
- [Backend Structure](./Backend/STRUCTURE.md)

## 📦 Pré-requisitos

Antes de começar, você precisa ter instalado:

- **Node.js** >= 20
- **npm** ou **yarn**
- **PostgreSQL** (para o backend)
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
cd Back-End
npm install
```

### 3. Instale as dependências do Frontend

```bash
cd Front-End
npm install
```

### 4. Para iOS (apenas macOS)

```bash
cd Front-End/ios
pod install
cd ../..
```

## ⚙️ Configuração

### Backend

1. Crie um arquivo `.env` na raiz do diretório `Back-End`:

```env
# Database
DATABASE_URL="postgresql://usuario:senha@localhost:5432/telemedicina?schema=public"

# JWT
JWT_SECRET="seu-secret-jwt-super-seguro-aqui"

# Server
PORT=3000
```

2. Execute as migrations do Prisma:

```bash
cd Back-End
npx prisma migrate dev
```

3. (Opcional) Popule o banco com dados de exemplo:

```bash
npx prisma db seed
```

### Frontend

1. Configure a URL da API em `Front-End/src/config/api.config.ts`:

```typescript
export const API_BASE_URL = __DEV__
  ? 'http://10.0.2.2:3000' // Android Emulator
  : 'http://localhost:3000'; // iOS Simulator ou dispositivo físico
```

**Nota**: Para dispositivos físicos, use o IP da sua máquina na rede local.

## 🏃 Executando o Projeto

### Backend

```bash
cd Back-End

# Desenvolvimento (com hot reload)
npm run start:dev

# Produção
npm run build
npm run start:prod
```

O backend estará rodando em `http://localhost:3000`

### Frontend

#### Android

```bash
cd Front-End

# Inicie o Metro Bundler
npm start

# Em outro terminal, execute:
npm run android
```

#### iOS

```bash
cd Front-End

# Inicie o Metro Bundler
npm start

# Em outro terminal, execute:
npm run ios
```

## 📡 API Endpoints

### Autenticação

```
POST   /auth/login              # Login
POST   /auth/register           # Registro
POST   /auth/forgot-password    # Recuperar senha
POST   /auth/reset-password     # Redefinir senha
POST   /auth/verify-email       # Verificar email
```

### Profissionais

```
GET    /professionals           # Listar profissionais (requer autenticação)
GET    /professionals/:id      # Detalhes do profissional
```

### Agendamentos

```
GET    /appointments/me        # Listar meus agendamentos
GET    /appointments/:id       # Detalhes do agendamento
POST   /appointments           # Criar agendamento
PATCH  /appointments/:id/cancel # Cancelar agendamento
```

### Mensagens

```
GET    /messages/conversations  # Listar conversas
GET    /messages/:conversationId # Mensagens de uma conversa
POST   /messages               # Enviar mensagem
POST   /messages/conversations # Criar conversa
```

**Nota**: Todos os endpoints (exceto login e registro) requerem autenticação via Bearer Token no header `Authorization`.

## 🗄️ Estrutura de Dados

### Principais Entidades

- **User**: Usuário base (email, senha, role)
- **Patient**: Perfil do paciente (CPF, telefone, data de nascimento)
- **Professional**: Perfil do profissional (CRM, especialidades, preço)
- **Appointment**: Agendamento (data, status, preço)
- **Specialty**: Especialidades médicas
- **MedicalRecord**: Prontuário médico
- **Message**: Mensagens entre usuários

### Status de Agendamento

- `PENDING_PAYMENT` - Aguardando pagamento
- `SCHEDULED` - Agendado
- `IN_PROGRESS` - Em andamento
- `COMPLETED` - Finalizado
- `CANCELED` - Cancelado

Para mais detalhes, consulte o schema Prisma em `Back-End/prisma/schema.prisma`.

## 📚 Documentação Adicional

- [Arquitetura de Agendamento](./ARQUITETURA_AGENDAMENTO.md) - Documentação detalhada do sistema de agendamentos
- [Análise de Problemas](./ANALISE_PROBLEMAS_SISTEMA.md) - Análise de problemas e soluções
- [Correções Aplicadas](./CORRECOES_APLICADAS.md) - Histórico de correções
- [Melhorias de Design](./MELHORIAS_DESIGN.md) - Documentação do design system

## 🤝 Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Padrões de Código

- Use TypeScript em todo o código
- Siga os padrões de código definidos nos arquivos `STRUCTURE.md`
- Escreva testes para novas funcionalidades
- Documente funções e componentes complexos

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](./LICENSE) para mais detalhes.

## 👥 Autores

- **Equipe Healtec** - Desenvolvimento inicial

## 🙏 Agradecimentos

- Comunidade React Native
- Comunidade NestJS
- Todos os contribuidores do projeto

---

**Desenvolvido com ❤️ para facilitar o acesso à saúde**
