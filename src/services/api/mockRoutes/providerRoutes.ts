import type { ServiceRequest, ServiceRequestDetail, User } from '../../../types/entities'
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

export const providerRoutes: MockRoute[] = [
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
