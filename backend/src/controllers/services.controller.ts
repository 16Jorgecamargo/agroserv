import { Controller, Get, Param, Query } from '@nestjs/common';
import { CurrentUser, Public } from '../decorators/auth.decorators.js';
import type { Paginated } from '../utils/pagination.js';
import type { User } from '../entities/user.entity.js';
import { CatalogService } from '../services/catalog.service.js';
import type { ServiceDetailView, ServiceView } from '../presenters/service.presenter.js';

@Public()
@Controller('services')
export class ServicesController {
  constructor(private readonly catalog: CatalogService) {}

  @Get()
  search(@Query() query: Record<string, unknown>): Promise<Paginated<ServiceView>> {
    // Busca pública de serviços
    return this.catalog.search(query);
  }

  @Get('featured')
  featured(@Query() query: Record<string, unknown>): Promise<ServiceView[]> {
    // Serviços em destaque da página inicial
    return this.catalog.featured(query);
  }

  @Get(':id')
  detail(@Param('id') id: string, @CurrentUser() user?: User): Promise<ServiceDetailView> {
    // Detalhe público do serviço
    return this.catalog.detail(id, user);
  }
}
