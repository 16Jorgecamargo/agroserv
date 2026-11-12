import type { ApiErrorBody } from '../../types/api'

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly fields?: Record<string, string>

  constructor(body: ApiErrorBody) {
    super(body.message)
    this.name = 'ApiError'
    this.status = body.status
    this.code = body.code
    this.fields = body.fields
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}