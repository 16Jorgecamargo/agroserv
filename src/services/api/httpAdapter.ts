import type { ApiErrorBody, HttpAdapter, QueryParams, RequestConfig } from '../../types/api'
import { ApiError } from './apiError'

export function buildUrl(baseUrl: string, path: string, query?: QueryParams): string {
  const base = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
  const url = new URL(path.replace(/^\//, ''), base)
  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== '') url.searchParams.set(key, String(value))
  })
  return url.toString()
}

export function createHttpAdapter(baseUrl: string): HttpAdapter {
  return {
    async request<T>({ method, path, query, body, token }: RequestConfig): Promise<T> {
      const headers: Record<string, string> = { Accept: 'application/json' }
      if (body !== undefined) headers['Content-Type'] = 'application/json'
      if (token) headers.Authorization = `Bearer ${token}`

      let response: Response
      try {
        response = await fetch(buildUrl(baseUrl, path, query), {
          method,
          headers,
          body: body === undefined ? undefined : JSON.stringify(body),
        })
      } catch {
        throw new ApiError({ status: 0, code: 'network_error', message: 'Não foi possível conectar ao servidor.' })
      }

      if (response.status === 204) return undefined as T
      const data: unknown = await response.json().catch(() => null)
      if (!response.ok) {
        const errorBody = (data ?? {}) as Partial<ApiErrorBody>
        throw new ApiError({
          status: response.status,
          code: errorBody.code ?? 'http_error',
          message: errorBody.message ?? 'Erro inesperado no servidor.',
        })
      }
      return data as T
    },
  }
}
