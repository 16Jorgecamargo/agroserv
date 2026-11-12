import type { Paginated } from '../../../types/api'
import type { Service, ServiceDetail } from '../../../types/entities'
import { getMockDatabase } from '../mockDatabase'
import { ApiError } from '../apiError'
import {
  getCategoryName,
  matchesAllTerms,
  paginate,
  toOptionalString,
  toPositiveInt,
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
    ? database.categories.find((candidate) => candidate.slug === categorySlug)
    : undefined

  if (categorySlug && !category) return paginate([], page, pageSize)

  const filtered = database.services
    .filter((record) => database.users.find((user) => user.id === record.providerId)?.status !== 'deleted')
    .map(toService)
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
    .filter((service) => service.available && database.users.find((user) => user.id === service.providerId)?.status !== 'deleted')
    .sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount)
    .slice(0, limit)
    .map(toService)
}

function getService({ params }: RouteContext): ServiceDetail {
  const database = getMockDatabase()
  const record = database.services.find((service) => service.id === params.id)
  const provider = record
    ? database.providers.find((candidate) => candidate.id === record.providerId)
    : undefined
  const category = record
    ? database.categories.find((candidate) => candidate.id === record.categoryId)
    : undefined

  const providerUser = record ? database.users.find((candidate) => candidate.id === record.providerId) : undefined

  if (!record || !provider || !category || providerUser?.status === 'deleted') {
    throw new ApiError({
      status: 404,
      code: 'service_not_found',
      message: 'Serviço não encontrado.',
    })
  }

  return { ...toService(record), provider, category }
}

export const catalogRoutes: MockRoute[] = [
  { method: 'GET', pattern: '/categories', handle: () => getMockDatabase().categories },
  { method: 'GET', pattern: '/services/featured', handle: listFeaturedServices },
  { method: 'GET', pattern: '/services/:id', handle: getService },
  { method: 'GET', pattern: '/services', handle: listServices },
]
