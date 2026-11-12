import type { ReviewList, ReviewPayload } from '../types/api'
import type { Review } from '../types/entities'
import { apiClient } from './api/apiClient'

interface ReviewQuery {
  page?: number
  pageSize?: number
  rating?: number
}

export const reviewService = {
  create(requestId: string, payload: ReviewPayload): Promise<Review> {
    return apiClient.post<Review>(`/requests/${encodeURIComponent(requestId)}/review`, payload)
  },
  update(id: string, payload: Partial<ReviewPayload>): Promise<Review> {
    return apiClient.patch<Review>(`/reviews/${encodeURIComponent(id)}`, payload)
  },
  listForService(serviceId: string, query: ReviewQuery = {}): Promise<ReviewList> {
    return apiClient.get<ReviewList>(`/services/${encodeURIComponent(serviceId)}/reviews`, { ...query })
  },
  listReceived(query: ReviewQuery = {}): Promise<ReviewList> {
    return apiClient.get<ReviewList>('/provider/reviews', { ...query })
  },
  reply(id: string, text: string): Promise<Review> {
    return apiClient.put<Review>(`/provider/reviews/${encodeURIComponent(id)}/reply`, { text })
  },
}
