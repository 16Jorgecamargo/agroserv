import { Body, Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { CurrentUser, Roles } from '../decorators/auth.decorators.js';
import type { User } from '../entities/user.entity.js';
import { CounterOfferDto, ProviderCancelDto, RejectRequestDto } from '../dto/provider-request.dto.js';
import { ProviderDashboardView, ProviderRequestsService } from '../services/provider-requests.service.js';
import type { RequestDetailView, RequestView } from '../presenters/request.presenter.js';

@Roles('provider')
@Controller('provider')
export class ProviderRequestsController {
  constructor(private readonly requests: ProviderRequestsService) {}

  @Get('dashboard')
  dashboard(@CurrentUser() user: User): Promise<ProviderDashboardView> {
    // Painel do prestador
    return this.requests.dashboard(user.id);
  }

  @Get('requests')
  list(@CurrentUser() user: User, @Query('status') status: unknown): Promise<RequestView[]> {
    // Lista as solicitações recebidas
    return this.requests.list(user.id, status);
  }

  @Get('requests/:id')
  detail(@CurrentUser() user: User, @Param('id') id: string): Promise<RequestDetailView> {
    // Detalhe de uma solicitação recebida
    return this.requests.detail(user, id);
  }

  @Post('requests/:id/accept')
  @HttpCode(200)
  accept(@CurrentUser() user: User, @Param('id') id: string): Promise<RequestDetailView> {
    // Aceita a solicitação
    return this.requests.accept(user, id);
  }

  @Post('requests/:id/reject')
  @HttpCode(200)
  reject(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: RejectRequestDto,
  ): Promise<RequestDetailView> {
    // Recusa a solicitação com motivo
    return this.requests.reject(user, id, dto);
  }

  @Post('requests/:id/counter-offer')
  @HttpCode(200)
  counterOffer(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: CounterOfferDto,
  ): Promise<RequestDetailView> {
    // Propõe nova data e/ou novo valor
    return this.requests.counterOffer(user, id, dto);
  }

  @Post('requests/:id/start')
  @HttpCode(200)
  start(@CurrentUser() user: User, @Param('id') id: string): Promise<RequestDetailView> {
    // Inicia o serviço
    return this.requests.start(user, id);
  }

  @Post('requests/:id/complete')
  @HttpCode(200)
  complete(@CurrentUser() user: User, @Param('id') id: string): Promise<RequestDetailView> {
    // Conclui o serviço
    return this.requests.complete(user, id);
  }

  @Post('requests/:id/cancel')
  @HttpCode(200)
  cancel(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: ProviderCancelDto,
  ): Promise<RequestDetailView> {
    // Cancela uma solicitação agendada
    return this.requests.cancel(user, id, dto);
  }
}
