// src/types/appointment.types.ts

export interface Professional {
  id: string;
  fullName: string;
  licenseNumber: string;
  bio?: string;
  avatarUrl?: string;
  price: number;
  specialties?: Array<{
    specialty: {
      id: number;
      name: string;
    };
  }>;
}

export interface CreateAppointmentDto {
  professionalId: string;
  scheduledAt: string; // ISO 8601 format
}

export interface Appointment {
  id: string;
  patientId: string;
  professionalId: string;
  scheduledAt: string;
  status: 'PENDING_PAYMENT' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED';
  price: number;
  createdAt: string;
  professional?: Professional;
}

