import type { ServiceRecord } from '../../../data/services'
import { brazilianStateCodes } from '../../../data/states'
import type { Service, ServiceDetail } from '../../../types/entities'
import { isOpenRequestStatus } from '../../../utils/requestStatus'
import { getMockDatabase, persistMockDatabase } from '../mockDatabase'
import { buildServiceDetail } from './catalogRoutes'
import {
  conflict,
  findOwnUpload,
  getBody,
  invalidTransition,
  nextId,
  OWN_IMAGES_MESSAGE,
  requireUser,
  serviceNotFound,
  textField,
  throwIfFields,
  toService,
} from './shared'
import type { MockRoute, RouteContext } from './types'

const PRICE_UNITS = ['hectare', 'hour', 'day', 'trip']
const HIDDEN_MESSAGE = 'Anúncio oculto pela administração.'
export const OPEN_SERVICE_REQUESTS_MESSAGE = 'Este serviço tem solicitações em aberto. Pause o anúncio em vez de excluir.'

type ServiceChanges = Partial<
  Pick<ServiceRecord, 'title' | 'categoryId' | 'description' | 'price' | 'priceUnit' | 'city' | 'state' | 'photos' | 'equipmentIds' | 'available'>
>

function loadOwnService(providerId: string, serviceId: string): ServiceRecord {
  const record = getMockDatabase().services.find((candidate) => candidate.id === serviceId && !candidate.deletedAt)
  if (!record || record.providerId !== providerId) serviceNotFound()
  return record
}

function textBetween(value: unknown, min: number, max: number): string | undefined {
  const text = textField(value)
  return typeof value === 'string' && text.length >= min && text.length <= max ? text : undefined
}

function parseServiceBody(providerId: string, body: unknown, current: ServiceRecord | null): ServiceChanges {
  const payload = getBody(body)
  const partial = current !== null
  const fields: Record<string, string> = {}
  const changes: ServiceChanges = {}
  const database = getMockDatabase()
  const has = (key: string) => payload[key] !== undefined || !partial

  if (has('title')) {
    const title = textBetween(payload.title, 3, 80)
    if (title) changes.title = title
    else fields.title = 'Informe o título.'
  }
  if (has('categoryId')) {
    const category = database.categories.find((candidate) => candidate.id === payload.categoryId && candidate.active)
    if (category) changes.categoryId = category.id
    else fields.categoryId = 'Selecione uma categoria.'
  }
  if (has('description')) {
    const description = textBetween(payload.description, 20, 2000)
    if (description) changes.description = description
    else fields.description = 'Descreva o serviço com pelo menos 20 caracteres.'
  }
  if (has('price')) {
    if (typeof payload.price === 'number' && Number.isFinite(payload.price) && payload.price > 0) changes.price = Math.round(payload.price * 100) / 100
    else fields.price = 'Informe o preço.'
  }
  if (has('priceUnit')) {
    if (typeof payload.priceUnit === 'string' && PRICE_UNITS.includes(payload.priceUnit)) changes.priceUnit = payload.priceUnit as ServiceRecord['priceUnit']
    else fields.priceUnit = 'Selecione a unidade.'
  }
  if (has('city')) {
    const city = textBetween(payload.city, 2, 80)
    if (city) changes.city = city
    else fields.city = 'Informe sua cidade.'
  }
  if (has('state')) {
    const state = textField(payload.state).toUpperCase()
    if (brazilianStateCodes.has(state)) changes.state = state
    else fields.state = 'Selecione a UF.'
  }
  if (payload.photos !== undefined) {
    const photos = payload.photos
    if (!Array.isArray(photos) || photos.length > 8 || photos.some((photo) => typeof photo !== 'string')) {
      fields.photos = 'Use no máximo 8 fotos.'
    } else if (photos.some((photo) => !current?.photos.includes(photo) && !findOwnUpload(providerId, photo, 'public'))) {
      fields.photos = OWN_IMAGES_MESSAGE
    } else changes.photos = [...new Set(photos as string[])]
  } else if (!partial) changes.photos = []
  if (payload.equipmentIds !== undefined) {
    const ids = payload.equipmentIds
    const own = new Set(database.equipment.filter((item) => item.providerId === providerId).map((item) => item.id))
    if (!Array.isArray(ids) || ids.some((id) => typeof id !== 'string' || !own.has(id))) fields.equipmentIds = 'Equipamento inválido.'
    else changes.equipmentIds = [...new Set(ids as string[])]
  } else if (!partial) changes.equipmentIds = []
  if (payload.available !== undefined) {
    if (typeof payload.available === 'boolean') changes.available = payload.available
    else fields.available = 'Informe se está disponível.'
  } else if (!partial) changes.available = true

  throwIfFields(fields)
  return changes
}

