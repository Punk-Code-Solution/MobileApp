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
    // 1. Busca o usuário
    const user = await this.usersService.findByEmail(email);
    
    // 2. Verifica se usuário existe e se a senha bate
    if (!user || !(await comparePassword(pass, user.passwordHash))) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // 3. Monta o Payload do Token (o que vai dentro do JWT)
    const payload = { 
      sub: user.id, 
      email: user.email, 
      role: user.role 
    };

    // 4. Retorna o Token assinado
    return {
      access_token: await this.jwtService.signAsync(payload),
      user: { // Opcional: retornar dados básicos do user junto
        id: user.id,
        email: user.email,
        role: user.role
      }
    };
  }
}