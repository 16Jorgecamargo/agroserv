import type { Paginated } from '../../../types/api'
import type { Service, ServiceDetail } from '../../../types/entities'
import { getMockDatabase } from '../mockDatabase'
import {
  findOptionalUser,
  findServiceRecord,
  getCategoryName,
  isServiceVisible,
  matchesAllTerms,
  paginate,
  serviceNotFound,
  toOptionalString,
  toPositiveInt,
  toProvider,
  toService,
} from './shared'
import type { MockRoute, RouteContext } from './types'

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

      return true
    })

  return paginate(filtered, page, pageSize)
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

export const catalogRoutes: MockRoute[] = [
  { method: 'GET', pattern: '/categories', handle: () => getMockDatabase().categories.filter((category) => category.active) },
  { method: 'GET', pattern: '/services/featured', handle: listFeaturedServices },
  { method: 'GET', pattern: '/services/:id', handle: getService },
  { method: 'GET', pattern: '/services', handle: listServices },
]
