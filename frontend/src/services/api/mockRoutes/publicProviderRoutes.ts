import type { ProviderPublicProfile } from '../../../types/api'
import { getMockDatabase } from '../mockDatabase'
import { getProviderReviewSummary } from './reviewRoutes'
import { isServiceVisible, notFound, toProvider, toService } from './shared'
import type { MockRoute } from './types'

function buildProfile(providerId: string): ProviderPublicProfile {
  const database = getMockDatabase()
  const user = database.users.find((candidate) => candidate.id === providerId)
  const provider = toProvider(providerId)
  if (!user || user.role !== 'provider' || user.status !== 'active' || !provider) {
    notFound('provider_unavailable', 'Prestador não está mais na plataforma.')
  }

  return {
    provider,
    services: database.services.filter((service) => service.providerId === providerId && isServiceVisible(service)).map((service) => toService(service)),
    equipment: database.equipment.filter((item) => item.providerId === providerId),
    recentReviews: database.reviews
      .filter((review) => review.providerId === providerId && !review.hidden)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 5),
    reviewSummary: getProviderReviewSummary(providerId),
  }
}

export const publicProviderRoutes: MockRoute[] = [
  { method: 'GET', pattern: '/providers/:id', handle: ({ params }) => buildProfile(params.id) },
]
