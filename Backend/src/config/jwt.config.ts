/**
 * Configuração JWT
 * Centraliza configurações relacionadas a autenticação JWT
 */

// Função para obter o JWT secret com validação
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
  
  // Validar apenas se estiver em produção E se DATABASE_URL estiver definido (runtime)
  // Isso evita erro durante o build quando variáveis podem não estar disponíveis
  if (isProduction && process.env.DATABASE_URL && !secret) {
    throw new Error(
      'JWT_SECRET deve ser definido em produção! Configure a variável de ambiente JWT_SECRET na Vercel.\n' +
      'Acesse: https://vercel.com/seu-projeto/settings/environment-variables\n' +
      'Veja: Backend/CONFIGURAR_VERCEL.md para instruções detalhadas.'
    );
  }
  
  return secret || 'SEGREDO_SUPER_SECRETO_DEV_ONLY';
}

// Cache do secret para evitar múltiplas validações
let cachedSecret: string | null = null;

export const jwtConfig = {
  get secret() {
    if (cachedSecret === null) {
      cachedSecret = getJwtSecret();
    }
    return cachedSecret;
  },
  expiresIn: (process.env.JWT_EXPIRES_IN || '1d') as string,
  ignoreExpiration: false,
};

