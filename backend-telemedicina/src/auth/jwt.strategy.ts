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
      // IMPORTANTE: Tem que ser a mesma chave usada no AuthModule
      secretOrKey: 'SEGREDO_SUPER_SECRETO', 
    });
  }

  async validate(payload: any) {
    // Isso anexa o usuário ao objeto Request (req.user)
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}