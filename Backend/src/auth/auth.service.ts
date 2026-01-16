import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { comparePassword } from '../utils/hash.util';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signIn(email: string, pass: string) {
    // 1. Normalizar email para lowercase (evita problemas de case sensitivity)
    const normalizedEmail = email.toLowerCase().trim();
    
    // 2. Busca o usuário com relacionamentos
    const user = await this.usersService.findByEmailWithRelations(normalizedEmail);
    
    // 3. Verifica se usuário existe e se a senha bate
    if (!user || !(await comparePassword(pass, user.passwordHash))) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // 4. Verificar se o usuário está ativo (CRÍTICO para produção)
    if (!user.isActive) {
      throw new UnauthorizedException('Sua conta foi desativada. Entre em contato com o suporte.');
    }

    // 5. Verificar se paciente tem perfil completo
    let hasCompleteProfile = true;
    if (user.role === 'PATIENT') {
      hasCompleteProfile = !!user.patient;
    } else if (user.role === 'PROFESSIONAL') {
      hasCompleteProfile = !!user.professional;
    }

    // 6. Monta o Payload do Token (o que vai dentro do JWT)
    const payload = { 
      sub: user.id, 
      email: user.email, 
      role: user.role 
    };

    // 7. Retorna o Token assinado
    return {
      access_token: await this.jwtService.signAsync(payload),
      user: { // Opcional: retornar dados básicos do user junto
        id: user.id,
        email: user.email,
        role: user.role,
        hasCompleteProfile, // Indica se o perfil está completo
      }
    };
  }
}