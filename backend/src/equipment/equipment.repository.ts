import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { defined } from '../common/objects.js';
import { Equipment } from './entities/equipment.entity.js';

@Injectable()
export class EquipmentRepository {
  constructor(@InjectRepository(Equipment) private readonly equipment: Repository<Equipment>) {}

  findByProvider(providerId: string): Promise<Equipment[]> {
    // Equipamentos do prestador, por ordem de cadastro
    return this.equipment.find({ where: { providerId }, order: { createdAt: 'ASC' } });
  }

  findOwn(id: string, providerId: string): Promise<Equipment | null> {
    // Equipamento que pertence ao prestador
    return this.equipment.findOneBy({ id, providerId });
  }

  findOwnByIds(ids: string[], providerId: string): Promise<Equipment[]> {
    // Equipamentos do prestador entre os ids informados
    return ids.length ? this.equipment.findBy({ id: In(ids), providerId }) : Promise.resolve([]);
  }

  create(data: Partial<Equipment>): Promise<Equipment> {
    // Grava um equipamento novo
    return this.equipment.save(this.equipment.create(data));
  }

  async update(id: string, changes: Partial<Equipment>): Promise<Equipment> {
    // Aplica as mudanças e devolve o equipamento atualizado
    const values = defined(changes);
    if (Object.keys(values).length) await this.equipment.update({ id }, values);
    return this.equipment.findOneByOrFail({ id });
  }

  async remove(id: string): Promise<void> {
    // Apaga de verdade; o vínculo com os serviços some junto
    await this.equipment.delete({ id });
  }
}
