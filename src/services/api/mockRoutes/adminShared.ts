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

export function requireReason(body: unknown, field = 'reason', min = 5, max = 500): string {
  const value = textField((body as Record<string, unknown> | null)?.[field])
  if (value.length < min || value.length > max) validationError({ [field]: `Informe o motivo (${min} a ${max} caracteres).` })
  return value
}
