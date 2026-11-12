import type { PropertyPayload } from '../types/api'
import type { Property } from '../types/entities'
import { apiClient } from './api/apiClient'

export const propertyService = {
  list(): Promise<Property[]> {
    return apiClient.get<Property[]>('/me/properties')
  },
  create(payload: PropertyPayload): Promise<Property> {
    return apiClient.post<Property>('/me/properties', payload)
  },
  update(id: string, payload: Partial<PropertyPayload>): Promise<Property> {
    return apiClient.patch<Property>(`/me/properties/${encodeURIComponent(id)}`, payload)
  },
  remove(id: string): Promise<void> {
    return apiClient.delete<void>(`/me/properties/${encodeURIComponent(id)}`)
  },
}
