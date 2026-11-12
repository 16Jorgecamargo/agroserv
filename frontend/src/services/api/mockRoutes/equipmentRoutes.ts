import type { Equipment, EquipmentType } from '../../../types/entities'
import { ApiError } from '../apiError'
import { getMockDatabase, persistMockDatabase } from '../mockDatabase'
import { findOwnUpload, getBody, nextId, OWN_IMAGES_MESSAGE, requireUser, textField, throwIfFields } from './shared'
import type { MockRoute, RouteContext } from './types'

export const EQUIPMENT_TYPES: EquipmentType[] = ['tractor', 'harvester', 'sprayer', 'drone', 'truck', 'implement', 'other']

type EquipmentChanges = Partial<Omit<Equipment, 'id' | 'providerId'>>

function loadOwnEquipment(providerId: string, id: string): Equipment {
  const item = getMockDatabase().equipment.find((candidate) => candidate.id === id && candidate.providerId === providerId)
  if (!item) throw new ApiError({ status: 404, code: 'equipment_not_found', message: 'Equipamento não encontrado.' })
  return item
}

function parseEquipment(providerId: string, body: unknown, current: Equipment | null): EquipmentChanges {
  const payload = getBody(body)
  const partial = current !== null
  const has = (key: string) => payload[key] !== undefined || !partial
  const fields: Record<string, string> = {}
  const changes: EquipmentChanges = {}
  const maxYear = new Date().getFullYear() + 1

  if (has('type')) {
    if (typeof payload.type === 'string' && EQUIPMENT_TYPES.includes(payload.type as EquipmentType)) changes.type = payload.type as EquipmentType
    else fields.type = 'Selecione o tipo.'
  }
  if (has('model')) {
    const model = textField(payload.model)
    if (model.length >= 2 && model.length <= 80) changes.model = model
    else fields.model = 'Informe marca e modelo.'
  }
  if (has('year')) {
    if (typeof payload.year === 'number' && Number.isInteger(payload.year) && payload.year >= 1950 && payload.year <= maxYear) changes.year = payload.year
    else fields.year = 'Informe um ano válido.'
  }
  if (payload.specs !== undefined) {
    const specs = textField(payload.specs)
    if (typeof payload.specs === 'string' && specs.length <= 500) changes.specs = specs
    else fields.specs = 'Use no máximo 500 caracteres.'
  } else if (!partial) changes.specs = ''
  if (payload.photos !== undefined) {
    const photos = payload.photos
    if (!Array.isArray(photos) || photos.length > 6 || photos.some((photo) => typeof photo !== 'string')) fields.photos = 'Use no máximo 6 fotos.'
    else if (photos.some((photo) => !current?.photos.includes(photo) && !findOwnUpload(providerId, photo, 'public'))) fields.photos = OWN_IMAGES_MESSAGE
    else changes.photos = [...new Set(photos as string[])]
  } else if (!partial) changes.photos = []

  throwIfFields(fields)
  return changes
}

function listEquipment({ token }: RouteContext): Equipment[] {
  const user = requireUser(token, 'provider')
  return getMockDatabase().equipment.filter((item) => item.providerId === user.id)
}

function createEquipment({ token, body }: RouteContext): Equipment {
  const user = requireUser(token, 'provider')
  const changes = parseEquipment(user.id, body, null)
  const database = getMockDatabase()
  const item: Equipment = {
    id: nextId('eqp', database.equipment.map((candidate) => candidate.id)),
    providerId: user.id,
    type: changes.type ?? 'other',
    model: changes.model ?? '',
    year: changes.year ?? new Date().getFullYear(),
    specs: changes.specs ?? '',
    photos: changes.photos ?? [],
  }
  database.equipment.push(item)
  persistMockDatabase()
  return item
}

function updateEquipment({ token, params, body }: RouteContext): Equipment {
  const user = requireUser(token, 'provider')
  const item = loadOwnEquipment(user.id, params.id)
  Object.assign(item, parseEquipment(user.id, body, item))
  persistMockDatabase()
  return item
}

function deleteEquipment({ token, params }: RouteContext): undefined {
  const user = requireUser(token, 'provider')
  const item = loadOwnEquipment(user.id, params.id)
  const database = getMockDatabase()
  database.equipment = database.equipment.filter((candidate) => candidate.id !== item.id)
  database.services
    .filter((service) => service.providerId === user.id)
    .forEach((service) => {
      service.equipmentIds = service.equipmentIds.filter((equipmentId) => equipmentId !== item.id)
    })
  persistMockDatabase()
  return undefined
}

export const equipmentRoutes: MockRoute[] = [
  { method: 'GET', pattern: '/provider/equipment', handle: listEquipment },
  { method: 'POST', pattern: '/provider/equipment', handle: createEquipment },
  { method: 'PATCH', pattern: '/provider/equipment/:id', handle: updateEquipment },
  { method: 'DELETE', pattern: '/provider/equipment/:id', handle: deleteEquipment },
]
