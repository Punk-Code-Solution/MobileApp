/**
 * Configuração da API
 * Centraliza a URL base da API e outras configurações relacionadas
 */

// Para Emulador Android: 10.0.2.2
// Para iOS ou Dispositivo Físico: Use o IP da sua máquina (ex: 192.168.1.X)
export const API_BASE_URL = 'http://10.0.2.2:3000';

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
  },
  MESSAGES: {
    BASE: '/messages',
    CONVERSATIONS: '/messages/conversations',
  },
} as const;

