import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { CurrentUser, Roles } from '../decorators/auth.decorators.js';
import type { User } from '../entities/user.entity.js';
import { CreatePropertyDto, UpdatePropertyDto } from '../dto/property.dto.js';
import { PropertiesService } from '../services/properties.service.js';
import type { PropertyView } from '../presenters/property.presenter.js';

@Roles('producer')
@Controller('me/properties')
export class PropertiesController {
  constructor(private readonly properties: PropertiesService) {}

  @Get()
  list(@CurrentUser() user: User): Promise<PropertyView[]> {
    // Lista as propriedades do produtor
    return this.properties.list(user.id);
  }

  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreatePropertyDto): Promise<PropertyView> {
    // Cadastra uma propriedade
    return this.properties.create(user.id, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdatePropertyDto,
  ): Promise<PropertyView> {
    // Edita uma propriedade
    return this.properties.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentUser() user: User, @Param('id') id: string): Promise<void> {
    // Remove uma propriedade
    return this.properties.remove(user.id, id);
  }
}
