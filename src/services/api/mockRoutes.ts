import { categories } from '../../data/categories'
import { providers } from '../../data/providers'
import { requestRecords } from '../../data/requests'
import { services, type ServiceRecord } from '../../data/services'
import { userCredentials, users } from '../../data/users'
import type {
  HttpMethod,
  LoginResponse,
  Paginated,
  ProducerDashboard,
  QueryValue,
  RequestConfig,
} from '../../types/api'
import type { RequestStatus, Service, ServiceDetail, ServiceRequest, User } from '../../types/entities'
import { isRequestStatus } from '../../utils/requestStatus'
import { ApiError } from './apiError'

interface RouteContext {
  params: Record<string, string>
  query: Record<string, QueryValue>
  body: unknown
  token: string | null
}

interface MockRoute {
  method: HttpMethod
  pattern: string
  handle: (context: RouteContext) => unknown
}

const TOKEN_PREFIX = 'mock.'
const DEFAULT_PAGE_SIZE = 9
const MAX_PAGE_SIZE = 60
const DEFAULT_FEATURED_LIMIT = 4
const MAX_FEATURED_LIMIT = 12
const RECENT_REQUESTS_LIMIT = 5
const OPEN_STATUSES: RequestStatus[] = ['pending', 'accepted']
const CONTRACTED_STATUSES: RequestStatus[] = ['accepted', 'in_progress', 'completed']

export function matchPath(pattern: string, path: string): Record<string, string> | null {
  const patternParts = pattern.split('/').filter(Boolean)
  const pathParts = path.split('/').filter(Boolean)
  if (patternParts.length !== pathParts.length) return null
  const params: Record<string, string> = {}
  for (let index = 0; index < patternParts.length; index += 1) {
    const patternPart = patternParts[index]
    const pathPart = pathParts[index]
    if (patternPart.startsWith(':')) {
      params[patternPart.slice(1)] = decodeURIComponent(pathPart)
    } else if (patternPart !== pathPart) {
      return null
    }
  }
  return params
}

export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function matchesAllTerms(haystack: string, search: string): boolean {
  const normalizedHaystack = normalizeText(haystack)
  return normalizeText(search)
    .split(' ')
    .every((term) => normalizedHaystack.includes(term))
}

function toPositiveInt(value: QueryValue, fallback: number, max: number): number {
  const parsed = typeof value === 'number' ? value : Number.parseInt(String(value ?? ''), 10)
  if (!Number.isFinite(parsed) || parsed < 1) return fallback
  return Math.min(Math.floor(parsed), max)
}

function toOptionalString(value: QueryValue): string | undefined {
  if (value === undefined) return undefined
  const text = String(value).trim()
  return text || undefined
}

function paginate<T>(items: T[], page: number, pageSize: number): Paginated<T> {
  const total = items.length
  const start = (page - 1) * pageSize
  return {
    data: items.slice(start, start + pageSize),
    meta: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
  }
}

function findUserByToken(token: string | null): User {
  const userId = token?.startsWith(TOKEN_PREFIX) ? token.slice(TOKEN_PREFIX.length) : null
  const user = userId ? users.find((candidate) => candidate.id === userId) : undefined
  if (!user) {
    throw new ApiError({ status: 401, code: 'unauthorized', message: 'Sessão inválida. Faça login novamente.' })
  }
  return user
}

function toService(record: ServiceRecord): Service {
  const provider = providers.find((candidate) => candidate.id === record.providerId)
  return { ...record, providerName: provider?.name ?? 'Prestador' }
}

function getCategoryName(categoryId: string): string {
  return categories.find((category) => category.id === categoryId)?.name ?? ''
}

function getUserRequests(userId: string): ServiceRequest[] {
  return requestRecords
    .filter((record) => record.producerId === userId)
    .map((record) => record.request)
    .sort((a, b) => b.scheduledDate.localeCompare(a.scheduledDate))
}

