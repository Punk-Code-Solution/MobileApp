/**
 * Configuração JWT
 * Centraliza configurações relacionadas a autenticação JWT
 */

// Validar JWT_SECRET em produção
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error(
    'JWT_SECRET deve ser definido em produção! Configure a variável de ambiente JWT_SECRET.'
  );
}

export const jwtConfig = {
  secret: process.env.JWT_SECRET || 'SEGREDO_SUPER_SECRETO_DEV_ONLY',
  expiresIn: (process.env.JWT_EXPIRES_IN || '1d') as string,
  ignoreExpiration: false,
};

