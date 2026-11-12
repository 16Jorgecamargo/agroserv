import type { HttpMethod, QueryValue } from '../../../types/api'

export interface RouteContext {
  params: Record<string, string>
  query: Record<string, QueryValue>
  body: unknown
  token: string | null
}

export interface MockRoute {
  method: HttpMethod
  pattern: string
  handle: (context: RouteContext) => unknown
}