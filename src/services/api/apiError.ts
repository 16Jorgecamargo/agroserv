import type { ApiErrorBody } from '../../types/api'

export class ApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(body: ApiErrorBody) {
    super(body.message)
    this.name = 'ApiError'
    this.status = body.status
    this.code = body.code
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}
