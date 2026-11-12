import { describe, expect, it } from 'vitest'
import type { Category } from '../../types/entities'
import { ApiError } from './apiError'
import { createMockAdapter } from './mockAdapter'

describe('createMockAdapter', () => {
  it('resolves routes and returns copies of the data', async () => {
    const adapter = createMockAdapter({ minDelayMs: 0, maxDelayMs: 0, shouldFail: () => false })
    const first = await adapter.request<Category[]>({ method: 'GET', path: '/categories' })
    first[0].name = 'Alterado'
    const second = await adapter.request<Category[]>({ method: 'GET', path: '/categories' })
    expect(second).toHaveLength(8)
    expect(second[0].name).toBe('Plantio')
  })

  it('rejects with ApiError when forced to fail', async () => {
    const adapter = createMockAdapter({ minDelayMs: 0, maxDelayMs: 0, shouldFail: () => true })
    await expect(adapter.request({ method: 'GET', path: '/categories' })).rejects.toMatchObject({
      status: 500,
      code: 'server_error',
    })
  })

  it('propagates route errors as ApiError', async () => {
    const adapter = createMockAdapter({ minDelayMs: 0, maxDelayMs: 0, shouldFail: () => false })
    await expect(adapter.request({ method: 'GET', path: '/services/x' })).rejects.toBeInstanceOf(ApiError)
  })
})
