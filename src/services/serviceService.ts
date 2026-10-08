import type { Paginated, ServiceFilters } from '../types/api'
import type { Service, ServiceDetail } from '../types/entities'
import { apiClient } from './api/apiClient'

export const serviceService = {
  list(filters: ServiceFilters): Promise<Paginated<Service>> {
    return apiClient.get<Paginated<Service>>('/services', { ...filters })
  },
  featured(limit: number): Promise<Service[]> {
    return apiClient.get<Service[]>('/services/featured', { limit })
  },
  getById(id: string): Promise<ServiceDetail> {
    return apiClient.get<ServiceDetail>(`/services/${encodeURIComponent(id)}`)
  },
}
