import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindOptionsRelations, In, Repository } from 'typeorm';
import { OPEN_STATUSES, REQUEST_STATUSES } from '../types/index.js';
import type { RequestStatus } from '../types/index.js';
import { RequestEvent } from '../entities/request-event.entity.js';
import { ServiceRequest } from '../entities/service-request.entity.js';

const DETAIL_RELATIONS: FindOptionsRelations<ServiceRequest> = {
  service: { provider: { providerProfile: true }, category: true, equipment: true },
  property: true,
  producer: true,
  provider: { providerProfile: true },
  events: true,
};

@Injectable()
export class RequestsRepository {
  constructor(
    @InjectRepository(ServiceRequest) private readonly requests: Repository<ServiceRequest>,
    @InjectRepository(RequestEvent) private readonly events: Repository<RequestEvent>,
  ) {}

  findById(id: string): Promise<ServiceRequest | null> {
    // Solicitação com tudo o que o detalhe precisa
    return this.requests.findOne({ where: { id }, relations: DETAIL_RELATIONS });
  }

  findByProducer(producerId: string, status?: RequestStatus): Promise<ServiceRequest[]> {
    // Solicitações do produtor, da data mais recente para a mais antiga
    return this.requests.find({
      where: status ? { producerId, status } : { producerId },
      order: { scheduledDate: 'DESC', createdAt: 'DESC' },
    });
  }

  findByProvider(providerId: string, status?: RequestStatus): Promise<ServiceRequest[]> {
    // Solicitações recebidas pelo prestador, mais novas primeiro
    return this.requests.find({
      where: status ? { providerId, status } : { providerId },
      order: { createdAt: 'DESC' },
    });
  }

  findForAgenda(providerId: string, from: string, to: string): Promise<ServiceRequest[]> {
    // Agendadas, em andamento e concluídas do período, por data
    return this.requests.find({
      where: {
        providerId,
        status: In(['accepted', 'in_progress', 'completed']),
        scheduledDate: Between(from, to),
      },
      order: { scheduledDate: 'ASC', createdAt: 'ASC' },
    });
  }

  findRecentByParticipant(userId: string, limit: number): Promise<ServiceRequest[]> {
    // Últimas solicitações em que a conta é produtor ou prestador
    return this.requests.find({
      where: [{ producerId: userId }, { providerId: userId }],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  findOpenByParticipant(userId: string): Promise<ServiceRequest[]> {
    // Solicitações abertas em que a conta participa
    return this.requests.find({
      where: [
        { producerId: userId, status: In(OPEN_STATUSES) },
        { providerId: userId, status: In(OPEN_STATUSES) },
      ],
    });
  }

  async countByStatus(): Promise<Record<RequestStatus, number>> {
    // Total de solicitações em cada status, com zero onde não houver
    const rows = await this.requests
      .createQueryBuilder('request')
      .select('request.status', 'status')
      .addSelect('COUNT(*)', 'total')
      .groupBy('request.status')
      .getRawMany<{ status: RequestStatus; total: number }>();
    const totals = Object.fromEntries(REQUEST_STATUSES.map((status) => [status, 0])) as Record<RequestStatus, number>;
    for (const row of rows) totals[row.status] = Number(row.total);
    return totals;
  }

  async topCategories(limit: number): Promise<{ categoryId: string; name: string; requests: number }[]> {
    // Categorias com mais solicitações em todas as épocas
    const rows = await this.requests
      .createQueryBuilder('request')
      .innerJoin('request.service', 'service')
      .innerJoin('service.category', 'category')
      .select('category.id', 'categoryId')
      .addSelect('category.name', 'name')
      .addSelect('COUNT(*)', 'requests')
      .groupBy('category.id')
      .addGroupBy('category.name')
      .orderBy('requests', 'DESC')
      .addOrderBy('category.name', 'ASC')
      .limit(limit)
      .getRawMany<{ categoryId: string; name: string; requests: number }>();
    return rows.map((row) => ({ ...row, requests: Number(row.requests) }));
  }

  findEventsByProvider(providerId: string): Promise<RequestEvent[]> {
    // Eventos das solicitações do prestador, em ordem cronológica
    return this.events.find({
      where: { request: { providerId } },
      order: { createdAt: 'ASC' },
    });
  }

  countOpenByProperty(propertyId: string): Promise<number> {
    // Solicitações abertas que usam a propriedade
    return this.requests.countBy({ propertyId, status: In(OPEN_STATUSES) });
  }

  countOpenByService(serviceId: string): Promise<number> {
    // Solicitações abertas do anúncio
    return this.requests.countBy({ serviceId, status: In(OPEN_STATUSES) });
  }

  async hasRelationship(producerId: string, providerId: string): Promise<boolean> {
    // Diz se produtor e prestador têm ou tiveram solicitação entre si
    return (await this.requests.countBy({ producerId, providerId })) > 0;
  }

  create(data: Partial<ServiceRequest>): Promise<ServiceRequest> {
    // Grava uma solicitação nova
    return this.requests.save(this.requests.create(data));
  }

  async update(id: string, changes: Partial<ServiceRequest>): Promise<void> {
    // Aplica as mudanças de uma transição
    await this.requests.update({ id }, changes);
  }

  async addEvent(data: Partial<RequestEvent>): Promise<void> {
    // Registra um evento na linha do tempo
    await this.events.save(this.events.create(data));
  }
}
