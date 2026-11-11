import type { Paginated, QueryValue } from '../../../types/api'
import type { ServiceRecord } from '../../../data/services'
import type { Service, ServiceRequest, User } from '../../../types/entities'
import { getMockDatabase } from '../mockDatabase'
import { ApiError } from '../apiError'

const TOKEN_PREFIX = 'mock.'

export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export function matchesAllTerms(haystack: string, search: string): boolean {
  const normalizedHaystack = normalizeText(haystack)

  return normalizeText(search)
    .split(' ')
    .every((term) => normalizedHaystack.includes(term))
}

export function toPositiveInt(value: QueryValue, fallback: number, max: number): number {
  const parsed = typeof value === 'number' ? value : Number.parseInt(String(value ?? ''), 10)
  if (!Number.isFinite(parsed) || parsed < 1) return fallback
  return Math.min(Math.floor(parsed), max)
}

export function toOptionalString(value: QueryValue): string | undefined {
  if (value === undefined) return undefined

  const text = String(value).trim()
  return text || undefined
}

export function paginate<T>(items: T[], page: number, pageSize: number): Paginated<T> {
  const total = items.length
  const start = (page - 1) * pageSize

  return {
    data: items.slice(start, start + pageSize),
    meta: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
  }
}

export function findUserByToken(token: string | null): User {
  const userId = token?.startsWith(TOKEN_PREFIX) ? token.slice(TOKEN_PREFIX.length) : null
  const user = userId ? getMockDatabase().users.find((candidate) => candidate.id === userId) : undefined

  if (!user) {
    throw new ApiError({
      status: 401,
      code: 'unauthorized',
      message: 'Sessão inválida. Faça login novamente.',
    })
  }

  return user
}

export function toService(record: ServiceRecord): Service {
  const provider = getMockDatabase().providers.find((candidate) => candidate.id === record.providerId)
  return { ...record, providerName: provider?.name ?? 'Prestador' }
}

export function getCategoryName(categoryId: string): string {
  return getMockDatabase().categories.find((category) => category.id === categoryId)?.name ?? ''
}

export function getUserRequests(userId: string): ServiceRequest[] {
  return getMockDatabase()
    .requestRecords
    .filter((record) => record.producerId === userId)
    .map((record) => record.request)
    .sort((a, b) => b.scheduledDate.localeCompare(a.scheduledDate))
}