import type { AdminDashboard, AdminUserDetail, AdminUserFilters, CreateAdminPayload, Paginated } from '../types/api'
import type { ServiceRequestDetail, User } from '../types/entities'
import { apiClient } from './api/apiClient'

const userPath = (id: string) => `/admin/users/${encodeURIComponent(id)}`

export const adminService = {
  dashboard(): Promise<AdminDashboard> {
    return apiClient.get<AdminDashboard>('/admin/dashboard')
  },
  listUsers(filters: AdminUserFilters): Promise<Paginated<User>> {
    return apiClient.get<Paginated<User>>('/admin/users', { ...filters })
  },
  createAdmin(payload: CreateAdminPayload): Promise<User> {
    return apiClient.post<User>('/admin/users', payload)
  },
  getUser(id: string): Promise<AdminUserDetail> {
    return apiClient.get<AdminUserDetail>(userPath(id))
  },
  suspendUser(id: string, reason: string): Promise<User> {
    return apiClient.post<User>(`${userPath(id)}/suspend`, { reason })
  },
  reactivateUser(id: string): Promise<User> {
    return apiClient.post<User>(`${userPath(id)}/reactivate`)
  },
  getRequest(id: string): Promise<ServiceRequestDetail> {
    return apiClient.get<ServiceRequestDetail>(`/admin/requests/${encodeURIComponent(id)}`)
  },
}
