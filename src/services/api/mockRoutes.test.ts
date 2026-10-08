import { describe, expect, it } from 'vitest'
import type { LoginResponse, Paginated, ProducerDashboard } from '../../types/api'
import type { Service, ServiceDetail, ServiceRequest, User } from '../../types/entities'
import { ApiError } from './apiError'
import { handleMockRequest, matchPath, normalizeText } from './mockRoutes'

const TOKEN = 'mock.usr-1'

function get<T>(path: string, query?: Record<string, string | number | undefined>, token: string | null = null) {
  return handleMockRequest({ method: 'GET', path, query, token }) as T
}

function captureError(action: () => unknown): ApiError {
  try {
    action()
  } catch (error) {
    if (error instanceof ApiError) return error
    throw error
  }
  throw new Error('Expected ApiError to be thrown')
}

describe('matchPath', () => {
  it('extracts params and rejects mismatches', () => {
    expect(matchPath('/services/:id', '/services/svc-1')).toEqual({ id: 'svc-1' })
    expect(matchPath('/services', '/services')).toEqual({})
    expect(matchPath('/services/:id', '/services')).toBeNull()
    expect(matchPath('/services/:id', '/requests/1')).toBeNull()
  })
})

describe('normalizeText', () => {
  it('removes accents, case and punctuation', () => {
    expect(normalizeText('  Santa Helena, PR ')).toBe('santa helena pr')
    expect(normalizeText('PULVERIZAÇÃO')).toBe('pulverizacao')
  })
})

describe('GET /services', () => {
  it('paginates with default page size 9', () => {
    const result = get<Paginated<Service>>('/services')
    expect(result.data).toHaveLength(9)
    expect(result.meta).toEqual({ page: 1, pageSize: 9, total: 12, totalPages: 2 })
    expect(get<Paginated<Service>>('/services', { page: '2' }).data).toHaveLength(3)
  })

  it('includes the provider name', () => {
    const [first] = get<Paginated<Service>>('/services').data
    expect(first.providerName).toBe('Agro Máquinas Paraná')
  })

  it('filters by category slug', () => {
    const result = get<Paginated<Service>>('/services', { category: 'pulverizacao' })
    expect(result.meta.total).toBe(2)
    expect(result.data.every((service) => service.categoryId === 'cat-spraying')).toBe(true)
  })

  it('returns an empty page for an unknown category', () => {
    expect(get<Paginated<Service>>('/services', { category: 'inexistente' }).meta.total).toBe(0)
  })

  it('searches ignoring accents and case', () => {
    const ids = get<Paginated<Service>>('/services', { q: 'PULVERIZACAO' }).data.map((service) => service.id)
    expect(ids).toEqual(['svc-1', 'svc-10'])
  })

  it('requires every search term', () => {
    const ids = get<Paginated<Service>>('/services', { q: 'pulverizacao drone' }).data.map((service) => service.id)
    expect(ids).toEqual(['svc-10'])
  })

  it('filters by location ignoring punctuation', () => {
    const ids = get<Paginated<Service>>('/services', { location: 'Santa Helena, PR' }).data.map((service) => service.id)
    expect(ids).toEqual(['svc-1', 'svc-5'])
  })

  it('caps page size and ignores invalid numbers', () => {
    const result = get<Paginated<Service>>('/services', { page: 'abc', pageSize: '500' })
    expect(result.meta.page).toBe(1)
    expect(result.meta.pageSize).toBe(60)
    expect(result.data).toHaveLength(12)
  })
})

describe('GET /services/featured and /services/:id', () => {
  it('returns available services sorted by rating', () => {
    const featured = get<Service[]>('/services/featured', { limit: 4 })
    expect(featured.map((service) => service.id)).toEqual(['svc-1', 'svc-3', 'svc-10', 'svc-2'])
    expect(featured.every((service) => service.available)).toBe(true)
  })

  it('returns detail with provider and category', () => {
    const detail = get<ServiceDetail>('/services/svc-1')
    expect(detail.provider.name).toBe('Agro Máquinas Paraná')
    expect(detail.category.slug).toBe('pulverizacao')
  })

  it('throws 404 for an unknown service', () => {
    const error = captureError(() => get('/services/nao-existe'))
    expect(error.status).toBe(404)
    expect(error.code).toBe('service_not_found')
  })
})

describe('auth routes', () => {
  it('logs in with trimmed, case-insensitive email', () => {
    const result = handleMockRequest({
      method: 'POST',
      path: '/auth/login',
      body: { email: '  PRODUTOR@agroserv.com ', password: '123456' },
    }) as LoginResponse
    expect(result.token).toBe(TOKEN)
    expect(result.user.email).toBe('produtor@agroserv.com')
    expect(result.user).not.toHaveProperty('password')
  })

  it('rejects wrong password with 401', () => {
    const error = captureError(() =>
      handleMockRequest({ method: 'POST', path: '/auth/login', body: { email: 'produtor@agroserv.com', password: 'x' } }),
    )
    expect(error.status).toBe(401)
    expect(error.message).toBe('E-mail ou senha inválidos.')
  })

  it('rejects missing fields with 400', () => {
    expect(captureError(() => handleMockRequest({ method: 'POST', path: '/auth/login', body: {} })).status).toBe(400)
  })

  it('returns the current user for a valid token and 401 otherwise', () => {
    expect(get<User>('/auth/me', undefined, TOKEN).id).toBe('usr-1')
    expect(captureError(() => get('/auth/me', undefined, 'mock.usr-999')).status).toBe(401)
    expect(captureError(() => get('/auth/me')).status).toBe(401)
  })
})

describe('private routes', () => {
  it('requires a token for requests', () => {
    expect(captureError(() => get('/requests')).status).toBe(401)
  })

  it('lists requests sorted by date descending', () => {
    const ids = get<ServiceRequest[]>('/requests', undefined, TOKEN).map((request) => request.id)
    expect(ids).toEqual(['req-8', 'req-3', 'req-1', 'req-2', 'req-4', 'req-5', 'req-6', 'req-7'])
  })

  it('filters requests by status and rejects invalid status', () => {
    expect(get<ServiceRequest[]>('/requests', { status: 'completed' }, TOKEN)).toHaveLength(3)
    expect(get<ServiceRequest[]>('/requests', { status: 'all' }, TOKEN)).toHaveLength(8)
    expect(captureError(() => get('/requests', { status: 'invalido' }, TOKEN)).status).toBe(400)
  })

  it('builds the producer dashboard', () => {
    const dashboard = get<ProducerDashboard>('/dashboard', undefined, TOKEN)
    expect(dashboard.stats).toEqual({ open: 3, inProgress: 1, completed: 3, totalSpent: 10260 })
    expect(dashboard.recentRequests.map((request) => request.id)).toEqual(['req-8', 'req-3', 'req-1', 'req-2', 'req-4'])
  })
})

describe('unknown routes', () => {
  it('throws 404', () => {
    expect(captureError(() => get('/nada')).code).toBe('route_not_found')
  })
})
