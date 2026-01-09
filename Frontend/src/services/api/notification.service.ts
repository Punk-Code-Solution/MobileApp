/**
 * Serviço de notificações
 * Centraliza todas as chamadas de API relacionadas a notificações
 */

import { api } from '../../config/axios.config';
import { API_ENDPOINTS } from '../../config/api.config';
import { getCache, setCache, removeCache, CACHE_KEYS } from '../../utils/cache';
import { isTokenValid } from '../../utils/token.util';

export interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  type: 'appointment' | 'message' | 'system' | 'reminder';
  read: boolean;
  appointmentId?: string;
  messageId?: string;
}

export const notificationService = {
  /**
   * Busca todas as notificações do usuário autenticado
   * Usa cache para melhorar performance (TTL de 1 minuto)
   */
  async getMyNotifications(token: string, useCache: boolean = true): Promise<Notification[]> {
    // Validar token antes de fazer requisição
    if (!token || !isTokenValid(token)) {
      // Se token inválido, tentar retornar do cache
      if (useCache) {
        const cached = await getCache<Notification[]>(CACHE_KEYS.NOTIFICATIONS);
        if (cached) {
          return cached;
        }
      }
      // Retornar array vazio se token inválido (não é erro crítico)
      return [];
    }

    // Tentar buscar do cache primeiro
    if (useCache) {
      const cached = await getCache<Notification[]>(CACHE_KEYS.NOTIFICATIONS);
      if (cached) {
        return cached;
      }
    }

    try {
      const response = await api.get<{ data: Notification[]; statusCode: number }>(
        API_ENDPOINTS.NOTIFICATIONS.ME,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      // O TransformInterceptor envolve a resposta em { data, statusCode }
      const notifications = response.data.data || response.data;
      const notificationsArray = Array.isArray(notifications) ? notifications : [];

      // Salvar no cache (TTL de 1 minuto para notificações - dados mais dinâmicos)
      if (useCache) {
        await setCache(CACHE_KEYS.NOTIFICATIONS, notificationsArray, { ttl: 60 * 1000 });
      }

      return notificationsArray;
    } catch (error: any) {
      // Se for erro 401, tentar retornar do cache antes de retornar vazio
      if (error.response?.status === 401 && useCache) {
        const cached = await getCache<Notification[]>(CACHE_KEYS.NOTIFICATIONS);
        if (cached) {
          return cached;
        }
      }
      // Se o endpoint não existir ainda (404), retornar array vazio silenciosamente
      if (error.response?.status === 404 || error.response?.status === 401) {
        return [];
      }
      throw error;
    }
  },

  /**
   * Marca uma notificação como lida
   */
  async markAsRead(token: string, notificationId: string): Promise<void> {
    try {
      await api.patch(
        API_ENDPOINTS.NOTIFICATIONS.MARK_READ(notificationId),
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      // Invalidar cache após marcar como lida
      await removeCache(CACHE_KEYS.NOTIFICATIONS);
    } catch (error: any) {
      // Se o endpoint não existir ainda (404), retornar silenciosamente
      if (error.response?.status === 404) {
        return;
      }
      throw error;
    }
  },

  /**
   * Marca todas as notificações como lidas
   */
  async markAllAsRead(token: string): Promise<void> {
    try {
      await api.patch(
        API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      // Invalidar cache após marcar todas como lidas
      await removeCache(CACHE_KEYS.NOTIFICATIONS);
    } catch (error: any) {
      // Se o endpoint não existir ainda (404), retornar silenciosamente
      if (error.response?.status === 404) {
        return;
      }
      throw error;
    }
  },
};

