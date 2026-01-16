// src/appointments/appointments.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  HttpException,
  Patch,
  BadRequestException,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { RateAppointmentDto } from './dto/rate-appointment.dto';
import { JwtAuthGuard } from '../common/guards';
import { CurrentUser, type CurrentUserPayload } from '../common/decorators';

@Controller('appointments')
@UseGuards(JwtAuthGuard) // Todas as rotas deste controller requerem autenticação
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createAppointmentDto: CreateAppointmentDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.appointmentsService.create(createAppointmentDto, user.userId, user.role);
  }

  @Get('me')
  findAll(@CurrentUser() user: CurrentUserPayload) {
    return this.appointmentsService.findAll(user.userId, user.role);
  }

  // IMPORTANTE: Rotas específicas devem vir ANTES de rotas com parâmetros dinâmicos
  // Caso contrário, a rota :id captura todas as requisições
  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK)
  cancel(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.appointmentsService.cancel(id, user.userId, user.role);
  }

  @Patch(':id/complete')
  @HttpCode(HttpStatus.OK)
  async complete(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    try {
      // Validar formato do ID (UUID)
      if (!id || typeof id !== 'string' || id.trim().length === 0) {
        throw new BadRequestException('ID do agendamento inválido.');
      }

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id.trim())) {
        throw new BadRequestException('ID do agendamento deve ser um UUID válido.');
      }

      return await this.appointmentsService.complete(id.trim(), user.userId, user.role);
    } catch (error) {
      // Se já for uma exceção HTTP, re-lançar
      if (error instanceof HttpException) {
        throw error;
      }
      // Logar erro inesperado
      console.error('[APPOINTMENTS-CONTROLLER] Erro ao finalizar consulta:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        appointmentId: id,
        userId: user.userId,
      });
      throw error;
    }
  }

  @Post(':id/rate')
  @HttpCode(HttpStatus.OK)
  rate(
    @Param('id') id: string,
    @Body() rateAppointmentDto: RateAppointmentDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.appointmentsService.rate(id, rateAppointmentDto, user.userId, user.role);
  }

  // Rota genérica deve vir POR ÚLTIMO
  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    // Prevenir conflito: se id for 'me', retornar erro
    if (id === 'me') {
      throw new BadRequestException('Invalid appointment ID. Use GET /appointments/me to list your appointments.');
    }
    return this.appointmentsService.findOne(id, user.userId, user.role);
  }
}

