/**
 * Serviço de agendamentos
 * Centraliza todas as chamadas de API relacionadas a agendamentos
 */

import { api } from '../../config/axios.config';
import { API_ENDPOINTS } from '../../config/api.config';
import { Appointment, CreateAppointmentDto } from '../../types/appointment.types';
import { getCache, setCache, removeCache, CACHE_KEYS } from '../../utils/cache';

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
      // Validar dados antes de enviar
      if (!data || !data.professionalId || !data.scheduledAt) {
        throw new Error('Dados de agendamento inválidos');
      }

      // Validar token
      if (!token || typeof token !== 'string') {
        throw new Error('Token de autenticação inválido');
      }

      const response = await api.post<{ data: Appointment; statusCode: number }>(
        API_ENDPOINTS.APPOINTMENTS.BASE, 
        data, 
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          timeout: 30000, // 30 segundos de timeout
        }
      );
      
      // Verificar se response existe
      if (!response || !response.data) {
        throw new Error('Resposta vazia do servidor');
      }
      
      // O TransformInterceptor envolve a resposta em { data, statusCode }
      const appointment = response.data.data || response.data;
      
      // Garantir que temos um objeto válido
      if (!appointment || typeof appointment !== 'object') {
        throw new Error('Resposta inválida do servidor');
      }
      
      // Validar que appointment tem id
      if (!appointment.id || typeof appointment.id !== 'string') {
        throw new Error('Agendamento criado sem ID válido');
      }
      
      // Normalizar datas se necessário (sem modificar se já estiver correto)
      if (appointment.scheduledAt && typeof appointment.scheduledAt === 'string') {
        // Apenas validar, não modificar
        const date = new Date(appointment.scheduledAt);
        if (isNaN(date.getTime())) {
          console.warn('Data scheduledAt inválida na resposta:', appointment.scheduledAt);
        }
      }
      if (appointment.createdAt && typeof appointment.createdAt === 'string') {
        // Apenas validar, não modificar
        const date = new Date(appointment.createdAt);
        if (isNaN(date.getTime())) {
          console.warn('Data createdAt inválida na resposta:', appointment.createdAt);
        }
      }
      
      // Invalidar cache de appointments após criar novo (com proteção)
      try {
        await removeCache(CACHE_KEYS.APPOINTMENTS);
      } catch (cacheError) {
        console.warn('Erro ao invalidar cache (não crítico):', cacheError);
        // Não propagar erro de cache
      }

      return appointment as Appointment;
    } catch (error: any) {
      console.error('Erro em createAppointment:', error);
      
      // Proteger contra erros de serialização
      try {
        console.error('Response data:', error.response?.data);
        console.error('Status:', error.response?.status);
      } catch (logError) {
        console.error('Erro ao logar detalhes do erro:', logError);
      }
      
      // Re-throw o erro para ser tratado no componente
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

