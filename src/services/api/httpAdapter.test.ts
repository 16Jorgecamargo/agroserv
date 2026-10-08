import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildUrl, createHttpAdapter } from './httpAdapter'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('buildUrl', () => {
  it('joins base url, path and non-empty query values', () => {
    expect(buildUrl('http://localhost:3333', '/services', { q: 'soja', page: 2, category: undefined, location: '' })).toBe(
      'http://localhost:3333/services?q=soja&page=2',
    )
    expect(buildUrl('http://api.test/v1/', '/services')).toBe('http://api.test/v1/services')
  })
})

describe('createHttpAdapter', () => {
  it('sends method, auth header and JSON body', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true }))
    vi.stubGlobal('fetch', fetchMock)
    const adapter = createHttpAdapter('http://api.test')
    const result = await adapter.request({ method: 'POST', path: '/auth/login', body: { a: 1 }, token: 'abc' })
    expect(result).toEqual({ ok: true })
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('http://api.test/auth/login')
    expect(init.method).toBe('POST')
    expect(init.headers.Authorization).toBe('Bearer abc')
    expect(init.headers['Content-Type']).toBe('application/json')
    expect(init.body).toBe('{"a":1}')
  })

  it('converts error responses into ApiError', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ code: 'unauthorized', message: 'Sem acesso' }, 401)))
    await expect(createHttpAdapter('http://api.test').request({ method: 'GET', path: '/auth/me' })).rejects.toMatchObject({
      status: 401,
      code: 'unauthorized',
      message: 'Sem acesso',
    })
  })

  it('converts network failures into ApiError with status 0', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    await expect(createHttpAdapter('http://api.test').request({ method: 'GET', path: '/x' })).rejects.toMatchObject({
      status: 0,
      code: 'network_error',
    })
  })

  it('returns undefined for 204', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })))
    await expect(createHttpAdapter('http://api.test').request({ method: 'DELETE', path: '/x' })).resolves.toBeUndefined()
  })
})
