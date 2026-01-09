/**
 * Configuração da API
 * Centraliza a URL base da API e outras configurações relacionadas
 */

import { Platform } from 'react-native';

// Detecção automática do ambiente
// 
// DESENVOLVIMENTO:
// - Emulador Android: 10.0.2.2
// - iOS Simulator: localhost
// - Dispositivo Físico: Use o IP da sua máquina na rede local
//   Para descobrir: ipconfig (Windows) ou ifconfig (Linux/Mac)
//
// PRODUÇÃO:
// - Backend na Vercel: https://mobile-app-xi-five.vercel.app
// 
// IMPORTANTE: A URL de produção é usada automaticamente quando:
// - O bundle é gerado com --dev false (build de produção)
// - __DEV__ é false (modo produção do React Native)
// 
// Para verificar se está usando a URL correta em produção:
// - O bundle gerado deve conter: 'https://mobile-app-xi-five.vercel.app'
// - Verifique o bundle em: android/app/src/main/assets/index.android.bundle

const getApiBaseUrl = (): string => {
  // Se estiver em desenvolvimento
  if (__DEV__) {
    // Para Android
    if (Platform.OS === 'android') {
      // IMPORTANTE: Configure o IP correto baseado no seu ambiente
      // 
      // Para EMULADOR Android, use:
      // return 'http://10.0.2.2:3000';
      //
      // Para DISPOSITIVO FÍSICO, use o IP da sua máquina na rede local:
      // Para descobrir seu IP: ipconfig (Windows) ou ifconfig (Linux/Mac)
      // Procure por "Endereço IPv4" na saída do comando
      // Exemplo: 'http://192.168.1.109:3000'
      
      // ALTERE A LINHA ABAIXO CONFORME SEU AMBIENTE:
      // return 'http://192.168.1.109:3000'; // Dispositivo físico - Descomente se estiver usando dispositivo físico
      return 'http://10.0.2.2:3000'; // Emulador Android - Use esta linha para emulador
    }
    // Para iOS Simulator
    if (Platform.OS === 'ios') {
      return 'http://localhost:3000'; // iOS Simulator
    }
  }
  
  // Produção - Backend na Vercel
  return 'https://mobile-app-xi-five.vercel.app';
};

// IMPORTANTE: Se estiver usando DISPOSITIVO FÍSICO, altere manualmente:
// Substitua '10.0.2.2' pelo IP da sua máquina na rede local
// Exemplo: 'http://192.168.1.100:3000'
// Para descobrir seu IP: ipconfig (Windows) ou ifconfig (Linux/Mac)

export const API_BASE_URL = getApiBaseUrl();

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    VERIFY_EMAIL: '/auth/verify-email',
  },
  PROFESSIONALS: '/professionals',
  APPOINTMENTS: {
    BASE: '/appointments',
    ME: '/appointments/me',
    CANCEL: (id: string) => `/appointments/${id}/cancel`,
    RATE: (id: string) => `/appointments/${id}/rate`,
  },
  MESSAGES: {
    BASE: '/messages',
    CONVERSATIONS: '/messages/conversations',
    BY_APPOINTMENT: (appointmentId: string) => `/messages/appointments/${appointmentId}/conversation`,
  },
  NOTIFICATIONS: {
    BASE: '/notifications',
    ME: '/notifications/me',
    MARK_READ: (id: string) => `/notifications/${id}/read`,
    MARK_ALL_READ: '/notifications/read-all',
  },
} as const;

