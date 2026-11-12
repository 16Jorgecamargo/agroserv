import { Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../decorators/auth.decorators.js';
import type { User } from '../entities/user.entity.js';
import { NotificationPage, NotificationsInboxService } from '../services/notifications-inbox.service.js';

@Controller('me/notifications')
export class NotificationsController {
  constructor(private readonly inbox: NotificationsInboxService) {}

  @Get()
  list(@CurrentUser() user: User, @Query() query: Record<string, unknown>): Promise<NotificationPage> {
    // Lista as notificações do usuário
    return this.inbox.list(user.id, query);
  }

  @Post('read-all')
  @HttpCode(204)
  markAllRead(@CurrentUser() user: User): Promise<void> {
    // Marca todas como lidas
    return this.inbox.markAllRead(user.id);
  }

  @Post(':id/read')
  @HttpCode(204)
  markRead(@CurrentUser() user: User, @Param('id') id: string): Promise<void> {
    // Marca uma notificação como lida
    return this.inbox.markRead(user.id, id);
  }
}
