-- ============================================
-- Inserts Básicos para Neon PostgreSQL
-- Dados iniciais para desenvolvimento/testes
-- ============================================
-- 
-- IMPORTANTE:
-- - Execute este script APÓS executar neon-schema.sql
-- - As senhas padrão são "123456" (hash bcrypt)
-- - Altere as senhas em produção!
-- ============================================

-- ============================================
-- ESPECIALIDADES
-- ============================================
-- Nota: Specialty.id é SERIAL (auto-incremento)
-- Os IDs serão gerados automaticamente: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10
-- Esses IDs são referenciados em ProfessionalSpecialty abaixo

INSERT INTO "Specialty" ("name") VALUES
    ('Cardiologia'),      -- ID: 1
    ('Dermatologia'),     -- ID: 2
    ('Pediatria'),        -- ID: 3
    ('Psiquiatria'),      -- ID: 4
    ('Ortopedia'),        -- ID: 5
    ('Neurologia'),       -- ID: 6
    ('Ginecologia'),      -- ID: 7
    ('Oftalmologia'),     -- ID: 8
    ('Clínica Geral'),    -- ID: 9
    ('Endocrinologia')    -- ID: 10
ON CONFLICT DO NOTHING;

-- ============================================
-- USUÁRIOS
-- ============================================
-- Senha padrão para TODOS os usuários: "123456"
-- Hash bcrypt: $2b$10$u8CiC3XydFk0yr.YF6Iexe3LVJ5tibNOkmKFY3cTXdPO/qYtBm4o6

-- Admin
INSERT INTO "User" ("id", "email", "passwordHash", "role", "isActive", "createdAt") VALUES
    ('00000000-0000-0000-0000-000000000001', 'admin@telemedicina.com', '$2b$10$u8CiC3XydFk0yr.YF6Iexe3LVJ5tibNOkmKFY3cTXdPO/qYtBm4o6', 'ADMIN', true, NOW())
ON CONFLICT ("id") DO NOTHING;

-- Profissionais
INSERT INTO "User" ("id", "email", "passwordHash", "role", "isActive", "createdAt") VALUES
    ('00000000-0000-0000-0000-000000000010', 'dr.silva@telemedicina.com', '$2b$10$u8CiC3XydFk0yr.YF6Iexe3LVJ5tibNOkmKFY3cTXdPO/qYtBm4o6', 'PROFESSIONAL', true, NOW()),
    ('00000000-0000-0000-0000-000000000011', 'dra.santos@telemedicina.com', '$2b$10$u8CiC3XydFk0yr.YF6Iexe3LVJ5tibNOkmKFY3cTXdPO/qYtBm4o6', 'PROFESSIONAL', true, NOW()),
    ('00000000-0000-0000-0000-000000000012', 'dr.oliveira@telemedicina.com', '$2b$10$u8CiC3XydFk0yr.YF6Iexe3LVJ5tibNOkmKFY3cTXdPO/qYtBm4o6', 'PROFESSIONAL', true, NOW()),
    ('00000000-0000-0000-0000-000000000013', 'dra.costa@telemedicina.com', '$2b$10$u8CiC3XydFk0yr.YF6Iexe3LVJ5tibNOkmKFY3cTXdPO/qYtBm4o6', 'PROFESSIONAL', true, NOW())
ON CONFLICT ("id") DO NOTHING;

-- Pacientes
INSERT INTO "User" ("id", "email", "passwordHash", "role", "isActive", "createdAt") VALUES
    ('00000000-0000-0000-0000-000000000020', 'paciente1@email.com', '$2b$10$u8CiC3XydFk0yr.YF6Iexe3LVJ5tibNOkmKFY3cTXdPO/qYtBm4o6', 'PATIENT', true, NOW()),
    ('00000000-0000-0000-0000-000000000021', 'paciente2@email.com', '$2b$10$u8CiC3XydFk0yr.YF6Iexe3LVJ5tibNOkmKFY3cTXdPO/qYtBm4o6', 'PATIENT', true, NOW()),
    ('00000000-0000-0000-0000-000000000022', 'paciente3@email.com', '$2b$10$u8CiC3XydFk0yr.YF6Iexe3LVJ5tibNOkmKFY3cTXdPO/qYtBm4o6', 'PATIENT', true, NOW())
ON CONFLICT ("id") DO NOTHING;

-- ============================================
-- PROFISSIONAIS
-- ============================================

