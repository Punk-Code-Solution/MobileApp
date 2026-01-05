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
    const response = await api.get<Appointment[]>(API_ENDPOINTS.APPOINTMENTS.ME, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  /**
   * Cria um novo agendamento
   */
  async createAppointment(token: string, data: CreateAppointmentDto): Promise<Appointment> {
    const response = await api.post<Appointment>(API_ENDPOINTS.APPOINTMENTS.BASE, data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
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

