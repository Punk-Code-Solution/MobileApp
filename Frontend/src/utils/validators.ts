/**
 * Funções utilitárias para validação de dados
 */

/**
 * Valida formato de email
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valida CPF (formato básico - 11 dígitos)
 */
export const isValidCPF = (cpf: string): boolean => {
  const cpfDigits = cpf.replace(/\D/g, '');
  return cpfDigits.length === 11;
};

/**
 * Valida senha (mínimo 6 caracteres)
 */
export const isValidPassword = (password: string): boolean => {
  return password.length >= 6;
};

/**
 * Valida se as senhas coincidem
 */
export const passwordsMatch = (password: string, confirmPassword: string): boolean => {
  return password === confirmPassword;
};

