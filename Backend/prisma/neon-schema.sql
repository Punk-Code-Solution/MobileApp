-- ============================================
-- Schema SQL para Neon PostgreSQL
-- Gerado a partir do Prisma Schema
-- ============================================
-- 
-- INSTRUÇÕES DE USO:
-- 1. Acesse o console do Neon (https://console.neon.tech)
-- 2. Selecione seu projeto
-- 3. Vá em "SQL Editor"
-- 4. Cole este script completo
-- 5. Execute o script
--
-- OU via linha de comando:
-- psql "postgresql://user:password@host/database" -f neon-schema.sql
-- ============================================

-- Limpar schema existente (OPCIONAL - use com cuidado!)
-- DROP SCHEMA public CASCADE;
-- CREATE SCHEMA public;
-- GRANT ALL ON SCHEMA public TO postgres;
-- GRANT ALL ON SCHEMA public TO public;

-- ============================================
-- ENUMS
-- ============================================

-- Enum para roles de usuário
CREATE TYPE "Role" AS ENUM ('PATIENT', 'PROFESSIONAL', 'ADMIN');

-- Enum para status de agendamentos
CREATE TYPE "AppointmentStatus" AS ENUM ('PENDING_PAYMENT', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELED');

-- ============================================
-- TABELAS
-- ============================================

-- Tabela de usuários (autenticação)
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- Tabela de pacientes
CREATE TABLE "Patient" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "stripeCustomerId" TEXT,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- Tabela de profissionais
CREATE TABLE "Professional" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "bio" TEXT,
    "avatarUrl" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Professional_pkey" PRIMARY KEY ("id")
);

-- Tabela de especialidades
CREATE TABLE "Specialty" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Specialty_pkey" PRIMARY KEY ("id")
);

-- Tabela de relacionamento profissional-especialidade
CREATE TABLE "ProfessionalSpecialty" (
    "professionalId" TEXT NOT NULL,
    "specialtyId" INTEGER NOT NULL,

    CONSTRAINT "ProfessionalSpecialty_pkey" PRIMARY KEY ("professionalId","specialtyId")
);

-- Tabela de agendamentos
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "price" DECIMAL(10,2) NOT NULL,
    "videoRoomUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- Tabela de horários disponíveis
CREATE TABLE "AvailabilitySlot" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,

    CONSTRAINT "AvailabilitySlot_pkey" PRIMARY KEY ("id")
);

-- Tabela de prontuários médicos
CREATE TABLE "MedicalRecord" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "anamnesis" TEXT NOT NULL,
    "diagnosis" TEXT,
    "prescriptionUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MedicalRecord_pkey" PRIMARY KEY ("id")
);

-- Tabela de logs de auditoria
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetId" TEXT,
    "ipAddress" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- ÍNDICES ÚNICOS
-- ============================================

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Patient_userId_key" ON "Patient"("userId");
CREATE UNIQUE INDEX "Patient_cpf_key" ON "Patient"("cpf");
CREATE UNIQUE INDEX "Professional_userId_key" ON "Professional"("userId");
CREATE UNIQUE INDEX "MedicalRecord_appointmentId_key" ON "MedicalRecord"("appointmentId");

-- ============================================
-- FOREIGN KEYS
-- ============================================

-- Relacionamentos Patient -> User
ALTER TABLE "Patient" 
    ADD CONSTRAINT "Patient_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") 
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Relacionamentos Professional -> User
ALTER TABLE "Professional" 
    ADD CONSTRAINT "Professional_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") 
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Relacionamentos ProfessionalSpecialty -> Professional
ALTER TABLE "ProfessionalSpecialty" 
    ADD CONSTRAINT "ProfessionalSpecialty_professionalId_fkey" 
    FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") 
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Relacionamentos ProfessionalSpecialty -> Specialty
ALTER TABLE "ProfessionalSpecialty" 
    ADD CONSTRAINT "ProfessionalSpecialty_specialtyId_fkey" 
    FOREIGN KEY ("specialtyId") REFERENCES "Specialty"("id") 
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Relacionamentos Appointment -> Patient
ALTER TABLE "Appointment" 
    ADD CONSTRAINT "Appointment_patientId_fkey" 
    FOREIGN KEY ("patientId") REFERENCES "Patient"("id") 
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Relacionamentos Appointment -> Professional
ALTER TABLE "Appointment" 
    ADD CONSTRAINT "Appointment_professionalId_fkey" 
    FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") 
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Relacionamentos AvailabilitySlot -> Professional
ALTER TABLE "AvailabilitySlot" 
    ADD CONSTRAINT "AvailabilitySlot_professionalId_fkey" 
    FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") 
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Relacionamentos MedicalRecord -> Appointment
ALTER TABLE "MedicalRecord" 
    ADD CONSTRAINT "MedicalRecord_appointmentId_fkey" 
    FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") 
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Relacionamentos MedicalRecord -> Patient
ALTER TABLE "MedicalRecord" 
    ADD CONSTRAINT "MedicalRecord_patientId_fkey" 
    FOREIGN KEY ("patientId") REFERENCES "Patient"("id") 
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Relacionamentos MedicalRecord -> Professional
ALTER TABLE "MedicalRecord" 
    ADD CONSTRAINT "MedicalRecord_professionalId_fkey" 
    FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") 
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Relacionamentos AuditLog -> User
ALTER TABLE "AuditLog" 
    ADD CONSTRAINT "AuditLog_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") 
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- ============================================
-- DADOS INICIAIS (OPCIONAL)
-- ============================================
-- 
-- Para inserir dados básicos, execute o arquivo:
-- prisma/neon-inserts.sql
-- 
-- Ou descomente as linhas abaixo para inserir apenas especialidades:
-- 
-- INSERT INTO "Specialty" ("name") VALUES
--     ('Cardiologia'),
--     ('Dermatologia'),
--     ('Pediatria'),
--     ('Psiquiatria'),
--     ('Ortopedia'),
--     ('Neurologia'),
--     ('Ginecologia'),
--     ('Oftalmologia');

-- ============================================
-- FIM DO SCRIPT
-- ============================================
-- 
-- Após executar este script:
-- 1. Configure a DATABASE_URL no seu .env:
--    DATABASE_URL="postgresql://user:password@host/database?sslmode=require"
-- 
-- 2. Execute as migrações do Prisma (se necessário):
--    npx prisma migrate deploy
-- 
-- 3. Gere o Prisma Client:
--    npx prisma generate
-- ============================================

