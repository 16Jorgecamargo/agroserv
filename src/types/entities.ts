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

export type RequestStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled'

export interface ServiceRequest {
  id: string
  serviceId: string
  serviceTitle: string
  providerName: string
  scheduledDate: string
  location: string
  status: RequestStatus
  value: number
}
