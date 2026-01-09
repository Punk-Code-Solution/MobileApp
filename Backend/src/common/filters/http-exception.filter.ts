/**
 * Filtro global de exceções HTTP
 * Compatível com FastifyAdapter
 * Formata erros de forma consistente para o cliente
 */

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FastifyReply } from 'fastify';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    // Lista de paths que devem ser ignorados nos logs (requisições comuns do navegador)
    const ignoredPaths = ['/favicon.ico', '/robots.txt', '/apple-touch-icon.png', '/favicon-32x32.png', '/favicon-16x16.png'];
    const shouldLog = !ignoredPaths.includes(request.url || '/') || status >= 500;

    // Tratar mensagens de validação (array de erros do class-validator)
    let formattedMessage: string | string[] = typeof message === 'string' 
      ? message 
      : (message as any).message || message;
    
    // Se for array (erros de validação), formatar melhor
    if (Array.isArray(formattedMessage)) {
      formattedMessage = formattedMessage.map((err: any) => {
        if (typeof err === 'string') return err;
        if (err?.constraints) {
          const constraints = Object.values(err.constraints || {});
          return constraints.join(', ');
        }
        return JSON.stringify(err);
      });
    }

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url || '/',
      message: formattedMessage,
    };

    // Logar apenas erros críticos (500+)
    if (shouldLog && status >= 500) {
      console.error(`[HTTP-EXCEPTION] ${request.method} ${request.url} - Status: ${status}`, formattedMessage);
    }

    response.status(status).send(errorResponse);
  }
}

