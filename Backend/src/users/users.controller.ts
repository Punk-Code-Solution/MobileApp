import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CompletePatientProfileDto } from './dto/complete-patient-profile.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Post('complete-patient-profile')
  @UseGuards(JwtAuthGuard)
  completePatientProfile(
    @CurrentUser() user: CurrentUserPayload,
    @Body() completePatientProfileDto: CompletePatientProfileDto,
  ) {
    return this.usersService.completePatientProfile(user.userId, completePatientProfileDto);
  }

  // Manter os outros métodos padrão ou remover se não for usar agora
}