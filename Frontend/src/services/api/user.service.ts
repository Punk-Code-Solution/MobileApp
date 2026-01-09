/**
 * Serviço de usuário
 * Centraliza chamadas de API relacionadas a usuários
 */

import { api } from '../../config/axios.config';
import { API_ENDPOINTS } from '../../config/api.config';

export interface CompletePatientProfileRequest {
  fullName: string;
  phone: string;
  cpf: string;
  birthDate: string; // ISO 8601 format
}

export const userService = {
  /**
   * Completa o perfil de paciente
   */
  async completePatientProfile(token: string, data: CompletePatientProfileRequest): Promise<void> {
    await api.post(
      API_ENDPOINTS.USERS.COMPLETE_PATIENT_PROFILE,
      data,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  },
};

