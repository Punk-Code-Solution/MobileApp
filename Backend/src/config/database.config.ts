/**
 * Configuração do banco de dados
 * Centraliza configurações relacionadas ao banco de dados
 */

export const databaseConfig = {
  url: process.env.DATABASE_URL || '',
} as const;

