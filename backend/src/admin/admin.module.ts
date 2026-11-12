import { Module } from '@nestjs/common';
import { ProvidersModule } from '../providers/providers.module.js';
import { CatalogModule } from '../services/catalog.module.js';
import { AdminActionsService } from './admin-actions.service.js';
import { AdminCategoriesController } from './admin-categories.controller.js';
import { AdminCategoriesService } from './admin-categories.service.js';
import { AdminDashboardService } from './admin-dashboard.service.js';
import { AdminModerationController } from './admin-moderation.controller.js';
import { AdminServicesService } from './admin-services.service.js';
import { AdminUsersController } from './admin-users.controller.js';
import { AdminUsersService } from './admin-users.service.js';
import { AdminVerificationsService } from './admin-verifications.service.js';
import { AdminController } from './admin.controller.js';

@Module({
  imports: [CatalogModule, ProvidersModule],
  controllers: [AdminController, AdminUsersController, AdminModerationController, AdminCategoriesController],
  providers: [
    AdminActionsService,
    AdminDashboardService,
    AdminUsersService,
    AdminServicesService,
    AdminVerificationsService,
    AdminCategoriesService,
  ],
  exports: [AdminActionsService, AdminUsersService, AdminServicesService],
})
export class AdminModule {}
