/**
 * Utilitários para hash de senhas
 * Centraliza funções relacionadas a criptografia
 */

import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

/**
 * Gera hash de uma senha
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compara uma senha com um hash
 */
export async function comparePassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

