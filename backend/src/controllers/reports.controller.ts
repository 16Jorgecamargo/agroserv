import { Body, Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { CurrentUser, Roles } from '../decorators/auth.decorators.js';
import type { Paginated } from '../utils/pagination.js';
import type { User } from '../entities/user.entity.js';
import { CreateReportDto, ResolveReportDto } from '../dto/report.dto.js';
import { ReportDetailView, ReportsService, ReportView } from '../services/reports.service.js';

@Controller()
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Roles('producer', 'provider')
  @Post('reports')
  create(@CurrentUser() user: User, @Body() dto: CreateReportDto): Promise<ReportView> {
    // Abre uma denúncia
    return this.reports.create(user, dto);
  }

  @Roles('admin')
  @Get('admin/reports')
  list(@Query() query: Record<string, unknown>): Promise<Paginated<ReportView>> {
    // Fila de denúncias do administrador
    return this.reports.list(query);
  }

  @Roles('admin')
  @Get('admin/reports/:id')
  detail(@Param('id') id: string): Promise<ReportDetailView> {
    // Detalhe da denúncia com o alvo atual
    return this.reports.detail(id);
  }

  @Roles('admin')
  @Post('admin/reports/:id/resolve')
  @HttpCode(200)
  resolve(
    @CurrentUser() admin: User,
    @Param('id') id: string,
    @Body() dto: ResolveReportDto,
  ): Promise<ReportView> {
    // Resolve ou arquiva a denúncia
    return this.reports.resolve(admin, id, dto);
  }
}
