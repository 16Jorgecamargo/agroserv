import { Module } from '@nestjs/common';
import { AdminModule } from './admin.module.js';
import { MessagesModule } from './messages.module.js';
import { CatalogModule } from './catalog.module.js';
import { ReportsController } from '../controllers/reports.controller.js';
import { ReportsService } from '../services/reports.service.js';

@Module({
  imports: [AdminModule, MessagesModule, CatalogModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
