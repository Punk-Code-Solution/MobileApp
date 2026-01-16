// src/appointments/appointments.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { RateAppointmentDto } from './dto/rate-appointment.dto';

@Injectable()
export class AppointmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createAppointmentDto: CreateAppointmentDto, userId: string, userRole: string) {
    const { professionalId, scheduledAt } = createAppointmentDto;

    // 0. Validar role primeiro (antes de fazer queries)
    if (userRole !== 'PATIENT') {
      throw new ForbiddenException('Apenas pacientes podem criar agendamentos.');
    }

    // 1. Converter scheduledAt para Date (normalizar para UTC)
    const appointmentDate = new Date(scheduledAt);
    if (isNaN(appointmentDate.getTime())) {
      throw new BadRequestException('Data/hora inválida. Use formato ISO 8601 (ex: 2024-01-15T14:30:00Z)');
    }
    const now = new Date();

    // 2. Validação: Não permitir agendamentos no passado
    if (appointmentDate <= now) {
      throw new BadRequestException(
        'Não é possível agendar consultas no passado. Por favor, selecione uma data futura.',
      );
    }

    // 3. Validação: Mínimo de 2 horas de antecedência
    const minTime = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 horas
    if (appointmentDate < minTime) {
      throw new BadRequestException(
        'É necessário agendar com pelo menos 2 horas de antecedência.',
      );
    }

    // 2. Buscar o Patient pelo userId (já validamos role acima)
    const patient = await this.prisma.patient.findUnique({
      where: { userId },
    });

    if (!patient) {
      throw new ForbiddenException(
        'Perfil de paciente não encontrado. Por favor, complete seu cadastro.',
      );
    }

    // 3. Verificar se o Professional existe e está ativo
    const professional = await this.prisma.professional.findUnique({
      where: { id: professionalId },
      include: {
        user: {
          select: {
            isActive: true,
          },
        },
      },
    });

    if (!professional) {
      throw new NotFoundException('Profissional não encontrado.');
    }

    if (!professional.user.isActive) {
      throw new BadRequestException('Profissional não está ativo no momento.');
    }

    // 4. Criar agendamento usando TRANSAÇÃO para prevenir race condition
    // Dentro da transação: verificar conflito e criar atomicamente
    const appointment = await this.prisma.$transaction(async (tx) => {
      // 4.1. Calcular janela de tempo (30 minutos de consulta)
      const appointmentStart = new Date(appointmentDate);
      const appointmentEnd = new Date(appointmentDate);
      appointmentEnd.setMinutes(appointmentEnd.getMinutes() + 30);

      // 4.2. Verificar "double booking" dentro da transação
      // Buscar todos os appointments do profissional no intervalo de tempo
      // (considerando que cada consulta tem 30 minutos)
      const conflictingAppointments = await tx.appointment.findMany({
        where: {
          professionalId,
          status: {
            not: 'CANCELED', // Agendamentos cancelados não contam como conflito
          },
          scheduledAt: {
            // Buscar appointments que podem sobrepor
            // Apenas appointments que começam antes do fim do novo OU terminam depois do início do novo
            gte: new Date(appointmentStart.getTime() - 30 * 60 * 1000), // 30min antes
            lte: new Date(appointmentEnd.getTime() + 30 * 60 * 1000), // 30min depois
          },
        },
      });

      // Verificar sobreposição real (cada appointment tem 30min)
      for (const existing of conflictingAppointments) {
        const existingStart = new Date(existing.scheduledAt);
        const existingEnd = new Date(existing.scheduledAt);
        existingEnd.setMinutes(existingEnd.getMinutes() + 30);

        // Verificar se há sobreposição: novo começa antes do fim do existente E novo termina depois do início do existente
        const hasOverlap =
          appointmentStart < existingEnd && appointmentEnd > existingStart;

        if (hasOverlap) {
          throw new BadRequestException(
            'Este horário já está ocupado. Por favor, selecione outro horário.',
          );
        }
      }

      // 4.3. Criar o agendamento dentro da mesma transação
      return await tx.appointment.create({
        data: {
          patientId: patient.id,
          professionalId: professional.id,
          scheduledAt: appointmentDate,
          price: professional.price,
          status: 'PENDING_PAYMENT', // Status inicial
        },
        include: {
          professional: {
            include: {
              specialties: {
                include: {
                  specialty: true,
                },
              },
            },
          },
          patient: {
            select: {
              id: true,
              fullName: true,
              phone: true,
            },
          },
        },
      });
    }, {
      timeout: 10000, // Timeout de 10 segundos para a transação
    });

