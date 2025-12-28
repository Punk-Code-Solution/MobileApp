// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  // 1. Criar Especialidades
  const specialties = ['Cardiologia', 'Dermatologia', 'Psicologia', 'Ortopedia', 'Pediatria'];
  
  for (const name of specialties) {
    await prisma.specialty.upsert({
      where: { id: specialties.indexOf(name) + 1 }, // ID fictício
      update: {},
      create: { name },
    });
  }
  console.log('✅ Especialidades criadas.');

  // 2. Criar Médicos
  const doctors = [
    { name: 'Dr. House', email: 'house@tv.com', spec: 1, price: 350.00 },
    { name: 'Dra. Grey', email: 'meredith@tv.com', spec: 2, price: 200.00 },
    { name: 'Dr. Shaun', email: 'shaun@tv.com', spec: 5, price: 150.00 },
  ];

  const passwordHash = await bcrypt.hash('123456', 10);

  for (const doc of doctors) {
    const user = await prisma.user.upsert({
      where: { email: doc.email },
      update: {},
      create: {
        email: doc.email,
        passwordHash,
        role: 'PROFESSIONAL',
        isActive: true,
      },
    });

    await prisma.professional.create({
      data: {
        userId: user.id,
        fullName: doc.name,
        licenseNumber: `CRM-${Math.floor(Math.random() * 10000)}`,
        price: doc.price,
        bio: 'Especialista com mais de 10 anos de experiência.',
        specialties: {
          create: {
            specialtyId: doc.spec, // Conecta à especialidade criada acima
          },
        },
      },
    });
  }

  console.log('✅ Médicos criados com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });