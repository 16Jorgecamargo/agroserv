import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { defined } from '../common/objects.js';
import type { PageRequest } from '../common/pagination.js';
import { normalizeText } from '../common/text.js';
import type { PriceUnit, ServiceStatus } from '../common/types.js';
import { Service } from './entities/service.entity.js';

export interface ServiceSearch {
  terms: string[];
  locationTerms: string[];
  categorySlug?: string;
  priceUnit?: PriceUnit;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  verifiedOnly?: boolean;
  availableOn?: string;
  sort?: 'relevance' | 'price_asc' | 'price_desc' | 'rating';
}

export interface AdminServiceSearch {
  terms: string[];
  categorySlug?: string;
  status?: ServiceStatus;
}

@Injectable()
export class ServicesRepository {
  constructor(@InjectRepository(Service) private readonly services: Repository<Service>) {}

  private query(): SelectQueryBuilder<Service> {
    // Consulta base com prestador, perfil, categoria e equipamentos
    return this.services
      .createQueryBuilder('service')
      .leftJoinAndSelect('service.provider', 'provider')
      .leftJoinAndSelect('provider.providerProfile', 'profile')
      .leftJoinAndSelect('service.category', 'category')
      .leftJoinAndSelect('service.equipment', 'equipment')
      .where('service.deletedAt IS NULL');
  }

  private visible(): SelectQueryBuilder<Service> {
    // Só anúncios ativos, de prestador ativo
    return this.query()
      .andWhere("service.status = 'active'")
      .andWhere("provider.status = 'active'");
  }

  private matchTerms(query: SelectQueryBuilder<Service>, column: string, terms: string[]): void {
    // Todos os termos precisam aparecer no texto normalizado
    terms.forEach((term, index) => {
      const key = `${column.replace('.', '_')}_${index}`;
      query.andWhere(`${column} LIKE :${key}`, { [key]: `%${term}%` });
    });
  }

  search(filters: ServiceSearch, page: PageRequest): Promise<[Service[], number]> {
    // Filtros de texto, local e categoria aplicados no banco
    const query = this.visible();
    this.matchTerms(query, 'service.searchText', filters.terms);
    this.matchTerms(query, 'service.locationText', filters.locationTerms);
    if (filters.categorySlug) query.andWhere('category.slug = :slug AND category.active = 1', { slug: filters.categorySlug });

    // Filtros avançados: unidade, faixa de preço, nota, selo e data livre
    if (filters.priceUnit) {
      query.andWhere('service.priceUnit = :unit', { unit: filters.priceUnit });
      if (filters.minPrice !== undefined) query.andWhere('service.price >= :minPrice', { minPrice: filters.minPrice });
      if (filters.maxPrice !== undefined) query.andWhere('service.price <= :maxPrice', { maxPrice: filters.maxPrice });
    }
    if (filters.minRating !== undefined) query.andWhere('service.rating >= :minRating', { minRating: filters.minRating });
    if (filters.verifiedOnly) query.andWhere("profile.verificationStatus = 'approved'");
    if (filters.availableOn) {
      const blocked = 'SELECT 1 FROM blocked_days blocked WHERE blocked.providerId = service.providerId AND blocked.date = :day';
      query.andWhere('service.available = 1').andWhere(`NOT EXISTS (${blocked})`, { day: filters.availableOn });
    }

    // Ordenação e paginação também ficam com o banco
    if (filters.sort === 'price_asc') query.orderBy('service.price', 'ASC');
    else if (filters.sort === 'price_desc') query.orderBy('service.price', 'DESC');
    else if (filters.sort === 'rating') query.orderBy('service.rating', 'DESC').addOrderBy('service.reviewCount', 'DESC');
    else query.orderBy('service.createdAt', 'ASC');
    return query.addOrderBy('service.id', 'ASC').skip(page.skip).take(page.pageSize).getManyAndCount();
  }

