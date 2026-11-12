import { Injectable } from '@nestjs/common';
import { addDays, ClockService, isValidDay } from '../common/clock.service.js';
import { Paginated, paginate, parsePage } from '../common/pagination.js';
import { ADMIN_ACTION_TYPES } from '../common/types.js';
import type { AdminActionType, AdminTargetType } from '../common/types.js';
import type { User } from '../users/entities/user.entity.js';
import { AdminActionsRepository } from './admin-actions.repository.js';
import type { AdminAction } from './entities/admin-action.entity.js';

export interface AdminActionView {
  id: string;
  adminId: string;
  adminName: string;
  action: AdminActionType;
  targetType: AdminTargetType;
  targetId: string;
  targetLabel: string;
  reason?: string;
  createdAt: string;
}

export interface ActionTarget {
  type: AdminTargetType;
  id: string;
  label: string;
}

export function toAdminActionView(action: AdminAction): AdminActionView {
  // Converte a entidade no tipo AdminAction do contrato
  const { id, adminId, adminName, targetType, targetId, targetLabel, reason, createdAt } = action;
  return { id, adminId, adminName, action: action.action, targetType, targetId, targetLabel, ...(reason ? { reason } : {}), createdAt };
}

function brasiliaMidnight(day: string): string {
  // Início do dia em Brasília (UTC-3), em ISO UTC
  return `${day}T03:00:00.000Z`;
}

@Injectable()
export class AdminActionsService {
  constructor(
    private readonly actions: AdminActionsRepository,
    private readonly clock: ClockService,
  ) {}

  async log(admin: User, action: AdminActionType, target: ActionTarget, reason?: string): Promise<void> {
    // Toda escrita do administrador entra no histórico
    await this.actions.create({
      adminId: admin.id,
      adminName: admin.name,
      action,
      targetType: target.type,
      targetId: target.id,
      targetLabel: target.label,
      reason: reason ?? null,
      createdAt: this.clock.nowIso(),
    });
  }

  async list(query: Record<string, unknown>): Promise<Paginated<AdminActionView>> {
    // Filtros por administrador, tipo e período (dias inclusivos, em Brasília)
    const page = parsePage(query, 20, 100);
    const action = ADMIN_ACTION_TYPES.includes(query.action as AdminActionType) ? (query.action as AdminActionType) : undefined;
    const filters = {
      adminId: typeof query.adminId === 'string' && query.adminId ? query.adminId : undefined,
      action,
      from: isValidDay(query.from) ? brasiliaMidnight(query.from) : undefined,
      to: isValidDay(query.to) ? brasiliaMidnight(addDays(query.to, 1)) : undefined,
    };
    const [actions, total] = await this.actions.findPage(filters, page);
    return paginate(actions.map(toAdminActionView), total, page);
  }

  async listForTarget(targetId: string): Promise<AdminActionView[]> {
    // Histórico administrativo sobre uma conta
    const actions = await this.actions.findByTarget(targetId);
    return actions.map(toAdminActionView);
  }
}
