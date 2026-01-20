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

import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { appConfig } from './config/app.config';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: false,
    }),
  );

  // Habilitar validação global de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remove propriedades que não estão no DTO
      forbidNonWhitelisted: true, // Lança erro se propriedades extras forem enviadas
      transform: true, // Transforma o payload para a instância do DTO
    }),
  );

  // Filtro global de exceções
  app.useGlobalFilters(new HttpExceptionFilter());

  // Interceptor global para transformar respostas
  app.useGlobalInterceptors(new TransformInterceptor());

  // Habilitar CORS para comunicação com o app mobile
  await app.register(require('@fastify/cors'), {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Em desenvolvimento, permitir todas as origens (incluindo IPs locais para dispositivos físicos)
      if (appConfig.nodeEnv === 'development') {
        callback(null, true);
        return;
      }
      // Em produção, verificar lista de origens permitidas
      // Permitir requisições sem origin (mobile apps, Postman, etc)
      if (!origin || appConfig.cors.allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'), false);
      }
    },
    credentials: appConfig.cors.credentials,
    methods: appConfig.cors.methods,
    allowedHeaders: appConfig.cors.allowedHeaders,
  });

  // Habilitar Helmet para segurança
  await app.register(require('@fastify/helmet'), {
    contentSecurityPolicy: false,
  });

  // A Vercel fornece a porta via process.env.PORT, mas pode ser undefined
  // NestJS precisa de um número, então usamos 0 para deixar o sistema escolher
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : appConfig.port;
  
  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}`);
}
bootstrap();
