import { Module } from '@nestjs/common';
import { CatalogModule } from './catalog.module.js';
import { AgendaController } from '../controllers/agenda.controller.js';
import { AgendaService } from '../services/agenda.service.js';

@Module({
  imports: [CatalogModule],
  controllers: [AgendaController],
  providers: [AgendaService],
})
export class AgendaModule {}
