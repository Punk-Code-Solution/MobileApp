-- ============================================
-- Inserts Básicos para Neon PostgreSQL
-- Dados iniciais para desenvolvimento/testes
-- ============================================
-- 
-- IMPORTANTE:
-- - Execute este script APÓS executar neon-schema.sql
-- - As senhas padrão são "123456" (hash bcrypt)
-- - Altere as senhas em produção!
-- 
-- ESTRUTURA DO ARQUIVO:
-- - Especialidades são criadas primeiro (IDs automáticos: 1, 2, 3, ...)
-- - Usuários são criados (Admin, Profissionais, Pacientes)
-- - Cada Profissional é inserido JUNTO com suas especialidades
--   Isso facilita a manutenção e garante que os relacionamentos estejam corretos
-- - Para adicionar múltiplas especialidades a um profissional, insira múltiplas
--   linhas na tabela ProfessionalSpecialty com o mesmo professionalId
-- - Horários disponíveis são agrupados por profissional
-- ============================================

-- ============================================
-- ESPECIALIDADES
-- ============================================
-- Nota: Specialty.id é SERIAL (auto-incremento)
-- Inserimos as especialidades e depois usamos subquery para buscar os IDs reais
-- Isso garante que funcionará mesmo se já existirem especialidades no banco
-- Os IDs são buscados dinamicamente pelo nome da especialidade em ProfessionalSpecialty

-- Inserir especialidades (ignorar se já existirem pelo nome)
INSERT INTO "Specialty" ("name") 
SELECT * FROM (VALUES 
    ('Cardiologia'),
    ('Dermatologia'),
    ('Pediatria'),
    ('Psiquiatria'),
    ('Ortopedia'),
    ('Neurologia'),
    ('Ginecologia'),
    ('Oftalmologia'),
    ('Clínica Geral'),
    ('Endocrinologia')
) AS v(name)
WHERE NOT EXISTS (
    SELECT 1 FROM "Specialty" WHERE "Specialty"."name" = v.name
);

-- ============================================
-- USUÁRIOS
-- ============================================
-- Senha padrão para TODOS os usuários: "123456"
-- Hash bcrypt: $2b$10$u8CiC3XydFk0yr.YF6Iexe3LVJ5tibNOkmKFY3cTXdPO/qYtBm4o6

-- Admin
INSERT INTO "User" ("id", "email", "passwordHash", "role", "isActive", "createdAt") VALUES
    ('40c29228-c059-4b0a-855e-75abf5ac6a7e', 'admin@telemedicina.com', '$2b$10$u8CiC3XydFk0yr.YF6Iexe3LVJ5tibNOkmKFY3cTXdPO/qYtBm4o6', 'ADMIN', true, NOW())
ON CONFLICT ("id") DO NOTHING;

-- Profissionais
INSERT INTO "User" ("id", "email", "passwordHash", "role", "isActive", "createdAt") VALUES
    ('89b976cf-3bc7-440b-8be0-35bc2ea5b87c', 'dr.silva@telemedicina.com', '$2b$10$u8CiC3XydFk0yr.YF6Iexe3LVJ5tibNOkmKFY3cTXdPO/qYtBm4o6', 'PROFESSIONAL', true, NOW()),
    ('09a58073-cc1e-4891-b6c2-bd66de84f837', 'dra.santos@telemedicina.com', '$2b$10$u8CiC3XydFk0yr.YF6Iexe3LVJ5tibNOkmKFY3cTXdPO/qYtBm4o6', 'PROFESSIONAL', true, NOW()),
    ('24c29491-3565-46ac-b8d3-ee7c95088cc4', 'dr.oliveira@telemedicina.com', '$2b$10$u8CiC3XydFk0yr.YF6Iexe3LVJ5tibNOkmKFY3cTXdPO/qYtBm4o6', 'PROFESSIONAL', true, NOW()),
    ('f96fe6a2-e8aa-4824-ad04-371f1aab801d', 'dra.costa@telemedicina.com', '$2b$10$u8CiC3XydFk0yr.YF6Iexe3LVJ5tibNOkmKFY3cTXdPO/qYtBm4o6', 'PROFESSIONAL', true, NOW()),
    ('5903e8f8-424b-436e-a4e1-3d5eb81552cc', 'dr.ferreira@telemedicina.com', '$2b$10$u8CiC3XydFk0yr.YF6Iexe3LVJ5tibNOkmKFY3cTXdPO/qYtBm4o6', 'PROFESSIONAL', true, NOW())
ON CONFLICT ("id") DO NOTHING;

