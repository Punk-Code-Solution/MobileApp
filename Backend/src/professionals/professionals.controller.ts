import { Controller, Get, UseGuards, Param, NotFoundException } from '@nestjs/common';
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

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const professional = await this.professionalsService.findOne(id);
    if (!professional) {
      throw new NotFoundException('Profissional não encontrado');
    }
    return professional;
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/reviews')
  async getReviews(@Param('id') id: string) {
    return this.professionalsService.getReviews(id);
  }
}