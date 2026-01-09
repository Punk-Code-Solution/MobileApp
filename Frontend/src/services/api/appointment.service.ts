/**
 * Serviço de agendamentos
 * Centraliza todas as chamadas de API relacionadas a agendamentos
 */

import { api } from '../../config/axios.config';
import { API_ENDPOINTS } from '../../config/api.config';
import { Appointment, CreateAppointmentDto } from '../../types/appointment.types';
import { getCache, setCache, removeCache, CACHE_KEYS } from '../../utils/cache';
import { isTokenValid } from '../../utils/token.util';

export const appointmentService = {
  /**
   * Busca todos os agendamentos do usuário autenticado
   * Usa cache para melhorar performance
   */
  async getMyAppointments(token: string, useCache: boolean = true): Promise<Appointment[]> {
    // Tentar buscar do cache primeiro
    if (useCache) {
      const cached = await getCache<Appointment[]>(CACHE_KEYS.APPOINTMENTS);
      if (cached) {
        return cached;
      }
    }

    const response = await api.get<{ data: Appointment[]; statusCode: number }>(API_ENDPOINTS.APPOINTMENTS.ME, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    // O TransformInterceptor envolve a resposta em { data, statusCode }
    const appointments = response.data.data || response.data;
    const appointmentsArray = Array.isArray(appointments) ? appointments : [];

    // Salvar no cache (TTL de 2 minutos para appointments)
    if (useCache) {
      await setCache(CACHE_KEYS.APPOINTMENTS, appointmentsArray, { ttl: 2 * 60 * 1000 });
    }

    return appointmentsArray;
  },

  /**
   * Cria um novo agendamento
   */
  async createAppointment(token: string, data: CreateAppointmentDto): Promise<Appointment> {
    try {
      if (!data || !data.professionalId || !data.scheduledAt) {
        throw new Error('Dados de agendamento inválidos');
      }

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const trimmedProfessionalId = data.professionalId.trim();
      if (!uuidRegex.test(trimmedProfessionalId)) {
        throw new Error('ID do profissional inválido. Formato UUID esperado.');
      }

      if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(data.scheduledAt)) {
        throw new Error('Formato de data inválido. Use formato ISO 8601 (ex: 2024-01-15T14:30:00Z)');
      }

      if (!token || typeof token !== 'string' || !isTokenValid(token)) {
        throw new Error('Token expirado. Por favor, faça login novamente.');
      }

      const response = await api.post<{ data: Appointment; statusCode: number }>(
        API_ENDPOINTS.APPOINTMENTS.BASE, 
        {
          professionalId: trimmedProfessionalId,
          scheduledAt: data.scheduledAt,
        }, 
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );
      
      if (!response || !response.data) {
        throw new Error('Resposta vazia do servidor');
      }
      
      const appointment = response.data.data || response.data;
      
      if (!appointment || typeof appointment !== 'object' || !appointment.id || typeof appointment.id !== 'string') {
        throw new Error('Resposta inválida do servidor');
      }
      
      // Invalidar cache de appointments após criar novo
      try {
        await removeCache(CACHE_KEYS.APPOINTMENTS);
      } catch (cacheError) {
        // Não propagar erro de cache
      }
      
      return appointment as Appointment;
    } catch (error: any) {
      console.error('[APPOINTMENT-SERVICE] Erro ao criar agendamento:', error?.message || error);
      throw error;
    }
  },

  /**
   * Cancela um agendamento
   */
  async cancelAppointment(token: string, appointmentId: string): Promise<void> {
    await api.patch(
      API_ENDPOINTS.APPOINTMENTS.CANCEL(appointmentId),
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    // Invalidar cache após cancelar
    await removeCache(CACHE_KEYS.APPOINTMENTS);
  },

  /**
   * Avalia um agendamento
   */
  async rateAppointment(
    token: string,
    appointmentId: string,
    data: { rating: number; comment?: string }
  ): Promise<any> {
    const response = await api.post<{ data: any; statusCode: number }>(
      API_ENDPOINTS.APPOINTMENTS.RATE(appointmentId),
      data,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    // Invalidar cache após avaliar
    await removeCache(CACHE_KEYS.APPOINTMENTS);
    // O TransformInterceptor envolve a resposta em { data, statusCode }
    // Usar fallback para garantir compatibilidade
    return response.data.data || response.data;
  },
};

