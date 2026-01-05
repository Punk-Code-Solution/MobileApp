import { Controller, Get, UseGuards } from '@nestjs/common';
import { ProfessionalsService } from './professionals.service';
import { JwtAuthGuard } from '../common/guards';

@Controller('professionals')
export class ProfessionalsController {
  constructor(private readonly professionalsService: ProfessionalsService) {}

  // Protegendo a rota: Só quem tem Token (está logado) pode ver a lista
  @UseGuards(JwtAuthGuard) 
  @Get()
  findAll() {
    return this.professionalsService.findAll();
  }
}