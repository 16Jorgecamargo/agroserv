import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import type { CategoryView } from '../categories/category.presenter.js';
import { CurrentUser, Roles } from '../common/auth.decorators.js';
import type { User } from '../users/entities/user.entity.js';
import { AdminCategoriesService, AdminCategoryView } from './admin-categories.service.js';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/admin.dto.js';

@Roles('admin')
@Controller('admin/categories')
export class AdminCategoriesController {
  constructor(private readonly categories: AdminCategoriesService) {}

  @Get()
  list(): Promise<AdminCategoryView[]> {
    // Lista todas as categorias
    return this.categories.list();
  }

  @Post()
  create(@CurrentUser() admin: User, @Body() dto: CreateCategoryDto): Promise<CategoryView> {
    // Cria uma categoria
    return this.categories.create(admin, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() admin: User,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ): Promise<CategoryView> {
    // Edita ou desativa uma categoria
    return this.categories.update(admin, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentUser() admin: User, @Param('id') id: string): Promise<void> {
    // Apaga uma categoria sem serviços
    return this.categories.remove(admin, id);
  }
}
