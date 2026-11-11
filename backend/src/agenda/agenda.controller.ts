import { Body, Controller, Delete, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { CurrentUser, Public, Roles } from '../common/auth.decorators.js';
import type { User } from '../users/entities/user.entity.js';
import { AgendaService, AgendaView } from './agenda.service.js';
import { BlockDayDto } from './dto/blocked-day.dto.js';

@Controller()
export class AgendaController {
  constructor(private readonly agenda: AgendaService) {}

  @Roles('provider')
  @Get('provider/agenda')
  month(@CurrentUser() user: User, @Query('month') month: unknown): Promise<AgendaView> {
    // Agenda mensal do prestador
    return this.agenda.month(user.id, month);
  }

  @Roles('provider')
  @Post('provider/blocked-days')
  block(@CurrentUser() user: User, @Body() dto: BlockDayDto): Promise<{ date: string }> {
    // Bloqueia um dia para novas solicitações
    return this.agenda.block(user.id, dto.date);
  }

  @Roles('provider')
  @Delete('provider/blocked-days/:date')
  @HttpCode(204)
  unblock(@CurrentUser() user: User, @Param('date') date: string): Promise<void> {
    // Libera um dia bloqueado
    return this.agenda.unblock(user.id, date);
  }

  @Public()
  @Get('services/:id/blocked-days')
  blockedDays(
    @Param('id') id: string,
    @Query() query: Record<string, unknown>,
    @CurrentUser() user?: User,
  ): Promise<string[]> {
    // Dias que o prestador do serviço não atende
    return this.agenda.blockedDaysOfService(id, query, user);
  }
}
