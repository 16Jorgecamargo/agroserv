import type { LoginPayload, LoginResponse } from '../types/api'
import type { User } from '../types/entities'
import { apiClient, isMockMode } from './api/apiClient'

export const demoAccount: LoginPayload | null = isMockMode
  ? { email: 'produtor@agroserv.com', password: '123456' }
  : null

export const authService = {
  login(payload: LoginPayload): Promise<LoginResponse> {
    return apiClient.post<LoginResponse>('/auth/login', payload)
  },
  me(): Promise<User> {
    return apiClient.get<User>('/auth/me')
  },
}
