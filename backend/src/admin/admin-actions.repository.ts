import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { PageRequest } from '../common/pagination.js';
import type { AdminActionType } from '../common/types.js';
import { AdminAction } from './entities/admin-action.entity.js';

export interface AdminActionFilters {
  adminId?: string;
  action?: AdminActionType;
  from?: string;
  to?: string;
}

@Injectable()
export class AdminActionsRepository {
  constructor(@InjectRepository(AdminAction) private readonly actions: Repository<AdminAction>) {}

  create(data: Partial<AdminAction>): Promise<AdminAction> {
    // Registra uma ação administrativa
    return this.actions.save(this.actions.create(data));
  }

  findPage(filters: AdminActionFilters, page: PageRequest): Promise<[AdminAction[], number]> {
    // Histórico filtrado no banco, mais recentes primeiro
    const query = this.actions.createQueryBuilder('action');
    if (filters.adminId) query.andWhere('action.adminId = :adminId', { adminId: filters.adminId });
    if (filters.action) query.andWhere('action.action = :type', { type: filters.action });
    if (filters.from) query.andWhere('action.createdAt >= :from', { from: filters.from });
    if (filters.to) query.andWhere('action.createdAt < :to', { to: filters.to });
    return query.orderBy('action.createdAt', 'DESC').addOrderBy('action.id', 'DESC').skip(page.skip).take(page.pageSize).getManyAndCount();
  }

  findByTarget(targetId: string): Promise<AdminAction[]> {
    // Ações feitas sobre um alvo, mais recentes primeiro
    return this.actions.find({ where: { targetId }, order: { createdAt: 'DESC' } });
  }
}
