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
  averageRating?: number; // Média de avaliações (0-5)
  reviewsCount?: number; // Quantidade de avaliações
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
  videoRoomUrl?: string;
  createdAt: string;
  professional?: Professional;
  patient?: {
    id: string;
    fullName: string;
    phone: string;
  };
}

