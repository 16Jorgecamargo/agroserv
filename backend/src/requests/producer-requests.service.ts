import { Injectable } from '@nestjs/common';
import { BlockedDaysRepository } from '../agenda/blocked-days.repository.js';
import { AppException, validationError } from '../common/app.exception.js';
import { ClockService } from '../common/clock.service.js';
import { roundMoney } from '../common/text.js';
import { NotificationsService, requestLink } from '../notifications/notifications.service.js';
import { PropertiesRepository } from '../properties/properties.repository.js';
import { CatalogService } from '../services/catalog.service.js';
import type { User } from '../users/entities/user.entity.js';
import {
  CANCEL_MESSAGE, DATE_MESSAGE,
} from './dto/producer-request.dto.js';
import type { CancelRequestDto, CreateRequestDto } from './dto/producer-request.dto.js';
import { actorOf, RequestLifecycleService } from './request-lifecycle.service.js';
import { parseStatusFilter } from './request-status.js';
import { RequestDetailView, RequestView, toRequestView } from './request.presenter.js';
import { RequestsRepository } from './requests.repository.js';

export interface ProducerDashboardView {
  stats: { open: number; inProgress: number; completed: number; totalSpent: number };
  recentRequests: RequestView[];
}

@Injectable()
export class ProducerRequestsService {
  constructor(
    private readonly requests: RequestsRepository,
    private readonly lifecycle: RequestLifecycleService,
    private readonly catalog: CatalogService,
    private readonly properties: PropertiesRepository,
    private readonly blockedDays: BlockedDaysRepository,
    private readonly notifications: NotificationsService,
    private readonly clock: ClockService,
  ) {}

  async create(producer: User, dto: CreateRequestDto): Promise<RequestDetailView> {
    // O serviço precisa estar visível no catálogo
    const service = await this.catalog.findVisible(dto.serviceId);

    // Propriedade própria, quantidade positiva e data livre a partir de hoje
    const property = await this.properties.findOwn(dto.propertyId, producer.id);
    if (!property) throw validationError({ propertyId: 'Selecione uma propriedade.' });
    if (dto.quantity <= 0) throw validationError({ quantity: 'Informe a quantidade.' });
    if (dto.scheduledDate < this.clock.today()) throw validationError({ scheduledDate: DATE_MESSAGE });
    if (await this.blockedDays.isBlocked(service.providerId, dto.scheduledDate)) {
      throw validationError({ scheduledDate: 'O prestador não atende nesta data.' });
    }

    // Anúncio visível, mas fechado para novas solicitações
    if (!service.available) {
      const message = 'Este serviço não está disponível para novas solicitações.';
      throw new AppException(409, 'service_unavailable', message);
    }

    // Guarda cópias de título, nomes e local do momento da criação
    const now = this.clock.nowIso();
    const request = await this.requests.create({
      serviceId: service.id,
      serviceTitle: service.title,
      providerId: service.providerId,
      providerName: service.provider!.name,
      producerId: producer.id,
      producerName: producer.name,
      propertyId: property.id,
      location: `${property.name}, ${property.city} - ${property.state}`,
      scheduledDate: dto.scheduledDate,
      quantity: dto.quantity,
      priceUnit: service.priceUnit,
      value: roundMoney(service.price * dto.quantity),
      notes: dto.notes || null,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    });

    // Evento de criação e aviso ao prestador
    const actor = actorOf(producer);
    await this.requests.addEvent({
      requestId: request.id, type: 'created', actorId: actor.id, actorRole: actor.role, actorName: actor.name, createdAt: now,
    });
    await this.notifications.notify({
      userId: service.providerId,
      type: 'request_created',
      title: `Nova solicitação: ${service.title}`,
      link: requestLink('provider', request.id),
    });
    return this.lifecycle.detail(request.id, 'producer');
  }

  async list(producerId: string, status: unknown): Promise<RequestView[]> {
    // Solicitações do produtor, com filtro opcional por status
    const requests = await this.requests.findByProducer(producerId, parseStatusFilter(status));
    return requests.map(toRequestView);
  }

  async detail(producer: User, id: string): Promise<RequestDetailView> {
    // Só o dono da solicitação abre o detalhe
    await this.lifecycle.load(id, { role: 'producer', id: producer.id });
    return this.lifecycle.detail(id, 'producer');
  }

  async cancel(producer: User, id: string, dto: CancelRequestDto): Promise<RequestDetailView> {
    // Cancelar uma solicitação já agendada exige o motivo
    const request = await this.lifecycle.load(id, { role: 'producer', id: producer.id });
    if (request.status === 'accepted' && !dto.reason) throw validationError({ reason: CANCEL_MESSAGE });
    await this.lifecycle.transition(request, 'producer_cancel', actorOf(producer), {
      changes: { cancelledBy: 'producer', cancelReason: dto.reason ?? null },
      note: dto.reason,
    });
    return this.lifecycle.detail(id, 'producer');
  }

  async acceptCounterOffer(producer: User, id: string): Promise<RequestDetailView> {
    // A data e o valor propostos passam a valer; os anteriores ficam no evento
    const request = await this.lifecycle.load(id, { role: 'producer', id: producer.id });
    await this.lifecycle.transition(request, 'accept_counter_offer', actorOf(producer), {
      changes: {
        scheduledDate: request.counterDate ?? request.scheduledDate,
        value: request.counterValue ?? request.value,
      },
      event: { previousDate: request.scheduledDate, previousValue: request.value },
    });
    return this.lifecycle.detail(id, 'producer');
  }

  async declineCounterOffer(producer: User, id: string): Promise<RequestDetailView> {
    // Recusar a contraproposta encerra a solicitação
    const request = await this.lifecycle.load(id, { role: 'producer', id: producer.id });
    const reason = 'Contraproposta recusada pelo produtor';
    await this.lifecycle.transition(request, 'decline_counter_offer', actorOf(producer), {
      changes: { cancelledBy: 'producer', cancelReason: reason },
    });
    return this.lifecycle.detail(id, 'producer');
  }

  async dashboard(producerId: string): Promise<ProducerDashboardView> {
    // Totais do painel do produtor (valores são estimativas)
    const requests = await this.requests.findByProducer(producerId);
    const count = (...statuses: string[]) => requests.filter((item) => statuses.includes(item.status)).length;
    const contracted = requests.filter((item) => ['accepted', 'in_progress', 'completed'].includes(item.status));
    const stats = {
      open: count('pending', 'counter_offer', 'accepted'),
      inProgress: count('in_progress'),
      completed: count('completed'),
      totalSpent: roundMoney(contracted.reduce((sum, item) => sum + item.value, 0)),
    };
    return { stats, recentRequests: requests.slice(0, 5).map(toRequestView) };
  }
}
