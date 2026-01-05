/**
 * Serviço de autenticação
 * Centraliza todas as chamadas de API relacionadas à autenticação
 */

import { api } from '../../config/axios.config';
import { API_ENDPOINTS } from '../../config/api.config';
import { LoginRequest, LoginResponse, RegisterRequest } from '../../types/auth.types';

export const authService = {
  /**
   * Realiza login do usuário
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await api.post<{ data: LoginResponse; statusCode: number }>(API_ENDPOINTS.AUTH.LOGIN, credentials);
    // O TransformInterceptor envolve a resposta em { data, statusCode }
    return response.data.data || response.data;
  },

  /**
   * Registra um novo usuário
   */
  async register(data: RegisterRequest): Promise<void> {
    await api.post(API_ENDPOINTS.AUTH.REGISTER, data);
  },

  /**
   * Solicita redefinição de senha
   */
  async forgotPassword(email: string): Promise<void> {
    await api.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
  },

  /**
   * Redefine a senha
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    await api.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, { token, newPassword });
  },

  /**
   * Verifica email com código
   */
  async verifyEmail(email: string, code: string): Promise<void> {
    await api.post(API_ENDPOINTS.AUTH.VERIFY_EMAIL, { email, code });
  },
};

