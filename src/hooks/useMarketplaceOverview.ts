import { useMemo } from 'react'
import type { Service } from '../types/entities'
import { formatLocation } from '../utils/format'
import { useAllServices } from './useServices'

const NO_FILTERS = {}

export interface MarketplaceOverview {
  verifiedProviders: number
  averageRating: number | null
  cities: number
  providersByCity: Record<string, number>
}

export function summarizeServices(services: Service[]): MarketplaceOverview {
  const verifiedProviders = new Set<string>()
  const providersPerCity = new Map<string, Set<string>>()
  let ratingSum = 0
  let reviewTotal = 0

  services.forEach((service) => {
    if (service.providerVerified) verifiedProviders.add(service.providerId)
    const city = formatLocation(service.city, service.state)
    const providers = providersPerCity.get(city) ?? new Set<string>()
    providers.add(service.providerId)
    providersPerCity.set(city, providers)
    ratingSum += service.rating * service.reviewCount
    reviewTotal += service.reviewCount
  })

  return {
    verifiedProviders: verifiedProviders.size,
    averageRating: reviewTotal > 0 ? ratingSum / reviewTotal : null,
    cities: providersPerCity.size,
    providersByCity: Object.fromEntries([...providersPerCity].map(([city, providers]) => [city, providers.size])),
  }
}

export function useMarketplaceOverview() {
  const services = useAllServices(NO_FILTERS, true)
  const overview = useMemo(() => (services.data ? summarizeServices(services.data) : null), [services.data])
  return { overview, isLoading: services.isLoading, error: services.error }
}
