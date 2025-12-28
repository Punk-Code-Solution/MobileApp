import { IsEmail, IsString, IsNotEmpty, IsEnum, IsOptional, MinLength } from 'class-validator';

export enum UserRole {
  PATIENT = 'PATIENT',
  PROFESSIONAL = 'PROFESSIONAL',
  ADMIN = 'ADMIN',
}

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsEnum(UserRole)
  role: UserRole;

  // --- Dados Comuns ---
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  // --- Específico Paciente ---
  @IsOptional()
  @IsString()
  cpf?: string;

  @IsOptional()
  birthDate?: string; // Receberemos como string ISO ex: "1990-01-01T00:00:00Z"

  // --- Específico Profissional ---
  @IsOptional()
  @IsString()
  licenseNumber?: string; // CRM

  @IsOptional()
  price?: number;
}