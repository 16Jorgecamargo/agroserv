import type { RequestRecord } from '../../../data/requests'
import type { ProducerDashboard } from '../../../types/api'
import type { RequestStatus, ServiceRequest, ServiceRequestDetail, User } from '../../../types/entities'
import { getTodayInBrasilia, isDateOnly } from '../../../utils/date'
import { isRequestStatus } from '../../../utils/requestStatus'
import { ApiError } from '../apiError'
import { getMockDatabase, persistMockDatabase } from '../mockDatabase'
import {
  findServiceRecord,
  findUserByToken,
  getBody,
  getUserRequests,
  isServiceVisible,
  nextId,
  notify,
  requestLinkFor,
  requireRole,
  requireUser,
  roundMoney,
  serviceNotFound,
  textField,
  throwIfFields,
  toOptionalString,
  toProvider,
} from './shared'
import { applyRequestTransition, getRequestDetail, getRequestRecord, type RequestTransitionAction } from './requestTransitions'
import type { MockRoute, RouteContext } from './types'

const RECENT_REQUESTS_LIMIT = 5
const OPEN_STATUSES: RequestStatus[] = ['pending', 'counter_offer', 'accepted']
const CONTRACTED_STATUSES: RequestStatus[] = ['accepted', 'in_progress', 'completed']

function listRequests({ token, query }: RouteContext): ServiceRequest[] {
  const user = requireRole(findUserByToken(token), 'producer')
  const status = toOptionalString(query.status)

  if (status && status !== 'all' && !isRequestStatus(status)) {
    throw new ApiError({
      status: 400,
      code: 'invalid_status',
      message: 'Status de solicitação inválido.',
    })
  }

  const userRequests = getUserRequests(user.id)

  return status && status !== 'all'
    ? userRequests.filter((request) => request.status === status)
    : userRequests
}

function getDashboard({ token }: RouteContext): ProducerDashboard {
  const user = requireRole(findUserByToken(token), 'producer')
  const userRequests = getUserRequests(user.id)
  const countBy = (statuses: RequestStatus[]) =>
    userRequests.filter((request) => statuses.includes(request.status)).length

  return {
    stats: {
      open: countBy(OPEN_STATUSES),
      inProgress: countBy(['in_progress']),
      completed: countBy(['completed']),
      totalSpent: userRequests
        .filter((request) => CONTRACTED_STATUSES.includes(request.status))
        .reduce((sum, request) => sum + request.value, 0),
    },
    recentRequests: userRequests.slice(0, RECENT_REQUESTS_LIMIT),
  }
}

function handleProducerTransition(action: RequestTransitionAction) {
  return ({ params, body, token }: RouteContext) => {
    const user: User = requireRole(findUserByToken(token), 'producer')
    const record = getRequestRecord(params.id)
    applyRequestTransition(params.id, action, user, body)
    return getRequestDetail(record, user.role)
  }
}

function createRequest({ token, body }: RouteContext): ServiceRequestDetail {
  const user = requireUser(token, 'producer')
  const input = getBody(body)
  const database = getMockDatabase()
  const serviceId = textField(input.serviceId)
  const record = findServiceRecord(serviceId)

  if (!record || !isServiceVisible(record)) serviceNotFound()
  if (!record.available) {
    throw new ApiError({
      status: 409,
      code: 'service_unavailable',
      message: 'Este serviço não está disponível para novas solicitações.',
    })
  }

  const fields: Record<string, string> = {}
  const today = getTodayInBrasilia()
  const property = database.properties.find(
    (candidate) => candidate.id === input.propertyId && candidate.producerId === user.id && !candidate.deletedAt,
  )
  const scheduledDate = textField(input.scheduledDate)
  const quantity = input.quantity
  const notes = input.notes === undefined || input.notes === null ? '' : input.notes

  if (!property) fields.propertyId = 'Selecione uma propriedade.'
  if (!isDateOnly(scheduledDate) || scheduledDate < today) fields.scheduledDate = 'Escolha uma data a partir de hoje.'
  else if (database.blockedDays.some((day) => day.providerId === record.providerId && day.date === scheduledDate)) {
    fields.scheduledDate = 'O prestador não atende nesta data.'
  }
  if (typeof quantity !== 'number' || !Number.isFinite(quantity) || quantity <= 0 || quantity > 100_000) {
    fields.quantity = 'Informe a quantidade.'
  }
  if (typeof notes !== 'string' || notes.trim().length > 1000) fields.notes = 'Use no máximo 1000 caracteres.'
  throwIfFields(fields)

  const provider = toProvider(record.providerId)
  if (!property || !provider) serviceNotFound()

  const now = new Date().toISOString()
  const id = nextId('req', database.requestRecords.map((candidate) => candidate.request.id))
  const trimmedNotes = (notes as string).trim()
  const request: ServiceRequest = {
    id,
    serviceId: record.id,
    serviceTitle: record.title,
    providerId: record.providerId,
    providerName: provider.name,
    producerId: user.id,
    producerName: user.name,
    propertyId: property.id,
    location: `${property.name}, ${property.city} - ${property.state}`,
    scheduledDate,
    quantity: quantity as number,
    priceUnit: record.priceUnit,
    value: roundMoney(record.price * (quantity as number)),
    ...(trimmedNotes ? { notes: trimmedNotes } : {}),
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  }
  const { producerId: _producerId, deletedAt: _deletedAt, ...propertySnapshot } = property
  const requestRecord: RequestRecord = {
    producerId: user.id,
    request,
    property: propertySnapshot,
    events: [
      {
        id: `evt-${id}-1`,
        type: 'created',
        actorId: user.id,
        actorRole: 'producer',
        actorName: user.name,
        createdAt: now,
      },
    ],
  }

  database.requestRecords.push(requestRecord)
  notify(record.providerId, 'request_created', `Nova solicitação: ${record.title}`, requestLinkFor('provider', id))
  persistMockDatabase()
  return getRequestDetail(requestRecord, 'producer')
}

export const producerRoutes: MockRoute[] = [
  { method: 'POST', pattern: '/requests', handle: createRequest },
  { method: 'GET', pattern: '/requests', handle: listRequests },
  { method: 'GET', pattern: '/dashboard', handle: getDashboard },
  { method: 'POST', pattern: '/requests/:id/cancel', handle: handleProducerTransition('producer_cancel') },
  {
    method: 'POST',
    pattern: '/requests/:id/counter-offer/accept',
    handle: handleProducerTransition('producer_accept_counter_offer'),
  },
  {
    method: 'POST',
    pattern: '/requests/:id/counter-offer/decline',
    handle: handleProducerTransition('producer_decline_counter_offer'),
  },
]
