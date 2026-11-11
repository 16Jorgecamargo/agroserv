import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { defined } from '../common/objects.js';
import { Category } from './entities/category.entity.js';

@Injectable()
export class CategoriesRepository {
  constructor(@InjectRepository(Category) private readonly categories: Repository<Category>) {}

  findActive(): Promise<Category[]> {
    // Categorias ativas na ordem de cadastro
    return this.categories.find({ where: { active: true }, order: { createdAt: 'ASC' } });
  }

  findAll(): Promise<Category[]> {
    // Todas as categorias, incluindo as desativadas
    return this.categories.find({ order: { createdAt: 'ASC' } });
  }

  findById(id: string): Promise<Category | null> {
    // Busca a categoria pelo id
    return this.categories.findOneBy({ id });
  }

  findBySlug(slug: string): Promise<Category | null> {
    // Busca a categoria pelo slug
    return this.categories.findOneBy({ slug });
  }

  create(data: Partial<Category>): Promise<Category> {
    // Grava uma categoria nova
    return this.categories.save(this.categories.create(data));
  }

  async update(id: string, changes: Partial<Category>): Promise<Category> {
    // Aplica as mudanças e devolve a categoria atualizada
    const values = defined(changes);
    if (Object.keys(values).length) await this.categories.update({ id }, values);
    return this.categories.findOneByOrFail({ id });
  }

  async remove(id: string): Promise<void> {
    // Apaga a categoria de verdade
    await this.categories.delete({ id });
  }
}
