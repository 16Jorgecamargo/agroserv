import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { CurrentUser, Roles } from '../common/auth.decorators.js';
import type { User } from '../users/entities/user.entity.js';
import { CreateEquipmentDto, UpdateEquipmentDto } from './dto/equipment.dto.js';
import type { EquipmentView } from './equipment.presenter.js';
import { EquipmentService } from './equipment.service.js';

@Roles('provider')
@Controller('provider/equipment')
export class EquipmentController {
  constructor(private readonly equipment: EquipmentService) {}

  @Get()
  list(@CurrentUser() user: User): Promise<EquipmentView[]> {
    // Lista os equipamentos do prestador
    return this.equipment.list(user.id);
  }

  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreateEquipmentDto): Promise<EquipmentView> {
    // Cadastra um equipamento
    return this.equipment.create(user.id, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateEquipmentDto,
  ): Promise<EquipmentView> {
    // Edita um equipamento
    return this.equipment.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentUser() user: User, @Param('id') id: string): Promise<void> {
    // Remove um equipamento
    return this.equipment.remove(user.id, id);
  }
}
