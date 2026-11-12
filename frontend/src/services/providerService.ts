import type { ProviderPublicProfile } from '../types/api'
import { apiClient } from './api/apiClient'

export const providerService = {
  getPublicProfile(id: string): Promise<ProviderPublicProfile> {
    return apiClient.get<ProviderPublicProfile>(`/providers/${encodeURIComponent(id)}`)
  },
}
