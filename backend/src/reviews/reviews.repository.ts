import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { defined } from '../common/objects.js';
import type { PageRequest } from '../common/pagination.js';
import { Review } from './entities/review.entity.js';

export interface ReviewScope {
  serviceId?: string;
  providerId?: string;
  producerId?: string;
}

@Injectable()
export class ReviewsRepository {
  constructor(@InjectRepository(Review) private readonly reviews: Repository<Review>) {}

  findById(id: string): Promise<Review | null> {
    // Avaliação com o autor, para a foto do produtor
    return this.reviews.findOne({ where: { id }, relations: { producer: true } });
  }

  findPage(
    scope: ReviewScope,
    options: { rating?: number; includeHidden: boolean },
    page: PageRequest,
  ): Promise<[Review[], number]> {
    // Avaliações do serviço ou do prestador, mais recentes primeiro
    const where: FindOptionsWhere<Review> = { ...defined(scope) };
    if (options.rating) where.rating = options.rating;
    if (!options.includeHidden) where.hidden = false;
    return this.reviews.findAndCount({
      where,
      relations: { producer: true },
      order: { createdAt: 'DESC', id: 'DESC' },
      skip: page.skip,
      take: page.pageSize,
    });
  }

  findAll(scope: ReviewScope): Promise<Review[]> {
    // Todas as avaliações do escopo, incluindo as ocultas
    return this.reviews.find({
      where: defined(scope),
      relations: { producer: true },
      order: { createdAt: 'DESC' },
    });
  }

  async distribution(scope: ReviewScope): Promise<Record<number, number>> {
    // Quantas avaliações visíveis existem em cada nota
    const query = this.reviews
      .createQueryBuilder('review')
      .select('review.rating', 'rating')
      .addSelect('COUNT(*)', 'total')
      .where('review.hidden = 0');
    for (const [key, value] of Object.entries(defined(scope))) query.andWhere(`review.${key} = :${key}`, { [key]: value });
    const rows = await query.groupBy('review.rating').getRawMany<{ rating: number; total: number }>();
    return Object.fromEntries(rows.map((row) => [Number(row.rating), Number(row.total)]));
  }

  create(data: Partial<Review>): Promise<Review> {
    // Grava uma avaliação nova
    return this.reviews.save(this.reviews.create(data));
  }

  async update(id: string, changes: Partial<Review>): Promise<Review> {
    // Aplica as mudanças e devolve a avaliação atualizada
    const values = defined(changes);
    if (Object.keys(values).length) await this.reviews.update({ id }, values);
    return (await this.findById(id))!;
  }
}
