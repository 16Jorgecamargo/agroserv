import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { BlockedDay } from '../entities/blocked-day.entity.js';

@Injectable()
export class BlockedDaysRepository {
  constructor(@InjectRepository(BlockedDay) private readonly days: Repository<BlockedDay>) {}

  async isBlocked(providerId: string, date: string): Promise<boolean> {
    // Diz se o prestador bloqueou o dia
    return (await this.days.countBy({ providerId, date })) > 0;
  }

  async findBetween(providerId: string, from: string, to: string): Promise<string[]> {
    // Dias bloqueados do intervalo, em ordem crescente
    const days = await this.days.find({
      where: { providerId, date: Between(from, to) },
      order: { date: 'ASC' },
    });
    return days.map((day) => day.date);
  }

  async add(providerId: string, date: string): Promise<void> {
    // Bloqueia o dia, sem duplicar
    if (!(await this.isBlocked(providerId, date))) await this.days.save(this.days.create({ providerId, date }));
  }

  async remove(providerId: string, date: string): Promise<void> {
    // Desbloqueia o dia
    await this.days.delete({ providerId, date });
  }
}
