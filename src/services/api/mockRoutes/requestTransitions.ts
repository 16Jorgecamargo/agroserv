import type { RequestRecord } from '../../../data/requests'
import { getMockDatabase, persistMockDatabase } from '../mockDatabase'
import { ApiError } from '../apiError'
import { toService } from './shared'
import type {
  Property,
  RequestAction,
  RequestEvent,
  RequestEventType,
  RequestParty,
  Role,
  ServiceRequest,
  ServiceRequestDetail,
  User,
} from '../../../types/entities'
import { getTodayInBrasilia } from '../../../utils/date'

export type RequestTransitionAction =
  | 'producer_cancel'
  | 'producer_accept_counter_offer'
  | 'producer_decline_counter_offer'
  | 'provider_accept'
  | 'provider_reject'
  | 'provider_counter_offer'
  | 'provider_start'
  | 'provider_complete'
  | 'provider_cancel'
  | 'system_cancel'

type TransitionActor = Pick<User, 'id' | 'role' | 'name'> | { id: null; role: 'system'; name: string }

interface ActionBody {
  reason?: unknown
  date?: unknown
  value?: unknown
  message?: unknown
}

const openStatuses = ['pending', 'counter_offer', 'accepted', 'in_progress'] as const

function invalidTransition(message = 'Esta ação não está mais disponível para esta solicitação.'): never {
  throw new ApiError({ status: 409, code: 'invalid_transition', message })
}

function validationError(fields: Record<string, string>, message = 'Revise os campos destacados.') {
  throw new ApiError({ status: 422, code: 'validation_error', message, fields })
}

function requestNotFound(): never {
  throw new ApiError({ status: 404, code: 'request_not_found', message: 'Solicitação não encontrada.' })
}

function getActionBody(body: unknown): ActionBody {
  return body && typeof body === 'object' && !Array.isArray(body) ? (body as ActionBody) : {}
}

function getRecord(requestId: string): RequestRecord {
  const record = getMockDatabase().requestRecords.find((candidate) => candidate.request.id === requestId)
  if (!record) requestNotFound()
  return record
}

export function getRequestRecord(requestId: string): RequestRecord {
  return getRecord(requestId)
}

