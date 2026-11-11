import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsRelations, In, Repository } from 'typeorm';
import { OPEN_STATUSES } from '../common/types.js';
import type { RequestStatus } from '../common/types.js';
import { RequestEvent } from './entities/request-event.entity.js';
import { ServiceRequest } from './entities/service-request.entity.js';

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

  findAll(): Promise<ServiceRequest[]> {
    // Todas as solicitações, para os totais do painel administrativo
    return this.requests.find({ relations: { service: { category: true } } });
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
