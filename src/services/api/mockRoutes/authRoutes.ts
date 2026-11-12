import type { LoginResponse } from '../../../types/api'
import { ApiError } from '../apiError'
import { getMockDatabase } from '../mockDatabase'
import { findUserByToken } from './shared'
import type { MockRoute, RouteContext } from './types'

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

  if (!user || credential?.password !== password) {
    throw new ApiError({
      status: 401,
      code: 'invalid_credentials',
      message: 'E-mail ou senha inválidos.',
    })
  }

  return { token: `mock.${user.id}`, user }
}

export const authRoutes: MockRoute[] = [
  { method: 'POST', pattern: '/auth/login', handle: login },
  { method: 'GET', pattern: '/auth/me', handle: ({ token }) => findUserByToken(token) },
]