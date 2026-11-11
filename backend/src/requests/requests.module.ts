import { Global, Module } from '@nestjs/common';
import { CatalogModule } from '../services/catalog.module.js';
import { ProducerRequestsController } from './producer-requests.controller.js';
import { ProducerRequestsService } from './producer-requests.service.js';
import { RequestLifecycleService } from './request-lifecycle.service.js';

@Global()
@Module({
  imports: [CatalogModule],
  controllers: [ProducerRequestsController],
  providers: [RequestLifecycleService, ProducerRequestsService],
  exports: [RequestLifecycleService],
})
export class RequestsModule {}
