import { Injectable } from '@nestjs/common';
import { notFound } from '../exceptions/app.exception.js';
import { isValidDay } from './clock.service.js';
import { Paginated, paginate, parsePage } from '../utils/pagination.js';
import { searchTerms } from '../utils/text.js';
import { PRICE_UNITS } from '../types/index.js';
import type { PriceUnit } from '../types/index.js';
import type { User } from '../entities/user.entity.js';
import type { Service } from '../entities/service.entity.js';
import {
  isServiceVisible, ServiceDetailView, ServiceView, toServiceDetailView, toServiceView,
} from '../presenters/service.presenter.js';
import { ServiceSearch, ServicesRepository } from '../repositories/services.repository.js';

export type Query = Record<string, unknown>;

const SORTS = ['relevance', 'price_asc', 'price_desc', 'rating'] as const;
type Sort = (typeof SORTS)[number];

@Injectable()
export class CatalogService {
  constructor(private readonly services: ServicesRepository) {}

  async search(query: Query): Promise<Paginated<ServiceView>> {
    // Lê os filtros da query string e delega a busca ao banco
    const page = parsePage(query, 9, 60);
    const filters: ServiceSearch = {
      terms: searchTerms(query.q),
      locationTerms: searchTerms(query.location),
      categorySlug: typeof query.category === 'string' && query.category ? query.category : undefined,
      ...this.advancedFilters(query),
    };
    const [services, total] = await this.services.search(filters, page);
    return paginate(services.map((service) => toServiceView(service)), total, page);
  }

  private advancedFilters(query: Query): Partial<ServiceSearch> {
    // Valores inválidos nos filtros avançados são ignorados, sem erro
    const number = (value: unknown, min: number, max = Infinity) => {
      const parsed = typeof value === 'string' && value.trim() !== '' ? Number(value) : NaN;
      return Number.isFinite(parsed) && parsed >= min && parsed <= max ? parsed : undefined;
    };
    const priceUnit = PRICE_UNITS.includes(query.priceUnit as PriceUnit) ? (query.priceUnit as PriceUnit) : undefined;
    const sort = SORTS.includes(query.sort as Sort) ? (query.sort as Sort) : undefined;

    // A faixa de preço só vale junto com a unidade de cobrança
    return {
      priceUnit,
      minPrice: priceUnit ? number(query.minPrice, 0) : undefined,
      maxPrice: priceUnit ? number(query.maxPrice, 0) : undefined,
      minRating: number(query.minRating, 1, 5),
      verifiedOnly: query.verified === 'true',
      availableOn: isValidDay(query.date) ? query.date : undefined,
      sort,
    };
  }

  async featured(query: Query): Promise<ServiceView[]> {
    // Limite padrão 4, máximo 12
    const requested = Number(query.limit);
    const limit = Number.isInteger(requested) && requested >= 1 ? Math.min(requested, 12) : 4;
    const services = await this.services.findFeatured(limit);
    return services.map((service) => toServiceView(service));
  }

  async detail(id: string, viewer?: User): Promise<ServiceDetailView> {
    // O dono e o administrador veem o anúncio em qualquer status
    const service = await this.findForViewer(id, viewer);
    const privileged = this.isPrivileged(service, viewer);
    return toServiceDetailView(service, privileged);
  }

  async findForViewer(id: string, viewer?: User): Promise<Service> {
    // Anúncio inexistente ou fora do catálogo responde 404
    const service = await this.services.findById(id);
    if (!service || (!isServiceVisible(service) && !this.isPrivileged(service, viewer))) {
      throw notFound('service_not_found', 'Serviço não encontrado.');
    }
    return service;
  }

  async findVisible(id: string): Promise<Service> {
    // Usado onde só valem anúncios visíveis no catálogo
    const service = await this.services.findById(id);
    if (!service || !isServiceVisible(service)) throw notFound('service_not_found', 'Serviço não encontrado.');
    return service;
  }

  private isPrivileged(service: Service, viewer?: User): boolean {
    // Dono do anúncio ou administrador
    return viewer?.role === 'admin' || viewer?.id === service.providerId;
  }
}
