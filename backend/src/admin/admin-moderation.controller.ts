import { Body, Controller, Delete, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { CurrentUser, Roles } from '../common/auth.decorators.js';
import type { Paginated } from '../common/pagination.js';
import type { VerificationView } from '../providers/verification.service.js';
import type { ServiceView } from '../services/service.presenter.js';
import type { User } from '../users/entities/user.entity.js';
import { AdminServicesService } from './admin-services.service.js';
import { AdminVerificationsService, PendingVerificationView } from './admin-verifications.service.js';
import { ReasonDto } from './dto/admin.dto.js';

@Roles('admin')
@Controller('admin')
export class AdminModerationController {
  constructor(
    private readonly verifications: AdminVerificationsService,
    private readonly services: AdminServicesService,
  ) {}

  @Get('verifications')
  queue(): Promise<PendingVerificationView[]> {
    // Fila de verificações em análise
    return this.verifications.queue();
  }

  @Post('verifications/:providerId/approve')
  @HttpCode(200)
  approve(@CurrentUser() admin: User, @Param('providerId') providerId: string): Promise<VerificationView> {
    // Aprova a verificação do prestador
    return this.verifications.approve(admin, providerId);
  }

  @Post('verifications/:providerId/reject')
  @HttpCode(200)
  reject(
    @CurrentUser() admin: User,
    @Param('providerId') providerId: string,
    @Body() dto: ReasonDto,
  ): Promise<VerificationView> {
    // Rejeita a verificação com motivo
    return this.verifications.reject(admin, providerId, dto.reason);
  }

  @Get('services')
  list(@Query() query: Record<string, unknown>): Promise<Paginated<ServiceView>> {
    // Lista todos os anúncios
    return this.services.list(query);
  }

  @Post('services/:id/hide')
  @HttpCode(200)
  hide(@CurrentUser() admin: User, @Param('id') id: string, @Body() dto: ReasonDto): Promise<ServiceView> {
    // Oculta um anúncio com motivo
    return this.services.hide(admin, id, dto.reason);
  }

  @Post('services/:id/show')
  @HttpCode(200)
  show(@CurrentUser() admin: User, @Param('id') id: string): Promise<ServiceView> {
    // Mostra de novo um anúncio oculto
    return this.services.show(admin, id);
  }

  @Delete('services/:id')
  @HttpCode(204)
  remove(@CurrentUser() admin: User, @Param('id') id: string): Promise<void> {
    // Remove um anúncio
    return this.services.remove(admin, id);
  }
}
