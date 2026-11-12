import { Controller, Get } from '@nestjs/common';
import { Public } from '../common/auth.decorators.js';
import { CategoriesService } from './categories.service.js';
import type { CategoryView } from './category.presenter.js';

@Public()
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  list(): Promise<CategoryView[]> {
    // Categorias usadas nos filtros públicos
    return this.categories.listActive();
  }
}
