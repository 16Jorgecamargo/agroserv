import { Injectable } from '@nestjs/common';
import { ClockService } from '../common/clock.service.js';
import type { NotificationType, Role } from '../common/types.js';
import { UsersRepository } from '../users/users.repository.js';
import { NotificationsRepository } from './notifications.repository.js';

export interface NewNotification {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  link: string;
  groupKey?: string;
}

export function requestLink(role: Role, requestId: string): string {
  // Rota da solicitação no front-end, conforme o papel de quem recebe
  if (role === 'provider') return `/prestador/solicitacoes/${requestId}`;
  return role === 'admin' ? `/admin/solicitacoes/${requestId}` : `/solicitacoes/${requestId}`;
}

export function notificationsLink(role: Role): string {
  // Rota da página de notificações de cada papel
  if (role === 'provider') return '/prestador/notificacoes';
  return role === 'admin' ? '/admin/notificacoes' : '/notificacoes';
}

@Injectable()
export class NotificationsService {
  constructor(
    private readonly notifications: NotificationsRepository,
    private readonly users: UsersRepository,
    private readonly clock: ClockService,
  ) {}

  async notify(data: NewNotification): Promise<void> {
    // Notificações só existem dentro do sistema
    await this.notifications.create({
      userId: data.userId,
      type: data.type,
      title: data.title,
      body: data.body ?? null,
      link: data.link,
      groupKey: data.groupKey ?? null,
      read: false,
      createdAt: this.clock.nowIso(),
    });
  }

  async notifyOnce(data: NewNotification & { groupKey: string }): Promise<void> {
    // Não repete enquanto a anterior do mesmo grupo não for lida
    if (await this.notifications.hasUnreadGroup(data.userId, data.groupKey)) return;
    await this.notify(data);
  }

  async notifyAdmins(data: Omit<NewNotification, 'userId'>): Promise<void> {
    // Envia a mesma notificação a todos os administradores ativos
    const admins = await this.users.findActiveByRole('admin');
    for (const admin of admins) await this.notify({ ...data, userId: admin.id });
  }
}
