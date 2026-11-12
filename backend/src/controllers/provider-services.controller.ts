import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { CurrentUser, Roles } from '../decorators/auth.decorators.js';
import type { User } from '../entities/user.entity.js';
import { CreateServiceDto, UpdateServiceDto } from '../dto/service.dto.js';
import { ProviderServicesService } from '../services/provider-services.service.js';
import type { ServiceDetailView, ServiceView } from '../presenters/service.presenter.js';

@Roles('provider')
@Controller('provider/services')
export class ProviderServicesController {
  constructor(private readonly services: ProviderServicesService) {}

  @Get()
  list(@CurrentUser() user: User): Promise<ServiceView[]> {
    // Lista os anúncios do prestador
    return this.services.list(user.id);
  }

  @Get(':id')
  detail(@CurrentUser() user: User, @Param('id') id: string): Promise<ServiceDetailView> {
    // Detalhe de um anúncio do prestador
    return this.services.detail(user.id, id);
  }

  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreateServiceDto): Promise<ServiceView> {
    // Publica um anúncio
    return this.services.create(user.id, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateServiceDto,
  ): Promise<ServiceView> {
    // Edita um anúncio
    return this.services.update(user.id, id, dto);
  }

  @Post(':id/pause')
  @HttpCode(200)
  pause(@CurrentUser() user: User, @Param('id') id: string): Promise<ServiceView> {
    // Tira o anúncio da busca
    return this.services.pause(user.id, id);
  }

  @Post(':id/activate')
  @HttpCode(200)
  activate(@CurrentUser() user: User, @Param('id') id: string): Promise<ServiceView> {
    // Devolve o anúncio à busca
    return this.services.activate(user.id, id);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentUser() user: User, @Param('id') id: string): Promise<void> {
    // Exclui o anúncio
    return this.services.remove(user.id, id);
  }
}
