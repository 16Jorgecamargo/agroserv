import { Injectable } from '@nestjs/common';
import { conflict, invalidTransition, notFound } from '../common/app.exception.js';
import { Paginated, paginate, parsePage } from '../common/pagination.js';
import { searchTerms } from '../common/text.js';
import { SERVICE_STATUSES } from '../common/types.js';
import type { ServiceStatus } from '../common/types.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import type { Service } from '../services/entities/service.entity.js';
import { ProviderServicesService } from '../services/provider-services.service.js';
import { ServiceView, toServiceView } from '../services/service.presenter.js';
import { ServicesRepository } from '../services/services.repository.js';
import type { User } from '../users/entities/user.entity.js';
import { AdminActionsService } from './admin-actions.service.js';

@Injectable()
export class AdminServicesService {
  constructor(
    private readonly services: ServicesRepository,
    private readonly providerServices: ProviderServicesService,
    private readonly notifications: NotificationsService,
    private readonly actions: AdminActionsService,
  ) {}

  async list(query: Record<string, unknown>): Promise<Paginated<ServiceView>> {
    // Todos os anúncios, com busca e filtros por categoria e situação
    const page = parsePage(query, 20, 100);
    const status = SERVICE_STATUSES.includes(query.status as ServiceStatus) ? (query.status as ServiceStatus) : undefined;
    const categorySlug = typeof query.category === 'string' && query.category ? query.category : undefined;
    const [services, total] = await this.services.searchAll({ terms: searchTerms(query.q), categorySlug, status }, page);
    return paginate(services.map((service) => toServiceView(service, true)), total, page);
  }

  async hide(admin: User, id: string, reason: string): Promise<ServiceView> {
    // Guarda o status anterior para poder mostrar de novo
    const service = await this.load(id);
    if (service.status === 'hidden') throw invalidTransition('Este anúncio já está oculto.');
    await this.services.update(id, { status: 'hidden', statusBeforeHidden: service.status, hiddenReason: reason });

    // O prestador recebe o motivo e a ação entra no histórico
    await this.notifications.notify({
      userId: service.providerId,
      type: 'service_hidden',
      title: 'Seu anúncio foi ocultado',
      body: reason,
      link: '/prestador/servicos',
    });
    await this.actions.log(admin, 'hide_service', { type: 'service', id, label: service.title }, reason);
    return toServiceView(await this.load(id), true);
  }

  async show(admin: User, id: string): Promise<ServiceView> {
    // Só volta o que foi ocultado pela administração
    const service = await this.load(id);
    if (service.status !== 'hidden') throw invalidTransition('Este anúncio não está oculto.');
    if (service.hiddenByAccountDeletion) throw conflict('O prestador excluiu a conta.');

    // O anúncio retorna ao status em que estava antes
    const status = service.statusBeforeHidden ?? 'active';
    await this.services.update(id, { status, statusBeforeHidden: null, hiddenReason: null });
    await this.actions.log(admin, 'show_service', { type: 'service', id, label: service.title });
    return toServiceView(await this.load(id), true);
  }

  async remove(admin: User, id: string): Promise<void> {
    // Mesma exclusão lógica do prestador, bloqueada com solicitações abertas
    const service = await this.load(id);
    await this.providerServices.softDelete(service);
    await this.notifications.notify({
      userId: service.providerId,
      type: 'service_hidden',
      title: 'Seu anúncio foi removido pela administração',
      link: '/prestador/servicos',
    });
    await this.actions.log(admin, 'delete_service', { type: 'service', id, label: service.title });
  }

  private async load(id: string): Promise<Service> {
    // Anúncio inexistente ou já excluído responde 404
    const service = await this.services.findById(id);
    if (!service) throw notFound('service_not_found', 'Serviço não encontrado.');
    return service;
  }
}
