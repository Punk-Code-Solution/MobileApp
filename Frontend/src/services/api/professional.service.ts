/**
 * Serviço de profissionais
 * Centraliza todas as chamadas de API relacionadas a profissionais
 */

import { api } from '../../config/axios.config';
import { API_ENDPOINTS } from '../../config/api.config';
import { Professional } from '../../types/appointment.types';
import { getCache, setCache, CACHE_KEYS } from '../../utils/cache';

export const professionalService = {
  /**
   * Busca todos os profissionais disponíveis
   * Usa cache para melhorar performance (TTL de 10 minutos)
   */
  async getAll(token: string, useCache: boolean = true): Promise<Professional[]> {
    // Tentar buscar do cache primeiro
    if (useCache) {
      const cached = await getCache<Professional[]>(CACHE_KEYS.PROFESSIONALS);
      if (cached) {
        return cached;
      }
    }

    const response = await api.get<{ data: Professional[]; statusCode: number }>(API_ENDPOINTS.PROFESSIONALS, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    // O TransformInterceptor envolve a resposta em { data, statusCode }
    const professionals = response.data.data || response.data;
    const professionalsArray = Array.isArray(professionals) ? professionals : [];

    // Salvar no cache (TTL de 10 minutos para professionals)
    if (useCache) {
      await setCache(CACHE_KEYS.PROFESSIONALS, professionalsArray, { ttl: 10 * 60 * 1000 });
    }

    return professionalsArray;
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

