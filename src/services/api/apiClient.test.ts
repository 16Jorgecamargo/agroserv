import { describe, expect, it, vi } from 'vitest'
import { ApiError } from './apiError'
import type { HttpAdapter } from '../../types/api'
import { createApiClient } from './apiClient'

describe('createApiClient', () => {
  it('forwards requests with the current token', async () => {
    const request = vi.fn().mockResolvedValue('result')
    const adapter: HttpAdapter = { request }
    const client = createApiClient(adapter, () => 'token-1')
    await expect(client.get('/services', { q: 'soja' })).resolves.toBe('result')
    await client.post('/auth/login', { email: 'a' })
    expect(request).toHaveBeenNthCalledWith(1, { method: 'GET', path: '/services', query: { q: 'soja' }, token: 'token-1' })
    expect(request).toHaveBeenNthCalledWith(2, { method: 'POST', path: '/auth/login', body: { email: 'a' }, token: 'token-1' })
  })

  it('reports 401 responses on authenticated requests', async () => {
    const unauthorized = new ApiError({ status: 401, code: 'unauthorized', message: 'Sessão inválida.' })
    const adapter: HttpAdapter = { request: vi.fn().mockRejectedValue(unauthorized) }
    const onUnauthorized = vi.fn()
    const client = createApiClient(adapter, () => 'token-1', onUnauthorized)
    await expect(client.get('/requests')).rejects.toBe(unauthorized)
    expect(onUnauthorized).toHaveBeenCalledTimes(1)
  })

  it('does not report 401 without a token or other errors', async () => {
    const onUnauthorized = vi.fn()
    const unauthorized = new ApiError({ status: 401, code: 'invalid_credentials', message: 'x' })
    const anonymous = createApiClient({ request: vi.fn().mockRejectedValue(unauthorized) }, () => null, onUnauthorized)
    await expect(anonymous.post('/auth/login', {})).rejects.toBe(unauthorized)
    const failing = createApiClient(
      { request: vi.fn().mockRejectedValue(new ApiError({ status: 500, code: 'server_error', message: 'x' })) },
      () => 'token-1',
      onUnauthorized,
    )
    await expect(failing.get('/x')).rejects.toBeInstanceOf(ApiError)
    expect(onUnauthorized).not.toHaveBeenCalled()
  })
})
