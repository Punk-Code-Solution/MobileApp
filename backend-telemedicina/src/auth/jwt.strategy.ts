// src/auth/jwt.strategy.ts
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      // Pega o token do cabeçalho Authorization: Bearer <token>
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // IMPORTANTE: Usar variável de ambiente para segurança
      secretOrKey: process.env.JWT_SECRET || 'SEGREDO_SUPER_SECRETO_DEV_ONLY',
    });
  }

  async validate(payload: any) {
    // Isso anexa o usuário ao objeto Request (req.user)
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}