// ============================================
// PATCH AGRESSIVO PARA app.router DEPRECATED
// ============================================
// Múltiplas abordagens para garantir que funcione em todos os ambientes

// Abordagem 1: Modificar diretamente o Application.prototype
try {
  const expressAppModule = require('express/lib/application');
  if (expressAppModule?.prototype) {
    const originalGet = expressAppModule.prototype.get;
    expressAppModule.prototype.get = function(key: string) {
      if (key === 'router') {
        return { stack: [] };
      }
      try {
        return originalGet.call(this, key);
      } catch (error: any) {
        if (error?.message?.includes('app.router') || error?.message?.includes('deprecated')) {
          return { stack: [] };
        }
        throw error;
      }
    };
  }
} catch (e) {
  // Ignorar se não conseguir modificar
}

// Abordagem 2: Modificar via require.cache
try {
  const expressPath = require.resolve('express/lib/application');
  if (require.cache[expressPath]?.exports?.prototype) {
    const Application = require.cache[expressPath].exports;
    const originalGet2 = Application.prototype.get;
    Application.prototype.get = function(key: string) {
      if (key === 'router') {
        return { stack: [] };
      }
      try {
        return originalGet2.call(this, key);
      } catch (error: any) {
        if (error?.message?.includes('app.router') || error?.message?.includes('deprecated')) {
          return { stack: [] };
        }
        throw error;
      }
    };
  }
} catch (e) {
  // Ignorar se não conseguir modificar
}

// Abordagem 3: Patch via instância temporária (fallback)
try {
  const tempExpress = require('express');
  const tempApp = tempExpress();
  const proto = Object.getPrototypeOf(tempApp);
  if (proto && !proto.get.toString().includes('router')) {
    const originalGet3 = proto.get;
    proto.get = function(key: string) {
      if (key === 'router') {
        return { stack: [] };
      }
      try {
        return originalGet3.call(this, key);
      } catch (error: any) {
        if (error?.message?.includes('app.router') || error?.message?.includes('deprecated')) {
          return { stack: [] };
        }
        throw error;
      }
    };
  }
} catch (e) {
  // Ignorar se não conseguir modificar
}

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

