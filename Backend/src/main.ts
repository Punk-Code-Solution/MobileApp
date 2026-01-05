import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { appConfig } from './config/app.config';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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
  app.enableCors({
    origin: (origin, callback) => {
      // Permitir requisições sem origin (mobile apps, Postman, etc)
      if (!origin || appConfig.cors.allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: appConfig.cors.credentials,
    methods: appConfig.cors.methods,
    allowedHeaders: appConfig.cors.allowedHeaders,
  });

  await app.listen(appConfig.port);
  console.log(`🚀 Application is running on: http://localhost:${appConfig.port}`);
}
bootstrap();
