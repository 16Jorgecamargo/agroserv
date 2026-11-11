import { Module } from '@nestjs/common';
import { CategoriesController } from '../categories/categories.controller.js';
import { CategoriesService } from '../categories/categories.service.js';
import { CatalogService } from './catalog.service.js';
import { ServicesController } from './services.controller.js';

@Module({
  controllers: [CategoriesController, ServicesController],
  providers: [CategoriesService, CatalogService],
  exports: [CategoriesService, CatalogService],
})
export class CatalogModule {}