-- Pacientes
INSERT INTO "User" ("id", "email", "passwordHash", "role", "isActive", "createdAt") VALUES
    ('0361890d-ec40-4a90-b725-7df61260e26a', 'paciente1@email.com', '$2b$10$u8CiC3XydFk0yr.YF6Iexe3LVJ5tibNOkmKFY3cTXdPO/qYtBm4o6', 'PATIENT', true, NOW()),
    ('e356881b-4b6f-4760-96b7-d555a63a18c4', 'paciente2@email.com', '$2b$10$u8CiC3XydFk0yr.YF6Iexe3LVJ5tibNOkmKFY3cTXdPO/qYtBm4o6', 'PATIENT', true, NOW()),
    ('7d5adf7c-ecaa-4fa9-a632-3cfc7be583ab', 'paciente3@email.com', '$2b$10$u8CiC3XydFk0yr.YF6Iexe3LVJ5tibNOkmKFY3cTXdPO/qYtBm4o6', 'PATIENT', true, NOW())
ON CONFLICT ("id") DO NOTHING;

-- ============================================
-- PROFISSIONAIS E SUAS ESPECIALIDADES
-- ============================================
-- Cada profissional é inserido junto com suas especialidades
-- para facilitar a manutenção e compreensão dos dados

-- ============================================
-- PROFISSIONAL 1: Dr. João Silva - Cardiologista
-- ============================================
INSERT INTO "Professional" ("id", "userId", "fullName", "licenseNumber", "bio", "avatarUrl", "price", "isVerified") VALUES
    ('3890cf77-7ea2-4e6f-aecb-932a9b5324e6', '89b976cf-3bc7-440b-8be0-35bc2ea5b87c', 'Dr. João Silva', 'CRM-SP 123456', 'Cardiologista com mais de 15 anos de experiência. Especialista em doenças cardiovasculares e prevenção.', 'https://ui-avatars.com/api/?name=Joao+Silva&background=4CAF50&color=fff&size=128', 350.00, true)
ON CONFLICT ("id") DO NOTHING;

-- Especialidades do Dr. João Silva
INSERT INTO "ProfessionalSpecialty" ("professionalId", "specialtyId")
SELECT 
    '3890cf77-7ea2-4e6f-aecb-932a9b5324e6'::TEXT,
    (SELECT id FROM "Specialty" WHERE name = 'Cardiologia' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM "ProfessionalSpecialty" 
    WHERE "professionalId" = '3890cf77-7ea2-4e6f-aecb-932a9b5324e6' 
    AND "specialtyId" = (SELECT id FROM "Specialty" WHERE name = 'Cardiologia' LIMIT 1)
);

-- ============================================
-- PROFISSIONAL 2: Dra. Maria Santos - Dermatologista
-- ============================================
INSERT INTO "Professional" ("id", "userId", "fullName", "licenseNumber", "bio", "avatarUrl", "price", "isVerified") VALUES
    ('444c8e9f-75bf-45bb-a9c6-89d2807a844a', '09a58073-cc1e-4891-b6c2-bd66de84f837', 'Dra. Maria Santos', 'CRM-RJ 234567', 'Dermatologista renomada, especialista em tratamentos estéticos e doenças de pele.', 'https://ui-avatars.com/api/?name=Maria+Santos&background=2196F3&color=fff&size=128', 280.00, true)
ON CONFLICT ("id") DO NOTHING;

-- Especialidades da Dra. Maria Santos
INSERT INTO "ProfessionalSpecialty" ("professionalId", "specialtyId")
SELECT 
    '444c8e9f-75bf-45bb-a9c6-89d2807a844a'::TEXT,
    (SELECT id FROM "Specialty" WHERE name = 'Dermatologia' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM "ProfessionalSpecialty" 
    WHERE "professionalId" = '444c8e9f-75bf-45bb-a9c6-89d2807a844a' 
    AND "specialtyId" = (SELECT id FROM "Specialty" WHERE name = 'Dermatologia' LIMIT 1)
);

-- ============================================
-- PROFISSIONAL 3: Dr. Carlos Oliveira - Pediatra
-- ============================================
INSERT INTO "Professional" ("id", "userId", "fullName", "licenseNumber", "bio", "avatarUrl", "price", "isVerified") VALUES
    ('ffb077de-2e52-40f0-950a-ef7d72846b9c', '24c29491-3565-46ac-b8d3-ee7c95088cc4', 'Dr. Carlos Oliveira', 'CRM-MG 345678', 'Pediatra dedicado ao cuidado infantil. Experiência em desenvolvimento infantil e vacinação.', 'https://ui-avatars.com/api/?name=Carlos+Oliveira&background=FF9800&color=fff&size=128', 200.00, true)
