import { Module } from '@nestjs/common';
import { CatalogModule } from './catalog.module.js';
import { FavoritesController } from '../controllers/favorites.controller.js';
import { FavoritesService } from '../services/favorites.service.js';

@Module({
  imports: [CatalogModule],
  controllers: [FavoritesController],
  providers: [FavoritesService],
})
export class FavoritesModule {}
