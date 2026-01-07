import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProfessionalsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const professionals = await this.prisma.professional.findMany({
      include: {
        specialties: {
          include: {
            specialty: true, // Traz o nome da especialidade (ex: Cardiologia)
          },
        },
        user: {
          select: { email: true, isActive: true } // Traz dados do usuário (opcional)
        },
        appointments: {
          where: {
            status: 'COMPLETED',
          },
          include: {
            rating: true,
          },
        },
      },
    });

    // Calcular média de ratings e quantidade de avaliações para cada profissional
    const professionalsWithRatings = professionals.map((professional) => {
      const ratings = professional.appointments
        .map((appointment) => appointment.rating)
        .filter((rating) => rating !== null)
        .map((rating) => rating!.rating);

      const reviewsCount = ratings.length;
      const averageRating =
        reviewsCount > 0
          ? ratings.reduce((sum, rating) => sum + rating, 0) / reviewsCount
          : 0;

      // Remover appointments do retorno (não precisamos enviar isso para o frontend)
      const { appointments, ...professionalWithoutAppointments } = professional;

      return {
        ...professionalWithoutAppointments,
        averageRating: Math.round(averageRating * 10) / 10, // Arredondar para 1 casa decimal
        reviewsCount,
      };
    });

    return professionalsWithRatings;
  }

  // Mantenha os outros métodos vazios por enquanto
  findOne(id: number) { return `Returns #${id} professional`; }
  update(id: number, updateProfessionalDto: any) { return `Updates #${id}`; }
  remove(id: number) { return `Removes #${id}`; }
}