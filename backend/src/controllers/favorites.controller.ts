import { Body, Controller, Delete, Get, HttpCode, Param, Post } from '@nestjs/common';
import { CurrentUser, Roles } from '../decorators/auth.decorators.js';
import type { ServiceView } from '../presenters/service.presenter.js';
import type { User } from '../entities/user.entity.js';
import { AddFavoriteDto } from '../dto/favorite.dto.js';
import { FavoritesService } from '../services/favorites.service.js';

@Roles('producer')
@Controller('me/favorites')
export class FavoritesController {
  constructor(private readonly favorites: FavoritesService) {}

  @Get()
  list(@CurrentUser() user: User): Promise<ServiceView[]> {
    return this.favorites.list(user.id);
  }

  @Post()
  @HttpCode(200)
  add(@CurrentUser() user: User, @Body() dto: AddFavoriteDto): Promise<ServiceView> {
    return this.favorites.add(user.id, dto.serviceId);
  }

  @Delete(':serviceId')
  @HttpCode(204)
  remove(@CurrentUser() user: User, @Param('serviceId') serviceId: string): Promise<void> {
    return this.favorites.remove(user.id, serviceId);
  }
}
