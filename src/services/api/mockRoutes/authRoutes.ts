import type {
  ForgotPasswordResponse,
  LoginResponse,
  ResetPasswordResponse,
} from '../../../types/api'
import type { PasswordResetTokenRecord } from '../../../types/entities'
import { ApiError } from '../apiError'
import { getMockDatabase, persistMockDatabase } from '../mockDatabase'
import { findUserByToken } from './shared'
import type { MockRoute, RouteContext } from './types'

const PASSWORD_RESET_MESSAGE = 'Se o e-mail existir, enviaremos um link.'
const INVALID_RESET_TOKEN_MESSAGE = 'Link inválido ou expirado.'
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000

function getBody(body: unknown): Record<string, unknown> {
  return body && typeof body === 'object' && !Array.isArray(body) ? (body as Record<string, unknown>) : {}
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

function createResetToken(): string {
  return `reset-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

function forgotPassword({ body }: RouteContext): ForgotPasswordResponse {
  const { email: rawEmail } = getBody(body)

  if (typeof rawEmail !== 'string' || !rawEmail.trim()) {
    throw new ApiError({
      status: 422,
      code: 'validation_error',
      message: 'Revise os campos destacados.',
      fields: { email: 'Informe um e-mail válido.' },
    })
  }

  const database = getMockDatabase()
  const email = rawEmail.trim().toLowerCase()
  const user = database.users.find((candidate) => candidate.email.toLowerCase() === email && candidate.status !== 'deleted')

  if (!user) return { message: PASSWORD_RESET_MESSAGE }

  const now = new Date()
  database.passwordResetTokens.forEach((record) => {
    if (record.userId === user.id && !record.usedAt) record.usedAt = now.toISOString()
  })

  const resetToken = createResetToken()
  const tokenRecord: PasswordResetTokenRecord = {
    token: resetToken,
    userId: user.id,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + PASSWORD_RESET_TTL_MS).toISOString(),
  }
  database.passwordResetTokens.push(tokenRecord)
  persistMockDatabase()

  return { message: PASSWORD_RESET_MESSAGE, resetToken }
}

function resetPassword({ body }: RouteContext): ResetPasswordResponse {
  const { token, password } = getBody(body)
  const database = getMockDatabase()
  const now = new Date()
  const resetRecord = typeof token === 'string'
    ? database.passwordResetTokens.find((record) => record.token === token && !record.usedAt)
    : undefined
  const user = resetRecord ? database.users.find((candidate) => candidate.id === resetRecord.userId) : undefined
  const isValidToken = Boolean(
    resetRecord &&
      user &&
      user.status !== 'deleted' &&
      new Date(resetRecord.expiresAt).getTime() > now.getTime(),
  )
  const fields: Record<string, string> = {}

  if (!isValidToken) fields.token = INVALID_RESET_TOKEN_MESSAGE
  if (typeof password !== 'string' || password.length < 8) {
    fields.password = 'A senha precisa ter pelo menos 8 caracteres.'
  }

  if (Object.keys(fields).length > 0) {
    throw new ApiError({ status: 422, code: 'validation_error', message: 'Revise os campos destacados.', fields })
  }

  const credential = database.userCredentials.find((candidate) => candidate.userId === user?.id)
  if (!credential || !user || !resetRecord) {
    throw new ApiError({
      status: 422,
      code: 'validation_error',
      message: 'Revise os campos destacados.',
      fields: { token: INVALID_RESET_TOKEN_MESSAGE },
    })
  }

  credential.password = password as string
  database.passwordResetTokens.forEach((record) => {
    if (record.userId === user.id && !record.usedAt) record.usedAt = now.toISOString()
  })
  persistMockDatabase()

  return { message: 'Senha redefinida. Entre com a nova senha.' }
}

export const authRoutes: MockRoute[] = [
  { method: 'POST', pattern: '/auth/forgot-password', handle: forgotPassword },
  { method: 'POST', pattern: '/auth/reset-password', handle: resetPassword },
  { method: 'POST', pattern: '/auth/login', handle: login },
  { method: 'GET', pattern: '/auth/me', handle: ({ token }) => findUserByToken(token) },
]
