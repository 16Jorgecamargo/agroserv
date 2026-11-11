import { Module } from '@nestjs/common';
import { CatalogModule } from '../services/catalog.module.js';
import { AgendaController } from './agenda.controller.js';
import { AgendaService } from './agenda.service.js';

@Module({
  imports: [CatalogModule],
  controllers: [AgendaController],
  providers: [AgendaService],
})
export class AgendaModule {}