function listOwnServices({ token }: RouteContext): Service[] {
  const user = requireUser(token, 'provider')
  return getMockDatabase()
    .services.filter((record) => record.providerId === user.id && !record.deletedAt)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((record) => toService(record, true))
}

function getOwnService({ token, params }: RouteContext): ServiceDetail {
  const user = requireUser(token, 'provider')
  loadOwnService(user.id, params.id)
  return buildServiceDetail(params.id, true)
}

function createService({ token, body }: RouteContext): Service {
  const user = requireUser(token, 'provider')
  const changes = parseServiceBody(user.id, body, null)
  const database = getMockDatabase()
  const record: ServiceRecord = {
    id: nextId('svc', database.services.map((service) => service.id)),
    providerId: user.id,
    title: changes.title ?? '',
    categoryId: changes.categoryId ?? '',
    description: changes.description ?? '',
    price: changes.price ?? 0,
    priceUnit: changes.priceUnit ?? 'hectare',
    city: changes.city ?? '',
    state: changes.state ?? '',
    photos: changes.photos ?? [],
    equipmentIds: changes.equipmentIds ?? [],
    available: changes.available ?? true,
    imageUrl: changes.photos?.[0] ?? '',
    rating: 0,
    reviewCount: 0,
    status: 'active',
    createdAt: new Date().toISOString(),
  }
  database.services.push(record)
  persistMockDatabase()
  return toService(record, true)
}

function updateService({ token, params, body }: RouteContext): Service {
  const user = requireUser(token, 'provider')
  const record = loadOwnService(user.id, params.id)
  const changes = parseServiceBody(user.id, body, record)
  Object.assign(record, changes)
  if (changes.photos) record.imageUrl = changes.photos[0] ?? ''
  persistMockDatabase()
  return toService(record, true)
}

function pauseService({ token, params }: RouteContext): Service {
  const user = requireUser(token, 'provider')
  const record = loadOwnService(user.id, params.id)
  if (record.status === 'hidden') invalidTransition(HIDDEN_MESSAGE)
  if (record.status !== 'active') invalidTransition('Este anúncio já está pausado.')
  record.status = 'paused'
  persistMockDatabase()
  return toService(record, true)
}

function activateService({ token, params }: RouteContext): Service {
  const user = requireUser(token, 'provider')
  const record = loadOwnService(user.id, params.id)
  if (record.status === 'hidden') invalidTransition(HIDDEN_MESSAGE)
  if (record.status !== 'paused') invalidTransition('Este anúncio já está ativo.')
  record.status = 'active'
  persistMockDatabase()
  return toService(record, true)
}

export function hasOpenServiceRequests(serviceId: string): boolean {
  return getMockDatabase().requestRecords.some(
    (candidate) => candidate.request.serviceId === serviceId && isOpenRequestStatus(candidate.request.status),
  )
}

function deleteService({ token, params }: RouteContext): undefined {
  const user = requireUser(token, 'provider')
  const record = loadOwnService(user.id, params.id)
  if (hasOpenServiceRequests(record.id)) conflict(OPEN_SERVICE_REQUESTS_MESSAGE)
  record.deletedAt = new Date().toISOString()
  const database = getMockDatabase()
  database.favorites = database.favorites.filter((favorite) => favorite.serviceId !== record.id)
  persistMockDatabase()
  return undefined
}

export const providerServiceRoutes: MockRoute[] = [
  { method: 'GET', pattern: '/provider/services', handle: listOwnServices },
  { method: 'GET', pattern: '/provider/services/:id', handle: getOwnService },
  { method: 'POST', pattern: '/provider/services', handle: createService },
  { method: 'PATCH', pattern: '/provider/services/:id', handle: updateService },
  { method: 'POST', pattern: '/provider/services/:id/pause', handle: pauseService },
  { method: 'POST', pattern: '/provider/services/:id/activate', handle: activateService },
  { method: 'DELETE', pattern: '/provider/services/:id', handle: deleteService },
]
