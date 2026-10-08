import type { RequestStatus, ServiceRequest, User } from './entities'

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE'

export type QueryValue = string | number | boolean | undefined

export type QueryParams = Record<string, QueryValue>

export interface RequestConfig {
  method: HttpMethod
  path: string
  query?: QueryParams
  body?: unknown
  token?: string | null
}

export interface HttpAdapter {
  request<T>(config: RequestConfig): Promise<T>
}

export interface PaginationMeta {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface Paginated<T> {
  data: T[]
  meta: PaginationMeta
}

export interface ApiErrorBody {
  status: number
  code: string
  message: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  user: User
}

export type ServiceFilters = {
  q?: string
  location?: string
  category?: string
  page?: number
  pageSize?: number
}

export type RequestStatusFilter = RequestStatus | 'all'

export interface ProducerDashboardStats {
  open: number
  inProgress: number
  completed: number
  totalSpent: number
}

export interface ProducerDashboard {
  stats: ProducerDashboardStats
  recentRequests: ServiceRequest[]
}
