import { Module } from '@nestjs/common';
import { AdminModule } from '../admin/admin.module.js';
import { MessagesModule } from '../messages/messages.module.js';
import { CatalogModule } from '../services/catalog.module.js';
import { ReportsController } from './reports.controller.js';
import { ReportsService } from './reports.service.js';

@Module({
  imports: [AdminModule, MessagesModule, CatalogModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
