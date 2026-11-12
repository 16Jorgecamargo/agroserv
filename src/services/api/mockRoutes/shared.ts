import type { Paginated, QueryValue } from '../../../types/api'
import type { ServiceRecord } from '../../../data/services'
import type {
  NotificationType,
  Provider,
  Role,
  Service,
  ServiceRequest,
  User,
} from '../../../types/entities'
import { getMockDatabase } from '../mockDatabase'
import { ApiError } from '../apiError'

const TOKEN_PREFIX = 'mock.'

export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
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

export function toOptionalNumber(value: QueryValue): number | undefined {
  if (value === undefined || value === '') return undefined
  const parsed = typeof value === 'number' ? value : Number(String(value))
  return Number.isFinite(parsed) ? parsed : undefined
}

export function paginate<T>(items: T[], page: number, pageSize: number): Paginated<T> {
  const total = items.length
  const start = (page - 1) * pageSize

  return {
    data: items.slice(start, start + pageSize),
    meta: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
  }
}

export function getBody(body: unknown): Record<string, unknown> {
  return body && typeof body === 'object' && !Array.isArray(body) ? (body as Record<string, unknown>) : {}
}

export function validationError(fields: Record<string, string>, message = 'Revise os campos destacados.'): never {
  throw new ApiError({ status: 422, code: 'validation_error', message, fields })
}

export function throwIfFields(fields: Record<string, string>): void {
  if (Object.keys(fields).length > 0) validationError(fields)
}

export function notFound(code: string, message: string): never {
  throw new ApiError({ status: 404, code, message })
}

export function conflict(message: string): never {
  throw new ApiError({ status: 409, code: 'conflict', message })
}

export function invalidTransition(message: string): never {
  throw new ApiError({ status: 409, code: 'invalid_transition', message })
}

export function nextId(prefix: string, existingIds: string[]): string {
  let highest = 0
  const pattern = new RegExp(`^${prefix}-(\\d+)$`)

  for (const id of existingIds) {
    const match = pattern.exec(id)
    if (match) highest = Math.max(highest, Number(match[1]))
  }

  return `${prefix}-${highest + 1}`
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100
}

export function roundRating(value: number): number {
  return Math.round(value * 100) / 100
}

export function getTokenUserId(token: string | null): string | null {
  return token?.startsWith(TOKEN_PREFIX) ? token.slice(TOKEN_PREFIX.length) : null
}

export function findUserByToken(token: string | null): User {
  const userId = getTokenUserId(token)
  const user = userId ? getMockDatabase().users.find((candidate) => candidate.id === userId) : undefined

  if (!user || user.status === 'suspended' || user.status === 'deleted') {
    throw new ApiError({
      status: 401,
      code: 'unauthorized',
      message: 'Sessão inválida. Faça login novamente.',
    })
  }

  return user
}

export function findOptionalUser(token: string | null): User | null {
  if (!token) return null
  try {
    return findUserByToken(token)
  } catch {
    return null
  }
}

export function requireRole(user: User, role: Role): User {
  if (user.role !== role) {
    throw new ApiError({
      status: 403,
      code: 'forbidden',
      message: 'Você não tem permissão para esta ação.',
    })
  }

  return user
}

export function requireUser(token: string | null, role: Role): User {
  return requireRole(findUserByToken(token), role)
}

export function findUserById(userId: string): User | undefined {
  return getMockDatabase().users.find((candidate) => candidate.id === userId)
}

export function toProvider(userId: string): Provider | undefined {
  const database = getMockDatabase()
  const user = database.users.find((candidate) => candidate.id === userId && candidate.role === 'provider')
  const profile = database.providerProfiles.find((candidate) => candidate.userId === userId)

  if (!user || !profile) return undefined

  return {
    id: user.id,
    name: user.name,
    ...(user.avatarUrl ? { avatarUrl: user.avatarUrl } : {}),
    city: user.city,
    state: user.state,
    rating: profile.rating,
    reviewCount: profile.reviewCount,
    yearsOfExperience: profile.yearsOfExperience,
    verified: profile.verificationStatus === 'approved',
    serviceRadiusKm: profile.serviceRadiusKm,
    description: profile.description,
  }
}

export function toService(record: ServiceRecord, includeHiddenReason = false): Service {
  const provider = toProvider(record.providerId)
  const {
    statusBeforeHidden: _statusBeforeHidden,
    hiddenByAccountDeletion: _hiddenByAccountDeletion,
    deletedAt: _deletedAt,
    hiddenReason,
    ...service
  } = record

  return {
    ...service,
    imageUrl: record.photos[0] ?? '',
    providerName: provider?.name ?? 'Prestador',
    providerVerified: provider?.verified ?? false,
    ...(includeHiddenReason && hiddenReason ? { hiddenReason } : {}),
  }
}

export function isServiceVisible(record: ServiceRecord): boolean {
  if (record.deletedAt || record.status !== 'active') return false

  const database = getMockDatabase()
  const provider = database.users.find((candidate) => candidate.id === record.providerId)
  const category = database.categories.find((candidate) => candidate.id === record.categoryId)

  return provider?.status === 'active' && category?.active === true
}

export function findServiceRecord(serviceId: string): ServiceRecord | undefined {
  return getMockDatabase().services.find((candidate) => candidate.id === serviceId && !candidate.deletedAt)
}

export function serviceNotFound(): never {
  return notFound('service_not_found', 'Serviço não encontrado.')
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

export function requestLinkFor(role: Role, requestId: string): string {
  if (role === 'provider') return `/prestador/solicitacoes/${requestId}`
  if (role === 'admin') return `/admin/solicitacoes/${requestId}`
  return `/solicitacoes/${requestId}`
}

export function notificationsLinkFor(role: Role): string {
  if (role === 'provider') return '/prestador/notificacoes'
  if (role === 'admin') return '/admin/notificacoes'
  return '/notificacoes'
}

export function notify(
  userId: string,
  type: NotificationType,
  title: string,
  link: string,
  body?: string,
  now: Date = new Date(),
): void {
  const database = getMockDatabase()

  database.notifications.push({
    id: nextId('ntf', database.notifications.map((notification) => notification.id)),
    userId,
    type,
    title,
    ...(body ? { body } : {}),
    link,
    read: false,
    createdAt: now.toISOString(),
  })
}

export function notifyAdmins(type: NotificationType, title: string, link: string, body?: string): void {
  getMockDatabase()
    .users.filter((user) => user.role === 'admin' && user.status === 'active')
    .forEach((admin) => notify(admin.id, type, title, link, body))
}

export function textField(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}
