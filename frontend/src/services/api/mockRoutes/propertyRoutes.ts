import { brazilianStateCodes } from '../../../data/states'
import { toProperty, type PropertyRecord } from '../../../data/properties'
import type { Property } from '../../../types/entities'
import { getMockDatabase, persistMockDatabase } from '../mockDatabase'
import { conflict, getBody, nextId, notFound, requireUser, textField, throwIfFields } from './shared'
import type { MockRoute, RouteContext } from './types'

const OPEN_STATUSES = new Set(['pending', 'counter_offer', 'accepted', 'in_progress'])

type PropertyFields = Pick<Property, 'name' | 'city' | 'state' | 'accessNotes' | 'areaHectares' | 'crops'>

export function validatePropertyInput(input: Record<string, unknown>, partial: boolean): Partial<PropertyFields> {
  const fields: Record<string, string> = {}
  const updates: Partial<PropertyFields> = {}
  const has = (key: string) => input[key] !== undefined

  if (!partial || has('name')) {
    const name = textField(input.name)
    if (name.length < 2 || name.length > 80) fields.name = 'Informe o nome da propriedade.'
    else updates.name = name
  }
  if (!partial || has('city')) {
    const city = textField(input.city)
    if (city.length < 2 || city.length > 80) fields.city = 'Informe a cidade.'
    else updates.city = city
  }
  if (!partial || has('state')) {
    const state = textField(input.state).toUpperCase()
    if (!brazilianStateCodes.has(state)) fields.state = 'Selecione a UF.'
    else updates.state = state
  }
  if (!partial || has('accessNotes')) {
    const accessNotes = input.accessNotes === undefined ? '' : input.accessNotes
    if (typeof accessNotes !== 'string' || accessNotes.trim().length > 500) fields.accessNotes = 'Use no máximo 500 caracteres.'
    else updates.accessNotes = accessNotes.trim()
  }
  if (!partial || has('areaHectares')) {
    const area = input.areaHectares
    if (typeof area !== 'number' || !Number.isFinite(area) || area <= 0 || area > 1_000_000) {
      fields.areaHectares = 'Informe a área em hectares.'
    } else updates.areaHectares = Math.round(area * 100) / 100
  }
  if (!partial || has('crops')) {
    const crops = input.crops === undefined ? [] : input.crops
    const normalized = Array.isArray(crops) ? crops.map((crop) => (typeof crop === 'string' ? crop.trim() : '')) : null
    const unique = normalized ? new Set(normalized.map((crop) => crop.toLowerCase())) : null
    if (
      !normalized ||
      normalized.length > 10 ||
      normalized.some((crop) => crop.length < 2 || crop.length > 40) ||
      unique?.size !== normalized.length
    ) {
      fields.crops = 'Informe até 10 culturas.'
    } else updates.crops = normalized
  }

  throwIfFields(fields)
  return updates
}

function findOwnProperty(producerId: string, propertyId: string): PropertyRecord {
  const property = getMockDatabase().properties.find(
    (candidate) => candidate.id === propertyId && candidate.producerId === producerId && !candidate.deletedAt,
  )
  if (!property) notFound('property_not_found', 'Propriedade não encontrada.')
  return property
}

export function listOwnProperties(producerId: string): Property[] {
  return getMockDatabase()
    .properties.filter((property) => property.producerId === producerId && !property.deletedAt)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map(toProperty)
}

export function createProperty(producerId: string, body: unknown): Property {
  const database = getMockDatabase()
  const values = validatePropertyInput(getBody(body), false) as PropertyFields
  const property: PropertyRecord = {
    id: nextId('prop', database.properties.map((candidate) => candidate.id)),
    producerId,
    ...values,
    createdAt: new Date().toISOString(),
  }

  database.properties.push(property)
  persistMockDatabase()
  return toProperty(property)
}

function listProperties({ token }: RouteContext): Property[] {
  return listOwnProperties(requireUser(token, 'producer').id)
}

function postProperty({ token, body }: RouteContext): Property {
  return createProperty(requireUser(token, 'producer').id, body)
}

function patchProperty({ token, params, body }: RouteContext): Property {
  const user = requireUser(token, 'producer')
  const property = findOwnProperty(user.id, params.id)
  Object.assign(property, validatePropertyInput(getBody(body), true))
  persistMockDatabase()
  return toProperty(property)
}

function deleteProperty({ token, params }: RouteContext): undefined {
  const user = requireUser(token, 'producer')
  const property = findOwnProperty(user.id, params.id)
  const hasOpenRequests = getMockDatabase().requestRecords.some(
    ({ request }) => request.propertyId === property.id && OPEN_STATUSES.has(request.status),
  )

  if (hasOpenRequests) conflict('Esta propriedade tem solicitações em aberto.')

  property.deletedAt = new Date().toISOString()
  persistMockDatabase()
  return undefined
}

export const propertyRoutes: MockRoute[] = [
  { method: 'GET', pattern: '/me/properties', handle: listProperties },
  { method: 'POST', pattern: '/me/properties', handle: postProperty },
  { method: 'PATCH', pattern: '/me/properties/:id', handle: patchProperty },
  { method: 'DELETE', pattern: '/me/properties/:id', handle: deleteProperty },
]
