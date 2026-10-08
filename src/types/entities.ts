export interface User {
  id: string
  name: string
  email: string
  role: 'producer'
  avatarUrl?: string
  city: string
  state: string
}

export interface Category {
  id: string
  slug: string
  name: string
  icon: string
}

export interface Provider {
  id: string
  name: string
  avatarUrl?: string
  city: string
  state: string
  rating: number
  yearsOfExperience: number
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
