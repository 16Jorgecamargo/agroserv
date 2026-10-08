import type { HttpAdapter, QueryParams, RequestConfig } from '../../types/api'
import { getToken } from '../../utils/storage'
import { isApiError } from './apiError'
import { createHttpAdapter } from './httpAdapter'
import { createMockAdapter } from './mockAdapter'

type UnauthorizedListener = (token: string) => void

const unauthorizedListeners = new Set<UnauthorizedListener>()

export function subscribeUnauthorized(listener: UnauthorizedListener): () => void {
  unauthorizedListeners.add(listener)
  return () => {
    unauthorizedListeners.delete(listener)
  }
}

function notifyUnauthorized(token: string): void {
  unauthorizedListeners.forEach((listener) => listener(token))
}

export function createApiClient(
  adapter: HttpAdapter,
  getAuthToken: () => string | null = getToken,
  onUnauthorized: UnauthorizedListener = notifyUnauthorized,
) {
  async function send<T>(config: RequestConfig): Promise<T> {
    try {
      return await adapter.request<T>(config)
    } catch (error) {
      if (config.token && isApiError(error) && error.status === 401) onUnauthorized(config.token)
      throw error
    }
  }

  return {
    get<T>(path: string, query?: QueryParams): Promise<T> {
      return send<T>({ method: 'GET', path, query, token: getAuthToken() })
    },
    post<T>(path: string, body?: unknown): Promise<T> {
      return send<T>({ method: 'POST', path, body, token: getAuthToken() })
    },
  }
}

export const isMockMode = import.meta.env.VITE_API_MODE !== 'http'

function resolveAdapter(): HttpAdapter {
  if (!isMockMode) return createHttpAdapter(import.meta.env.VITE_API_URL ?? 'http://localhost:3333')
  return createMockAdapter(import.meta.env.MODE === 'test' ? { minDelayMs: 0, maxDelayMs: 0 } : {})
}

export const apiClient = createApiClient(resolveAdapter())
