import { Injectable } from '@nestjs/common';
import { CategoriesRepository } from '../categories/categories.repository.js';
import { CategoryView, toCategoryView } from '../categories/category.presenter.js';
import type { Category } from '../categories/entities/category.entity.js';
import { conflict, notFound, validationError } from '../common/app.exception.js';
import { ClockService } from '../common/clock.service.js';
import { normalizeText, slugify } from '../common/text.js';
import { ServicesRepository } from '../services/services.repository.js';
import type { User } from '../users/entities/user.entity.js';
import { AdminActionsService } from './admin-actions.service.js';
import type { CreateCategoryDto, UpdateCategoryDto } from './dto/admin.dto.js';

export type AdminCategoryView = CategoryView & { serviceCount: number };

@Injectable()
export class AdminCategoriesService {
  constructor(
    private readonly categories: CategoriesRepository,
    private readonly services: ServicesRepository,
    private readonly actions: AdminActionsService,
    private readonly clock: ClockService,
  ) {}

  async list(): Promise<AdminCategoryView[]> {
    // Todas as categorias, com o número de serviços de cada uma
    const categories = await this.categories.findAll();
    const counts = await this.services.countByCategory();
    return categories.map((category) => ({ ...toCategoryView(category), serviceCount: counts.get(category.id) ?? 0 }));
  }

  async create(admin: User, dto: CreateCategoryDto): Promise<CategoryView> {
    // Nome e endereço são únicos; o endereço sai do nome quando ausente
    const slug = dto.slug ?? slugify(dto.name);
    await this.assertUnique(dto.name, slug);
    const category = await this.categories.create({
      name: dto.name,
      slug,
      icon: dto.icon,
      active: true,
      createdAt: this.clock.nowIso(),
    });
    await this.actions.log(admin, 'create_category', this.target(category));
    return toCategoryView(category);
  }

  async update(admin: User, id: string, dto: UpdateCategoryDto): Promise<CategoryView> {
    // Confere a unicidade só do que mudou
    const category = await this.load(id);
    await this.assertUnique(dto.name, dto.slug, id);
    const updated = await this.categories.update(id, { name: dto.name, slug: dto.slug, icon: dto.icon, active: dto.active });

    // O nome da categoria faz parte do texto de busca dos anúncios
    if (dto.name && dto.name !== category.name) await this.services.refreshSearchTextWhere({ categoryId: id });
    await this.actions.log(admin, 'update_category', this.target(updated));
    return toCategoryView(updated);
  }

  async remove(admin: User, id: string): Promise<void> {
    // Só dá para apagar uma categoria sem serviços
    const category = await this.load(id);
    if ((await this.services.countAllByCategory(id)) > 0) {
      throw conflict('Esta categoria tem serviços. Desative em vez de apagar.');
    }
    await this.categories.remove(id);
    await this.actions.log(admin, 'delete_category', this.target(category));
  }

  private target(category: Category) {
    // Alvo da ação no histórico administrativo
    return { type: 'category' as const, id: category.id, label: category.name };
  }

  private async assertUnique(name?: string, slug?: string, ignoreId?: string): Promise<void> {
    // Compara nomes sem acento e caixa, e endereços de forma exata
    const others = (await this.categories.findAll()).filter((category) => category.id !== ignoreId);
    if (name && others.some((category) => normalizeText(category.name) === normalizeText(name))) {
      throw validationError({ name: 'Já existe uma categoria com este nome.' });
    }
    if (slug !== undefined && (!slug || others.some((category) => category.slug === slug))) {
      throw validationError({ slug: 'Já existe uma categoria com este endereço.' });
    }
  }

  private async load(id: string): Promise<Category> {
    // Categoria inexistente responde 404
    const category = await this.categories.findById(id);
    if (!category) throw notFound('category_not_found', 'Categoria não encontrada.');
    return category;
  }
}
