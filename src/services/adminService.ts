import type { AdminDashboard } from '../types/api'
import { apiClient } from './api/apiClient'

export const adminService = {
  dashboard(): Promise<AdminDashboard> {
    return apiClient.get<AdminDashboard>('/admin/dashboard')
  },
}
