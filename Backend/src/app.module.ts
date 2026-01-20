/**
 * Sistema de Telemedicina - Backend API
 * 
 * Copyright (c) 2025-2026 Punk Code Solution
 * CNPJ: 61.805.210/0001-41
 * Rua do Aconchego, Ilhéus - BA, CEP 45656-627
 * 
 * Este software é propriedade da Punk Code Solution e está protegido
 * pelas leis de direitos autorais brasileiras e internacionais.
 * Licenciado sob os termos da licença MIT.
 */

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ProfessionalsModule } from './professionals/professionals.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { MessagesModule } from './messages/messages.module';

@Module({
  imports: [
    PrismaModule, // O módulo deve estar aqui
    UsersModule, 
    AuthModule,
    ProfessionalsModule,
    AppointmentsModule,
    NotificationsModule,
    MessagesModule,
  ],
  controllers: [AppController],
  providers: [AppService], // <--- AQUI SÓ DEVE TER O AppService. Não coloque UsersService aqui.
})
export class AppModule {}