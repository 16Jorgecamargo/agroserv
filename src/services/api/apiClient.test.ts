import { describe, expect, it, vi } from 'vitest'
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
})
