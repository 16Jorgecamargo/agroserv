import type { CounterOfferPayload, ProviderDashboard, RequestStatusFilter } from '../types/api'
import type { ServiceRequest, ServiceRequestDetail } from '../types/entities'
import { apiClient } from './api/apiClient'

const pathFor = (id: string) => `/provider/requests/${encodeURIComponent(id)}`

export const providerRequestService = {
  dashboard(): Promise<ProviderDashboard> {
    return apiClient.get<ProviderDashboard>('/provider/dashboard')
  },
  list(status: RequestStatusFilter = 'all'): Promise<ServiceRequest[]> {
    return apiClient.get<ServiceRequest[]>('/provider/requests', status === 'all' ? undefined : { status })
  },
  getById(id: string): Promise<ServiceRequestDetail> {
    return apiClient.get<ServiceRequestDetail>(pathFor(id))
  },
  accept(id: string): Promise<ServiceRequestDetail> {
    return apiClient.post<ServiceRequestDetail>(`${pathFor(id)}/accept`)
  },
  reject(id: string, reason: string): Promise<ServiceRequestDetail> {
    return apiClient.post<ServiceRequestDetail>(`${pathFor(id)}/reject`, { reason })
  },
  counterOffer(id: string, payload: CounterOfferPayload): Promise<ServiceRequestDetail> {
    return apiClient.post<ServiceRequestDetail>(`${pathFor(id)}/counter-offer`, payload)
  },
  start(id: string): Promise<ServiceRequestDetail> {
    return apiClient.post<ServiceRequestDetail>(`${pathFor(id)}/start`)
  },
  complete(id: string): Promise<ServiceRequestDetail> {
    return apiClient.post<ServiceRequestDetail>(`${pathFor(id)}/complete`)
  },
  cancel(id: string, reason: string): Promise<ServiceRequestDetail> {
    return apiClient.post<ServiceRequestDetail>(`${pathFor(id)}/cancel`, { reason })
  },
}
