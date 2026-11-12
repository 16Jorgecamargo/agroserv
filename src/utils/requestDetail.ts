import { paths } from '../routes/paths'
import type { ServiceRequestDetail } from '../types/entities'
import { getTodayInBrasilia } from './date'

export type RequestViewer = 'producer' | 'provider' | 'admin'

export function isRequestDatePast(request: ServiceRequestDetail, today = getTodayInBrasilia()): boolean {
  if (request.status === 'pending') return request.scheduledDate < today
  if (request.status === 'counter_offer') return (request.counterOffer?.date ?? request.scheduledDate) < today
  return false
}

export function getRequestDetailPath(viewer: RequestViewer, requestId: string): string {
  if (viewer === 'provider') return paths.providerRequestDetail(requestId)
  if (viewer === 'admin') return paths.adminRequestDetail(requestId)
  return paths.requestDetail(requestId)
}
