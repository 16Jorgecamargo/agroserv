import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Favorite } from '../entities/favorite.entity.js';

@Injectable()
export class FavoritesRepository {
  constructor(@InjectRepository(Favorite) private readonly favorites: Repository<Favorite>) {}

  findByProducer(producerId: string): Promise<Favorite[]> {
    // Favoritos do produtor, do mais recente para o mais antigo
    return this.favorites.find({ where: { producerId }, order: { createdAt: 'DESC' } });
  }

  async add(producerId: string, serviceId: string, createdAt: string): Promise<void> {
    // Favoritar duas vezes não duplica
    const exists = await this.favorites.countBy({ producerId, serviceId });
    if (!exists) await this.favorites.save(this.favorites.create({ producerId, serviceId, createdAt }));
  }

  async remove(producerId: string, serviceId: string): Promise<void> {
    // Apaga o favorito de verdade
    await this.favorites.delete({ producerId, serviceId });
  }
}
