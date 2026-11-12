import type {
  ForgotPasswordResponse,
  LoginPayload,
  LoginResponse,
  ResetPasswordPayload,
  ResetPasswordResponse,
} from '../types/api'
import type { User } from '../types/entities'
import { apiClient, isMockMode } from './api/apiClient'

export interface DemoAccount extends LoginPayload {
  label: string
}

export const demoAccounts: DemoAccount[] = isMockMode
  ? [
      { label: 'Produtor', email: 'produtor@agroserv.com', password: '123456' },
      { label: 'Prestador', email: 'prestador@agroserv.com', password: '123456' },
      { label: 'Administrador', email: 'admin@agroserv.com', password: '123456' },
    ]
  : []

export const authService = {
  login(payload: LoginPayload): Promise<LoginResponse> {
    return apiClient.post<LoginResponse>('/auth/login', payload)
  },
  forgotPassword(email: string): Promise<ForgotPasswordResponse> {
    return apiClient.post<ForgotPasswordResponse>('/auth/forgot-password', { email })
  },
  resetPassword(payload: ResetPasswordPayload): Promise<ResetPasswordResponse> {
    return apiClient.post<ResetPasswordResponse>('/auth/reset-password', payload)
  },
  me(): Promise<User> {
    return apiClient.get<User>('/auth/me')
  },
}
