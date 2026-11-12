import { Global, Module } from '@nestjs/common';
import { CatalogModule } from '../services/catalog.module.js';
import { ReviewsController } from './reviews.controller.js';
import { ReviewsService } from './reviews.service.js';

@Global()
@Module({
  imports: [CatalogModule],
  controllers: [ReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
