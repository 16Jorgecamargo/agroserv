import { Body, Controller, Delete, Get, HttpCode, Param, Post } from '@nestjs/common';
import { CurrentUser, Roles } from '../common/auth.decorators.js';
import type { ServiceView } from '../services/service.presenter.js';
import type { User } from '../users/entities/user.entity.js';
import { AddFavoriteDto } from './dto/favorite.dto.js';
import { FavoritesService } from './favorites.service.js';

@Roles('producer')
@Controller('me/favorites')
export class FavoritesController {
  constructor(private readonly favorites: FavoritesService) {}

  @Get()
  list(@CurrentUser() user: User): Promise<ServiceView[]> {
    // Lista os serviços favoritos do produtor
    return this.favorites.list(user.id);
  }

  @Post()
  @HttpCode(204)
  add(@CurrentUser() user: User, @Body() dto: AddFavoriteDto): Promise<void> {
    // Favorita um serviço
    return this.favorites.add(user.id, dto.serviceId);
  }

  @Delete(':serviceId')
  @HttpCode(204)
  remove(@CurrentUser() user: User, @Param('serviceId') serviceId: string): Promise<void> {
    // Tira um serviço dos favoritos
    return this.favorites.remove(user.id, serviceId);
  }
}
