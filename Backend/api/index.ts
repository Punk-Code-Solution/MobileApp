import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../src/app.module';
import express, { Request, Response } from 'express';
import { ValidationPipe } from '@nestjs/common';
import { appConfig } from '../src/config/app.config';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';

let cachedApp: express.Express;

async function createApp(): Promise<express.Express> {
  if (cachedApp) {
    return cachedApp;
  }

  try {
    // Suprimir warning sobre app.router deprecated
    const originalWarn = console.warn;
    console.warn = (...args: any[]) => {
      if (args[0] && typeof args[0] === 'string' && args[0].includes('app.router')) {
        // Suprimir apenas o warning sobre app.router
        return;
      }
      originalWarn.apply(console, args);
    };

    const server = express();
    const app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
      logger: false,
    });

    // Restaurar console.warn após criar o app
    console.warn = originalWarn;

    // Habilitar validação global de DTOs
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    // Filtro global de exceções
    app.useGlobalFilters(new HttpExceptionFilter());

    // Interceptor global para transformar respostas
    app.useGlobalInterceptors(new TransformInterceptor());

    // Habilitar CORS
    app.enableCors({
      origin: (origin, callback) => {
        if (appConfig.nodeEnv === 'development') {
          callback(null, true);
          return;
        }
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

    await app.init();
    cachedApp = server;
    return server;
  } catch (error) {
    console.error('Error creating NestJS app:', error);
    throw error;
  }
}

export default async function handler(req: Request, res: Response) {
  try {
    // Verificar variáveis de ambiente críticas
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL is not set');
      return res.status(500).json({
        error: 'Configuration Error',
        message: 'DATABASE_URL environment variable is missing',
      });
    }

    const app = await createApp();
    app(req, res);
  } catch (error) {
    console.error('Error in serverless function:', error);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined,
      });
    }
  }
}

