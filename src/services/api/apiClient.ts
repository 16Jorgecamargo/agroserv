import type { HttpAdapter, QueryParams } from '../../types/api'
import { getToken } from '../../utils/storage'
import { createHttpAdapter } from './httpAdapter'
import { createMockAdapter } from './mockAdapter'

export function createApiClient(adapter: HttpAdapter, getAuthToken: () => string | null = getToken) {
  return {
    get<T>(path: string, query?: QueryParams): Promise<T> {
      return adapter.request<T>({ method: 'GET', path, query, token: getAuthToken() })
    },
    post<T>(path: string, body?: unknown): Promise<T> {
      return adapter.request<T>({ method: 'POST', path, body, token: getAuthToken() })
    },
  }
}

export const isMockMode = import.meta.env.VITE_API_MODE !== 'http'

function resolveAdapter(): HttpAdapter {
  if (!isMockMode) return createHttpAdapter(import.meta.env.VITE_API_URL ?? 'http://localhost:3333')
  return createMockAdapter(import.meta.env.MODE === 'test' ? { minDelayMs: 0, maxDelayMs: 0 } : {})
}

export const apiClient = createApiClient(resolveAdapter())
