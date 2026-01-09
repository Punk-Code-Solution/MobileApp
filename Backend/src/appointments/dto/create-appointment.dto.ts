// src/appointments/dto/create-appointment.dto.ts
import { IsString, IsNotEmpty, IsDateString, Matches } from 'class-validator';

export class CreateAppointmentDto {
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, {
    message: 'professionalId must be a valid UUID',
  })
  @IsNotEmpty()
  @IsString()
  professionalId: string;

  @IsDateString()
  @IsNotEmpty()
  scheduledAt: string; // ISO 8601 format: "2024-01-15T14:30:00Z"
}

