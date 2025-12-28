// src/appointments/appointments.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

@Injectable()
export class AppointmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createAppointmentDto: CreateAppointmentDto, userId: string) {
    const { professionalId, scheduledAt } = createAppointmentDto;

    // 1. Converter scheduledAt para Date
    const appointmentDate = new Date(scheduledAt);
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

    // 4. Buscar o Patient pelo userId
    const patient = await this.prisma.patient.findUnique({
      where: { userId },
    });

    if (!patient) {
      throw new ForbiddenException(
        'Apenas pacientes podem criar agendamentos. Perfil de paciente não encontrado.',
      );
    }

    // 5. Verificar se o Professional existe e está ativo
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

    // 6. Validação: Verificar "double booking" - Não permitir dois agendamentos no mesmo horário
    // Considerar uma janela de 30 minutos (consultas padrão)
    const appointmentStart = new Date(appointmentDate);
    const appointmentEnd = new Date(appointmentDate);
    appointmentEnd.setMinutes(appointmentEnd.getMinutes() + 30); // Consulta de 30 minutos

    const conflictingAppointment = await this.prisma.appointment.findFirst({
      where: {
        professionalId,
        scheduledAt: {
          gte: appointmentStart,
          lt: appointmentEnd,
        },
        status: {
          not: 'CANCELED', // Agendamentos cancelados não contam como conflito
        },
      },
    });

    if (conflictingAppointment) {
      throw new BadRequestException(
        'Este horário já está ocupado. Por favor, selecione outro horário.',
      );
    }

    // 7. Criar o agendamento usando o preço do profissional
    const appointment = await this.prisma.appointment.create({
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

    return appointment;
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

    // Verificar se já está cancelado ou completado
    if (appointment.status === 'CANCELED') {
      throw new BadRequestException('Este agendamento já está cancelado.');
    }

    if (appointment.status === 'COMPLETED') {
      throw new BadRequestException(
        'Não é possível cancelar uma consulta já finalizada.',
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
      hasPermission = patient && appointment.patientId === patient.id;
    } else if (userRole === 'PROFESSIONAL') {
      const professional = await this.prisma.professional.findUnique({
        where: { userId },
      });
      hasPermission =
        professional && appointment.professionalId === professional.id;
    }

    if (!hasPermission) {
      throw new ForbiddenException(
        'Você não tem permissão para cancelar este agendamento.',
      );
    }

    // Cancelar o agendamento
    return this.prisma.appointment.update({
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
          },
        },
      },
    });
  }
}

