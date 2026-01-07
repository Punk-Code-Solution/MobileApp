# 📱 Frontend - Sistema de Telemedicina Healtec

Aplicativo mobile desenvolvido com React Native para o sistema de telemedicina, permitindo que pacientes e profissionais gerenciem consultas, mensagens e notificações.

## 📋 Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Tecnologias](#tecnologias)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Executando o Projeto](#executando-o-projeto)
- [Funcionalidades](#funcionalidades)
- [Estrutura de Telas](#estrutura-de-telas)
- [Documentação Adicional](#documentação-adicional)

## 🎯 Sobre o Projeto

Aplicativo mobile React Native que fornece uma interface completa para pacientes e profissionais de saúde gerenciarem:

- Agendamentos de consultas
- Sistema de mensagens e chat
- Notificações em tempo real
- Avaliações de consultas
- Histórico médico detalhado

## 🛠 Tecnologias

- **React Native** 0.83.1
- **TypeScript** 5.8.3
- **Axios** 1.13.2 - Cliente HTTP
- **React Native Linear Gradient** 2.8.3 - Gradientes
- **React Native Safe Area Context** 5.5.2 - Áreas seguras
- **AsyncStorage** - Cache local
- **React Native Reanimated** - Animações

## 📁 Estrutura do Projeto

```
Frontend/
├── src/
│   ├── components/          # Componentes reutilizáveis
│   │   └── BottomNavigation.tsx
│   ├── screens/              # Telas do aplicativo
│   │   ├── Auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── RegisterScreen.tsx
│   │   │   └── ...
│   │   ├── Home/
│   │   │   ├── HomeScreen.tsx
│   │   │   ├── NewHomeScreen.tsx
│   │   │   └── SearchScreen.tsx
│   │   ├── Appointments/
│   │   │   ├── MyAppointments.tsx
│   │   │   ├── MedicalHistoryScreen.tsx
│   │   │   └── AppointmentDetailsModal.tsx
│   │   ├── Messages/
│   │   │   ├── MessagesScreen.tsx
│   │   │   └── ChatScreen.tsx
│   │   └── Profile/
│   │       └── ProfileScreen.tsx
│   ├── services/             # Serviços de API
│   │   └── api/
│   │       ├── auth.service.ts
│   │       ├── appointment.service.ts
│   │       ├── professional.service.ts
│   │       ├── notification.service.ts
│   │       └── message.service.ts
│   ├── hooks/                # Custom hooks
│   │   ├── useUnreadCounts.ts
│   │   └── useAnimation.ts
│   ├── config/               # Configurações
│   │   ├── api.config.ts
│   │   └── axios.config.ts
│   ├── utils/                # Utilitários
│   │   └── cache.ts
│   ├── types/                # Tipos TypeScript
│   │   ├── auth.types.ts
│   │   ├── appointment.types.ts
│   │   └── message.types.ts
│   └── theme/                # Tema e cores
│       └── colors.ts
├── android/                  # Configurações Android
├── ios/                      # Configurações iOS
└── package.json
```

## 📦 Pré-requisitos

- **Node.js** >= 20
- **npm** ou **yarn**
- **React Native CLI**
- **Android Studio** (para Android) ou **Xcode** (para iOS)
- **Backend rodando** (ver [Backend README](../Backend/README.md))

## 🚀 Instalação

```bash
# Instalar dependências
npm install

# Para iOS (apenas macOS)
cd ios
pod install
cd ..
```

## ⚙️ Configuração

### 1. URL da API

Configure a URL da API em `src/config/api.config.ts`:

```typescript
export const API_BASE_URL = __DEV__
  ? 'http://10.0.2.2:3000'        // Android Emulator
  : 'http://localhost:3000';      // iOS Simulator
```

**Para dispositivos físicos**, use o IP da sua máquina na rede local:
```typescript
export const API_BASE_URL = 'http://192.168.1.100:3000';
```

## 🏃 Executando o Projeto

### Android

```bash
# Iniciar Metro Bundler
npm start

# Em outro terminal:
npm run android
```

### iOS

```bash
# Iniciar Metro Bundler
npm start

# Em outro terminal:
npm run ios
```

## ✨ Funcionalidades

### Autenticação

- ✅ Login com validação de tipo de usuário
- ✅ Registro de pacientes e profissionais
- ✅ Recuperação de senha
- ✅ Verificação de email
- ✅ Validação: usuários só podem fazer login com o tipo correto

### Interface Diferenciada

- ✅ **Pacientes**: Tela inicial com busca de profissionais
- ✅ **Profissionais**: Acesso direto à tela de consultas (sem tela inicial)
- ✅ Navegação inferior adaptada por tipo de usuário

### Agendamentos

- ✅ Busca de profissionais por especialidade
- ✅ Agendamento de consultas
- ✅ Visualização de próximas consultas
- ✅ Histórico detalhado de consultas
- ✅ Cancelamento de consultas
- ✅ Avaliação de consultas (rating + comentário)
- ✅ Visualização de ratings reais dos profissionais

### Mensagens

- ✅ Lista de conversas com contador de não lidas
- ✅ Chat em tempo real
- ✅ Conversas vinculadas a consultas
- ✅ Marcação automática de mensagens como lidas
- ✅ Botão "Enviar Mensagem" em detalhes de consulta
- ✅ Navegação direta para chat a partir de consultas

### Notificações

- ✅ Lista de notificações
- ✅ Contador de notificações não lidas
- ✅ Marcação de notificações como lidas
- ✅ Marcar todas como lidas
- ✅ Badge dinâmico na navegação

### Performance e UX

- ✅ Cache local de dados (AsyncStorage)
  - Profissionais: TTL 10 minutos
  - Notificações: TTL 1 minuto
  - Agendamentos: Cache com invalidação
- ✅ Animações suaves
  - Fade in em telas principais
  - Slide in para modais
  - Scale para botões
  - Bounce para feedback
- ✅ Loading states
- ✅ Pull-to-refresh
- ✅ Tratamento de erros gracioso
- ✅ Offline mode (visualização de dados em cache)

## 📱 Estrutura de Telas

### Autenticação
- `LoginScreen` - Login com seleção de tipo de usuário
- `RegisterScreen` - Registro de novos usuários
- `ForgotPasswordScreen` - Recuperação de senha
- `ResetPasswordScreen` - Redefinição de senha
- `EmailVerificationScreen` - Verificação de email

### Principal (HomeScreen)
- `NewHomeScreen` - Tela inicial para pacientes (busca de profissionais)
- `MyAppointments` - Lista de consultas (próximas/histórico)
- `MedicalHistoryScreen` - Histórico detalhado de consultas
- `MessagesScreen` - Lista de conversas
- `ChatScreen` - Interface de chat
- `ProfileScreen` - Perfil do usuário
- `NotificationsScreen` - Lista de notificações

### Modais e Detalhes
- `AppointmentDetailsModal` - Detalhes da consulta
- `AppointmentBooking` - Agendamento de consulta
- `ProfessionalDetailsScreen` - Detalhes do profissional
- `SearchScreen` - Busca de profissionais
- `RateAppointmentScreen` - Avaliação de consulta

## 🎨 Componentes Reutilizáveis

- `BottomNavigation` - Navegação inferior (adapta-se ao tipo de usuário)
- Hooks de animação (`useFadeIn`, `useSlideIn`, `useScale`, `useBounce`)
- `useUnreadCounts` - Hook para contadores de não lidas

## 🔧 Serviços de API

Todos os serviços estão em `src/services/api/`:

- `auth.service.ts` - Autenticação
- `appointment.service.ts` - Agendamentos (com cache)
- `professional.service.ts` - Profissionais (com cache e ratings)
- `notification.service.ts` - Notificações (com cache)
- `message.service.ts` - Mensagens e chat

## 📦 Cache Local

O sistema utiliza `AsyncStorage` para cache local:

- **Profissionais**: Cache de 10 minutos
- **Notificações**: Cache de 1 minuto
- **Agendamentos**: Cache com invalidação automática

## 🎭 Animações

Animações implementadas usando React Native Reanimated:

- **Fade In**: Entrada suave de telas
- **Slide In**: Modais e transições
- **Scale**: Feedback em botões
- **Bounce**: Feedback visual

## 🐛 Tratamento de Erros

- Tratamento gracioso de erros 404 (endpoints não implementados)
- Fallback para dados mockados quando necessário
- Mensagens de erro amigáveis ao usuário
- Logs de erro apenas quando relevante

## 📝 Licença

Este projeto está sob a licença MIT.

---

**Desenvolvido com ❤️ para facilitar o acesso à saúde**
