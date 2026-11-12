import type { AdminDashboard } from '../../../types/api'
import type { RequestStatus } from '../../../types/entities'
import { requestStatuses } from '../../../utils/requestStatus'
import { getMockDatabase } from '../mockDatabase'
import { requireAdmin } from './adminShared'
import { isServiceVisible } from './shared'
import type { MockRoute } from './types'

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

function buildDashboard(now: Date): AdminDashboard {
  const database = getMockDatabase()
  const accounts = database.users.filter((user) => user.status !== 'deleted')
  const since = now.getTime() - WEEK_MS
  const requestsByStatus = Object.fromEntries(requestStatuses.map((status) => [status, 0])) as Record<RequestStatus, number>
  const requestsByCategory = new Map<string, number>()

  database.requestRecords.forEach(({ request }) => {
    requestsByStatus[request.status] += 1
    const categoryId = database.services.find((service) => service.id === request.serviceId)?.categoryId
    if (categoryId) requestsByCategory.set(categoryId, (requestsByCategory.get(categoryId) ?? 0) + 1)
  })

  const topCategories = [...requestsByCategory.entries()]
    .map(([categoryId, requests]) => ({
      categoryId,
      name: database.categories.find((category) => category.id === categoryId)?.name ?? '',
      requests,
    }))
    .sort((a, b) => b.requests - a.requests || a.name.localeCompare(b.name, 'pt-BR'))
    .slice(0, 5)

  return {
    users: {
      producers: accounts.filter((user) => user.role === 'producer').length,
      providers: accounts.filter((user) => user.role === 'provider').length,
      admins: accounts.filter((user) => user.role === 'admin').length,
    },
    newUsersLast7Days: accounts.filter((user) => new Date(user.createdAt).getTime() >= since).length,
    requestsByStatus,
    activeServices: database.services.filter(isServiceVisible).length,
    topCategories,
    pendingVerifications: database.providerProfiles.filter((profile) => profile.verificationStatus === 'under_review').length,
    openReports: database.reports.filter((report) => report.status === 'open').length,
  }
}

export const adminRoutes: MockRoute[] = [
  {
    method: 'GET',
    pattern: '/admin/dashboard',
    handle: ({ token }) => {
      requireAdmin(token)
      return buildDashboard(new Date())
    },
  },
]
