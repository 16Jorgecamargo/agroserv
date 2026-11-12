import { beforeEach, describe, expect, it } from 'vitest'
import type { LoginResponse, RequestConfig } from '../../types/api'
import type { ServiceDetail, UserStatus } from '../../types/entities'
import { ApiError } from './apiError'
import { getMockDatabase, resetMockDatabase } from './mockDatabase'
import { handleMockRequest } from './mockRoutes'

function captureError(action: () => unknown): ApiError {
  try {
    action()
  } catch (error) {
    if (error instanceof ApiError) return error
    throw error
  }

  throw new Error('Expected ApiError to be thrown')
}

function get(path: string, token?: string): unknown {
  const config: RequestConfig = {
    method: 'GET',
    path,
    token,
  }

  return handleMockRequest(config)
}

describe('F1-02 demo accounts', () => {
  beforeEach(() => {
    resetMockDatabase()
  })

  it('seeds the producer, six providers and administrator demo accounts', () => {
    const database = getMockDatabase()

    expect(database.users.filter((user) => user.role === 'provider').map((user) => user.id)).toEqual([
      'prv-1',
      'prv-2',
      'prv-3',
      'prv-4',
      'prv-5',
      'prv-6',
    ])
    expect(database.users.find((user) => user.role === 'producer')?.id).toBe('usr-1')
    expect(database.users.find((user) => user.role === 'admin')?.id).toBe('adm-1')
    expect(database.providerProfiles).toHaveLength(6)
  })

  it('allows login to every seeded demo account with the demo password', () => {
    const accounts = [
      ['produtor@agroserv.com', 'usr-1', 'producer'],
      ['prestador@agroserv.com', 'prv-1', 'provider'],
      ['prestador2@agroserv.com', 'prv-2', 'provider'],
      ['prestador3@agroserv.com', 'prv-3', 'provider'],
      ['prestador4@agroserv.com', 'prv-4', 'provider'],
      ['prestador5@agroserv.com', 'prv-5', 'provider'],
      ['prestador6@agroserv.com', 'prv-6', 'provider'],
      ['admin@agroserv.com', 'adm-1', 'admin'],
    ] as const

    for (const [email, id, role] of accounts) {
      const result = handleMockRequest({
        method: 'POST',
        path: '/auth/login',
        body: { email, password: '123456' },
      }) as LoginResponse

      expect(result.user.id).toBe(id)
      expect(result.user.role).toBe(role)
    }
  })

  it('returns the provider verification status in service details', () => {
    const verified = get('/services/svc-1') as ServiceDetail
    const underReview = get('/services/svc-4') as ServiceDetail

    expect(verified.provider.verified).toBe(true)
    expect(underReview.provider.verified).toBe(false)
  })
})

describe('mock authorization', () => {
  beforeEach(() => {
    resetMockDatabase()
  })

  it.each(['suspended', 'deleted'] satisfies UserStatus[])(
    'rejects authenticated requests for a %s account with 401',
    (status) => {
      const user = getMockDatabase().users.find((candidate) => candidate.id === 'usr-1')
      if (!user) throw new Error('Demo producer account not found')

      user.status = status

      const error = captureError(() => get('/auth/me', 'mock.usr-1'))

      expect(error.status).toBe(401)
      expect(error.code).toBe('unauthorized')
    },
  )

  it('returns the specific error when a suspended user tries to log in', () => {
    const user = getMockDatabase().users.find((candidate) => candidate.id === 'usr-1')
    if (!user) throw new Error('Demo producer account not found')

    user.status = 'suspended'

    const error = captureError(() =>
      handleMockRequest({
        method: 'POST',
        path: '/auth/login',
        body: { email: user.email, password: '123456' },
      }),
    )

    expect(error.status).toBe(403)
    expect(error.code).toBe('account_suspended')
    expect(error.message).toBe('Sua conta está suspensa. Entre em contato com o suporte.')
  })

  it.each(['mock.prv-1', 'mock.adm-1'])(
    'rejects a non-producer role from producer routes with 403',
    (token) => {
      const error = captureError(() => get('/requests', token))

      expect(error.status).toBe(403)
      expect(error.code).toBe('forbidden')
    },
  )
})