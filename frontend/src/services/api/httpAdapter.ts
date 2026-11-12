import type { ApiErrorBody, HttpAdapter, QueryParams, RequestConfig } from '../../types/api'
import { ApiError } from './apiError'

interface ResponseEnvelope {
  success?: boolean
  data?: unknown
  error?: Partial<ApiErrorBody>
}

export function buildUrl(baseUrl: string, path: string, query?: QueryParams): string {
  const base = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
  const url = new URL(path.replace(/^\//, ''), base)

  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== '') url.searchParams.set(key, String(value))
  })

  return url.toString()
}

function encodeBody(body: unknown): BodyInit | undefined {
  if (body === undefined) return undefined
  return body instanceof FormData ? body : JSON.stringify(body)
}

export function createHttpAdapter(baseUrl: string): HttpAdapter {
  return {
    async request<T>({ method, path, query, body, token }: RequestConfig): Promise<T> {
      const headers: Record<string, string> = { Accept: 'application/json' }

      if (body !== undefined && !(body instanceof FormData)) headers['Content-Type'] = 'application/json'
      if (token) headers.Authorization = `Bearer ${token}`

      let response: Response

      try {
        response = await fetch(buildUrl(baseUrl, path, query), {
          method,
          headers,
          body: encodeBody(body),
        })
      } catch {
        throw new ApiError({
          status: 0,
          code: 'network_error',
          message: 'Não foi possível conectar ao servidor.',
        })
      }

      if (response.status === 204) return undefined as T

      const payload: unknown = await response.json().catch(() => null)
      const envelope = (payload ?? {}) as ResponseEnvelope

      if (!response.ok || envelope.success === false) {
        const error = envelope.error ?? {}

        throw new ApiError({
          status: error.status ?? response.status,
          code: error.code ?? 'http_error',
          message: error.message ?? 'Erro inesperado no servidor.',
          fields: error.fields,
        })
      }

      return envelope.data as T
    },
  }
}
