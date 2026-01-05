/**
 * Decorator para obter o usuário atual da requisição
 * Movido de auth/decorators para common/decorators para reutilização
 */

import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentUserPayload {
  userId: string;
  email: string;
  role: string;
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): CurrentUserPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user; // Retorna o objeto user anexado pelo JwtStrategy
  },
);

