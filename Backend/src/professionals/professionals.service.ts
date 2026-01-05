import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProfessionalsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.professional.findMany({
      include: {
        specialties: {
          include: {
            specialty: true, // Traz o nome da especialidade (ex: Cardiologia)
          },
        },
        user: {
          select: { email: true, isActive: true } // Traz dados do usuário (opcional)
        }
      },
    });
  }

  // Mantenha os outros métodos vazios por enquanto
  findOne(id: number) { return `Returns #${id} professional`; }
  update(id: number, updateProfessionalDto: any) { return `Updates #${id}`; }
  remove(id: number) { return `Removes #${id}`; }
}