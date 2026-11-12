import type {
  AdminActionFilters,
  AdminCategory,
  AdminDashboard,
  AdminReportFilters,
  AdminServiceFilters,
  AdminUserDetail,
  AdminUserFilters,
  CategoryPayload,
  CreateAdminPayload,
  Paginated,
  PendingVerification,
  ReportDetail,
  ResolveReportPayload,
} from '../types/api'
import type { AdminAction, Category, Report, Service, ServiceRequestDetail, User, Verification } from '../types/entities'
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
  listReports(filters: AdminReportFilters): Promise<Paginated<Report>> {
    return apiClient.get<Paginated<Report>>('/admin/reports', { ...filters })
  },
  getReport(id: string): Promise<ReportDetail> {
    return apiClient.get<ReportDetail>(`/admin/reports/${encodeURIComponent(id)}`)
  },
  resolveReport(id: string, payload: ResolveReportPayload): Promise<Report> {
    return apiClient.post<Report>(`/admin/reports/${encodeURIComponent(id)}/resolve`, payload)
  },
  listCategories(): Promise<AdminCategory[]> {
    return apiClient.get<AdminCategory[]>('/admin/categories')
  },
  createCategory(payload: CategoryPayload): Promise<Category> {
    return apiClient.post<Category>('/admin/categories', payload)
  },
  updateCategory(id: string, payload: Partial<CategoryPayload>): Promise<Category> {
    return apiClient.patch<Category>(`/admin/categories/${encodeURIComponent(id)}`, payload)
  },
  deleteCategory(id: string): Promise<void> {
    return apiClient.delete<void>(`/admin/categories/${encodeURIComponent(id)}`)
  },
  listActions(filters: AdminActionFilters): Promise<Paginated<AdminAction>> {
    return apiClient.get<Paginated<AdminAction>>('/admin/actions', { ...filters })
  },
}
