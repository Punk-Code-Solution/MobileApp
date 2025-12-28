import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

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

  // Habilitar CORS para comunicação com o app mobile
  app.enableCors();

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
