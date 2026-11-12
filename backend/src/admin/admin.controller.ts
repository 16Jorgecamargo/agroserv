import { Controller, Get, Param, Query } from '@nestjs/common';
import { Roles } from '../common/auth.decorators.js';
import type { Paginated } from '../common/pagination.js';
import { RequestLifecycleService } from '../requests/request-lifecycle.service.js';
import type { RequestDetailView } from '../requests/request.presenter.js';
import { AdminActionsService, AdminActionView } from './admin-actions.service.js';
import { AdminDashboardService, AdminDashboardView } from './admin-dashboard.service.js';

@Roles('admin')
@Controller('admin')
export class AdminController {
  constructor(
    private readonly dashboard: AdminDashboardService,
    private readonly actions: AdminActionsService,
    private readonly lifecycle: RequestLifecycleService,
  ) {}

  @Get('dashboard')
  overview(): Promise<AdminDashboardView> {
    // Painel do administrador
    return this.dashboard.overview();
  }

  @Get('actions')
  history(@Query() query: Record<string, unknown>): Promise<Paginated<AdminActionView>> {
    // Histórico de ações administrativas, somente leitura
    return this.actions.list(query);
  }

  @Get('requests/:id')
  request(@Param('id') id: string): Promise<RequestDetailView> {
    // Detalhe de qualquer solicitação, somente leitura
    return this.lifecycle.detail(id, 'admin');
  }
}
