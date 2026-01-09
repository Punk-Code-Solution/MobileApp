import { IsString, IsNotEmpty, IsDateString } from 'class-validator';

export class CompletePatientProfileDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  cpf: string;

  @IsDateString()
  @IsNotEmpty()
  birthDate: string; // ISO 8601 format
}

