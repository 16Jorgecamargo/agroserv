import type { User } from '../../../types/entities'
import { findUserByToken, requireRole } from './shared'
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

export const providerRoutes: MockRoute[] = [
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
