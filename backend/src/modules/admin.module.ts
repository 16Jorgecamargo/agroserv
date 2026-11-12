import { Module } from '@nestjs/common';
import { ProvidersModule } from './providers.module.js';
import { CatalogModule } from './catalog.module.js';
import { AdminActionsService } from '../services/admin-actions.service.js';
import { AdminCategoriesController } from '../controllers/admin-categories.controller.js';
import { AdminCategoriesService } from '../services/admin-categories.service.js';
import { AdminDashboardService } from '../services/admin-dashboard.service.js';
import { AdminModerationController } from '../controllers/admin-moderation.controller.js';
import { AdminServicesService } from '../services/admin-services.service.js';
import { AdminUsersController } from '../controllers/admin-users.controller.js';
import { AdminUsersService } from '../services/admin-users.service.js';
import { AdminVerificationsService } from '../services/admin-verifications.service.js';
import { AdminController } from '../controllers/admin.controller.js';

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
