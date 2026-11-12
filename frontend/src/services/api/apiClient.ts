import type { HttpAdapter, QueryParams, RequestConfig } from '../../types/api'
import { getToken } from '../../utils/storage'
import { isApiError } from './apiError'
import { createHttpAdapter } from './httpAdapter'
import { createMockAdapter } from './mockAdapter'

type UnauthorizedListener = (token: string) => void
type MutationListener = () => void

const mutationListeners = new Set<MutationListener>()

export function subscribeMutations(listener: MutationListener): () => void {
  mutationListeners.add(listener)
  return () => {
    mutationListeners.delete(listener)
  }
}

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
      const result = await adapter.request<T>(config)
      if (config.method !== 'GET') mutationListeners.forEach((listener) => listener())
      return result
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
    patch<T>(path: string, body?: unknown): Promise<T> {
      return send<T>({ method: 'PATCH', path, body, token: getAuthToken() })
    },
    put<T>(path: string, body?: unknown): Promise<T> {
      return send<T>({ method: 'PUT', path, body, token: getAuthToken() })
    },
    delete<T>(path: string): Promise<T> {
      return send<T>({ method: 'DELETE', path, token: getAuthToken() })
    },
  }
}

export const isMockMode = import.meta.env.VITE_API_MODE !== 'http'

function resolveAdapter(): HttpAdapter {
  if (!isMockMode) return createHttpAdapter(import.meta.env.VITE_API_URL ?? 'http://localhost:3333')
  return createMockAdapter(import.meta.env.MODE === 'test' ? { minDelayMs: 0, maxDelayMs: 0 } : {})
}

export const apiClient = createApiClient(resolveAdapter())
