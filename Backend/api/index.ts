import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from '../src/app.module';
import { ValidationPipe } from '@nestjs/common';
import { appConfig } from '../src/config/app.config';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import type { IncomingMessage, ServerResponse } from 'http';

let cachedApp: NestFastifyApplication;

async function createApp(): Promise<NestFastifyApplication> {
  if (cachedApp) {
    return cachedApp;
  }

  try {
    const adapter = new FastifyAdapter({
      logger: false,
    });

    const app = await NestFactory.create<NestFastifyApplication>(
      AppModule,
      adapter,
      {
        logger: false,
      },
    );

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
    await app.register(require('@fastify/cors'), {
      origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        if (appConfig.nodeEnv === 'development') {
          callback(null, true);
          return;
        }
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

    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    
    cachedApp = app;
    return app;
  } catch (error) {
    console.error('Error creating NestJS app:', error);
    throw error;
  }
}

// Helper para ler body do request de forma assíncrona
function readBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });
    req.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    req.on('error', reject);
  });
}

// Helper para extrair query parameters da URL
function getQueryParams(url: string): Record<string, string> {
  try {
    const urlObj = new URL(url, 'http://localhost');
    const params: Record<string, string> = {};
    urlObj.searchParams.forEach((value, key) => {
      params[key] = value;
    });
    return params;
  } catch {
    return {};
  }
}

// Handler para Vercel serverless functions
// Vercel passa Node.js Request/Response, convertemos para Fastify
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    // Verificar variáveis de ambiente críticas
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL is not set');
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'Configuration Error',
        message: 'DATABASE_URL environment variable is missing',
      }));
      return;
    }

    const app = await createApp();
    const fastifyInstance = app.getHttpAdapter().getInstance();
    
    // Converter requisição Node.js para Fastify
    const url = req.url || '/';
    const method = (req.method || 'GET') as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD';
    
    // Ler body se existir (apenas para métodos que podem ter body)
    let body: Buffer | undefined;
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      try {
        body = await readBody(req);
      } catch (error) {
        // Se houver erro ao ler body, continuar sem body
        console.warn('Error reading body:', error);
      }
    }
    
    // Preparar headers
    const headers: Record<string, string> = {};
    Object.keys(req.headers).forEach((key) => {
      const value = req.headers[key];
      if (value) {
        headers[key] = Array.isArray(value) ? value.join(', ') : value;
      }
    });
    
    // Extrair path e query separadamente
    const urlObj = new URL(url, 'http://localhost');
    const path = urlObj.pathname;
    const query = getQueryParams(url);
    
    // Processar requisição usando Fastify inject
    // Type assertion para compatibilidade com tipos do Fastify
    type FastifyInjectResponse = {
      statusCode: number;
      headers: Record<string, string | string[]>;
      body: string | Buffer;
      payload: string | Buffer;
    };
    
    const response = await fastifyInstance.inject({
      method: method as any, // Fastify aceita string como método HTTP
      url: path,
      headers,
      payload: body,
      query,
    }) as unknown as FastifyInjectResponse;

    // Preparar headers da resposta
    const responseHeaders: Record<string, string> = {};
    if (response.headers) {
      Object.keys(response.headers).forEach((key) => {
        const value = response.headers[key];
        if (value) {
          responseHeaders[key] = Array.isArray(value) ? value.join(', ') : String(value);
        }
      });
    }

    // Enviar resposta
    // Fastify inject retorna um objeto com statusCode (number) e body/payload (string | Buffer)
    const statusCode = response.statusCode || 200;
    const responseBody = response.body || response.payload || '';
    res.writeHead(statusCode, responseHeaders);
    res.end(typeof responseBody === 'string' ? responseBody : Buffer.from(responseBody));
  } catch (error) {
    console.error('Error in serverless function:', error);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined,
      }));
    }
  }
}
