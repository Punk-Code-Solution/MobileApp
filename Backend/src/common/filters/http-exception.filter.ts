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

    // Logar erro para debug
    console.log('[HTTP-EXCEPTION-FILTER] ===== ERRO CAPTURADO =====');
    console.log('[HTTP-EXCEPTION-FILTER] Status:', status);
    console.log('[HTTP-EXCEPTION-FILTER] Path:', request.url || '/');
    console.log('[HTTP-EXCEPTION-FILTER] Method:', request.method);
    console.log('[HTTP-EXCEPTION-FILTER] Message type:', typeof message);
    console.log('[HTTP-EXCEPTION-FILTER] Message:', JSON.stringify(message, null, 2));
    
    if (request.body) {
      console.log('[HTTP-EXCEPTION-FILTER] Request body:', JSON.stringify(request.body, null, 2));
    }

    // Tratar mensagens de validação (array de erros do class-validator)
    let formattedMessage: string | string[] = typeof message === 'string' 
      ? message 
      : (message as any).message || message;
    
    // Se for array (erros de validação), formatar melhor
    if (Array.isArray(formattedMessage)) {
      console.log('[HTTP-EXCEPTION-FILTER] Mensagem é array com', formattedMessage.length, 'itens');
      formattedMessage = formattedMessage.map((err: any, index: number) => {
        console.log(`[HTTP-EXCEPTION-FILTER] Erro ${index}:`, JSON.stringify(err, null, 2));
        if (typeof err === 'string') return err;
        if (err?.constraints) {
          // Extrair mensagens de constraints
          const constraints = Object.values(err.constraints || {});
          console.log(`[HTTP-EXCEPTION-FILTER] Constraints do erro ${index}:`, constraints);
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

    console.log('[HTTP-EXCEPTION-FILTER] Resposta de erro:', JSON.stringify(errorResponse, null, 2));
    console.log('[HTTP-EXCEPTION-FILTER] ===== FIM ERRO =====');

    response.status(status).send(errorResponse);
  }
}

