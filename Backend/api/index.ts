import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../src/app.module';
import express, { Request, Response } from 'express';
import { ValidationPipe } from '@nestjs/common';
import { appConfig } from '../src/config/app.config';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';

// Patch do Express ANTES de criar qualquer instância
// Isso intercepta o acesso a app.router antes que o erro seja lançado
// Criar uma instância temporária para acessar o prototype
const tempApp = express();
const ApplicationPrototype = Object.getPrototypeOf(tempApp);

// Salvar o método original
const originalGet = ApplicationPrototype.get;

// Sobrescrever o método get no prototype do Express
ApplicationPrototype.get = function(key: string) {
  if (key === 'router') {
    // Retornar um objeto mock que o ExpressAdapter espera
    return {
      stack: [],
    };
  }
  // Para outras chaves, usar o método original
  try {
    return originalGet.call(this, key);
  } catch (error: any) {
    // Se for erro sobre router deprecated, retornar mock
    if (error && error.message && typeof error.message === 'string' && error.message.includes('app.router')) {
      return {
        stack: [],
      };
    }
    throw error;
  }
};

let cachedApp: express.Express;

async function createApp(): Promise<express.Express> {
  if (cachedApp) {
    return cachedApp;
  }

  try {
    const server = express();

    const app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
      logger: false,
    });

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

