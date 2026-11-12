import { describe, expect, it } from 'vitest'
import type { ForgotPasswordResponse, RequestConfig, ResetPasswordResponse } from '../../../types/api'
import { ApiError } from '../apiError'
import { getMockDatabase } from '../mockDatabase'
import { handleMockRequest } from '../mockRoutes'

const GENERIC_MESSAGE = 'Se o e-mail existir, enviaremos um link.'
const INVALID_TOKEN_MESSAGE = 'Link inválido ou expirado.'

function post<T>(path: string, body: unknown): T {
  const config: RequestConfig = { method: 'POST', path, body }
  return handleMockRequest(config) as T
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

function requestResetLink(email = 'produtor@agroserv.com'): ForgotPasswordResponse {
  return post('/auth/forgot-password', { email })
}

describe('password recovery mock routes', () => {
  it('returns the same message for an existing email and exposes a reset token in the mock', () => {
    const response = requestResetLink()

    expect(response.message).toBe(GENERIC_MESSAGE)
    expect(response.resetToken).toBeTruthy()
    expect(getMockDatabase().passwordResetTokens).toHaveLength(1)
    expect(JSON.parse(localStorage.getItem('agroserv_mock_db') ?? '{}').database.passwordResetTokens).toHaveLength(1)
  })

  it('returns the same message without a reset token for an unknown email', () => {
    const response = requestResetLink('nao-existe@agroserv.com')

    expect(response).toEqual({ message: GENERIC_MESSAGE })
    expect(getMockDatabase().passwordResetTokens).toHaveLength(0)
  })

  it('invalidates the previous token when a new reset is requested', () => {
    const first = requestResetLink()
    const second = requestResetLink()

    expect(second.resetToken).not.toBe(first.resetToken)
    expect(getMockDatabase().passwordResetTokens[0].usedAt).toBeTruthy()
    expect(getMockDatabase().passwordResetTokens[1].usedAt).toBeUndefined()
  })

  it('changes the password, marks the token used and allows login with the new password', () => {
    const { resetToken } = requestResetLink()
    if (!resetToken) throw new Error('Mock reset token was not returned')

    const response = post<ResetPasswordResponse>('/auth/reset-password', {
      token: resetToken,
      password: 'nova-senha-segura',
    })

    expect(response.message).toBe('Senha redefinida. Entre com a nova senha.')
    expect(getMockDatabase().userCredentials.find((credential) => credential.userId === 'usr-1')?.password).toBe(
      'nova-senha-segura',
    )
    expect(getMockDatabase().passwordResetTokens[0].usedAt).toBeTruthy()
    expect(post('/auth/login', { email: 'produtor@agroserv.com', password: 'nova-senha-segura' })).toMatchObject({
      token: 'mock.usr-1',
    })
  })

  it('rejects missing, expired and previously used tokens with a token field error', () => {
    const missing = captureError(() => post('/auth/reset-password', { token: 'missing', password: 'nova-senha-segura' }))
    expect(missing.fields).toEqual({ token: INVALID_TOKEN_MESSAGE })

    const { resetToken } = requestResetLink()
    if (!resetToken) throw new Error('Mock reset token was not returned')
    const record = getMockDatabase().passwordResetTokens.find((candidate) => candidate.token === resetToken)
    if (!record) throw new Error('Reset token record was not found')
    record.expiresAt = '2020-01-01T00:00:00.000Z'

    const expired = captureError(() => post('/auth/reset-password', { token: resetToken, password: 'nova-senha-segura' }))
    expect(expired.fields).toEqual({ token: INVALID_TOKEN_MESSAGE })

    record.expiresAt = new Date(Date.now() + 60_000).toISOString()
    record.usedAt = new Date().toISOString()
    const used = captureError(() => post('/auth/reset-password', { token: resetToken, password: 'nova-senha-segura' }))
    expect(used.fields).toEqual({ token: INVALID_TOKEN_MESSAGE })
  })

  it('validates the new password length', () => {
    const { resetToken } = requestResetLink()
    const error = captureError(() => post('/auth/reset-password', { token: resetToken, password: 'curta' }))

    expect(error.status).toBe(422)
    expect(error.fields).toEqual({ password: 'A senha precisa ter pelo menos 8 caracteres.' })
  })
})
