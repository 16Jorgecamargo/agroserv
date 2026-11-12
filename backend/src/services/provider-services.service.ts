import { Injectable } from '@nestjs/common';
import { CategoriesRepository } from '../repositories/categories.repository.js';
import { conflict, invalidTransition, notFound, validationError } from '../exceptions/app.exception.js';
import { ClockService } from './clock.service.js';
import type { Equipment } from '../entities/equipment.entity.js';
import { EquipmentRepository } from '../repositories/equipment.repository.js';
import { RequestsRepository } from '../repositories/requests.repository.js';
import { UploadRulesService } from './upload-rules.service.js';
import type { CreateServiceDto, UpdateServiceDto } from '../dto/service.dto.js';
import type { Service } from '../entities/service.entity.js';
import { ServiceDetailView, ServiceView, toServiceDetailView, toServiceView } from '../presenters/service.presenter.js';
import { ServicesRepository } from '../repositories/services.repository.js';

const HIDDEN_MESSAGE = 'Anúncio oculto pela administração.';
export const OPEN_REQUESTS_MESSAGE = 'Este serviço tem solicitações em aberto. Pause o anúncio em vez de excluir.';

@Injectable()
export class ProviderServicesService {
  constructor(
    private readonly services: ServicesRepository,
    private readonly categories: CategoriesRepository,
    private readonly equipment: EquipmentRepository,
    private readonly requests: RequestsRepository,
    private readonly uploadRules: UploadRulesService,
    private readonly clock: ClockService,
  ) {}

  async list(providerId: string): Promise<ServiceView[]> {
    // Anúncios do prestador em qualquer status, com o motivo quando ocultos
    const services = await this.services.findByProvider(providerId);
    return services.map((service) => toServiceView(service, true));
  }

  async detail(providerId: string, id: string): Promise<ServiceDetailView> {
    // Detalhe de um anúncio do próprio prestador
    return toServiceDetailView(await this.loadOwn(providerId, id), true);
  }

  async create(providerId: string, dto: CreateServiceDto): Promise<ServiceView> {
    // Confere categoria, fotos e equipamentos antes de publicar
    const equipment = await this.checkLinks(providerId, dto);
    const service = this.services.create({
      providerId,
      title: dto.title,
      categoryId: dto.categoryId,
      description: dto.description,
      price: dto.price,
      priceUnit: dto.priceUnit,
      city: dto.city,
      state: dto.state,
      photos: dto.photos ?? [],
      available: dto.available ?? true,
      status: 'active',
      createdAt: this.clock.nowIso(),
    });
    service.equipment = equipment ?? [];

    // O anúncio vai para a busca na hora, sem aprovação
    return toServiceView(await this.services.save(service), true);
  }

  async update(providerId: string, id: string, dto: UpdateServiceDto): Promise<ServiceView> {
    // Um anúncio oculto pode ser editado, mas continua oculto
    const service = await this.loadOwn(providerId, id);
    const equipment = await this.checkLinks(providerId, dto);
    const { equipmentIds: _equipmentIds, ...fields } = dto;
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) Object.assign(service, { [key]: value });
    }
    if (equipment) service.equipment = equipment;
    return toServiceView(await this.services.save(service), true);
  }

  async pause(providerId: string, id: string): Promise<ServiceView> {
    // Só um anúncio ativo pode ser pausado
    const service = await this.loadOwn(providerId, id);
    if (service.status === 'hidden') throw invalidTransition(HIDDEN_MESSAGE);
    if (service.status !== 'active') throw invalidTransition('Este anúncio já está pausado.');
    return this.changeStatus(service, 'paused');
  }

  async activate(providerId: string, id: string): Promise<ServiceView> {
    // Só um anúncio pausado volta para a busca pelo prestador
    const service = await this.loadOwn(providerId, id);
    if (service.status === 'hidden') throw invalidTransition(HIDDEN_MESSAGE);
    if (service.status !== 'paused') throw invalidTransition('Este anúncio já está ativo.');
    return this.changeStatus(service, 'active');
  }

  async remove(providerId: string, id: string): Promise<void> {
    // Excluir é bloqueado enquanto houver solicitação aberta
    const service = await this.loadOwn(providerId, id);
    await this.softDelete(service);
  }

  async softDelete(service: Service): Promise<void> {
    // Exclusão lógica: some das listas e continua nas solicitações antigas
    if ((await this.requests.countOpenByService(service.id)) > 0) throw conflict(OPEN_REQUESTS_MESSAGE);
    await this.services.update(service.id, { deletedAt: this.clock.nowIso() });
  }

  private async changeStatus(service: Service, status: 'active' | 'paused'): Promise<ServiceView> {
    // Grava o novo status e devolve o anúncio atualizado
    await this.services.update(service.id, { status });
    service.status = status;
    return toServiceView(service, true);
  }

  private async loadOwn(providerId: string, id: string): Promise<Service> {
    // Anúncio de outro prestador ou excluído responde 404
    const service = await this.services.findById(id);
    if (!service || service.providerId !== providerId) {
      throw notFound('service_not_found', 'Serviço não encontrado.');
    }
    return service;
  }

  private async checkLinks(providerId: string, dto: UpdateServiceDto): Promise<Equipment[] | undefined> {
    // A categoria precisa existir e estar ativa
    if (dto.categoryId !== undefined) {
      const category = await this.categories.findById(dto.categoryId);
      if (!category?.active) throw validationError({ categoryId: 'Selecione uma categoria.' });
    }

    // Fotos e equipamentos precisam ser do próprio prestador
    if (dto.photos?.length) await this.uploadRules.assertOwnPublicUrls(providerId, dto.photos, 'photos');
    if (dto.equipmentIds === undefined) return undefined;
    const ids = [...new Set(dto.equipmentIds)];
    const equipment = await this.equipment.findOwnByIds(ids, providerId);
    if (equipment.length !== ids.length) throw validationError({ equipmentIds: 'Equipamento inválido.' });
    return equipment;
  }
}
