import type { CreateRequestPayload, ProducerDashboard, RequestStatusFilter } from '../types/api'
import type { ServiceRequest, ServiceRequestDetail } from '../types/entities'
import { apiClient } from './api/apiClient'

export const requestService = {
  list(status: RequestStatusFilter): Promise<ServiceRequest[]> {
    return apiClient.get<ServiceRequest[]>('/requests', { status: status === 'all' ? undefined : status })
  },
  getDashboard(): Promise<ProducerDashboard> {
    return apiClient.get<ProducerDashboard>('/dashboard')
  },
  create(payload: CreateRequestPayload): Promise<ServiceRequestDetail> {
    return apiClient.post<ServiceRequestDetail>('/requests', payload)
  },
  getById(id: string): Promise<ServiceRequestDetail> {
    return apiClient.get<ServiceRequestDetail>(`/requests/${encodeURIComponent(id)}`)
  },
  cancel(id: string, reason?: string): Promise<ServiceRequestDetail> {
    return apiClient.post<ServiceRequestDetail>(`/requests/${encodeURIComponent(id)}/cancel`, reason ? { reason } : {})
  },
  acceptCounterOffer(id: string): Promise<ServiceRequestDetail> {
    return apiClient.post<ServiceRequestDetail>(`/requests/${encodeURIComponent(id)}/counter-offer/accept`)
  },
  declineCounterOffer(id: string): Promise<ServiceRequestDetail> {
    return apiClient.post<ServiceRequestDetail>(`/requests/${encodeURIComponent(id)}/counter-offer/decline`)
  },
}
