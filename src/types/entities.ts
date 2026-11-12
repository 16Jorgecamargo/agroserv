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

export interface Category {
  id: string
  slug: string
  name: string
  icon: string
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
}

export interface ServiceDetail extends Service {
  provider: Provider
  category: Category
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
