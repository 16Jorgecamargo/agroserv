import type { HttpMethod, QueryParams } from '../types/api'
import { ApiError } from '../services/api/apiError'
import { handleMockRequest } from '../services/api/mockRoutes'

interface CallOptions {
  body?: unknown
  token?: string | null
  query?: QueryParams
}

export function call<T>(method: HttpMethod, path: string, { body, token = null, query }: CallOptions = {}): T {
  return handleMockRequest({ method, path, body, token, query }) as T
}

export async function callAsync<T>(method: HttpMethod, path: string, options: CallOptions = {}): Promise<T> {
  return (await call<Promise<T> | T>(method, path, options)) as T
}

export function captureError(action: () => unknown): ApiError {
  try {
    action()
  } catch (error) {
    if (error instanceof ApiError) return error
    throw error
  }
  throw new Error('Expected ApiError to be thrown')
}

export async function captureErrorAsync(action: () => Promise<unknown>): Promise<ApiError> {
  try {
    await action()
  } catch (error) {
    if (error instanceof ApiError) return error
    throw error
  }
  throw new Error('Expected ApiError to be thrown')
}

export const tokens = {
  producer: 'mock.usr-1',
  provider: 'mock.prv-1',
  otherProvider: 'mock.prv-2',
  admin: 'mock.adm-1',
}