  searchAll(filters: AdminServiceSearch, page: PageRequest): Promise<[Service[], number]> {
    // Lista administrativa: qualquer status, mais recentes primeiro
    const query = this.query();
    this.matchTerms(query, 'service.searchText', filters.terms);
    if (filters.categorySlug) query.andWhere('category.slug = :slug', { slug: filters.categorySlug });
    if (filters.status) query.andWhere('service.status = :status', { status: filters.status });
    return query.orderBy('service.createdAt', 'DESC').skip(page.skip).take(page.pageSize).getManyAndCount();
  }

  findFeatured(limit: number): Promise<Service[]> {
    // Destaques: visíveis, disponíveis e mais bem avaliados
    return this.visible()
      .andWhere('service.available = 1')
      .orderBy('service.rating', 'DESC')
      .addOrderBy('service.reviewCount', 'DESC')
      .take(limit)
      .getMany();
  }

  findById(id: string): Promise<Service | null> {
    // Busca um anúncio não excluído
    return this.query().andWhere('service.id = :id', { id }).getOne();
  }

  findByIdWithDeleted(id: string): Promise<Service | null> {
    // Busca o anúncio mesmo depois da exclusão lógica
    return this.services.findOne({
      where: { id },
      relations: { provider: { providerProfile: true }, category: true, equipment: true },
    });
  }

  findByProvider(providerId: string): Promise<Service[]> {
    // Anúncios do prestador em qualquer status, mais recentes primeiro
    return this.query()
      .andWhere('service.providerId = :providerId', { providerId })
      .orderBy('service.createdAt', 'DESC')
      .getMany();
  }

  findVisibleByProvider(providerId: string): Promise<Service[]> {
    // Anúncios do prestador que aparecem no catálogo
    return this.visible()
      .andWhere('service.providerId = :providerId', { providerId })
      .orderBy('service.createdAt', 'DESC')
      .getMany();
  }

  countVisible(): Promise<number> {
    // Total de anúncios visíveis no catálogo
    return this.visible().getCount();
  }

  async countByCategory(): Promise<Map<string, number>> {
    // Número de anúncios não excluídos por categoria
    const rows = await this.services
      .createQueryBuilder('service')
      .select('service.categoryId', 'categoryId')
      .addSelect('COUNT(*)', 'total')
      .where('service.deletedAt IS NULL')
      .groupBy('service.categoryId')
      .getRawMany<{ categoryId: string; total: number }>();
    return new Map(rows.map((row) => [row.categoryId, Number(row.total)]));
  }

  countAllByCategory(categoryId: string): Promise<number> {
    // Anúncios ligados à categoria, incluindo os excluídos logicamente
    return this.services.countBy({ categoryId });
  }

  async save(service: Service): Promise<Service> {
    // Grava o anúncio com os textos de busca atualizados
    const saved = await this.services.save(service);
    await this.refreshSearchText(saved.id);
    return (await this.findByIdWithDeleted(saved.id))!;
  }

  create(data: Partial<Service>): Service {
    // Monta a entidade para ser gravada
    return this.services.create(data);
  }

  async update(id: string, changes: Partial<Service>): Promise<void> {
    // Aplica mudanças pontuais no anúncio
    const values = defined(changes);
    if (Object.keys(values).length) await this.services.update({ id }, values);
  }

  async refreshSearchText(id: string): Promise<void> {
    // Recalcula os textos normalizados usados na busca
    const service = await this.findByIdWithDeleted(id);
    if (!service) return;
    const parts = [service.title, service.description, service.provider?.name, service.category?.name, service.city];
    const searchText = normalizeText(parts.filter(Boolean).join(' '));
    const locationText = normalizeText(`${service.city} ${service.state}`);
    await this.services.update({ id }, { searchText, locationText });
  }

  async refreshSearchTextWhere(where: { providerId?: string; categoryId?: string }): Promise<void> {
    // Mantém a busca em dia quando o prestador ou a categoria mudam de nome
    const services = await this.services.find({ where, select: { id: true } });
    for (const service of services) await this.refreshSearchText(service.id);
  }
}
