import type { Service } from '../types/entities'
import { apiClient } from './api/apiClient'

export const favoriteService = {
  list(): Promise<Service[]> {
    return apiClient.get<Service[]>('/me/favorites')
  },
  add(serviceId: string): Promise<Service> {
    return apiClient.post<Service>('/me/favorites', { serviceId })
  },
  remove(serviceId: string): Promise<void> {
    return apiClient.delete<void>(`/me/favorites/${encodeURIComponent(serviceId)}`)
  },
}
