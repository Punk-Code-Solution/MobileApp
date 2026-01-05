/**
 * Estratégia JWT para autenticação
 * Movido de auth/jwt.strategy para common/strategies para melhor organização
 */

import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { jwtConfig } from '../../config/jwt.config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      // Pega o token do cabeçalho Authorization: Bearer <token>
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: jwtConfig.ignoreExpiration,
      secretOrKey: jwtConfig.secret,
    });
  }

  async validate(payload: any) {
    // Isso anexa o usuário ao objeto Request (req.user)
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}

