import type {
  AdminAction,
  AdminActionType,
  Category,
  CategoryIcon,
  Equipment,
  EquipmentType,
  Message,
  Notification,
  PriceUnit,
  Provider,
  ProviderProfile,
  Report,
  ReportReason,
  ReportResolutionAction,
  ReportStatus,
  ReportTargetType,
  RequestStatus,
  Review,
  ReviewSummary,
  Role,
  Service,
  ServiceRequest,
  ServiceRequestDetail,
  ServiceStatus,
  UploadPurpose,
  User,
  UserStatus,
  Verification,
} from './entities'

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'

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
  fields?: Record<string, string>
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload extends LoginPayload {
  name: string
  phone: string
  city: string
  state: string
  role: 'producer' | 'provider'
  acceptedTerms: true
}

export interface LoginResponse {
  token: string
  user: User
}

export interface ForgotPasswordResponse {
  message: string
  resetToken?: string
}

export interface ResetPasswordPayload {
  token: string
  password: string
}

export interface ResetPasswordResponse {
  message: string
}

export type UpdateProfilePayload = Partial<Pick<User, 'name' | 'phone' | 'city' | 'state'>> & {
  avatarUrl?: string | null
}

export interface ChangePasswordPayload {
  currentPassword: string
  newPassword: string
}

export interface MessageResponse {
  message: string
}

export type ProviderProfilePayload = Partial<
  Pick<ProviderProfile, 'document' | 'serviceRadiusKm' | 'yearsOfExperience' | 'description'>
>

export interface DemoRestoreResponse {
  message: string
}

export type ServiceSort = 'relevance' | 'price_asc' | 'price_desc' | 'rating'

export type ServiceFilters = {
  q?: string
  location?: string
  category?: string
  page?: number
  pageSize?: number
  priceUnit?: PriceUnit
  minPrice?: number
  maxPrice?: number
  minRating?: number
  verified?: boolean
  date?: string
  sort?: ServiceSort
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

export interface PropertyPayload {
  name: string
  city: string
  state: string
  accessNotes?: string
  areaHectares: number
  crops: string[]
}

export interface CreateRequestPayload {
  serviceId: string
  propertyId: string
  scheduledDate: string
  quantity: number
  notes?: string
}

export interface ReasonPayload {
  reason?: string
}

export interface CounterOfferPayload {
  date?: string
  value?: number
  message: string
}

export interface ReviewPayload {
  rating: number
  comment?: string
}

export interface ReviewList extends Paginated<Review> {
  summary: ReviewSummary
}

export interface ServicePayload {
  title: string
  categoryId: string
  description: string
  price: number
  priceUnit: PriceUnit
  city: string
  state: string
  photos: string[]
  equipmentIds: string[]
  available: boolean
}

export interface EquipmentPayload {
  type: EquipmentType
  model: string
  year: number
  specs: string
  photos: string[]
}

export interface ProviderDashboard {
  stats: {
    newRequests: number
    upcoming: number
    inProgress: number
    acceptanceRate: number | null
    averageRating: number
    monthEstimatedValue: number
  }
  pendingRequests: ServiceRequest[]
  upcomingRequests: ServiceRequest[]
}

export interface ProviderAgenda {
  month: string
  blockedDays: string[]
  requests: ServiceRequest[]
}

export interface VerificationPayload {
  identityUploadId: string
  addressUploadId: string
}

export interface MockUploadPayload {
  name: string
  contentType: string
  dataUrl: string
  purpose: UploadPurpose
}

export interface NotificationList extends Paginated<Notification> {
  unreadCount: number
}

export interface ReportPayload {
  targetType: ReportTargetType
  targetId: string
  reason: ReportReason
  description: string
}

export interface ProviderPublicProfile {
  provider: Provider
  services: Service[]
  equipment: Equipment[]
  recentReviews: Review[]
  reviewSummary: ReviewSummary
}

export interface AdminDashboard {
  users: { producers: number; providers: number; admins: number }
  newUsersLast7Days: number
  requestsByStatus: Record<RequestStatus, number>
  activeServices: number
  topCategories: { categoryId: string; name: string; requests: number }[]
  pendingVerifications: number
  openReports: number
}

export interface AdminUserFilters {
  q?: string
  role?: Role
  status?: Exclude<UserStatus, 'deleted'>
  page?: number
  pageSize?: number
}

export interface CreateAdminPayload {
  name: string
  email: string
  password: string
  city: string
  state: string
}

export interface AdminUserDetail {
  user: User
  providerProfile?: ProviderProfile
  requests: ServiceRequest[]
  services?: Service[]
  reviews: Review[]
  actions: AdminAction[]
}

export interface PendingVerification {
  provider: Provider
  email: string
  document: string
  verification: Verification
}

export interface AdminServiceFilters {
  q?: string
  category?: string
  status?: ServiceStatus
  page?: number
  pageSize?: number
}

export interface AdminReportFilters {
  status?: ReportStatus | 'all'
  targetType?: ReportTargetType
  page?: number
  pageSize?: number
}

export interface ReportDetail {
  report: Report
  target: Service | Review | User | ServiceRequestDetail
  messages?: Message[]
}

export interface ResolveReportPayload {
  action: ReportResolutionAction
  targetUserId?: string
  message?: string
  internalNote: string
}

export type AdminCategory = Category & { serviceCount: number }

export interface CategoryPayload {
  name: string
  slug?: string
  icon: CategoryIcon
  active?: boolean
}

export interface AdminActionFilters {
  adminId?: string
  action?: AdminActionType
  from?: string
  to?: string
  page?: number
  pageSize?: number
}
