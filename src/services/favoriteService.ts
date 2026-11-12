import type { Service } from '../types/entities'
import { apiClient } from './api/apiClient'

export const favoriteService = {
  list(): Promise<Service[]> {
    return apiClient.get<Service[]>('/me/favorites')
  },
  add(serviceId: string): Promise<void> {
    return apiClient.post<void>('/me/favorites', { serviceId })
  },
  remove(serviceId: string): Promise<void> {
    return apiClient.delete<void>(`/me/favorites/${encodeURIComponent(serviceId)}`)
  },
}
