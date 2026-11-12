import type { ProducerDashboard } from '../../../types/api'
import type { RequestStatus, ServiceRequest, User } from '../../../types/entities'
import { isRequestStatus } from '../../../utils/requestStatus'
import { ApiError } from '../apiError'
import { findUserByToken, getUserRequests, requireRole, toOptionalString } from './shared'
import { applyRequestTransition, getRequestDetail, getRequestRecord, type RequestTransitionAction } from './requestTransitions'
import type { MockRoute, RouteContext } from './types'

const RECENT_REQUESTS_LIMIT = 5
const OPEN_STATUSES: RequestStatus[] = ['pending', 'counter_offer', 'accepted']
const CONTRACTED_STATUSES: RequestStatus[] = ['accepted', 'in_progress', 'completed']

function listRequests({ token, query }: RouteContext): ServiceRequest[] {
  const user = requireRole(findUserByToken(token), 'producer')
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
  const user = requireRole(findUserByToken(token), 'producer')
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

function handleProducerTransition(action: RequestTransitionAction) {
  return ({ params, body, token }: RouteContext) => {
    const user: User = requireRole(findUserByToken(token), 'producer')
    const record = getRequestRecord(params.id)
    applyRequestTransition(params.id, action, user, body)
    return getRequestDetail(record, user.role)
  }
}

export const producerRoutes: MockRoute[] = [
  { method: 'GET', pattern: '/requests', handle: listRequests },
  { method: 'GET', pattern: '/dashboard', handle: getDashboard },
  { method: 'POST', pattern: '/requests/:id/cancel', handle: handleProducerTransition('producer_cancel') },
  {
    method: 'POST',
    pattern: '/requests/:id/counter-offer/accept',
    handle: handleProducerTransition('producer_accept_counter_offer'),
  },
  {
    method: 'POST',
    pattern: '/requests/:id/counter-offer/decline',
    handle: handleProducerTransition('producer_decline_counter_offer'),
  },
]
