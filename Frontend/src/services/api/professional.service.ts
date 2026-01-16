/**
 * Serviço de profissionais
 * Centraliza todas as chamadas de API relacionadas a profissionais
 */

import { api } from '../../config/axios.config';
import { API_ENDPOINTS } from '../../config/api.config';
import { Professional } from '../../types/appointment.types';
import { getCache, setCache, CACHE_KEYS } from '../../utils/cache';
import { isTokenValid } from '../../utils/token.util';

export const professionalService = {
  /**
   * Busca todos os profissionais disponíveis
   * Usa cache para melhorar performance (TTL de 10 minutos)
   */
  async getAll(token: string, useCache: boolean = true): Promise<Professional[]> {
    // Validar token antes de fazer requisição
    if (!token || !isTokenValid(token)) {
      // Se token inválido, tentar retornar do cache
      if (useCache) {
        const cached = await getCache<Professional[]>(CACHE_KEYS.PROFESSIONALS);
        if (cached) {
          return cached;
        }
      }
      throw new Error('Token inválido ou expirado');
    }

    // Tentar buscar do cache primeiro
    if (useCache) {
      const cached = await getCache<Professional[]>(CACHE_KEYS.PROFESSIONALS);
      if (cached) {
        return cached;
      }
    }

    try {
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
    } catch (error: any) {
      // Se for erro 401, tentar retornar do cache antes de lançar erro
      if (error.response?.status === 401 && useCache) {
        const cached = await getCache<Professional[]>(CACHE_KEYS.PROFESSIONALS);
        if (cached) {
          return cached;
        }
      }
      throw error;
    }
  },

  /**
   * Busca um profissional por ID
   */
  async getById(token: string, id: string): Promise<Professional> {
    // Validar token antes de fazer requisição
    if (!token || !isTokenValid(token)) {
      throw new Error('Token inválido ou expirado');
    }

    const response = await api.get<{ data: Professional; statusCode: number }>(`${API_ENDPOINTS.PROFESSIONALS}/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    // O TransformInterceptor envolve a resposta em { data, statusCode }
    return response.data.data || response.data;
  },

  /**
   * Busca avaliações de um profissional
   */
  async getReviews(token: string, professionalId: string): Promise<Array<{
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    patient: {
      fullName: string;
      avatarUrl: string | null;
    };
  }>> {
    console.log('[PROFESSIONAL-SERVICE] Buscando avaliações:', {
      professionalId,
      tokenLength: token?.length,
    });

    if (!token || !isTokenValid(token)) {
      console.error('[PROFESSIONAL-SERVICE] Token inválido ou expirado');
      throw new Error('Token inválido ou expirado');
    }

    try {
      const response = await api.get<{ data: any[]; statusCode: number }>(
        `${API_ENDPOINTS.PROFESSIONALS}/${professionalId}/reviews`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('[PROFESSIONAL-SERVICE] Resposta da API:', {
        status: response.status,
        hasData: !!response.data,
        dataType: Array.isArray(response.data?.data) ? 'array' : typeof response.data?.data,
        dataLength: Array.isArray(response.data?.data) ? response.data.data.length : 0,
        rawData: response.data,
      });

      const reviews = response.data.data || response.data || [];
      console.log('[PROFESSIONAL-SERVICE] Avaliações processadas:', {
        count: reviews.length,
        reviews: reviews.map((r: any) => ({
          id: r.id,
          rating: r.rating,
          hasComment: !!r.comment,
          commentLength: r.comment?.length || 0,
          patientName: r.patient?.fullName,
        })),
      });

      return reviews;
    } catch (error: any) {
      console.error('[PROFESSIONAL-SERVICE] Erro ao buscar avaliações:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
        professionalId,
      });
      throw error;
    }
  },
};

