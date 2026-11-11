import { Module } from '@nestjs/common';
import { CategoriesController } from '../categories/categories.controller.js';
import { CategoriesService } from '../categories/categories.service.js';
import { CatalogService } from './catalog.service.js';
import { ProviderServicesController } from './provider-services.controller.js';
import { ProviderServicesService } from './provider-services.service.js';
import { ServicesController } from './services.controller.js';

@Module({
  controllers: [CategoriesController, ServicesController, ProviderServicesController],
  providers: [CategoriesService, CatalogService, ProviderServicesService],
  exports: [CategoriesService, CatalogService, ProviderServicesService],
})
export class CatalogModule {}
