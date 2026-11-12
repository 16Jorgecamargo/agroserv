import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { defined } from '../utils/objects.js';
import { Property } from '../entities/property.entity.js';

@Injectable()
export class PropertiesRepository {
  constructor(@InjectRepository(Property) private readonly properties: Repository<Property>) {}

  findByProducer(producerId: string): Promise<Property[]> {
    // Propriedades não removidas do produtor, por ordem de cadastro
    return this.properties.find({
      where: { producerId, deletedAt: IsNull() },
      order: { createdAt: 'ASC' },
    });
  }

  findOwn(id: string, producerId: string): Promise<Property | null> {
    // Propriedade não removida que pertence ao produtor
    return this.properties.findOneBy({ id, producerId, deletedAt: IsNull() });
  }

  create(data: Partial<Property>): Promise<Property> {
    // Grava uma propriedade nova
    return this.properties.save(this.properties.create(data));
  }

  async update(id: string, changes: Partial<Property>): Promise<Property> {
    // Aplica as mudanças e devolve a propriedade atualizada
    const values = defined(changes);
    if (Object.keys(values).length) await this.properties.update({ id }, values);
    return this.properties.findOneByOrFail({ id });
  }
}
