import { Global, Module } from '@nestjs/common';
import { CatalogModule } from './catalog.module.js';
import { ProducerRequestsController } from '../controllers/producer-requests.controller.js';
import { ProducerRequestsService } from '../services/producer-requests.service.js';
import { ProviderRequestsController } from '../controllers/provider-requests.controller.js';
import { ProviderRequestsService } from '../services/provider-requests.service.js';
import { RequestLifecycleService } from '../services/request-lifecycle.service.js';

@Global()
@Module({
  imports: [CatalogModule],
  controllers: [ProducerRequestsController, ProviderRequestsController],
  providers: [RequestLifecycleService, ProducerRequestsService, ProviderRequestsService],
  exports: [RequestLifecycleService],
})
export class RequestsModule {}
