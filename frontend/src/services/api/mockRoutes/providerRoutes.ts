import type { ProviderDashboard } from '../../../types/api'
import type { ServiceRequest, ServiceRequestDetail, User } from '../../../types/entities'
import { addDays, getTodayInBrasilia } from '../../../utils/date'
import { isRequestStatus } from '../../../utils/requestStatus'
import { ApiError } from '../apiError'
import { getMockDatabase } from '../mockDatabase'
import { findUserByToken, requireRole, requireUser, toOptionalString } from './shared'
import { applyRequestTransition, getRequestDetail, getRequestRecord, type RequestTransitionAction } from './requestTransitions'
import type { MockRoute, RouteContext } from './types'

function handleProviderTransition(action: RequestTransitionAction) {
  return ({ params, body, token }: RouteContext) => {
    const user: User = requireRole(findUserByToken(token), 'provider')
    const record = getRequestRecord(params.id)
    applyRequestTransition(params.id, action, user, body)
    return getRequestDetail(record, user.role)
  }
}

function listReceivedRequests({ token, query }: RouteContext): ServiceRequest[] {
  const user = requireUser(token, 'provider')
  const status = toOptionalString(query.status)

  if (status && status !== 'all' && !isRequestStatus(status)) {
    throw new ApiError({ status: 400, code: 'invalid_status', message: 'Status de solicitação inválido.' })
  }

  return getMockDatabase()
    .requestRecords.map((record) => record.request)
    .filter((request) => request.providerId === user.id && (!status || status === 'all' || request.status === status))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

function getReceivedRequest({ token, params }: RouteContext): ServiceRequestDetail {
  const user = requireUser(token, 'provider')
  const record = getMockDatabase().requestRecords.find((candidate) => candidate.request.id === params.id)
  if (!record || record.request.providerId !== user.id) {
    throw new ApiError({ status: 404, code: 'request_not_found', message: 'Solicitação não encontrada.' })
  }
  return getRequestDetail(record, 'provider')
}

const RESPONSE_EVENTS = new Set(['accepted', 'rejected', 'counter_offer'])

function getProviderDashboard({ token }: RouteContext): ProviderDashboard {
  const user = requireUser(token, 'provider')
  const now = new Date()
  const today = getTodayInBrasilia(now)
  const weekEnd = addDays(today, 7)
  const month = today.slice(0, 7)
  const responseWindowStart = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString()
  const database = getMockDatabase()
  const records = database.requestRecords.filter((record) => record.request.providerId === user.id)
  const requests = records.map((record) => record.request)
  const pending = requests.filter((request) => request.status === 'pending').sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  const upcoming = requests
    .filter((request) => request.status === 'accepted' && request.scheduledDate >= today && request.scheduledDate <= weekEnd)
    .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate))

  let responded = 0
  let acceptedCount = 0
  let monthEstimatedValue = 0
  for (const record of records) {
    const events = [...record.events].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    const firstResponse = events.find((event) => RESPONSE_EVENTS.has(event.type))
    if (firstResponse && firstResponse.createdAt >= responseWindowStart) {
      responded += 1
      const acceptedLater = firstResponse.type === 'counter_offer' && events.some((event) => event.type === 'counter_offer_accepted')
      if (firstResponse.type === 'accepted' || acceptedLater) acceptedCount += 1
    }
    const completed = events.find((event) => event.type === 'completed')
    if (record.request.status === 'completed' && completed && getTodayInBrasilia(new Date(completed.createdAt)).startsWith(month)) {
      monthEstimatedValue += record.request.value
    }
  }

  const profile = database.providerProfiles.find((candidate) => candidate.userId === user.id)

  return {
    stats: {
      newRequests: pending.length,
      upcoming: upcoming.length,
      inProgress: requests.filter((request) => request.status === 'in_progress').length,
      acceptanceRate: responded ? acceptedCount / responded : null,
      averageRating: profile?.rating ?? 0,
      monthEstimatedValue: Math.round(monthEstimatedValue * 100) / 100,
    },
    pendingRequests: pending.slice(0, 5),
    upcomingRequests: upcoming.slice(0, 5),
  }
}

export const providerRoutes: MockRoute[] = [
  { method: 'GET', pattern: '/provider/dashboard', handle: getProviderDashboard },
  { method: 'GET', pattern: '/provider/requests', handle: listReceivedRequests },
  { method: 'GET', pattern: '/provider/requests/:id', handle: getReceivedRequest },
  { method: 'POST', pattern: '/provider/requests/:id/accept', handle: handleProviderTransition('provider_accept') },
  { method: 'POST', pattern: '/provider/requests/:id/reject', handle: handleProviderTransition('provider_reject') },
  {
    method: 'POST',
    pattern: '/provider/requests/:id/counter-offer',
    handle: handleProviderTransition('provider_counter_offer'),
  },
  { method: 'POST', pattern: '/provider/requests/:id/start', handle: handleProviderTransition('provider_start') },
  { method: 'POST', pattern: '/provider/requests/:id/complete', handle: handleProviderTransition('provider_complete') },
  { method: 'POST', pattern: '/provider/requests/:id/cancel', handle: handleProviderTransition('provider_cancel') },
]
