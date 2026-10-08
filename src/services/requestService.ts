import type { ProducerDashboard, RequestStatusFilter } from '../types/api'
import type { ServiceRequest } from '../types/entities'
import { apiClient } from './api/apiClient'

export const requestService = {
  list(status: RequestStatusFilter): Promise<ServiceRequest[]> {
    return apiClient.get<ServiceRequest[]>('/requests', { status: status === 'all' ? undefined : status })
  },
  getDashboard(): Promise<ProducerDashboard> {
    return apiClient.get<ProducerDashboard>('/dashboard')
  },
}