function login({ body }: RouteContext): LoginResponse {
  const { email, password } = (body ?? {}) as Record<string, unknown>
  if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
    throw new ApiError({ status: 400, code: 'validation_error', message: 'Informe e-mail e senha.' })
  }
  const user = users.find((candidate) => candidate.email.toLowerCase() === email.trim().toLowerCase())
  const credential = user ? userCredentials.find((candidate) => candidate.userId === user.id) : undefined
  if (!user || credential?.password !== password) {
    throw new ApiError({ status: 401, code: 'invalid_credentials', message: 'E-mail ou senha inválidos.' })
  }
  return { token: `${TOKEN_PREFIX}${user.id}`, user }
}

function listServices({ query }: RouteContext): Paginated<Service> {
  const search = toOptionalString(query.q)
  const location = toOptionalString(query.location)
  const categorySlug = toOptionalString(query.category)
  const page = toPositiveInt(query.page, 1, Number.MAX_SAFE_INTEGER)
  const pageSize = toPositiveInt(query.pageSize, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE)
  const category = categorySlug ? categories.find((candidate) => candidate.slug === categorySlug) : undefined
  if (categorySlug && !category) return paginate([], page, pageSize)

  const filtered = services.map(toService).filter((service) => {
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
  const limit = toPositiveInt(query.limit, DEFAULT_FEATURED_LIMIT, MAX_FEATURED_LIMIT)
  return services
    .filter((service) => service.available)
    .sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount)
    .slice(0, limit)
    .map(toService)
}

function getService({ params }: RouteContext): ServiceDetail {
  const record = services.find((service) => service.id === params.id)
  const provider = record ? providers.find((candidate) => candidate.id === record.providerId) : undefined
  const category = record ? categories.find((candidate) => candidate.id === record.categoryId) : undefined
  if (!record || !provider || !category) {
    throw new ApiError({ status: 404, code: 'service_not_found', message: 'Serviço não encontrado.' })
  }
  return { ...toService(record), provider, category }
}

function listRequests({ token, query }: RouteContext): ServiceRequest[] {
  const user = findUserByToken(token)
  const status = toOptionalString(query.status)
  if (status && status !== 'all' && !isRequestStatus(status)) {
    throw new ApiError({ status: 400, code: 'invalid_status', message: 'Status de solicitação inválido.' })
  }
  const userRequests = getUserRequests(user.id)
  return status && status !== 'all' ? userRequests.filter((request) => request.status === status) : userRequests
}

function getDashboard({ token }: RouteContext): ProducerDashboard {
  const user = findUserByToken(token)
  const userRequests = getUserRequests(user.id)
  const countBy = (statuses: RequestStatus[]) =>
    userRequests.filter((request) => statuses.includes(request.status)).length
  return {
    stats: {
      open: countBy(OPEN_STATUSES),
      inProgress: countBy(['in_progress']),
      completed: countBy(['completed']),
      totalSpent: userRequests
        .filter((request) => CONTRACTED_STATUSES.includes(request.status))
        .reduce((sum, request) => sum + request.value, 0),
    },
    recentRequests: userRequests.slice(0, RECENT_REQUESTS_LIMIT),
  }
}

const routes: MockRoute[] = [
  { method: 'POST', pattern: '/auth/login', handle: login },
  { method: 'GET', pattern: '/auth/me', handle: ({ token }) => findUserByToken(token) },
  { method: 'GET', pattern: '/categories', handle: () => categories },
  { method: 'GET', pattern: '/services/featured', handle: listFeaturedServices },
  { method: 'GET', pattern: '/services/:id', handle: getService },
  { method: 'GET', pattern: '/services', handle: listServices },
  { method: 'GET', pattern: '/requests', handle: listRequests },
  { method: 'GET', pattern: '/dashboard', handle: getDashboard },
]

export function handleMockRequest(config: RequestConfig): unknown {
  for (const route of routes) {
    if (route.method !== config.method) continue
    const params = matchPath(route.pattern, config.path)
    if (params) {
      return route.handle({ params, query: config.query ?? {}, body: config.body, token: config.token ?? null })
    }
  }
  throw new ApiError({
    status: 404,
    code: 'route_not_found',
    message: `Rota ${config.method} ${config.path} não encontrada.`,
  })
}
