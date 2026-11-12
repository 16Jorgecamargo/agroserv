import type { Paginated, QueryValue, ServiceSort } from '../../../types/api'
import type { PriceUnit, Service, ServiceDetail } from '../../../types/entities'
import { getMockDatabase } from '../mockDatabase'
import {
  findOptionalUser,
  findServiceRecord,
  getCategoryName,
  isServiceVisible,
  matchesAllTerms,
  paginate,
  serviceNotFound,
  toOptionalNumber,
  toOptionalString,
  toPositiveInt,
  toProvider,
  toService,
} from './shared'
import type { MockRoute, RouteContext } from './types'
import { addDays, getTodayInBrasilia, isDateOnly } from '../../../utils/date'

const PRICE_UNITS: PriceUnit[] = ['hectare', 'hour', 'day', 'trip']
const SORTS: ServiceSort[] = ['relevance', 'price_asc', 'price_desc', 'rating']

interface AdvancedFilters {
  priceUnit?: PriceUnit
  minPrice?: number
  maxPrice?: number
  minRating?: number
  verifiedOnly: boolean
  availableOn?: string
  sort: ServiceSort
}

function boundedNumber(value: QueryValue, min: number, max = Number.POSITIVE_INFINITY): number | undefined {
  const parsed = toOptionalNumber(value)
  return parsed !== undefined && parsed >= min && parsed <= max ? parsed : undefined
}

function parseAdvancedFilters(query: Record<string, QueryValue>): AdvancedFilters {
  const priceUnit = PRICE_UNITS.find((unit) => unit === query.priceUnit)
  const date = toOptionalString(query.date)
  return {
    priceUnit,
    minPrice: priceUnit ? boundedNumber(query.minPrice, 0) : undefined,
    maxPrice: priceUnit ? boundedNumber(query.maxPrice, 0) : undefined,
    minRating: boundedNumber(query.minRating, 1, 5),
    verifiedOnly: query.verified === true || query.verified === 'true',
    availableOn: date && isDateOnly(date) ? date : undefined,
    sort: SORTS.find((sort) => sort === query.sort) ?? 'relevance',
  }
}

function matchesAdvanced(service: Service, filters: AdvancedFilters, blocked: Set<string>): boolean {
  if (filters.priceUnit && service.priceUnit !== filters.priceUnit) return false
  if (filters.minPrice !== undefined && service.price < filters.minPrice) return false
  if (filters.maxPrice !== undefined && service.price > filters.maxPrice) return false
  if (filters.minRating !== undefined && service.rating < filters.minRating) return false
  if (filters.verifiedOnly && !service.providerVerified) return false
  if (filters.availableOn && (!service.available || blocked.has(service.providerId))) return false
  return true
}

function sortServices(services: Service[], sort: ServiceSort): Service[] {
  if (sort === 'price_asc') return [...services].sort((a, b) => a.price - b.price)
  if (sort === 'price_desc') return [...services].sort((a, b) => b.price - a.price)
  if (sort === 'rating') return [...services].sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount)
  return services
}

const DEFAULT_PAGE_SIZE = 9
const MAX_PAGE_SIZE = 60
const DEFAULT_FEATURED_LIMIT = 4
const MAX_FEATURED_LIMIT = 12

function listServices({ query }: RouteContext): Paginated<Service> {
  const database = getMockDatabase()
  const search = toOptionalString(query.q)
  const location = toOptionalString(query.location)
  const categorySlug = toOptionalString(query.category)
  const page = toPositiveInt(query.page, 1, Number.MAX_SAFE_INTEGER)
  const pageSize = toPositiveInt(query.pageSize, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE)
  const category = categorySlug
    ? database.categories.find((candidate) => candidate.slug === categorySlug && candidate.active)
    : undefined

  if (categorySlug && !category) return paginate([], page, pageSize)

  const advanced = parseAdvancedFilters(query)
  const blocked = new Set(
    advanced.availableOn ? database.blockedDays.filter((day) => day.date === advanced.availableOn).map((day) => day.providerId) : [],
  )

  const filtered = database.services
    .filter(isServiceVisible)
    .map((record) => toService(record))
    .filter((service) => {
      if (category && service.categoryId !== category.id) return false

      if (
        search &&
        !matchesAllTerms(
          `${service.title} ${service.description} ${service.providerName} ${getCategoryName(service.categoryId)} ${service.city}`,
          search,
        )
      ) {
        return false
      }

      if (location && !matchesAllTerms(`${service.city} ${service.state}`, location)) return false

      return matchesAdvanced(service, advanced, blocked)
    })

  return paginate(sortServices(filtered, advanced.sort), page, pageSize)
}

function listFeaturedServices({ query }: RouteContext): Service[] {
  const database = getMockDatabase()
  const limit = toPositiveInt(query.limit, DEFAULT_FEATURED_LIMIT, MAX_FEATURED_LIMIT)

  return database.services
    .filter((service) => service.available && isServiceVisible(service))
    .sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount)
    .slice(0, limit)
    .map((record) => toService(record))
}

export function buildServiceDetail(serviceId: string, includeHiddenReason: boolean): ServiceDetail {
  const database = getMockDatabase()
  const record = findServiceRecord(serviceId)
  const provider = record ? toProvider(record.providerId) : undefined
  const category = record ? database.categories.find((candidate) => candidate.id === record.categoryId) : undefined

  if (!record || !provider || !category) serviceNotFound()

  return {
    ...toService(record, includeHiddenReason),
    provider,
    category,
    equipment: database.equipment.filter((item) => record.equipmentIds.includes(item.id)),
  }
}

function getService({ params, token }: RouteContext): ServiceDetail {
  const record = findServiceRecord(params.id)
  const viewer = findOptionalUser(token)
  const isOwner = Boolean(record && viewer?.role === 'provider' && viewer.id === record.providerId)
  const isAdmin = viewer?.role === 'admin'

  if (!record || (!isServiceVisible(record) && !isOwner && !isAdmin)) serviceNotFound()

  return buildServiceDetail(params.id, isOwner || isAdmin)
}

function listBlockedDays({ params, query, token }: RouteContext): string[] {
  const record = findServiceRecord(params.id)
  const viewer = findOptionalUser(token)
  const canSee = record && (isServiceVisible(record) || viewer?.role === 'admin' || viewer?.id === record.providerId)
  if (!record || !canSee) serviceNotFound()

  const today = getTodayInBrasilia()
  const fromQuery = toOptionalString(query.from)
  const toQuery = toOptionalString(query.to)
  const from = fromQuery && isDateOnly(fromQuery) ? fromQuery : today
  const requestedTo = toQuery && isDateOnly(toQuery) ? toQuery : addDays(from, 90)
  const to = requestedTo > addDays(from, 366) ? addDays(from, 366) : requestedTo

  return getMockDatabase()
    .blockedDays.filter((day) => day.providerId === record.providerId && day.date >= from && day.date <= to)
    .map((day) => day.date)
    .sort()
}

export const catalogRoutes: MockRoute[] = [
  { method: 'GET', pattern: '/services/:id/blocked-days', handle: listBlockedDays },
  { method: 'GET', pattern: '/categories', handle: () => getMockDatabase().categories.filter((category) => category.active) },
  { method: 'GET', pattern: '/services/featured', handle: listFeaturedServices },
  { method: 'GET', pattern: '/services/:id', handle: getService },
  { method: 'GET', pattern: '/services', handle: listServices },
]
