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
  Patch,
  BadRequestException,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser, type CurrentUserPayload } from 'src/auth/decorators/current-user.decorator';

@Controller('appointments')
@UseGuards(AuthGuard('jwt')) // Todas as rotas deste controller requerem autenticação
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

  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK)
  cancel(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.appointmentsService.cancel(id, user.userId, user.role);
  }
}

