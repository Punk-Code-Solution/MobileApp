/**
 * Tipos relacionados à autenticação
 */

export type UserRole = 'PATIENT' | 'PROFESSIONAL';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

export interface RegisterRequest {
  fullName: string;
  cpf: string;
  email: string;
  password: string;
  role: UserRole;
  profession?: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  cpf?: string;
  profession?: string;
}

