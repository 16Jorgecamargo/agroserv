import type { AdminDashboard, AdminUserDetail, AdminUserFilters, CreateAdminPayload, Paginated, PendingVerification } from '../types/api'
import type { ServiceRequestDetail, User, Verification } from '../types/entities'
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
  listVerifications(): Promise<PendingVerification[]> {
    return apiClient.get<PendingVerification[]>('/admin/verifications')
  },
  approveVerification(providerId: string): Promise<Verification> {
    return apiClient.post<Verification>(`/admin/verifications/${encodeURIComponent(providerId)}/approve`)
  },
  rejectVerification(providerId: string, reason: string): Promise<Verification> {
    return apiClient.post<Verification>(`/admin/verifications/${encodeURIComponent(providerId)}/reject`, { reason })
  },
}
