import { Injectable } from '@nestjs/common';
import { defined } from '../common/objects.js';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, IsNull, Not, Repository } from 'typeorm';
import { BlockedDay } from '../agenda/entities/blocked-day.entity.js';
import { OPEN_STATUSES } from '../common/types.js';
import type { Role } from '../common/types.js';
import { Equipment } from '../equipment/entities/equipment.entity.js';
import { Favorite } from '../favorites/entities/favorite.entity.js';
import { Property } from '../properties/entities/property.entity.js';
import { ServiceRequest } from '../requests/entities/service-request.entity.js';
import { Service } from '../services/entities/service.entity.js';
import { User } from './entities/user.entity.js';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  findById(id: string): Promise<User | null> {
    // Busca a conta pelo id
    return this.users.findOneBy({ id });
  }

  findByIds(ids: string[]): Promise<User[]> {
    // Busca várias contas de uma vez
    return ids.length ? this.users.findBy({ id: In(ids) }) : Promise.resolve([]);
  }

  findByEmail(email: string): Promise<User | null> {
    // Busca uma conta não excluída pelo e-mail
    return this.users.findOneBy({ email, status: Not('deleted') });
  }

  findActiveByRole(role: Role): Promise<User[]> {
    // Lista as contas ativas de um papel
    return this.users.findBy({ role, status: 'active' });
  }

  async findPasswordHash(id: string): Promise<string | null> {
    // Lê o hash da senha, que fica fora das consultas padrão
    const query = this.users.createQueryBuilder('user').addSelect('user.passwordHash');
    const user = await query.where('user.id = :id', { id }).getOne();
    return user?.passwordHash ?? null;
  }

  create(data: Partial<User>): Promise<User> {
    // Grava uma conta nova
    return this.users.save(this.users.create(data));
  }

  async update(id: string, changes: Partial<User>): Promise<User> {
    // Aplica as mudanças e devolve a conta atualizada
    const values = defined(changes);
    if (Object.keys(values).length) await this.users.update({ id }, values);
    return this.users.findOneByOrFail({ id });
  }

  countOpenRequests(userId: string): Promise<number> {
    // Conta as solicitações abertas em que a conta participa
    return this.dataSource.getRepository(ServiceRequest).count({
      where: [
        { producerId: userId, status: In(OPEN_STATUSES) },
        { providerId: userId, status: In(OPEN_STATUSES) },
      ],
    });
  }

  async softDelete(user: User, now: string): Promise<void> {
    // Exclusão lógica da conta e dos dados ligados a ela, em uma transação
    await this.dataSource.transaction(async (manager) => {
      const email = `deleted-${user.id}@removed.agroserv`;
      await manager.update(User, { id: user.id }, { status: 'deleted', deletedAt: now, email, searchText: '' });
      await manager.update(Property, { producerId: user.id, deletedAt: IsNull() }, { deletedAt: now });
      await manager.delete(Favorite, { producerId: user.id });
      await manager.delete(Equipment, { providerId: user.id });
      await manager.delete(BlockedDay, { providerId: user.id });
      const services = await manager.findBy(Service, { providerId: user.id });
      for (const service of services.filter((item) => !item.deletedAt)) {
        const previous = service.status === 'hidden' ? service.statusBeforeHidden : service.status;
        await manager.update(Service, { id: service.id }, {
          status: 'hidden',
          statusBeforeHidden: previous,
          hiddenReason: 'Conta excluída',
          hiddenByAccountDeletion: true,
        });
      }
    });
  }
}
