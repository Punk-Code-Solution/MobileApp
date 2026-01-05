// src/appointments/entities/appointment.entity.ts
// Esta entidade é usada para tipar os retornos das APIs
export class Appointment {
  id: string;
  patientId: string;
  professionalId: string;
  scheduledAt: Date;
  status: 'PENDING_PAYMENT' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED';
  price: number;
  videoRoomUrl?: string;
  createdAt: Date;
  professional?: any;
  patient?: any;
}