function isDateOnly(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(`${value}T00:00:00.000Z`)
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

function getEffectiveCounterOfferDate(request: ServiceRequest): string {
  return request.counterOffer?.date ?? request.scheduledDate
}

export function getAllowedActions(
  request: ServiceRequest,
  role: Role,
  now: Date = new Date(),
): RequestAction[] {
  const today = getTodayInBrasilia(now)

  if (role === 'admin') return []

  if (request.status === 'pending') {
    if (role === 'producer') return ['cancel', 'message', 'report']

    const actions: RequestAction[] = ['reject', 'counter_offer', 'message', 'report']
    if (request.scheduledDate >= today) actions.unshift('accept')
    return actions
  }

  if (request.status === 'counter_offer') {
    if (role === 'provider') return ['message', 'report']

    const actions: RequestAction[] = ['decline_counter_offer', 'cancel', 'message', 'report']
    if (getEffectiveCounterOfferDate(request) >= today) actions.unshift('accept_counter_offer')
    return actions
  }

  if (request.status === 'accepted') {
    if (role === 'producer') return ['cancel', 'message', 'report']

    const actions: RequestAction[] = ['cancel', 'message', 'report']
    if (today >= request.scheduledDate) actions.unshift('start')
    return actions
  }

  if (request.status === 'in_progress') {
    return role === 'producer' ? ['message', 'report'] : ['complete', 'message', 'report']
  }

  if (request.status === 'completed') {
    if (role === 'provider') return ['report']
    return [request.reviewId ? 'edit_review' : 'review', 'report']
  }

  return ['report']
}

function ensureActionRole(action: RequestTransitionAction, actor: TransitionActor): void {
  const requiredRole = action.startsWith('producer_')
    ? 'producer'
    : action.startsWith('provider_')
      ? 'provider'
      : 'system'

  if (actor.role !== requiredRole) {
    throw new ApiError({
      status: 403,
      code: 'forbidden',
      message: 'Você não tem permissão para esta ação.',
    })
  }
}

function ensureActorOwnsRequest(record: RequestRecord, actor: TransitionActor): void {
  if (actor.role === 'system') return

  const request = record.request
  const ownsRequest =
    (actor.role === 'producer' && request.producerId === actor.id) ||
    (actor.role === 'provider' && request.providerId === actor.id)

  if (!ownsRequest) requestNotFound()
}

function getReason(body: ActionBody, required: boolean, message: string): string | undefined {
  if (body.reason === undefined && !required) return undefined
  const reason = typeof body.reason === 'string' ? body.reason.trim() : ''

  if (!reason || reason.length < 5 || reason.length > 500) validationError({ reason: message })

  return reason
}

function appendEvent(
  record: RequestRecord,
  type: RequestEventType,
  actor: TransitionActor,
  createdAt: string,
  details: Pick<RequestEvent, 'note' | 'previousDate' | 'previousValue'> = {},
): void {
  record.events.push({
    id: `evt-${record.request.id}-${record.events.length + 1}`,
    type,
    actorId: actor.id,
    actorRole: actor.role,
    actorName: actor.name,
    createdAt,
    ...details,
  })
}

export function applyRequestTransition(
  requestId: string,
  action: RequestTransitionAction,
  actor: TransitionActor,
  body: unknown = {},
  now: Date = new Date(),
): ServiceRequest {
  ensureActionRole(action, actor)
  const record = getRecord(requestId)
  ensureActorOwnsRequest(record, actor)

  const request = record.request
  const input = getActionBody(body)
  const today = getTodayInBrasilia(now)
  const timestamp = now.toISOString()
  let eventType: RequestEventType
  let note: string | undefined
  let previousDate: string | undefined
  let previousValue: number | undefined

  if (action === 'producer_cancel') {
    if (!['pending', 'counter_offer', 'accepted'].includes(request.status)) invalidTransition()
    const reason = getReason(input, request.status === 'accepted', 'Informe o motivo do cancelamento.')
    request.status = 'cancelled'
    request.cancelledBy = 'producer'
    request.cancelReason = reason
    eventType = 'cancelled'
    note = reason
  } else if (action === 'producer_accept_counter_offer') {
    if (request.status !== 'counter_offer' || !request.counterOffer) invalidTransition()
    if (getEffectiveCounterOfferDate(request) < today) {
      invalidTransition('A data proposta já passou. Recuse a proposta ou cancele a solicitação.')
    }
    previousDate = request.scheduledDate
    previousValue = request.value
    request.scheduledDate = request.counterOffer.date ?? request.scheduledDate
    request.value = request.counterOffer.value ?? request.value
    request.status = 'accepted'
    eventType = 'counter_offer_accepted'
    note = request.counterOffer.message
  } else if (action === 'producer_decline_counter_offer') {
    if (request.status !== 'counter_offer') invalidTransition()
    request.status = 'cancelled'
    request.cancelledBy = 'producer'
    request.cancelReason = 'Contraproposta recusada pelo produtor'
    eventType = 'counter_offer_declined'
    note = request.cancelReason
  } else if (action === 'provider_accept') {
    if (request.status !== 'pending') invalidTransition()
    if (request.scheduledDate < today) {
      invalidTransition('A data pedida já passou. Faça uma contraproposta com uma nova data.')
    }
    request.status = 'accepted'
    eventType = 'accepted'
  } else if (action === 'provider_reject') {
    if (request.status !== 'pending') invalidTransition()
    const reason = getReason(input, true, 'Informe o motivo da recusa.')
    request.status = 'rejected'
    request.rejectReason = reason
    eventType = 'rejected'
    note = reason
  } else if (action === 'provider_counter_offer') {
    if (request.status !== 'pending') invalidTransition()

    if (input.date !== undefined && typeof input.date !== 'string') {
      validationError({ date: 'Escolha uma data a partir de hoje.' })
    }
    const date = typeof input.date === 'string' ? input.date.trim() : undefined
    const value = input.value
    const message = typeof input.message === 'string' ? input.message.trim() : ''

    if (date && (!isDateOnly(date) || date < today)) {
      validationError({ date: 'Escolha uma data a partir de hoje.' })
    }
    if (value !== undefined && (typeof value !== 'number' || !Number.isFinite(value) || value <= 0)) {
      validationError({ value: 'Informe um valor válido.' })
    }
    if (message.length < 5 || message.length > 500) {
      validationError({ message: 'Explique a proposta ao produtor.' })
    }

    const changedDate = date !== undefined && date !== request.scheduledDate
    const changedValue = value !== undefined && value !== request.value
    if (!changedDate && !changedValue) {
      validationError({ date: 'Proponha uma nova data ou um novo valor.' }, 'Proponha uma nova data ou um novo valor.')
    }

    request.counterOffer = {
      ...(date ? { date } : {}),
      ...(typeof value === 'number' ? { value } : {}),
      message,
      createdAt: timestamp,
    }
    request.status = 'counter_offer'
    eventType = 'counter_offer'
    note = message
  } else if (action === 'provider_start') {
    if (request.status !== 'accepted') invalidTransition()
    if (today < request.scheduledDate) {
      invalidTransition('O serviço só pode ser iniciado a partir da data agendada.')
    }
    request.status = 'in_progress'
    eventType = 'started'
  } else if (action === 'provider_complete') {
    if (request.status !== 'in_progress') invalidTransition()
    request.status = 'completed'
    eventType = 'completed'
  } else if (action === 'provider_cancel') {
    if (request.status !== 'accepted') invalidTransition()
    const reason = getReason(input, true, 'Informe o motivo do cancelamento.')
    request.status = 'cancelled'
    request.cancelledBy = 'provider'
    request.cancelReason = reason
    eventType = 'cancelled'
    note = reason
  } else {
    if (!openStatuses.includes(request.status as (typeof openStatuses)[number])) invalidTransition()
    request.status = 'cancelled'
    request.cancelledBy = 'system'
    request.cancelReason = typeof input.reason === 'string' ? input.reason : undefined
    eventType = 'cancelled'
    note = request.cancelReason
  }

  request.updatedAt = timestamp
  appendEvent(record, eventType, actor, timestamp, { note, previousDate, previousValue })
  persistMockDatabase()
  return request
}


export function cancelOpenRequestsForUser(userId: string, now: Date = new Date()): void {
  const records = getMockDatabase().requestRecords.filter(
    ({ request }) =>
      openStatuses.includes(request.status as (typeof openStatuses)[number]) &&
      (request.producerId === userId || request.providerId === userId),
  )

  for (const record of records) {
    applyRequestTransition(
      record.request.id,
      'system_cancel',
      { id: null, role: 'system', name: 'Sistema' },
      { reason: 'Conta suspensa pela administração' },
      now,
    )
  }
}
function toRequestParty(user: User, includePhone: boolean): RequestParty {
  return {
    id: user.id,
    name: user.name,
    ...(user.avatarUrl ? { avatarUrl: user.avatarUrl } : {}),
    city: user.city,
    state: user.state,
    ...(includePhone && user.phone ? { phone: user.phone } : {}),
  }
}

function missingDetail(): never {
  return requestNotFound()
}

export function getRequestDetail(record: RequestRecord, role: Role, now: Date = new Date()): ServiceRequestDetail {
  const database = getMockDatabase()
  const request = record.request
  const serviceRecord = database.services.find((candidate) => candidate.id === request.serviceId)
  const provider = database.providers.find((candidate) => candidate.id === request.providerId)
  const producer = database.users.find((candidate) => candidate.id === request.producerId)
  const providerUser = database.users.find((candidate) => candidate.id === request.providerId)

  if (!serviceRecord || !provider || !producer || !providerUser) return missingDetail()

  const canContact = ['accepted', 'in_progress', 'completed'].includes(request.status)

  return {
    ...request,
    service: toService(serviceRecord),
    serviceRemoved: false,
    property: record.property as Property,
    propertyRemoved: false,
    producer: toRequestParty(producer, canContact && role === 'provider'),
    provider: { ...provider, ...(canContact && role === 'producer' && providerUser.phone ? { phone: providerUser.phone } : {}) },
    events: [...record.events].sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    allowedActions: getAllowedActions(request, role, now),
  }
}
