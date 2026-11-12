import type { ProducerDashboard } from '../../../types/api'
import type { RequestStatus, ServiceRequest } from '../../../types/entities'
import { isRequestStatus } from '../../../utils/requestStatus'
import { ApiError } from '../apiError'
import { findUserByToken, getUserRequests, toOptionalString } from './shared'
import type { MockRoute, RouteContext } from './types'

const RECENT_REQUESTS_LIMIT = 5
const OPEN_STATUSES: RequestStatus[] = ['pending', 'accepted']
const CONTRACTED_STATUSES: RequestStatus[] = ['accepted', 'in_progress', 'completed']

function listRequests({ token, query }: RouteContext): ServiceRequest[] {
  const user = findUserByToken(token)
  const status = toOptionalString(query.status)

  if (status && status !== 'all' && !isRequestStatus(status)) {
    throw new ApiError({
      status: 400,
      code: 'invalid_status',
      message: 'Status de solicitação inválido.',
    })
  }

  const userRequests = getUserRequests(user.id)

  return status && status !== 'all'
    ? userRequests.filter((request) => request.status === status)
    : userRequests
}

function getDashboard({ token }: RouteContext): ProducerDashboard {
  const user = findUserByToken(token)
  const userRequests = getUserRequests(user.id)
  const countBy = (statuses: RequestStatus[]) =>
    userRequests.filter((request) => statuses.includes(request.status)).length

  return {
    stats: {
      open: countBy(OPEN_STATUSES),
      inProgress: countBy(['in_progress']),
      completed: countBy(['completed']),
      totalSpent: userRequests
        .filter((request) => CONTRACTED_STATUSES.includes(request.status))
        .reduce((sum, request) => sum + request.value, 0),
    },
    recentRequests: userRequests.slice(0, RECENT_REQUESTS_LIMIT),
  }
}

export const producerRoutes: MockRoute[] = [
  { method: 'GET', pattern: '/requests', handle: listRequests },
  { method: 'GET', pattern: '/dashboard', handle: getDashboard },
]