INSERT INTO "Professional" ("id", "userId", "fullName", "licenseNumber", "bio", "avatarUrl", "price", "isVerified") VALUES
    ('00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000010', 'Dr. João Silva', 'CRM-SP 123456', 'Cardiologista com mais de 15 anos de experiência. Especialista em doenças cardiovasculares e prevenção.', 'https://ui-avatars.com/api/?name=Joao+Silva&background=4CAF50&color=fff&size=128', 350.00, true),
    ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000011', 'Dra. Maria Santos', 'CRM-RJ 234567', 'Dermatologista renomada, especialista em tratamentos estéticos e doenças de pele.', 'https://ui-avatars.com/api/?name=Maria+Santos&background=2196F3&color=fff&size=128', 280.00, true),
    ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000012', 'Dr. Carlos Oliveira', 'CRM-MG 345678', 'Pediatra dedicado ao cuidado infantil. Experiência em desenvolvimento infantil e vacinação.', 'https://ui-avatars.com/api/?name=Carlos+Oliveira&background=FF9800&color=fff&size=128', 200.00, true),
    ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000013', 'Dra. Ana Costa', 'CRM-SP 456789', 'Psiquiatra especialista em saúde mental. Atendimento humanizado e acolhedor.', 'https://ui-avatars.com/api/?name=Ana+Costa&background=9C27B0&color=fff&size=128', 320.00, true)
ON CONFLICT ("id") DO NOTHING;

-- ============================================
-- RELACIONAMENTO PROFISSIONAL-ESPECIALIDADE
-- ============================================

INSERT INTO "ProfessionalSpecialty" ("professionalId", "specialtyId") VALUES
    -- Dr. João Silva - Cardiologia
    ('00000000-0000-0000-0000-000000000100', 1),
    -- Dra. Maria Santos - Dermatologia
    ('00000000-0000-0000-0000-000000000101', 2),
    -- Dr. Carlos Oliveira - Pediatria
    ('00000000-0000-0000-0000-000000000102', 3),
    -- Dra. Ana Costa - Psiquiatria
    ('00000000-0000-0000-0000-000000000103', 4)
ON CONFLICT ("professionalId", "specialtyId") DO NOTHING;

-- ============================================
-- PACIENTES
-- ============================================

INSERT INTO "Patient" ("id", "userId", "fullName", "cpf", "phone", "birthDate", "stripeCustomerId") VALUES
    ('00000000-0000-0000-0000-000000000200', '00000000-0000-0000-0000-000000000020', 'Pedro Alves', '12345678900', '(11) 98765-4321', TIMESTAMP '1990-05-15 00:00:00', NULL),
    ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000021', 'Julia Ferreira', '23456789011', '(21) 97654-3210', TIMESTAMP '1985-08-22 00:00:00', NULL),
    ('00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000022', 'Lucas Rodrigues', '34567890122', '(31) 96543-2109', TIMESTAMP '1992-11-30 00:00:00', NULL)
ON CONFLICT ("id") DO NOTHING;

-- ============================================
-- HORÁRIOS DISPONÍVEIS (AvailabilitySlot)
-- ============================================
-- dayOfWeek: 0=Domingo, 1=Segunda, 2=Terça, 3=Quarta, 4=Quinta, 5=Sexta, 6=Sábado

INSERT INTO "AvailabilitySlot" ("id", "professionalId", "dayOfWeek", "startTime", "endTime") VALUES
    -- Dr. João Silva - Segunda a Sexta, 8h às 12h
    ('00000000-0000-0000-0000-000000000300', '00000000-0000-0000-0000-000000000100', 1, '08:00', '12:00'),
    ('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000100', 2, '08:00', '12:00'),
    ('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000100', 3, '08:00', '12:00'),
    ('00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000100', 4, '08:00', '12:00'),
    ('00000000-0000-0000-0000-000000000304', '00000000-0000-0000-0000-000000000100', 5, '08:00', '12:00'),
    
    -- Dra. Maria Santos - Segunda, Quarta, Sexta, 14h às 18h
    ('00000000-0000-0000-0000-000000000305', '00000000-0000-0000-0000-000000000101', 1, '14:00', '18:00'),
    ('00000000-0000-0000-0000-000000000306', '00000000-0000-0000-0000-000000000101', 3, '14:00', '18:00'),
    ('00000000-0000-0000-0000-000000000307', '00000000-0000-0000-0000-000000000101', 5, '14:00', '18:00'),
    
    -- Dr. Carlos Oliveira - Terça e Quinta, 9h às 13h
    ('00000000-0000-0000-0000-000000000308', '00000000-0000-0000-0000-000000000102', 2, '09:00', '13:00'),
    ('00000000-0000-0000-0000-000000000309', '00000000-0000-0000-0000-000000000102', 4, '09:00', '13:00'),
    
    -- Dra. Ana Costa - Segunda a Sexta, 10h às 16h
    ('00000000-0000-0000-0000-000000000310', '00000000-0000-0000-0000-000000000103', 1, '10:00', '16:00'),
    ('00000000-0000-0000-0000-000000000311', '00000000-0000-0000-0000-000000000103', 2, '10:00', '16:00'),
    ('00000000-0000-0000-0000-000000000312', '00000000-0000-0000-0000-000000000103', 3, '10:00', '16:00'),
    ('00000000-0000-0000-0000-000000000313', '00000000-0000-0000-0000-000000000103', 4, '10:00', '16:00'),
    ('00000000-0000-0000-0000-000000000314', '00000000-0000-0000-0000-000000000103', 5, '10:00', '16:00')
