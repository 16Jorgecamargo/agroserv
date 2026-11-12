import type { AdminAction, AdminActionTargetType, AdminActionType, User } from '../../../types/entities'
import { getMockDatabase } from '../mockDatabase'
import { nextId, requireUser, textField, validationError } from './shared'

export function requireAdmin(token: string | null): User {
  return requireUser(token, 'admin')
}

export function recordAdminAction(
  admin: User,
  action: AdminActionType,
  targetType: AdminActionTargetType,
  targetId: string,
  targetLabel: string,
  reason?: string,
  now: Date = new Date(),
): AdminAction {
  const database = getMockDatabase()
  const record: AdminAction = {
    id: nextId('act', database.adminActions.map((candidate) => candidate.id)),
    adminId: admin.id,
    adminName: admin.name,
    action,
    targetType,
    targetId,
    targetLabel,
    ...(reason ? { reason } : {}),
    createdAt: now.toISOString(),
  }
  database.adminActions.push(record)
  return record
}

export const REASON_MESSAGE = 'Informe o motivo com pelo menos 5 caracteres.'

export function requireReason(body: unknown): string {
  const value = textField((body as Record<string, unknown> | null)?.reason)
  if (value.length < 5 || value.length > 500) validationError({ reason: REASON_MESSAGE })
  return value
}
