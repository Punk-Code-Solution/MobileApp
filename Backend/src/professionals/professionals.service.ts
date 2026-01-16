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

  async findOne(id: string) {
    const professional = await this.prisma.professional.findUnique({
      where: { id },
      include: {
        specialties: {
          include: {
            specialty: true,
          },
        },
        user: {
          select: { email: true, isActive: true },
        },
      },
    });

    if (!professional) {
      return null;
    }

    // Buscar avaliações do profissional
    const appointmentsWithRatings = await this.prisma.appointment.findMany({
      where: {
        professionalId: id,
        status: 'COMPLETED',
        rating: {
          isNot: null,
        },
      },
      include: {
        rating: true,
        patient: {
          select: {
            fullName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50, // Limitar a 50 avaliações mais recentes
    });

    // Calcular média e quantidade de avaliações
    const ratings = appointmentsWithRatings
      .map((appointment) => appointment.rating)
      .filter((rating) => rating !== null)
      .map((rating) => rating!.rating);

    const reviewsCount = ratings.length;
    const averageRating =
      reviewsCount > 0
        ? ratings.reduce((sum, rating) => sum + rating, 0) / reviewsCount
        : 0;

    // Formatar avaliações para retorno
    const reviews = appointmentsWithRatings
      .filter((appointment) => appointment.rating !== null)
      .map((appointment) => ({
        id: appointment.rating!.id,
        rating: appointment.rating!.rating,
        comment: appointment.rating!.comment,
        createdAt: appointment.rating!.createdAt,
        patient: {
          fullName: appointment.patient.fullName,
          avatarUrl: null, // Patient não tem avatarUrl no schema
        },
      }));

    return {
      ...professional,
      averageRating: Math.round(averageRating * 10) / 10,
      reviewsCount,
      reviews,
    };
  }

  async getReviews(professionalId: string) {
    console.log('[PROFESSIONALS-SERVICE] Buscando avaliações para profissional:', professionalId);
    
    const appointmentsWithRatings = await this.prisma.appointment.findMany({
      where: {
        professionalId,
        status: 'COMPLETED',
        rating: {
          isNot: null,
        },
      },
      include: {
        rating: true,
        patient: {
          select: {
            fullName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log('[PROFESSIONALS-SERVICE] Appointments encontrados:', appointmentsWithRatings.length);

    const reviews = appointmentsWithRatings
      .filter((appointment) => appointment.rating !== null)
      .map((appointment) => {
        const review = {
          id: appointment.rating!.id,
          rating: appointment.rating!.rating,
          comment: appointment.rating!.comment || null, // Garantir que seja null se vazio
          createdAt: appointment.rating!.createdAt,
          patient: {
            fullName: appointment.patient.fullName,
            avatarUrl: null, // Patient não tem avatarUrl no schema
          },
        };
        console.log('[PROFESSIONALS-SERVICE] Review processado:', {
          id: review.id,
          rating: review.rating,
          hasComment: !!review.comment,
          comment: review.comment,
          commentLength: review.comment?.length || 0,
          patientName: review.patient.fullName,
        });
        return review;
      })
      // Ordenar por data da avaliação (mais recente primeiro)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    console.log('[PROFESSIONALS-SERVICE] Total de avaliações retornadas:', reviews.length);
    console.log('[PROFESSIONALS-SERVICE] Avaliações com comentários:', reviews.filter(r => r.comment && r.comment.trim()).length);
    return reviews;
  }

  update(id: number, updateProfessionalDto: any) { return `Updates #${id}`; }
  remove(id: number) { return `Removes #${id}`; }
}