ON CONFLICT ("id") DO NOTHING;

-- Especialidades do Dr. Carlos Oliveira
INSERT INTO "ProfessionalSpecialty" ("professionalId", "specialtyId")
SELECT 
    'ffb077de-2e52-40f0-950a-ef7d72846b9c'::TEXT,
    (SELECT id FROM "Specialty" WHERE name = 'Pediatria' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM "ProfessionalSpecialty" 
    WHERE "professionalId" = 'ffb077de-2e52-40f0-950a-ef7d72846b9c' 
    AND "specialtyId" = (SELECT id FROM "Specialty" WHERE name = 'Pediatria' LIMIT 1)
);

-- ============================================
-- PROFISSIONAL 4: Dra. Ana Costa - Psiquiatra
-- ============================================
INSERT INTO "Professional" ("id", "userId", "fullName", "licenseNumber", "bio", "avatarUrl", "price", "isVerified") VALUES
    ('94bcb225-d9b4-46bd-8449-745312900e77', 'f96fe6a2-e8aa-4824-ad04-371f1aab801d', 'Dra. Ana Costa', 'CRM-SP 456789', 'Psiquiatra especialista em saúde mental. Atendimento humanizado e acolhedor.', 'https://ui-avatars.com/api/?name=Ana+Costa&background=9C27B0&color=fff&size=128', 320.00, true)
ON CONFLICT ("id") DO NOTHING;

-- Especialidades da Dra. Ana Costa
INSERT INTO "ProfessionalSpecialty" ("professionalId", "specialtyId")
SELECT 
    '94bcb225-d9b4-46bd-8449-745312900e77'::TEXT,
    (SELECT id FROM "Specialty" WHERE name = 'Psiquiatria' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM "ProfessionalSpecialty" 
    WHERE "professionalId" = '94bcb225-d9b4-46bd-8449-745312900e77' 
    AND "specialtyId" = (SELECT id FROM "Specialty" WHERE name = 'Psiquiatria' LIMIT 1)
);

-- ============================================
-- PROFISSIONAL 5: Dr. Roberto Ferreira - Clínico Geral e Endocrinologista
-- ============================================
-- EXEMPLO: Profissional com MÚLTIPLAS especialidades
INSERT INTO "Professional" ("id", "userId", "fullName", "licenseNumber", "bio", "avatarUrl", "price", "isVerified") VALUES
    ('d55b044a-9b3b-44dc-89e0-33a757da0f1c', '5903e8f8-424b-436e-a4e1-3d5eb81552cc', 'Dr. Roberto Ferreira', 'CRM-SP 567890', 'Clínico Geral e Endocrinologista com ampla experiência em medicina preventiva e tratamento de doenças metabólicas.', 'https://ui-avatars.com/api/?name=Roberto+Ferreira&background=607D8B&color=fff&size=128', 250.00, true)
ON CONFLICT ("id") DO NOTHING;

-- Especialidades do Dr. Roberto Ferreira (MÚLTIPLAS)
-- Para adicionar múltiplas especialidades, insira múltiplas linhas com o mesmo professionalId
INSERT INTO "ProfessionalSpecialty" ("professionalId", "specialtyId")
SELECT 
    'd55b044a-9b3b-44dc-89e0-33a757da0f1c'::TEXT,
    (SELECT id FROM "Specialty" WHERE name = 'Clínica Geral' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM "ProfessionalSpecialty" 
    WHERE "professionalId" = 'd55b044a-9b3b-44dc-89e0-33a757da0f1c' 
    AND "specialtyId" = (SELECT id FROM "Specialty" WHERE name = 'Clínica Geral' LIMIT 1)
);

INSERT INTO "ProfessionalSpecialty" ("professionalId", "specialtyId")
SELECT 
    'd55b044a-9b3b-44dc-89e0-33a757da0f1c'::TEXT,
    (SELECT id FROM "Specialty" WHERE name = 'Endocrinologia' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM "ProfessionalSpecialty" 
    WHERE "professionalId" = 'd55b044a-9b3b-44dc-89e0-33a757da0f1c' 
    AND "specialtyId" = (SELECT id FROM "Specialty" WHERE name = 'Endocrinologia' LIMIT 1)
);

-- ============================================
-- PACIENTES
-- ============================================

