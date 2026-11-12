import type { EquipmentPayload } from '../types/api'
import type { Equipment } from '../types/entities'
import { apiClient } from './api/apiClient'

const base = '/provider/equipment'

export const equipmentService = {
  list(): Promise<Equipment[]> {
    return apiClient.get<Equipment[]>(base)
  },
  create(payload: EquipmentPayload): Promise<Equipment> {
    return apiClient.post<Equipment>(base, payload)
  },
  update(id: string, payload: Partial<EquipmentPayload>): Promise<Equipment> {
    return apiClient.patch<Equipment>(`${base}/${encodeURIComponent(id)}`, payload)
  },
  remove(id: string): Promise<void> {
    return apiClient.delete<void>(`${base}/${encodeURIComponent(id)}`)
  },
}
