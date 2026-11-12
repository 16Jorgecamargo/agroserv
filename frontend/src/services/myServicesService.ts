import type { ServicePayload } from '../types/api'
import type { Service, ServiceDetail } from '../types/entities'
import { apiClient } from './api/apiClient'

const base = '/provider/services'
const pathFor = (id: string) => `${base}/${encodeURIComponent(id)}`

export const myServicesService = {
  list(): Promise<Service[]> {
    return apiClient.get<Service[]>(base)
  },
  getById(id: string): Promise<ServiceDetail> {
    return apiClient.get<ServiceDetail>(pathFor(id))
  },
  create(payload: ServicePayload): Promise<Service> {
    return apiClient.post<Service>(base, payload)
  },
  update(id: string, payload: Partial<ServicePayload>): Promise<Service> {
    return apiClient.patch<Service>(pathFor(id), payload)
  },
  pause(id: string): Promise<Service> {
    return apiClient.post<Service>(`${pathFor(id)}/pause`)
  },
  activate(id: string): Promise<Service> {
    return apiClient.post<Service>(`${pathFor(id)}/activate`)
  },
  remove(id: string): Promise<void> {
    return apiClient.delete<void>(pathFor(id))
  },
}
