import type { ProviderAgenda } from '../types/api'
import { apiClient } from './api/apiClient'

export const agendaService = {
  get(month: string): Promise<ProviderAgenda> {
    return apiClient.get<ProviderAgenda>('/provider/agenda', { month })
  },
  block(date: string): Promise<{ date: string }> {
    return apiClient.post<{ date: string }>('/provider/blocked-days', { date })
  },
  unblock(date: string): Promise<void> {
    return apiClient.delete<void>(`/provider/blocked-days/${encodeURIComponent(date)}`)
  },
}
