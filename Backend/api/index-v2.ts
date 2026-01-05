import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import express, { Request, Response } from 'express';
import { ValidationPipe } from '@nestjs/common';
import { appConfig } from '../src/config/app.config';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';

// Abordagem 1: Usar FastifyAdapter em vez de ExpressAdapter
// Mas isso requer mudanças maiores no código...

// Abordagem 2: Criar adapter customizado que não acessa app.router
class CustomExpressAdapter {
  private expressInstance: express.Express;

  constructor(expressInstance: express.Express) {
    this.expressInstance = expressInstance;
  }

  getInstance(): express.Express {
    return this.expressInstance;
  }
}

let cachedApp: express.Express;

async function createApp(): Promise<express.Express> {
  if (cachedApp) {
    return cachedApp;
  }

  try {
    const server = express();
    
    // Abordagem 3: Configurar middlewares manualmente antes do NestJS
    server.use(express.json());
    server.use(express.urlencoded({ extended: true }));

    // Criar app NestJS sem ExpressAdapter (não funciona, precisa do adapter)
    // Vamos tentar outra abordagem...

    cachedApp = server;
    return server;
  } catch (error) {
    console.error('Error creating NestJS app:', error);
    throw error;
  }
}

export default async function handler(req: Request, res: Response) {
  try {
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
      });
    }
  }
}

