import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto, UserRole } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { hashPassword } from '../utils/hash.util';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    // 1. Verificar se email já existe
    const userExists = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (userExists) {
      throw new BadRequestException('Email already in use');
    }

    // 2. Criptografar a senha
    const passwordHash = await hashPassword(createUserDto.password);

    // 3. Transação: Cria User + Perfil Específico
    return await this.prisma.$transaction(async (tx) => {
      // Cria o usuário base
      const user = await tx.user.create({
        data: {
          email: createUserDto.email,
          passwordHash: passwordHash,
          role: createUserDto.role as any, // Cast para o Enum do Prisma
        },
      });

      // Lógica para PACIENTE
      if (createUserDto.role === UserRole.PATIENT) {
        if (!createUserDto.cpf || !createUserDto.birthDate) {
          throw new BadRequestException('CPF and BirthDate are required for Patients');
        }
        await tx.patient.create({
          data: {
            userId: user.id,
            fullName: createUserDto.fullName,
            phone: createUserDto.phone,
            cpf: createUserDto.cpf,
            birthDate: new Date(createUserDto.birthDate), // Converte string para Date
          },
        });
      }

      // Lógica para PROFISSIONAL
      else if (createUserDto.role === UserRole.PROFESSIONAL) {
        if (!createUserDto.licenseNumber || !createUserDto.price) {
          throw new BadRequestException('License (CRM) and Price are required for Professionals');
        }
        await tx.professional.create({
          data: {
            userId: user.id,
            fullName: createUserDto.fullName,
            licenseNumber: createUserDto.licenseNumber,
            price: createUserDto.price,
            // Outros campos opcionais podem ser adicionados aqui
          },
        });
      }

      // Retorna o usuário criado (sem a senha, por segurança)
      const { passwordHash: _, ...result } = user;
      return result;
    });
  }

  findAll() {
    return this.prisma.user.findMany({
      include: {
        patient: true,
        professional: true,
      },
    });
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }

  // Adicione isso dentro da classe UsersService
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

}