INSERT INTO "Patient" ("id", "userId", "fullName", "cpf", "phone", "birthDate", "stripeCustomerId") VALUES
    ('e2ded583-d2c0-46f3-8850-49dbd94824f1', '0361890d-ec40-4a90-b725-7df61260e26a', 'Pedro Alves', '12345678900', '(11) 98765-4321', TIMESTAMP '1990-05-15 00:00:00', NULL),
    ('ae97749d-4d42-48ba-9e17-c8adcbd39c8f', 'e356881b-4b6f-4760-96b7-d555a63a18c4', 'Julia Ferreira', '23456789011', '(21) 97654-3210', TIMESTAMP '1985-08-22 00:00:00', NULL),
    ('10eb1927-c430-45fc-aaa4-252821ac5f0d', '7d5adf7c-ecaa-4fa9-a632-3cfc7be583ab', 'Lucas Rodrigues', '34567890122', '(31) 96543-2109', TIMESTAMP '1992-11-30 00:00:00', NULL)
ON CONFLICT ("id") DO NOTHING;

-- ============================================
-- HORÁRIOS DISPONÍVEIS (AvailabilitySlot)
-- ============================================
-- dayOfWeek: 0=Domingo, 1=Segunda, 2=Terça, 3=Quarta, 4=Quinta, 5=Sexta, 6=Sábado
-- Os horários são agrupados por profissional para facilitar a manutenção

-- Horários do Dr. João Silva - Segunda a Sexta, 8h às 12h
INSERT INTO "AvailabilitySlot" ("id", "professionalId", "dayOfWeek", "startTime", "endTime") VALUES
    ('129bc039-6662-4995-babd-27fdfa4815c2', '3890cf77-7ea2-4e6f-aecb-932a9b5324e6', 1, '08:00', '12:00'),
    ('75f8567e-c8eb-4423-83d5-0f77b7b80be7', '3890cf77-7ea2-4e6f-aecb-932a9b5324e6', 2, '08:00', '12:00'),
    ('78748919-cdd9-466c-9821-53f4c01f8980', '3890cf77-7ea2-4e6f-aecb-932a9b5324e6', 3, '08:00', '12:00'),
    ('45614535-ac36-4650-aaa9-03f781287250', '3890cf77-7ea2-4e6f-aecb-932a9b5324e6', 4, '08:00', '12:00'),
    ('ab6d5e54-ec8c-42e4-8317-1b56781d29f2', '3890cf77-7ea2-4e6f-aecb-932a9b5324e6', 5, '08:00', '12:00')
ON CONFLICT ("id") DO NOTHING;

-- Horários da Dra. Maria Santos - Segunda, Quarta, Sexta, 14h às 18h
INSERT INTO "AvailabilitySlot" ("id", "professionalId", "dayOfWeek", "startTime", "endTime") VALUES
    ('0e5acc0a-f023-448b-ade1-89bbeb39f213', '444c8e9f-75bf-45bb-a9c6-89d2807a844a', 1, '14:00', '18:00'),
    ('4ad3e06c-ce5a-4b65-9a16-975cbfe35d9a', '444c8e9f-75bf-45bb-a9c6-89d2807a844a', 3, '14:00', '18:00'),
    ('51167c98-f8ee-43fe-8770-adaaed503aa0', '444c8e9f-75bf-45bb-a9c6-89d2807a844a', 5, '14:00', '18:00')
ON CONFLICT ("id") DO NOTHING;

-- Horários do Dr. Carlos Oliveira - Terça e Quinta, 9h às 13h
INSERT INTO "AvailabilitySlot" ("id", "professionalId", "dayOfWeek", "startTime", "endTime") VALUES
    ('9cf1c064-3a44-4ddd-95f1-f96f00261a9e', 'ffb077de-2e52-40f0-950a-ef7d72846b9c', 2, '09:00', '13:00'),
    ('9d1e3139-1952-4dcf-8608-11cab6899968', 'ffb077de-2e52-40f0-950a-ef7d72846b9c', 4, '09:00', '13:00')
ON CONFLICT ("id") DO NOTHING;

-- Horários da Dra. Ana Costa - Segunda a Sexta, 10h às 16h
INSERT INTO "AvailabilitySlot" ("id", "professionalId", "dayOfWeek", "startTime", "endTime") VALUES
    ('bc244ace-0903-4631-b8bf-4e55b74fad2a', '94bcb225-d9b4-46bd-8449-745312900e77', 1, '10:00', '16:00'),
    ('d292b383-d3a6-490e-96f6-9fca46461d36', '94bcb225-d9b4-46bd-8449-745312900e77', 2, '10:00', '16:00'),
    ('4156877f-6598-46cd-be6f-047795fbec38', '94bcb225-d9b4-46bd-8449-745312900e77', 3, '10:00', '16:00'),
    ('a91b52a6-5099-4ce0-a672-8e483651b90f', '94bcb225-d9b4-46bd-8449-745312900e77', 4, '10:00', '16:00'),
    ('5d67a978-9291-426f-b091-8f1300245216', '94bcb225-d9b4-46bd-8449-745312900e77', 5, '10:00', '16:00')
