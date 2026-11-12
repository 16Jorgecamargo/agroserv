import type {
  AdminDashboard,
  AdminServiceFilters,
  AdminUserDetail,
  AdminUserFilters,
  CreateAdminPayload,
  Paginated,
  PendingVerification,
} from '../types/api'
import type { Service, ServiceRequestDetail, User, Verification } from '../types/entities'
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
  listServices(filters: AdminServiceFilters): Promise<Paginated<Service>> {
    return apiClient.get<Paginated<Service>>('/admin/services', { ...filters })
  },
  hideService(id: string, reason: string): Promise<Service> {
    return apiClient.post<Service>(`/admin/services/${encodeURIComponent(id)}/hide`, { reason })
  },
  showService(id: string): Promise<Service> {
    return apiClient.post<Service>(`/admin/services/${encodeURIComponent(id)}/show`)
  },
  deleteService(id: string): Promise<void> {
    return apiClient.delete<void>(`/admin/services/${encodeURIComponent(id)}`)
  },
}
