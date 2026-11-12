import { describe, expect, it } from 'vitest'
import type { LoginResponse, RequestConfig } from '../../../types/api'
import { ApiError } from '../apiError'
import { getMockDatabase } from '../mockDatabase'
import { handleMockRequest } from '../mockRoutes'

const validPayload = {
  name: 'Ana Produtora',
  email: 'ana@agroserv.com',
  password: 'senha-segura',
  phone: '(45) 99999-0000',
  city: 'Toledo',
  state: 'PR',
  role: 'producer',
  acceptedTerms: true,
}

function register(body: unknown = validPayload): LoginResponse {
  const config: RequestConfig = { method: 'POST', path: '/auth/register', body }
  return handleMockRequest(config) as LoginResponse
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

describe('POST /auth/register', () => {
  it('creates a producer account, stores its credential and returns a session', () => {
    const result = register()
    const database = getMockDatabase()

    expect(result.token).toBe(`mock.${result.user.id}`)
    expect(result.user).toMatchObject({
      id: 'usr-2',
      name: 'Ana Produtora',
      email: 'ana@agroserv.com',
      role: 'producer',
      phone: '45999990000',
      city: 'Toledo',
      state: 'PR',
      status: 'active',
    })
    expect(database.userCredentials).toContainEqual({ userId: result.user.id, password: 'senha-segura' })
    expect(JSON.parse(localStorage.getItem('agroserv_mock_db') ?? '{}').database.users).toContainEqual(result.user)
    expect(database.providerProfiles.some((profile) => profile.userId === result.user.id)).toBe(false)
  })

  it('creates an empty provider profile and public provider record', () => {
    const result = register({ ...validPayload, role: 'provider' })
    const database = getMockDatabase()

    expect(result.user.id).toBe('prv-7')
    expect(database.providerProfiles.find((profile) => profile.userId === result.user.id)).toMatchObject({
      userId: 'prv-7',
      document: '',
      serviceRadiusKm: 50,
      yearsOfExperience: 0,
      description: '',
      verificationStatus: 'not_sent',
      rating: 0,
      reviewCount: 0,
    })
    expect(database.providers.find((provider) => provider.id === result.user.id)).toMatchObject({
      name: 'Ana Produtora',
      verified: false,
      serviceRadiusKm: 50,
    })
  })

  it('rejects an already registered email on the email field', () => {
    const error = captureError(() => register({ ...validPayload, email: ' PRODUTOR@agroserv.com ' }))

    expect(error.status).toBe(422)
    expect(error.fields).toEqual({ email: 'Este e-mail já está cadastrado.' })
  })

  it('validates required registration fields', () => {
    const error = captureError(() => register({ ...validPayload, phone: '123', state: 'XX', acceptedTerms: false }))

    expect(error.status).toBe(422)
    expect(error.fields).toEqual({
      phone: 'Informe um telefone válido.',
      state: 'Selecione a UF.',
      acceptedTerms: 'Aceite os termos de uso e a política de privacidade.',
    })
  })

  it('allows an email whose previous account was deleted', () => {
    const deletedUser = getMockDatabase().users.find((user) => user.id === 'usr-1')
    if (!deletedUser) throw new Error('Seed user was not found')
    deletedUser.email = 'ana@agroserv.com'
    deletedUser.status = 'deleted'
    const result = register()

    expect(deletedUser.status).toBe('deleted')
    expect(result.user.email).toBe('ana@agroserv.com')
  })
})