ON CONFLICT ("id") DO NOTHING;

-- ============================================
-- AGENDAMENTOS DE EXEMPLO (OPCIONAL)
-- ============================================

INSERT INTO "Appointment" ("id", "patientId", "professionalId", "scheduledAt", "status", "price", "videoRoomUrl", "createdAt") VALUES
    -- Agendamento futuro
    ('e60561f5-d44f-4521-9048-89afb0bf336b', 'e2ded583-d2c0-46f3-8850-49dbd94824f1', '3890cf77-7ea2-4e6f-aecb-932a9b5324e6', NOW() + INTERVAL '7 days', 'SCHEDULED', 350.00, NULL, NOW()),
    -- Agendamento concluído
    ('2314a363-6ba7-4677-9998-aed8dc08c989', 'ae97749d-4d42-48ba-9e17-c8adcbd39c8f', '444c8e9f-75bf-45bb-a9c6-89d2807a844a', NOW() - INTERVAL '5 days', 'COMPLETED', 280.00, NULL, NOW() - INTERVAL '10 days'),
    -- Agendamento pendente de pagamento
    ('2144e08a-e9a1-4284-9b65-51b3431ba395', '10eb1927-c430-45fc-aaa4-252821ac5f0d', 'ffb077de-2e52-40f0-950a-ef7d72846b9c', NOW() + INTERVAL '3 days', 'PENDING_PAYMENT', 200.00, NULL, NOW())
ON CONFLICT ("id") DO NOTHING;

-- ============================================
-- PRONTUÁRIO MÉDICO (para o agendamento concluído)
-- ============================================

INSERT INTO "MedicalRecord" ("id", "appointmentId", "patientId", "professionalId", "anamnesis", "diagnosis", "prescriptionUrl", "createdAt") VALUES
    ('3cd58296-a5d1-42fa-8bdc-5437f7244997', '2314a363-6ba7-4677-9998-aed8dc08c989', 'ae97749d-4d42-48ba-9e17-c8adcbd39c8f', '444c8e9f-75bf-45bb-a9c6-89d2807a844a', 
     'Paciente relata coceira e vermelhidão na pele há 3 semanas. Sem histórico de alergias conhecidas. Uso de creme hidratante diário.', 
     'Dermatite de contato. Recomendado uso de pomada tópica e evitar contato com substâncias irritantes.', 
     NULL, 
     NOW() - INTERVAL '5 days')
ON CONFLICT ("id") DO NOTHING;

-- ============================================
-- LOGS DE AUDITORIA (EXEMPLO)
-- ============================================

INSERT INTO "AuditLog" ("id", "userId", "action", "targetId", "ipAddress", "timestamp") VALUES
    ('54e589b7-5e23-4072-af35-4d7f2d2ad51d', '0361890d-ec40-4a90-b725-7df61260e26a', 'LOGIN', NULL, '192.168.1.100', NOW() - INTERVAL '1 hour'),
    ('beec6661-6027-475f-81fe-c4bfde0ba26d', '0361890d-ec40-4a90-b725-7df61260e26a', 'APPOINTMENT_CREATED', 'e60561f5-d44f-4521-9048-89afb0bf336b', '192.168.1.100', NOW() - INTERVAL '2 hours'),
    ('c75156cb-36ef-4605-8f2f-a8142354231e', '89b976cf-3bc7-440b-8be0-35bc2ea5b87c', 'APPOINTMENT_VIEWED', 'e60561f5-d44f-4521-9048-89afb0bf336b', '192.168.1.101', NOW() - INTERVAL '30 minutes')
ON CONFLICT ("id") DO NOTHING;

-- ============================================
-- FIM DOS INSERTS
-- ============================================
-- 
-- RESUMO DOS DADOS INSERIDOS:
-- - 10 Especialidades
-- - 1 Admin
-- - 5 Profissionais (4 com 1 especialidade, 1 com 2 especialidades)
-- - 3 Pacientes
-- - 5 Relacionamentos Profissional-Especialidade (1 profissional tem 2 especialidades)
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

