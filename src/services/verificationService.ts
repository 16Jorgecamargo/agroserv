import type { VerificationPayload } from '../types/api'
import type { Verification } from '../types/entities'
import { apiClient } from './api/apiClient'

export const verificationService = {
  get(): Promise<Verification> {
    return apiClient.get<Verification>('/provider/verification')
  },
  submit(payload: VerificationPayload): Promise<Verification> {
    return apiClient.post<Verification>('/provider/verification', payload)
  },
}
