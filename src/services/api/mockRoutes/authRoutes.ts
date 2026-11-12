import type { LoginResponse } from '../../../types/api'
import type { Provider, ProviderProfile, Role, User } from '../../../types/entities'
import { ApiError } from '../apiError'
import { getMockDatabase, persistMockDatabase } from '../mockDatabase'
import { findUserByToken } from './shared'
import type { MockRoute, RouteContext } from './types'
import { isValidEmail, brazilianStates } from '../../../utils/validators'

function nextId(prefix: string, existingIds: string[]): string {
  let index = 1
  while (existingIds.includes(`${prefix}-${index}`)) index += 1
  return `${prefix}-${index}`
}

function validateRegistration(payload: Record<string, unknown>, users: User[]): Record<string, string> {
  const fields: Record<string, string> = {}
  const name = typeof payload.name === 'string' ? payload.name.trim() : ''
  const email = typeof payload.email === 'string' ? payload.email.trim() : ''
  const password = typeof payload.password === 'string' ? payload.password : ''
  const phone = typeof payload.phone === 'string' ? payload.phone.replace(/\D/g, '') : ''
  const city = typeof payload.city === 'string' ? payload.city.trim() : ''

  if (name.length < 2 || name.length > 120) fields.name = 'Informe seu nome.'
  if (!isValidEmail(email)) fields.email = 'Informe um e-mail válido.'
  else if (users.some((user) => user.status !== 'deleted' && user.email.toLowerCase() === email.toLowerCase())) {
    fields.email = 'Este e-mail já está cadastrado.'
  }
  if (password.length < 8) fields.password = 'A senha precisa ter pelo menos 8 caracteres.'
  if (phone.length !== 10 && phone.length !== 11) fields.phone = 'Informe um telefone válido.'
  if (city.length < 2 || city.length > 80) fields.city = 'Informe sua cidade.'
  if (typeof payload.state !== 'string' || !brazilianStates.some((state) => state.value === payload.state)) {
    fields.state = 'Selecione a UF.'
  }
  if (payload.role !== 'producer' && payload.role !== 'provider') {
    fields.role = 'Escolha como você vai usar o AgroServ.'
  }
  if (payload.acceptedTerms !== true) {
    fields.acceptedTerms = 'Aceite os termos de uso e a política de privacidade.'
  }

  return fields
}

function register({ body }: RouteContext): LoginResponse {
  const payload = body && typeof body === 'object' && !Array.isArray(body) ? (body as Record<string, unknown>) : {}
  const database = getMockDatabase()
  const fields = validateRegistration(payload, database.users)

  if (Object.keys(fields).length > 0) {
    throw new ApiError({ status: 422, code: 'validation_error', message: 'Revise os campos destacados.', fields })
  }

  const role = payload.role as Exclude<Role, 'admin'>
  const id = nextId(role === 'provider' ? 'prv' : 'usr', database.users.map((user) => user.id))
  const name = (payload.name as string).trim()
  const email = (payload.email as string).trim().toLowerCase()
  const city = (payload.city as string).trim()
  const state = payload.state as string
  const phone = (payload.phone as string).replace(/\D/g, '')
  const createdAt = new Date().toISOString()
  const user: User = { id, name, email, role, phone, city, state, status: 'active', createdAt }

  database.users.push(user)
  database.userCredentials.push({ userId: id, password: payload.password as string })

  if (role === 'provider') {
    const profile: ProviderProfile = {
      userId: id,
      document: '',
      serviceRadiusKm: 50,
      yearsOfExperience: 0,
      description: '',
      verificationStatus: 'not_sent',
      rating: 0,
      reviewCount: 0,
    }
    const provider: Provider = {
      id,
      name,
      city,
      state,
      rating: 0,
      reviewCount: 0,
      yearsOfExperience: 0,
      verified: false,
      serviceRadiusKm: 50,
      description: '',
    }
    database.providerProfiles.push(profile)
    database.providers.push(provider)
  }

  persistMockDatabase()
  return { token: `mock.${id}`, user }
}

function login({ body }: RouteContext): LoginResponse {
  const { email, password } = (body ?? {}) as Record<string, unknown>

  if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
    throw new ApiError({
      status: 400,
      code: 'validation_error',
      message: 'Informe e-mail e senha.',
    })
  }

  const database = getMockDatabase()
  const user = database.users.find((candidate) => candidate.email.toLowerCase() === email.trim().toLowerCase())
  const credential = user
    ? database.userCredentials.find((candidate) => candidate.userId === user.id)
    : undefined

  if (!user || credential?.password !== password || user.status === 'deleted') {
    throw new ApiError({
      status: 401,
      code: 'invalid_credentials',
      message: 'E-mail ou senha inválidos.',
    })
  }

  if (user.status === 'suspended') {
    throw new ApiError({
      status: 403,
      code: 'account_suspended',
      message: 'Sua conta está suspensa. Entre em contato com o suporte.',
    })
  }

  return { token: `mock.${user.id}`, user }
}

export const authRoutes: MockRoute[] = [
  { method: 'POST', pattern: '/auth/register', handle: register },
  { method: 'POST', pattern: '/auth/login', handle: login },
  { method: 'GET', pattern: '/auth/me', handle: ({ token }) => findUserByToken(token) },
]
