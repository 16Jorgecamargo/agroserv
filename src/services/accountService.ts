import type {
  ChangePasswordPayload,
  DemoRestoreResponse,
  MessageResponse,
  ProviderProfilePayload,
  UpdateProfilePayload,
} from '../types/api'
import type { ProviderProfile, User } from '../types/entities'
import { apiClient, isMockMode } from './api/apiClient'

export const accountService = {
  canRestoreDemoData: isMockMode,
  updateProfile(payload: UpdateProfilePayload): Promise<User> {
    return apiClient.patch<User>('/me', payload)
  },
  changePassword(payload: ChangePasswordPayload): Promise<MessageResponse> {
    return apiClient.patch<MessageResponse>('/me/password', payload)
  },
  deleteAccount(): Promise<MessageResponse> {
    return apiClient.delete<MessageResponse>('/me')
  },
  getProviderProfile(): Promise<ProviderProfile> {
    return apiClient.get<ProviderProfile>('/provider/profile')
  },
  updateProviderProfile(payload: ProviderProfilePayload): Promise<ProviderProfile> {
    return apiClient.patch<ProviderProfile>('/provider/profile', payload)
  },
  restoreDemoData(): Promise<DemoRestoreResponse> {
    if (!isMockMode) return Promise.reject(new Error('A restauração demo só funciona no modo mock.'))
    return apiClient.post<DemoRestoreResponse>('/mock/restore-demo')
  },
}
