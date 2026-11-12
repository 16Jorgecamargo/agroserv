import { Injectable } from '@nestjs/common';
import { CategoriesRepository } from '../repositories/categories.repository.js';
import { CategoryView, toCategoryView } from '../presenters/category.presenter.js';

@Injectable()
export class CategoriesService {
  constructor(private readonly categories: CategoriesRepository) {}

  async listActive(): Promise<CategoryView[]> {
    // Lista pública: só as categorias ativas
    const categories = await this.categories.findActive();
    return categories.map(toCategoryView);
  }
}
