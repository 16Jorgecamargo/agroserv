import type { ServiceRecord } from '../../../data/services'
import type { Paginated, QueryValue } from '../../../types/api'
import type { Service, ServiceStatus, User } from '../../../types/entities'
import { getMockDatabase, persistMockDatabase } from '../mockDatabase'
import { recordAdminAction, requireAdmin, requireReason } from './adminShared'
import { hasOpenServiceRequests, OPEN_SERVICE_REQUESTS_MESSAGE } from './providerServiceRoutes'
import {
  conflict,
  findServiceRecord,
  getCategoryName,
  invalidTransition,
  matchesAllTerms,
  notify,
  paginate,
  serviceNotFound,
  toOptionalString,
  toPositiveInt,
  toService,
} from './shared'
import type { MockRoute } from './types'

const SERVICE_STATUSES: ServiceStatus[] = ['active', 'paused', 'hidden']
const PROVIDER_SERVICES_LINK = '/prestador/servicos'

function loadService(serviceId: string): ServiceRecord {
  return findServiceRecord(serviceId) ?? serviceNotFound()
}

function listServices(query: Record<string, QueryValue>): Paginated<Service> {
  const database = getMockDatabase()
  const q = toOptionalString(query.q)
  const slug = toOptionalString(query.category)
  const category = slug ? database.categories.find((candidate) => candidate.slug === slug) : undefined
  const status = SERVICE_STATUSES.find((candidate) => candidate === query.status)
  const page = toPositiveInt(query.page, 1, Number.MAX_SAFE_INTEGER)
  const pageSize = toPositiveInt(query.pageSize, 20, 100)
  if (slug && !category) return paginate([], page, pageSize)

  const services = database.services
    .filter((record) => !record.deletedAt)
    .filter((record) => !category || record.categoryId === category.id)
    .filter((record) => !status || record.status === status)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((record) => toService(record, true))
    .filter(
      (service) =>
        !q ||
        matchesAllTerms(`${service.title} ${service.description} ${service.providerName} ${getCategoryName(service.categoryId)} ${service.city}`, q),
    )

  return paginate(services, page, pageSize)
}

export function hideService(admin: User, record: ServiceRecord, reason: string): Service {
  if (record.status === 'hidden') invalidTransition('Este anúncio já está oculto.')
  record.statusBeforeHidden = record.status
  record.status = 'hidden'
  record.hiddenReason = reason
  notify(record.providerId, 'service_hidden', 'Seu anúncio foi ocultado', PROVIDER_SERVICES_LINK, reason)
  recordAdminAction(admin, 'hide_service', 'service', record.id, record.title, reason)
  persistMockDatabase()
  return toService(record, true)
}

function showService(admin: User, record: ServiceRecord): Service {
  if (record.status !== 'hidden') invalidTransition('Este anúncio não está oculto.')
  if (record.hiddenByAccountDeletion) conflict('O prestador excluiu a conta.')
  record.status = record.statusBeforeHidden ?? 'active'
  delete record.statusBeforeHidden
  delete record.hiddenReason
  recordAdminAction(admin, 'show_service', 'service', record.id, record.title)
  persistMockDatabase()
  return toService(record, true)
}

function removeService(admin: User, record: ServiceRecord): undefined {
  if (hasOpenServiceRequests(record.id)) conflict(OPEN_SERVICE_REQUESTS_MESSAGE)
  const database = getMockDatabase()
  record.deletedAt = new Date().toISOString()
  database.favorites = database.favorites.filter((favorite) => favorite.serviceId !== record.id)
  notify(record.providerId, 'service_hidden', 'Seu anúncio foi removido pela administração', PROVIDER_SERVICES_LINK)
  recordAdminAction(admin, 'delete_service', 'service', record.id, record.title)
  persistMockDatabase()
  return undefined
}

export const adminServiceRoutes: MockRoute[] = [
  {
    method: 'GET',
    pattern: '/admin/services',
    handle: ({ token, query }) => {
      requireAdmin(token)
      return listServices(query)
    },
  },
  {
    method: 'POST',
    pattern: '/admin/services/:id/hide',
    handle: ({ token, params, body }) => {
      const admin = requireAdmin(token)
      const record = loadService(params.id)
      return hideService(admin, record, requireReason(body))
    },
  },
  {
    method: 'POST',
    pattern: '/admin/services/:id/show',
    handle: ({ token, params }) => showService(requireAdmin(token), loadService(params.id)),
  },
  {
    method: 'DELETE',
    pattern: '/admin/services/:id',
    handle: ({ token, params }) => removeService(requireAdmin(token), loadService(params.id)),
  },
]
