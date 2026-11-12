import { Injectable } from '@nestjs/common';
import { notFound } from '../common/app.exception.js';
import { Paginated, paginate, parsePage } from '../common/pagination.js';
import type { NotificationType } from '../common/types.js';
import type { Notification } from './entities/notification.entity.js';
import { NotificationsRepository } from './notifications.repository.js';

export interface NotificationView {
  id: string;
  type: NotificationType;
  title: string;
  body?: string;
  link: string;
  read: boolean;
  createdAt: string;
}

export type NotificationPage = Paginated<NotificationView> & { unreadCount: number };

function toNotificationView(notification: Notification): NotificationView {
  // Converte a entidade no tipo Notification do contrato
  const { id, type, title, body, link, read, createdAt } = notification;
  return { id, type, title, ...(body ? { body } : {}), link, read, createdAt };
}

@Injectable()
export class NotificationsInboxService {
  constructor(private readonly notifications: NotificationsRepository) {}

  async list(userId: string, query: Record<string, unknown>): Promise<NotificationPage> {
    // Página de notificações com o contador de não lidas do sino
    const page = parsePage(query, 20, 50);
    const unreadOnly = query.unreadOnly === 'true';
    const [items, total] = await this.notifications.findPage(userId, unreadOnly, page);
    const unreadCount = await this.notifications.countUnread(userId);
    return { ...paginate(items.map(toNotificationView), total, page), unreadCount };
  }

  async markRead(userId: string, id: string): Promise<void> {
    // Notificação de outro usuário responde 404
    const found = await this.notifications.markRead(id, userId);
    if (!found) throw notFound('notification_not_found', 'Notificação não encontrada.');
  }

  async markAllRead(userId: string): Promise<void> {
    // Marca tudo como lido
    await this.notifications.markAllRead(userId);
  }
}
