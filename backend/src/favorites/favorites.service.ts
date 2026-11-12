import { Injectable } from '@nestjs/common';
import { ClockService } from '../common/clock.service.js';
import { CatalogService } from '../services/catalog.service.js';
import type { Service } from '../services/entities/service.entity.js';
import { isServiceVisible, ServiceView, toServiceView } from '../services/service.presenter.js';
import { ServicesRepository } from '../services/services.repository.js';
import { FavoritesRepository } from './favorites.repository.js';

@Injectable()
export class FavoritesService {
  constructor(
    private readonly favorites: FavoritesRepository,
    private readonly services: ServicesRepository,
    private readonly catalog: CatalogService,
    private readonly clock: ClockService,
  ) {}

  async list(producerId: string): Promise<ServiceView[]> {
    const favorites = await this.favorites.findByProducer(producerId);
    const services: Service[] = [];
    for (const favorite of favorites) {
      const service = await this.services.findById(favorite.serviceId);
      if (service && isServiceVisible(service)) services.push(service);
    }
    return services.map((service) => toServiceView(service));
  }

  async add(producerId: string, serviceId: string): Promise<ServiceView> {
    const service = await this.catalog.findVisible(serviceId);
    await this.favorites.add(producerId, service.id, this.clock.nowIso());
    return toServiceView(service);
  }

  async remove(producerId: string, serviceId: string): Promise<void> {
    await this.favorites.remove(producerId, serviceId);
  }
}