    // Criar notificação para o paciente sobre o agendamento
    try {
      await this.createAppointmentNotification(appointment, patient.userId);
    } catch (error) {
      // Não falhar a criação do agendamento se a notificação falhar
      console.error('Erro ao criar notificação de agendamento:', error);
    }

    return appointment;
  }

  /**
   * Cria notificação quando um agendamento é criado
   */
  private async createAppointmentNotification(appointment: any, userId: string) {
    const professionalName = appointment.professional?.fullName || 'Profissional';
    const appointmentDate = new Date(appointment.scheduledAt);
    const formattedDate = appointmentDate.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const formattedTime = appointmentDate.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    await this.prisma.notification.create({
      data: {
        userId,
        title: 'Consulta Agendada',
        message: `Sua consulta com ${professionalName} foi agendada para ${formattedDate} às ${formattedTime}`,
        type: 'APPOINTMENT',
        appointmentId: appointment.id,
        read: false,
      },
    });
  }

  async findAll(userId: string, userRole: string) {
    // Se for ADMIN, retorna todos os agendamentos
    if (userRole === 'ADMIN') {
      return this.prisma.appointment.findMany({
        include: {
          professional: {
            include: {
              specialties: {
                include: {
                  specialty: true,
                },
              },
            },
          },
          patient: {
            select: {
              id: true,
              fullName: true,
              phone: true,
            },
          },
        },
        orderBy: {
          scheduledAt: 'asc',
        },
      });
    }

    // Se for PATIENT, retorna apenas seus agendamentos
    if (userRole === 'PATIENT') {
      const patient = await this.prisma.patient.findUnique({
        where: { userId },
      });

      if (!patient) {
        return [];
      }

      return this.prisma.appointment.findMany({
        where: {
          patientId: patient.id,
        },
        include: {
          professional: {
            include: {
              specialties: {
                include: {
                  specialty: true,
                },
              },
            },
          },
        },
        orderBy: {
          scheduledAt: 'asc',
        },
      });
    }

    // Se for PROFESSIONAL, retorna apenas agendamentos deste profissional
    if (userRole === 'PROFESSIONAL') {
      const professional = await this.prisma.professional.findUnique({
        where: { userId },
      });

      if (!professional) {
        return [];
      }

      return this.prisma.appointment.findMany({
        where: {
          professionalId: professional.id,
        },
        include: {
          patient: {
            select: {
              id: true,
              fullName: true,
              phone: true,
            },
          },
        },
        orderBy: {
          scheduledAt: 'asc',
        },
      });
    }

    return [];
  }

  async findOne(id: string, userId: string, userRole: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        professional: {
          include: {
            specialties: {
              include: {
                specialty: true,
              },
            },
          },
        },
        patient: {
          select: {
            id: true,
            fullName: true,
            phone: true,
          },
        },
        medicalRecord: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Agendamento não encontrado.');
    }

    // Verificar permissão: apenas owner ou ADMIN pode ver
    if (userRole === 'ADMIN') {
      return appointment;
    }

    if (userRole === 'PATIENT') {
      const patient = await this.prisma.patient.findUnique({
        where: { userId },
      });

      if (patient && appointment.patientId === patient.id) {
        return appointment;
      }
    }

    if (userRole === 'PROFESSIONAL') {
      const professional = await this.prisma.professional.findUnique({
        where: { userId },
      });

      if (professional && appointment.professionalId === professional.id) {
        return appointment;
      }
    }

    throw new ForbiddenException(
      'Você não tem permissão para visualizar este agendamento.',
    );
  }

  async cancel(id: string, userId: string, userRole: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      throw new NotFoundException('Agendamento não encontrado.');
    }

    // Verificar se já está cancelado, completado ou em andamento
    if (appointment.status === 'CANCELED') {
      throw new BadRequestException('Este agendamento já está cancelado.');
    }

    if (appointment.status === 'COMPLETED') {
      throw new BadRequestException(
        'Não é possível cancelar uma consulta já finalizada.',
      );
    }

    if (appointment.status === 'IN_PROGRESS') {
      throw new BadRequestException(
        'Não é possível cancelar uma consulta em andamento.',
      );
    }

    // Verificar permissão: apenas owner ou ADMIN pode cancelar
    let hasPermission = false;

    if (userRole === 'ADMIN') {
      hasPermission = true;
    } else if (userRole === 'PATIENT') {
      const patient = await this.prisma.patient.findUnique({
        where: { userId },
      });
      hasPermission = !!(patient && appointment.patientId === patient.id);
    } else if (userRole === 'PROFESSIONAL') {
      const professional = await this.prisma.professional.findUnique({
        where: { userId },
      });
      hasPermission = !!(professional && appointment.professionalId === professional.id);
    }

    if (!hasPermission) {
      throw new ForbiddenException(
        'Você não tem permissão para cancelar este agendamento.',
      );
    }

    // Cancelar o agendamento
    const canceledAppointment = await this.prisma.appointment.update({
      where: { id },
      data: {
        status: 'CANCELED',
      },
      include: {
        professional: {
          include: {
            specialties: {
              include: {
                specialty: true,
              },
            },
          },
        },
        patient: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            userId: true,
          },
        },
      },
    });

    // Criar notificação de cancelamento
    try {
      const professionalName = canceledAppointment.professional?.fullName || 'Profissional';
      await this.prisma.notification.create({
        data: {
          userId: canceledAppointment.patient.userId,
          title: 'Consulta Cancelada',
          message: `Sua consulta com ${professionalName} foi cancelada`,
          type: 'APPOINTMENT',
          appointmentId: canceledAppointment.id,
          read: false,
        },
      });
    } catch (error) {
      console.error('Erro ao criar notificação de cancelamento:', error);
    }

    // Criar notificação de cancelamento
    try {
      const professionalName = canceledAppointment.professional?.fullName || 'Profissional';
      await this.prisma.notification.create({
        data: {
          userId: canceledAppointment.patient.userId,
          title: 'Consulta Cancelada',
          message: `Sua consulta com ${professionalName} foi cancelada`,
          type: 'APPOINTMENT',
          appointmentId: canceledAppointment.id,
          read: false,
        },
      });
    } catch (error) {
      console.error('Erro ao criar notificação de cancelamento:', error);
    }

    return canceledAppointment;
  }

  async complete(id: string, userId: string, userRole: string) {
    try {
      // Validar parâmetros
      if (!id || typeof id !== 'string' || id.trim().length === 0) {
        throw new BadRequestException('ID do agendamento inválido.');
      }

      if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
        throw new BadRequestException('ID do usuário inválido.');
      }

      // Apenas profissionais podem finalizar consultas
      if (userRole !== 'PROFESSIONAL') {
        throw new ForbiddenException('Apenas profissionais podem finalizar consultas.');
      }

      const trimmedId = id.trim();
      const trimmedUserId = userId.trim();

      // Buscar o agendamento (sem include primeiro para verificar se existe)
      const appointment = await this.prisma.appointment.findUnique({
        where: { id: trimmedId },
      });

      if (!appointment) {
        console.error(`[COMPLETE] Agendamento não encontrado. ID: ${trimmedId}, UserId: ${trimmedUserId}`);
        // Tentar buscar todos os appointments do profissional para debug
        const professional = await this.prisma.professional.findUnique({
          where: { userId: trimmedUserId },
          include: {
            appointments: {
              select: { id: true, status: true },
              take: 5,
            },
          },
        });
        if (professional) {
          console.error(`[COMPLETE] Appointments do profissional:`, professional.appointments);
        }
        throw new NotFoundException('Agendamento não encontrado.');
      }

      // Buscar o profissional para verificar permissão
      const professional = await this.prisma.professional.findUnique({
        where: { userId: trimmedUserId },
      });

      if (!professional) {
        console.error(`[COMPLETE] Profissional não encontrado. UserId: ${trimmedUserId}`);
        throw new ForbiddenException('Profissional não encontrado.');
      }

      // Verificar se o agendamento pertence ao profissional
      if (appointment.professionalId !== professional.id) {
        console.error(
          `[COMPLETE] Permissão negada. Appointment.professionalId: ${appointment.professionalId}, Professional.id: ${professional.id}, AppointmentId: ${trimmedId}`,
        );
        throw new ForbiddenException(
          'Você não tem permissão para finalizar este agendamento.',
        );
      }

      // Verificar se já está finalizado ou cancelado
      if (appointment.status === 'COMPLETED') {
        throw new BadRequestException('Esta consulta já foi finalizada.');
      }

      if (appointment.status === 'CANCELED') {
        throw new BadRequestException('Não é possível finalizar uma consulta cancelada.');
      }

      // Finalizar o agendamento
      const completedAppointment = await this.prisma.appointment.update({
        where: { id: trimmedId },
      data: {
        status: 'COMPLETED',
      },
      include: {
        professional: {
          select: {
            id: true,
            fullName: true,
            userId: true,
          },
        },
        patient: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            userId: true,
          },
        },
      },
    });

    // Criar notificação para o paciente sobre a finalização
    try {
      const professionalName = completedAppointment.professional?.fullName || 'Profissional';
      await this.prisma.notification.create({
        data: {
          userId: completedAppointment.patient.userId,
          title: 'Consulta Finalizada',
          message: `Sua consulta com ${professionalName} foi finalizada. Você pode avaliar o atendimento.`,
          type: 'APPOINTMENT',
          appointmentId: completedAppointment.id,
          read: false,
        },
      });
    } catch (error) {
      console.error('Erro ao criar notificação de finalização:', error);
      // Não propagar erro de notificação - a consulta já foi finalizada
    }

      // Retornar apenas os dados essenciais para otimizar a resposta
      return {
        id: completedAppointment.id,
        status: completedAppointment.status,
        scheduledAt: completedAppointment.scheduledAt,
        professional: completedAppointment.professional,
        patient: completedAppointment.patient,
      };
    } catch (error) {
      // Se já for uma exceção HTTP, re-lançar
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      // Logar erro inesperado
      console.error('[APPOINTMENTS-SERVICE] Erro inesperado ao finalizar consulta:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        appointmentId: id,
        userId,
      });
      throw error;
    }
  }

  async rate(
    appointmentId: string,
    rateAppointmentDto: RateAppointmentDto,
    userId: string,
    userRole: string,
  ) {
    // Apenas pacientes podem avaliar consultas
    if (userRole !== 'PATIENT') {
      throw new ForbiddenException('Apenas pacientes podem avaliar consultas.');
    }

    // Buscar o agendamento
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!appointment) {
      throw new NotFoundException('Agendamento não encontrado.');
    }

    // Verificar se o agendamento pertence ao usuário
    if (appointment.patient.userId !== userId) {
      throw new ForbiddenException('Você não tem permissão para avaliar este agendamento.');
    }

    // Verificar se o agendamento foi concluído
    if (appointment.status !== 'COMPLETED') {
      throw new BadRequestException('Apenas consultas concluídas podem ser avaliadas.');
    }

    // Verificar se já existe uma avaliação
    const existingRating = await this.prisma.appointmentRating.findUnique({
      where: { appointmentId },
    });

    let rating;
    if (existingRating) {
      // Atualizar avaliação existente
      rating = await this.prisma.appointmentRating.update({
        where: { appointmentId },
        data: {
          rating: rateAppointmentDto.rating,
          comment: rateAppointmentDto.comment || null,
        },
      });
    } else {
      // Criar nova avaliação
      rating = await this.prisma.appointmentRating.create({
        data: {
          appointmentId,
          rating: rateAppointmentDto.rating,
          comment: rateAppointmentDto.comment || null,
        },
      });
    }

    // Criar notificação para o profissional sobre a avaliação
    try {
      const professional = await this.prisma.professional.findUnique({
        where: { id: appointment.professionalId },
        select: { userId: true },
      });

      if (professional) {
        await this.prisma.notification.create({
          data: {
            userId: professional.userId,
            title: 'Nova Avaliação Recebida',
            message: `Você recebeu uma avaliação de ${rateAppointmentDto.rating} estrelas${rateAppointmentDto.comment ? ' com comentário' : ''}`,
            type: 'SYSTEM',
            appointmentId: appointment.id,
            read: false,
          },
        });
      }
    } catch (error) {
      console.error('Erro ao criar notificação de avaliação:', error);
    }

    return {
      id: rating.id,
      appointmentId: rating.appointmentId,
      rating: rating.rating,
      comment: rating.comment,
      message: 'Avaliação registrada com sucesso.',
    };
  }
}

