import { Injectable } from '@nestjs/common';
import { conflict, notFound, validationError } from '../exceptions/app.exception.js';
import { ClockService } from './clock.service.js';
import { defined } from '../utils/objects.js';
import { RequestsRepository } from '../repositories/requests.repository.js';
import type { CreatePropertyDto, UpdatePropertyDto } from '../dto/property.dto.js';
import type { Property } from '../entities/property.entity.js';
import { PropertiesRepository } from '../repositories/properties.repository.js';
import { PropertyView, toPropertyView } from '../presenters/property.presenter.js';

@Injectable()
export class PropertiesService {
  constructor(
    private readonly properties: PropertiesRepository,
    private readonly requests: RequestsRepository,
    private readonly clock: ClockService,
  ) {}

  async list(producerId: string): Promise<PropertyView[]> {
    // Propriedades do produtor autenticado
    const properties = await this.properties.findByProducer(producerId);
    return properties.map(toPropertyView);
  }

  async create(producerId: string, dto: CreatePropertyDto): Promise<PropertyView> {
    // A área precisa ser maior que zero
    this.assertArea(dto.areaHectares);
    const property = await this.properties.create({
      producerId,
      name: dto.name,
      city: dto.city,
      state: dto.state,
      accessNotes: dto.accessNotes ?? '',
      areaHectares: dto.areaHectares,
      crops: dto.crops ?? [],
      createdAt: this.clock.nowIso(),
    });
    return toPropertyView(property);
  }

  async update(producerId: string, id: string, dto: UpdatePropertyDto): Promise<PropertyView> {
    // Só o dono edita; as solicitações antigas guardam a cópia do local
    const property = await this.loadOwn(producerId, id);
    this.assertArea(dto.areaHectares);
    return toPropertyView(await this.properties.update(property.id, defined(dto)));
  }

  async remove(producerId: string, id: string): Promise<void> {
    // Propriedade com solicitação aberta não pode ser removida
    const property = await this.loadOwn(producerId, id);
    if ((await this.requests.countOpenByProperty(property.id)) > 0) {
      throw conflict('Esta propriedade tem solicitações em aberto.');
    }

    // Exclusão lógica: some das listas e continua nas solicitações antigas
    await this.properties.update(property.id, { deletedAt: this.clock.nowIso() });
  }

  private assertArea(area: number | undefined): void {
    // Área zerada ou negativa é erro de formulário
    if (area !== undefined && area <= 0) throw validationError({ areaHectares: 'Informe a área em hectares.' });
  }

  private async loadOwn(producerId: string, id: string): Promise<Property> {
    // Propriedade de outro produtor responde 404
    const property = await this.properties.findOwn(id, producerId);
    if (!property) throw notFound('property_not_found', 'Propriedade não encontrada.');
    return property;
  }
}
