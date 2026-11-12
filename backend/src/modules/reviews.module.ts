import { Global, Module } from '@nestjs/common';
import { CatalogModule } from './catalog.module.js';
import { ReviewsController } from '../controllers/reviews.controller.js';
import { ReviewsService } from '../services/reviews.service.js';

@Global()
@Module({
  imports: [CatalogModule],
  controllers: [ReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
