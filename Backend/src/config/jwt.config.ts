/**
 * Configuração JWT
 * Centraliza configurações relacionadas a autenticação JWT
 */

export const jwtConfig = {
  secret: process.env.JWT_SECRET || 'SEGREDO_SUPER_SECRETO_DEV_ONLY',
  expiresIn: (process.env.JWT_EXPIRES_IN || '1d') as string,
  ignoreExpiration: false,
};

