import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { PageRequest } from '../common/pagination.js';
import { Notification } from './entities/notification.entity.js';

@Injectable()
export class NotificationsRepository {
  constructor(
    @InjectRepository(Notification) private readonly notifications: Repository<Notification>,
  ) {}

  create(data: Partial<Notification>): Promise<Notification> {
    // Grava uma notificação nova
    return this.notifications.save(this.notifications.create(data));
  }

  findPage(userId: string, unreadOnly: boolean, page: PageRequest): Promise<[Notification[], number]> {
    // Notificações do usuário, mais recentes primeiro
    return this.notifications.findAndCount({
      where: unreadOnly ? { userId, read: false } : { userId },
      order: { createdAt: 'DESC', id: 'DESC' },
      skip: page.skip,
      take: page.pageSize,
    });
  }

  countUnread(userId: string): Promise<number> {
    // Total de não lidas do usuário
    return this.notifications.countBy({ userId, read: false });
  }

  async hasUnreadGroup(userId: string, groupKey: string): Promise<boolean> {
    // Diz se já existe uma notificação não lida do mesmo grupo
    return (await this.notifications.countBy({ userId, groupKey, read: false })) > 0;
  }

  async markRead(id: string, userId: string): Promise<boolean> {
    // Marca uma notificação do usuário como lida
    const result = await this.notifications.update({ id, userId }, { read: true });
    return (result.affected ?? 0) > 0;
  }

  async markAllRead(userId: string): Promise<void> {
    // Marca todas as notificações do usuário como lidas
    await this.notifications.update({ userId, read: false }, { read: true });
  }
}
