import { Body, Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { CurrentUser, Roles } from '../decorators/auth.decorators.js';
import type { User } from '../entities/user.entity.js';
import { CancelRequestDto, CreateRequestDto } from '../dto/producer-request.dto.js';
import { ProducerDashboardView, ProducerRequestsService } from '../services/producer-requests.service.js';
import type { RequestDetailView, RequestView } from '../presenters/request.presenter.js';

@Roles('producer')
@Controller()
export class ProducerRequestsController {
  constructor(private readonly requests: ProducerRequestsService) {}

  @Post('requests')
  create(@CurrentUser() user: User, @Body() dto: CreateRequestDto): Promise<RequestDetailView> {
    // Solicita um serviço
    return this.requests.create(user, dto);
  }

  @Get('requests')
  list(@CurrentUser() user: User, @Query('status') status: unknown): Promise<RequestView[]> {
    // Lista as solicitações do produtor
    return this.requests.list(user.id, status);
  }

  @Get('requests/:id')
  detail(@CurrentUser() user: User, @Param('id') id: string): Promise<RequestDetailView> {
    // Detalhe de uma solicitação do produtor
    return this.requests.detail(user, id);
  }

  @Post('requests/:id/cancel')
  @HttpCode(200)
  cancel(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: CancelRequestDto,
  ): Promise<RequestDetailView> {
    // Cancela a solicitação
    return this.requests.cancel(user, id, dto);
  }

  @Post('requests/:id/counter-offer/accept')
  @HttpCode(200)
  acceptCounterOffer(@CurrentUser() user: User, @Param('id') id: string): Promise<RequestDetailView> {
    // Aceita a contraproposta do prestador
    return this.requests.acceptCounterOffer(user, id);
  }

  @Post('requests/:id/counter-offer/decline')
  @HttpCode(200)
  declineCounterOffer(@CurrentUser() user: User, @Param('id') id: string): Promise<RequestDetailView> {
    // Recusa a contraproposta do prestador
    return this.requests.declineCounterOffer(user, id);
  }

  @Get('dashboard')
  dashboard(@CurrentUser() user: User): Promise<ProducerDashboardView> {
    // Painel do produtor
    return this.requests.dashboard(user.id);
  }
}
