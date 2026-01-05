/**
 * Filtro global de exceções HTTP
 * Formata erros de forma consistente para o cliente
 */

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    // Ignorar erros relacionados a app.router deprecated
    if (exception instanceof Error) {
      const errorMessage = exception.message || '';
      if (errorMessage.includes('app.router') || errorMessage.includes('deprecated')) {
        // Retornar uma resposta vazia ou genérica para evitar expor o erro
        return response.status(HttpStatus.OK).json({});
      }
    }

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: typeof message === 'string' ? message : (message as any).message || message,
    };

    response.status(status).json(errorResponse);
  }
}

