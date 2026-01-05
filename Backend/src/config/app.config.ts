/**
 * Configuração da aplicação
 * Centraliza todas as configurações do app
 */

export const appConfig = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'http://10.0.2.2:3000', // Emulador Android
      'http://192.168.1.109:3000', // Dispositivo físico - ajuste conforme seu IP
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  },
} as const;

