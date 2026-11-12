export type Role = 'producer' | 'provider' | 'admin'
export type UserStatus = 'active' | 'suspended' | 'deleted'
export type VerificationStatus = 'not_sent' | 'under_review' | 'approved' | 'rejected'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  phone?: string
  avatarUrl?: string
  city: string
  state: string
  status: UserStatus
  mustChangePassword?: boolean
  createdAt: string
}

export interface PasswordResetTokenRecord {
  token: string
  userId: string
  createdAt: string
  expiresAt: string
  usedAt?: string
}

export type CategoryIcon =
  | 'sprout'
  | 'wheat'
  | 'droplets'
  | 'spray-can'
  | 'flask-conical'
  | 'truck'
  | 'wrench'
  | 'tractor'
  | 'leaf'
  | 'shovel'
  | 'warehouse'
  | 'sun'
  | 'tree-pine'
  | 'beef'

export interface Category {
  id: string
  slug: string
  name: string
  icon: CategoryIcon
  active: boolean
}

export interface ProviderProfile {
  userId: string
  document: string
  serviceRadiusKm: number
  yearsOfExperience: number
  description: string
  verificationStatus: VerificationStatus
  verificationRejectionReason?: string
  rating: number
  reviewCount: number
}

export interface Provider {
  id: string
  name: string
  avatarUrl?: string
  city: string
  state: string
  rating: number
  reviewCount: number
  yearsOfExperience: number
  verified: boolean
  serviceRadiusKm: number
  description: string
}

export type PriceUnit = 'hour' | 'hectare' | 'day' | 'trip'
export type ServiceStatus = 'active' | 'paused' | 'hidden'

export interface Service {
  id: string
  title: string
  description: string
  categoryId: string
  providerId: string
  providerName: string
  city: string
  state: string
  price: number
  priceUnit: PriceUnit
  rating: number
  reviewCount: number
  available: boolean
  imageUrl: string
  providerVerified: boolean
  photos: string[]
  equipmentIds: string[]
  status: ServiceStatus
  hiddenReason?: string
  createdAt: string
}

export type EquipmentType = 'tractor' | 'harvester' | 'sprayer' | 'drone' | 'truck' | 'implement' | 'other'

export interface Equipment {
  id: string
  providerId: string
  type: EquipmentType
  model: string
  year: number
  specs: string
  photos: string[]
}

export interface ServiceDetail extends Service {
  provider: Provider
  category: Category
  equipment: Equipment[]
}

export interface Property {
  id: string
  name: string
  city: string
  state: string
  accessNotes: string
  areaHectares: number
  crops: string[]
  createdAt: string
}

export type RequestStatus =
  | 'pending'
  | 'counter_offer'
  | 'accepted'
  | 'in_progress'
  | 'completed'
  | 'rejected'
  | 'cancelled'

export interface CounterOffer {
  date?: string
  value?: number
  message: string
  createdAt: string
}

export interface ServiceRequest {
  id: string
  serviceId: string
  serviceTitle: string
  providerId: string
  providerName: string
  producerId: string
  producerName: string
  propertyId: string
  location: string
  scheduledDate: string
  quantity: number
  priceUnit: PriceUnit
  value: number
  notes?: string
  status: RequestStatus
  counterOffer?: CounterOffer
  rejectReason?: string
  cancelReason?: string
  cancelledBy?: Role | 'system'
  reviewId?: string
  createdAt: string
  updatedAt: string
}

export type RequestEventType =
  | 'created'
  | 'accepted'
  | 'rejected'
  | 'counter_offer'
  | 'counter_offer_accepted'
  | 'counter_offer_declined'
  | 'started'
  | 'completed'
  | 'cancelled'

export interface RequestEvent {
  id: string
  type: RequestEventType
  actorId: string | null
  actorRole: Role | 'system'
  actorName: string
  note?: string
  previousDate?: string
  previousValue?: number
  createdAt: string
}

