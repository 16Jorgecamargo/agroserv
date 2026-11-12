import { Injectable } from '@nestjs/common';
import { defined } from '../utils/objects.js';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, IsNull, MoreThanOrEqual, Not, Repository } from 'typeorm';
import { BlockedDay } from '../entities/blocked-day.entity.js';
import type { PageRequest } from '../utils/pagination.js';
import { OPEN_STATUSES } from '../types/index.js';
import type { Role } from '../types/index.js';
import { Equipment } from '../entities/equipment.entity.js';
import { Favorite } from '../entities/favorite.entity.js';
import { Property } from '../entities/property.entity.js';
import { ServiceRequest } from '../entities/service-request.entity.js';
import { Service } from '../entities/service.entity.js';
import { User } from '../entities/user.entity.js';

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

  search(
    filters: { terms: string[]; role?: Role; status?: 'active' | 'suspended' },
    page: PageRequest,
  ): Promise<[User[], number]> {
    // Busca administrativa por nome ou e-mail, sem contas excluídas
    const query = this.users.createQueryBuilder('user').where("user.status != 'deleted'");
    filters.terms.forEach((term, index) => {
      query.andWhere(`user.searchText LIKE :term${index}`, { [`term${index}`]: `%${term}%` });
    });
    if (filters.role) query.andWhere('user.role = :role', { role: filters.role });
    if (filters.status) query.andWhere('user.status = :status', { status: filters.status });
    return query.orderBy('user.createdAt', 'DESC').skip(page.skip).take(page.pageSize).getManyAndCount();
  }

  async countByRole(): Promise<Record<Role, number>> {
    // Contas não excluídas de cada papel
    const rows = await this.users
      .createQueryBuilder('user')
      .select('user.role', 'role')
      .addSelect('COUNT(*)', 'total')
      .where("user.status != 'deleted'")
      .groupBy('user.role')
      .getRawMany<{ role: Role; total: number }>();
    const totals: Record<Role, number> = { producer: 0, provider: 0, admin: 0 };
    for (const row of rows) totals[row.role] = Number(row.total);
    return totals;
  }

  countCreatedSince(since: string): Promise<number> {
    // Cadastros recentes, sem contas excluídas
    return this.users.countBy({ createdAt: MoreThanOrEqual(since), status: Not('deleted') });
  }

  countActiveAdmins(): Promise<number> {
    // Administradores que ainda conseguem entrar
    return this.users.countBy({ role: 'admin', status: 'active' });
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
