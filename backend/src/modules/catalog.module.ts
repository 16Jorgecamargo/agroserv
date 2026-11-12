import { Module } from '@nestjs/common';
import { CategoriesController } from '../controllers/categories.controller.js';
import { CategoriesService } from '../services/categories.service.js';
import { CatalogService } from '../services/catalog.service.js';
import { ProviderServicesController } from '../controllers/provider-services.controller.js';
import { ProviderServicesService } from '../services/provider-services.service.js';
import { ServicesController } from '../controllers/services.controller.js';

@Module({
  controllers: [CategoriesController, ServicesController, ProviderServicesController],
  providers: [CategoriesService, CatalogService, ProviderServicesService],
  exports: [CategoriesService, CatalogService, ProviderServicesService],
})
export class CatalogModule {}
