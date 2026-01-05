// src/appointments/dto/create-appointment.dto.ts
import { IsString, IsNotEmpty, IsDateString, IsUUID } from 'class-validator';

export class CreateAppointmentDto {
  @IsUUID()
  @IsNotEmpty()
  professionalId: string;

  @IsDateString()
  @IsNotEmpty()
  scheduledAt: string; // ISO 8601 format: "2024-01-15T14:30:00Z"
}

