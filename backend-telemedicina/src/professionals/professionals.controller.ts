import { Controller, Get, UseGuards } from '@nestjs/common';
import { ProfessionalsService } from './professionals.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('professionals')
export class ProfessionalsController {
  constructor(private readonly professionalsService: ProfessionalsService) {}

  // Protegendo a rota: Só quem tem Token (está logado) pode ver a lista
  @UseGuards(AuthGuard('jwt')) 
  @Get()
  findAll() {
    return this.professionalsService.findAll();
  }
}