import type { HttpAdapter, RequestConfig } from '../../types/api'
import { ApiError } from './apiError'
import { handleMockRequest } from './mockRoutes'

export interface MockAdapterOptions {
  minDelayMs?: number
  maxDelayMs?: number
  shouldFail?: (config: RequestConfig) => boolean
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isErrorForcedByUrl(config: RequestConfig): boolean {
  return (
    config.method === 'GET' &&
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).has('mockError')
  )
}

export function createMockAdapter({
  minDelayMs = 300,
  maxDelayMs = 600,
  shouldFail = isErrorForcedByUrl,
}: MockAdapterOptions = {}): HttpAdapter {
  return {
    async request<T>(config: RequestConfig): Promise<T> {
      await wait(minDelayMs + Math.random() * Math.max(0, maxDelayMs - minDelayMs))
      if (shouldFail(config)) {
        throw new ApiError({
          status: 500,
          code: 'server_error',
          message: 'Não foi possível carregar os dados. Tente novamente.',
        })
      }
      return JSON.parse(JSON.stringify(handleMockRequest(config))) as T
    },
  }
}
