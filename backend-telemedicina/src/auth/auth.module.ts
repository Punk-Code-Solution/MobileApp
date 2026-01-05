// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy'; // <--- IMPORTANTE: Importar o arquivo criado acima

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'SEGREDO_SUPER_SECRETO_DEV_ONLY', // Usar variável de ambiente
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [AuthController],
  // O ERRO ESTAVA AQUI: Faltava o JwtStrategy nos providers
  providers: [AuthService, JwtStrategy], 
  exports: [AuthService],
})
export class AuthModule {}