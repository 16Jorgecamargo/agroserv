import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildUrl, createHttpAdapter } from './httpAdapter'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function successResponse(data: unknown, status = 200) {
  return jsonResponse({ success: true, data }, status)
}

function errorResponse(error: Record<string, unknown>, status: number) {
  return jsonResponse({ success: false, error: { status, ...error } }, status)
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('buildUrl', () => {
  it('joins base url, path and non-empty query values', () => {
    expect(
      buildUrl('http://localhost:3333', '/services', {
        q: 'soja',
        page: 2,
        category: undefined,
        location: '',
      }),
    ).toBe('http://localhost:3333/services?q=soja&page=2')

    expect(buildUrl('http://api.test/v1/', '/services')).toBe('http://api.test/v1/services')
  })
})

describe('createHttpAdapter', () => {
  it('sends method, auth header and JSON body', async () => {
    const fetchMock = vi.fn().mockResolvedValue(successResponse({ ok: true }))
    vi.stubGlobal('fetch', fetchMock)

    const adapter = createHttpAdapter('http://api.test')
    const result = await adapter.request({
      method: 'POST',
      path: '/auth/login',
      body: { a: 1 },
      token: 'abc',
    })

    expect(result).toEqual({ ok: true })

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('http://api.test/auth/login')
    expect(init.method).toBe('POST')
    expect(init.headers.Authorization).toBe('Bearer abc')
    expect(init.headers['Content-Type']).toBe('application/json')
    expect(init.body).toBe('{"a":1}')
  })

  it('converts error responses into ApiError', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        errorResponse({ code: 'unauthorized', message: 'Sem acesso' }, 401),
      ),
    )

    await expect(
      createHttpAdapter('http://api.test').request({
        method: 'GET',
        path: '/auth/me',
      }),
    ).rejects.toMatchObject({
      status: 401,
      code: 'unauthorized',
      message: 'Sem acesso',
    })
  })

  it('preserves field errors from a 422 response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        errorResponse(
          {
            code: 'validation_error',
            message: 'Revise os campos destacados.',
            fields: {
              email: 'Este e-mail já está cadastrado.',
            },
          },
          422,
        ),
      ),
    )

    await expect(
      createHttpAdapter('http://api.test').request({
        method: 'POST',
        path: '/auth/register',
        body: { email: 'cadastrado@agroserv.com' },
      }),
    ).rejects.toMatchObject({
      status: 422,
      code: 'validation_error',
      message: 'Revise os campos destacados.',
      fields: {
        email: 'Este e-mail já está cadastrado.',
      },
    })
  })

  it('unwraps paginated data without touching its inner shape', async () => {
    const page = { data: [{ id: 'svc-1' }], meta: { page: 1, pageSize: 12, total: 1, totalPages: 1 } }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(successResponse(page)))

    await expect(
      createHttpAdapter('http://api.test').request({ method: 'GET', path: '/services' }),
    ).resolves.toEqual(page)
  })

  it('treats an envelope with success false as an error even with status 200', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({ success: false, error: { status: 409, code: 'conflict', message: 'Conflito' } }),
      ),
    )

    await expect(
      createHttpAdapter('http://api.test').request({ method: 'POST', path: '/x', body: {} }),
    ).rejects.toMatchObject({ status: 409, code: 'conflict', message: 'Conflito' })
  })

  it('falls back to a generic error when the error body is not an envelope', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('Bad Gateway', { status: 502 })))

    await expect(
      createHttpAdapter('http://api.test').request({ method: 'GET', path: '/x' }),
    ).rejects.toMatchObject({ status: 502, code: 'http_error', message: 'Erro inesperado no servidor.' })
  })

  it('sends FormData as is and lets the browser set the multipart content type', async () => {
    const fetchMock = vi.fn().mockResolvedValue(successResponse({ id: 'upl-1' }, 201))
    vi.stubGlobal('fetch', fetchMock)
    const form = new FormData()
    form.append('purpose', 'avatar')

    await createHttpAdapter('http://api.test').request({
      method: 'POST',
      path: '/uploads',
      body: form,
      token: 'abc',
    })

    const [, init] = fetchMock.mock.calls[0]
    expect(init.body).toBe(form)
    expect(init.headers['Content-Type']).toBeUndefined()
    expect(init.headers.Authorization).toBe('Bearer abc')
  })

  it('converts network failures into ApiError with status 0', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    await expect(
      createHttpAdapter('http://api.test').request({
        method: 'GET',
        path: '/x',
      }),
    ).rejects.toMatchObject({
      status: 0,
      code: 'network_error',
    })
  })

  it('returns undefined for 204', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })))

    await expect(
      createHttpAdapter('http://api.test').request({
        method: 'DELETE',
        path: '/x',
      }),
    ).resolves.toBeUndefined()
  })
})