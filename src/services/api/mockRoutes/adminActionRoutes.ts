import type { Paginated } from '../../../types/api'
import type { AdminAction, AdminActionType } from '../../../types/entities'
import { adminActionLabels } from '../../../utils/adminLabels'
import { addDays, isDateOnly } from '../../../utils/date'
import { getMockDatabase } from '../mockDatabase'
import { requireAdmin } from './adminShared'
import { paginate, toOptionalString, toPositiveInt } from './shared'
import type { MockRoute } from './types'

const ACTION_TYPES = Object.keys(adminActionLabels) as AdminActionType[]

function brasiliaMidnight(day: string): string {
  return `${day}T03:00:00.000Z`
}

export const adminActionRoutes: MockRoute[] = [
  {
    method: 'GET',
    pattern: '/admin/actions',
    handle: ({ token, query }): Paginated<AdminAction> => {
      requireAdmin(token)
      const adminId = toOptionalString(query.adminId)
      const action = ACTION_TYPES.find((candidate) => candidate === query.action)
      const fromDay = toOptionalString(query.from)
      const toDay = toOptionalString(query.to)
      const from = fromDay && isDateOnly(fromDay) ? brasiliaMidnight(fromDay) : undefined
      const to = toDay && isDateOnly(toDay) ? brasiliaMidnight(addDays(toDay, 1)) : undefined
      const actions = getMockDatabase()
        .adminActions.filter((item) => !adminId || item.adminId === adminId)
        .filter((item) => !action || item.action === action)
        .filter((item) => !from || item.createdAt >= from)
        .filter((item) => !to || item.createdAt < to)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id, undefined, { numeric: true }))

      return paginate(actions, toPositiveInt(query.page, 1, Number.MAX_SAFE_INTEGER), toPositiveInt(query.pageSize, 20, 100))
    },
  },
]
