import { Injectable } from '@nestjs/common';
import { conflict, notFound } from '../common/app.exception.js';
import { ClockService } from '../common/clock.service.js';
import type { Role } from '../common/types.js';
import { NotificationsService, requestLink } from '../notifications/notifications.service.js';
import { ReportsRepository } from '../reports/reports.repository.js';
import type { ServiceRequest } from '../requests/entities/service-request.entity.js';
import { isOpen } from '../requests/request-lifecycle.js';
import { RequestsRepository } from '../requests/requests.repository.js';
import type { User } from '../users/entities/user.entity.js';
import type { CreateMessageDto } from './dto/message.dto.js';
import type { Message } from './entities/message.entity.js';
import { MessagesRepository } from './messages.repository.js';

export interface MessageView {
  id: string;
  requestId: string;
  senderId: string;
  senderName: string;
  senderRole: Role;
  text: string;
  createdAt: string;
}

export function toMessageView(message: Message): MessageView {
  // Converte a entidade no tipo Message do contrato
  const { id, requestId, senderId, senderName, senderRole, text, createdAt } = message;
  return { id, requestId, senderId, senderName, senderRole, text, createdAt };
}

@Injectable()
export class MessagesService {
  constructor(
    private readonly messages: MessagesRepository,
    private readonly requests: RequestsRepository,
    private readonly reports: ReportsRepository,
    private readonly notifications: NotificationsService,
    private readonly clock: ClockService,
  ) {}

  async list(user: User, requestId: string): Promise<MessageView[]> {
    // Participantes leem sempre; o administrador só quando há denúncia sobre a solicitação
    const request = await this.requests.findById(requestId);
    const participant = request && [request.producerId, request.providerId].includes(user.id);
    const reported = user.role === 'admin' && (await this.reports.existsForTarget('request', requestId));
    if (!request || (!participant && !reported)) throw this.missing();
    const messages = await this.messages.findByRequest(requestId);
    return messages.map(toMessageView);
  }

  async listForAdmin(requestId: string): Promise<MessageView[]> {
    // Usado no detalhe da denúncia, que já conferiu o acesso
    const messages = await this.messages.findByRequest(requestId);
    return messages.map(toMessageView);
  }

  async send(user: User, requestId: string, dto: CreateMessageDto): Promise<MessageView> {
    // Só produtor e prestador da solicitação escrevem, e só com ela aberta
    const request = await this.requests.findById(requestId);
    if (!request || ![request.producerId, request.providerId].includes(user.id)) throw this.missing();
    if (!isOpen(request.status)) throw conflict('Esta conversa está encerrada.');
    const message = await this.messages.create({
      requestId,
      senderId: user.id,
      senderName: user.name,
      senderRole: user.role,
      text: dto.text,
      createdAt: this.clock.nowIso(),
    });

    // Avisa a outra parte, sem repetir enquanto o aviso anterior não foi lido
    await this.notifyOtherParty(request, user);
    return toMessageView(message);
  }

  private async notifyOtherParty(request: ServiceRequest, sender: User): Promise<void> {
    // O link depende do papel de quem recebe
    const toProvider = sender.id === request.producerId;
    await this.notifications.notifyOnce({
      userId: toProvider ? request.providerId : request.producerId,
      type: 'message',
      title: `Nova mensagem de ${sender.name}`,
      link: requestLink(toProvider ? 'provider' : 'producer', request.id),
      groupKey: `message:${request.id}:${sender.id}`,
    });
  }

  private missing() {
    // Quem não participa não descobre que a solicitação existe
    return notFound('request_not_found', 'Solicitação não encontrada.');
  }
}
