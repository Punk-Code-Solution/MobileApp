/**
 * Serviço de agendamentos
 * Centraliza todas as chamadas de API relacionadas a agendamentos
 */

import { api } from '../../config/axios.config';
import { API_ENDPOINTS } from '../../config/api.config';
import { Appointment, CreateAppointmentDto } from '../../types/appointment.types';

export const appointmentService = {
  /**
   * Busca todos os agendamentos do usuário autenticado
   */
  async getMyAppointments(token: string): Promise<Appointment[]> {
    const response = await api.get<{ data: Appointment[]; statusCode: number }>(API_ENDPOINTS.APPOINTMENTS.ME, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    // O TransformInterceptor envolve a resposta em { data, statusCode }
    const appointments = response.data.data || response.data;
    return Array.isArray(appointments) ? appointments : [];
  },

  /**
   * Cria um novo agendamento
   */
  async createAppointment(token: string, data: CreateAppointmentDto): Promise<Appointment> {
    try {
      const response = await api.post<{ data: Appointment; statusCode: number }>(API_ENDPOINTS.APPOINTMENTS.BASE, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      // O TransformInterceptor envolve a resposta em { data, statusCode }
      const appointment = response.data.data || response.data;
      
      // Garantir que temos um objeto válido
      if (!appointment || typeof appointment !== 'object') {
        throw new Error('Resposta inválida do servidor');
      }
      
      // Normalizar datas se necessário
      if (appointment.scheduledAt && typeof appointment.scheduledAt === 'string') {
        appointment.scheduledAt = appointment.scheduledAt;
      }
      if (appointment.createdAt && typeof appointment.createdAt === 'string') {
        appointment.createdAt = appointment.createdAt;
      }
      
      return appointment as Appointment;
    } catch (error: any) {
      console.error('Erro em createAppointment:', error);
      console.error('Response data:', error.response?.data);
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
  },
};

