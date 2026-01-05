/**
 * Serviço de profissionais
 * Centraliza todas as chamadas de API relacionadas a profissionais
 */

import { api } from '../../config/axios.config';
import { API_ENDPOINTS } from '../../config/api.config';
import { Professional } from '../../types/appointment.types';

export const professionalService = {
  /**
   * Busca todos os profissionais disponíveis
   */
  async getAll(token: string): Promise<Professional[]> {
    const response = await api.get<{ data: Professional[]; statusCode: number }>(API_ENDPOINTS.PROFESSIONALS, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    // O TransformInterceptor envolve a resposta em { data, statusCode }
    const professionals = response.data.data || response.data;
    return Array.isArray(professionals) ? professionals : [];
  },

  /**
   * Busca um profissional por ID
   */
  async getById(token: string, id: string): Promise<Professional> {
    const response = await api.get<{ data: Professional; statusCode: number }>(`${API_ENDPOINTS.PROFESSIONALS}/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    // O TransformInterceptor envolve a resposta em { data, statusCode }
    return response.data.data || response.data;
  },
};