export type RequestAction =
  | 'cancel'
  | 'accept_counter_offer'
  | 'decline_counter_offer'
  | 'review'
  | 'edit_review'
  | 'accept'
  | 'reject'
  | 'counter_offer'
  | 'start'
  | 'complete'
  | 'message'
  | 'report'

export interface RequestParty {
  id: string
  name: string
  avatarUrl?: string
  city: string
  state: string
  phone?: string
}

export interface Review {
  id: string
  requestId: string
  serviceId: string
  serviceTitle: string
  providerId: string
  producerId: string
  producerName: string
  producerAvatarUrl?: string
  rating: 1 | 2 | 3 | 4 | 5
  comment?: string
  reply?: { text: string; createdAt: string; updatedAt: string }
  hidden: boolean
  editableUntil: string
  createdAt: string
  updatedAt: string
}

export interface ServiceRequestDetail extends ServiceRequest {
  service: Service
  serviceRemoved: boolean
  property: Property
  propertyRemoved: boolean
  producer: RequestParty
  provider: Provider & { phone?: string }
  events: RequestEvent[]
  review?: Review
  allowedActions: RequestAction[]
}

export interface ReviewSummary {
  average: number
  count: number
  writtenCount: number
  distribution: Record<1 | 2 | 3 | 4 | 5, number>
}

export interface Message {
  id: string
  requestId: string
  senderId: string
  senderName: string
  senderRole: Role
  text: string
  createdAt: string
}

export type NotificationType =
  | 'request_created'
  | 'request_status'
  | 'counter_offer'
  | 'message'
  | 'review'
  | 'review_reply'
  | 'verification'
  | 'service_hidden'
  | 'warning'
  | 'report_resolved'
  | 'report_created'
  | 'verification_submitted'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  body?: string
  link: string
  read: boolean
  createdAt: string
}

export type ReportTargetType = 'service' | 'review' | 'user' | 'request'
export type ReportReason = 'offensive' | 'false_info' | 'fraud' | 'service_not_done' | 'other'
export type ReportStatus = 'open' | 'resolved' | 'dismissed'
export type ReportResolutionAction = 'hide_service' | 'hide_review' | 'warn' | 'suspend' | 'archive'

export interface ReportResolution {
  action: ReportResolutionAction
  targetUserId?: string
  message?: string
  internalNote: string
  adminId: string
  adminName: string
  resolvedAt: string
}

export interface Report {
  id: string
  reporterId: string
  reporterName: string
  reporterRole: Role
  targetType: ReportTargetType
  targetId: string
  targetLabel: string
  reason: ReportReason
  description: string
  status: ReportStatus
  resolution?: ReportResolution
  createdAt: string
}

export type VerificationDocumentKind = 'identity' | 'address'

export interface VerificationDocument {
  kind: VerificationDocumentKind
  uploadId: string
  url: string
  name: string
}

export interface Verification {
  status: VerificationStatus
  documents: VerificationDocument[]
  submittedAt?: string
  reviewedAt?: string
  rejectionReason?: string
}

export type UploadPurpose = 'public' | 'verification'

export interface Upload {
  id: string
  url: string
  name: string
  contentType: string
  size: number
  purpose: UploadPurpose
  createdAt: string
}

export type AdminActionType =
  | 'suspend_user'
  | 'reactivate_user'
  | 'create_admin'
  | 'approve_verification'
  | 'reject_verification'
  | 'hide_service'
  | 'show_service'
  | 'delete_service'
  | 'hide_review'
  | 'warn_user'
  | 'resolve_report'
  | 'dismiss_report'
  | 'create_category'
  | 'update_category'
  | 'delete_category'

export type AdminActionTargetType = 'user' | 'service' | 'review' | 'report' | 'category' | 'verification'

export interface AdminAction {
  id: string
  adminId: string
  adminName: string
  action: AdminActionType
  targetType: AdminActionTargetType
  targetId: string
  targetLabel: string
  reason?: string
  createdAt: string
}