ON CONFLICT ("id") DO NOTHING;

-- ============================================
-- AGENDAMENTOS DE EXEMPLO (OPCIONAL)
-- ============================================

INSERT INTO "Appointment" ("id", "patientId", "professionalId", "scheduledAt", "status", "price", "videoRoomUrl", "createdAt") VALUES
    -- Agendamento futuro
    ('00000000-0000-0000-0000-000000000400', '00000000-0000-0000-0000-000000000200', '00000000-0000-0000-0000-000000000100', NOW() + INTERVAL '7 days', 'SCHEDULED', 350.00, NULL, NOW()),
    -- Agendamento concluído
    ('00000000-0000-0000-0000-000000000401', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000101', NOW() - INTERVAL '5 days', 'COMPLETED', 280.00, NULL, NOW() - INTERVAL '10 days'),
    -- Agendamento pendente de pagamento
    ('00000000-0000-0000-0000-000000000402', '00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000102', NOW() + INTERVAL '3 days', 'PENDING_PAYMENT', 200.00, NULL, NOW())
ON CONFLICT ("id") DO NOTHING;

-- ============================================
-- PRONTUÁRIO MÉDICO (para o agendamento concluído)
-- ============================================

INSERT INTO "MedicalRecord" ("id", "appointmentId", "patientId", "professionalId", "anamnesis", "diagnosis", "prescriptionUrl", "createdAt") VALUES
    ('00000000-0000-0000-0000-000000000500', '00000000-0000-0000-0000-000000000401', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000101', 
     'Paciente relata coceira e vermelhidão na pele há 3 semanas. Sem histórico de alergias conhecidas. Uso de creme hidratante diário.', 
     'Dermatite de contato. Recomendado uso de pomada tópica e evitar contato com substâncias irritantes.', 
     NULL, 
     NOW() - INTERVAL '5 days')
ON CONFLICT ("id") DO NOTHING;

-- ============================================
-- LOGS DE AUDITORIA (EXEMPLO)
-- ============================================

INSERT INTO "AuditLog" ("id", "userId", "action", "targetId", "ipAddress", "timestamp") VALUES
    ('00000000-0000-0000-0000-000000000600', '00000000-0000-0000-0000-000000000020', 'LOGIN', NULL, '192.168.1.100', NOW() - INTERVAL '1 hour'),
    ('00000000-0000-0000-0000-000000000601', '00000000-0000-0000-0000-000000000020', 'APPOINTMENT_CREATED', '00000000-0000-0000-0000-000000000400', '192.168.1.100', NOW() - INTERVAL '2 hours'),
    ('00000000-0000-0000-0000-000000000602', '00000000-0000-0000-0000-000000000010', 'APPOINTMENT_VIEWED', '00000000-0000-0000-0000-000000000400', '192.168.1.101', NOW() - INTERVAL '30 minutes')
ON CONFLICT ("id") DO NOTHING;

-- ============================================
-- FIM DOS INSERTS
-- ============================================
-- 
-- RESUMO DOS DADOS INSERIDOS:
-- - 10 Especialidades
-- - 1 Admin
-- - 4 Profissionais
-- - 3 Pacientes
-- - 4 Relacionamentos Profissional-Especialidade
-- - 15 Horários Disponíveis
-- - 3 Agendamentos (exemplo)
-- - 1 Prontuário Médico
-- - 3 Logs de Auditoria
-- 
-- CREDENCIAIS DE TESTE:
-- Admin: admin@telemedicina.com / 123456
-- Profissionais: dr.silva@telemedicina.com / 123456
-- Pacientes: paciente1@email.com / 123456
-- ============================================

