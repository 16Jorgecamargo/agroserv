import { beforeEach, describe, expect, it } from 'vitest'
import type { RequestConfig } from '../../../types/api'
import type { RequestStatus, ServiceRequest, ServiceRequestDetail } from '../../../types/entities'
import { getTodayInBrasilia } from '../../../utils/date'
import { ApiError } from '../apiError'
import { getMockDatabase, resetMockDatabase } from '../mockDatabase'
import { handleMockRequest } from '../mockRoutes'
import { applyRequestTransition, cancelOpenRequestsForUser, getAllowedActions, getRequestDetail } from './requestTransitions'

const producerToken = 'mock.usr-1'

function dateOffset(days: number, base = getTodayInBrasilia()): string {
  const date = new Date(`${base}T00:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function getRecord(requestId: string) {
  const record = getMockDatabase().requestRecords.find((candidate) => candidate.request.id === requestId)
  if (!record) throw new Error(`Request ${requestId} was not found`)
  return record
}

function post<T>(path: string, token: string, body: unknown = {}): T {
  const config: RequestConfig = { method: 'POST', path, token, body }
  return handleMockRequest(config) as T
}

function captureError(action: () => unknown): ApiError {
  try {
    action()
  } catch (error) {
    if (error instanceof ApiError) return error
    throw error
  }

  throw new Error('Expected ApiError to be thrown')
}

function requestWith(status: RequestStatus, overrides: Partial<ServiceRequest> = {}): ServiceRequest {
  return {
    id: 'test-request',
    serviceId: 'svc-1',
    serviceTitle: 'Pulverização Agrícola',
    providerId: 'prv-1',
    providerName: 'Agro Máquinas Paraná',
    producerId: 'usr-1',
    producerName: 'Carlos Henrique Souza',
    propertyId: 'prop-1',
    location: 'Fazenda Boa Vista, Santa Helena - PR',
    scheduledDate: dateOffset(2),
    quantity: 8,
    priceUnit: 'hour',
    value: 1440,
    status,
    createdAt: '2026-01-01T12:00:00.000Z',
    updatedAt: '2026-01-01T12:00:00.000Z',
    ...overrides,
  }
}

describe('request lifecycle seed', () => {
  beforeEach(() => {
    resetMockDatabase()
  })

  it('seeds a request in every lifecycle status with an event history', () => {
    const records = getMockDatabase().requestRecords
    const statuses = new Set(records.map((record) => record.request.status))

    expect(statuses).toEqual(
      new Set<RequestStatus>(['pending', 'counter_offer', 'accepted', 'in_progress', 'completed', 'rejected', 'cancelled']),
    )
    expect(records.every((record) => record.events.length > 0)).toBe(true)
    expect(records.every((record) => record.request.producerId === 'usr-1')).toBe(true)
    expect(records.some((record) => record.request.providerId === 'prv-1')).toBe(true)
  })
})

describe('request transitions', () => {
  beforeEach(() => {
    resetMockDatabase()
  })

  it('accepts a pending request when its date is today or later', () => {
    getRecord('req-8').request.scheduledDate = getTodayInBrasilia()
    const detail = post<ServiceRequestDetail>('/provider/requests/req-8/accept', 'mock.prv-3')

    expect(detail.status).toBe('accepted')
    expect(detail.events.at(-1)?.type).toBe('accepted')
  })

  it('rejects a pending request and records the reason', () => {
    const detail = post<ServiceRequestDetail>('/provider/requests/req-8/reject', 'mock.prv-3', {
      reason: 'Equipamento indisponível nesta data.',
    })

    expect(detail.status).toBe('rejected')
    expect(detail.rejectReason).toBe('Equipamento indisponível nesta data.')
    expect(detail.events.at(-1)?.type).toBe('rejected')
  })

  it('creates a counter-offer with a new date and total value', () => {
    const detail = post<ServiceRequestDetail>('/provider/requests/req-8/counter-offer', 'mock.prv-3', {
      date: dateOffset(4),
      value: 1800,
      message: 'Consigo atender na nova data proposta.',
    })

    expect(detail.status).toBe('counter_offer')
    expect(detail.counterOffer).toMatchObject({ date: dateOffset(4), value: 1800 })
    expect(detail.events.at(-1)?.type).toBe('counter_offer')
  })

  it('allows a value-only counter-offer when the amount changes', () => {
    const detail = post<ServiceRequestDetail>('/provider/requests/req-8/counter-offer', 'mock.prv-3', {
      value: 1800,
      message: 'O custo de deslocamento mudou.',
    })

    expect(detail.counterOffer).toMatchObject({ value: 1800 })
    expect(detail.counterOffer).not.toHaveProperty('date')
  })

  it('cancels a pending request by its producer', () => {
    const detail = post<ServiceRequestDetail>('/requests/req-8/cancel', producerToken)

    expect(detail.status).toBe('cancelled')
    expect(detail.cancelledBy).toBe('producer')
    expect(detail.events.at(-1)?.type).toBe('cancelled')
  })

  it('accepts a counter-offer and keeps the proposed values and history', () => {
    const detail = post<ServiceRequestDetail>('/requests/req-1/counter-offer/accept', producerToken)

    expect(detail.status).toBe('accepted')
    expect(detail.scheduledDate).toBe('2026-11-20')
    expect(detail.value).toBe(1600)
    expect(detail.counterOffer).toBeDefined()
    expect(detail.events.at(-1)).toMatchObject({
      type: 'counter_offer_accepted',
      previousDate: '2026-10-15',
      previousValue: 1440,
    })
  })

  it('declines a counter-offer and records its fixed cancellation reason', () => {
    const detail = post<ServiceRequestDetail>('/requests/req-1/counter-offer/decline', producerToken)

    expect(detail.status).toBe('cancelled')
    expect(detail.cancelledBy).toBe('producer')
    expect(detail.cancelReason).toBe('Contraproposta recusada pelo produtor')
    expect(detail.events.at(-1)?.type).toBe('counter_offer_declined')
  })

  it('allows the producer to cancel a counter-offer', () => {
    const detail = post<ServiceRequestDetail>('/requests/req-1/cancel', producerToken)

    expect(detail.status).toBe('cancelled')
    expect(detail.events.at(-1)?.type).toBe('cancelled')
  })

  it('starts an accepted request on or after its scheduled date', () => {
    getRecord('req-3').request.scheduledDate = dateOffset(-1)
    const detail = post<ServiceRequestDetail>('/provider/requests/req-3/start', 'mock.prv-6')

    expect(detail.status).toBe('in_progress')
    expect(detail.events.at(-1)?.type).toBe('started')
  })

  it('requires a reason when the producer cancels an accepted request', () => {
    const error = captureError(() => post('/requests/req-3/cancel', producerToken))

    expect(error.status).toBe(422)
    expect(error.fields).toEqual({ reason: 'Informe o motivo do cancelamento.' })
  })

  it('cancels an accepted request by the producer with a reason', () => {
    const detail = post<ServiceRequestDetail>('/requests/req-3/cancel', producerToken, {
      reason: 'A propriedade não estará disponível.',
    })

    expect(detail.status).toBe('cancelled')
    expect(detail.cancelledBy).toBe('producer')
  })

  it('cancels an accepted request by the provider with a reason', () => {
    const detail = post<ServiceRequestDetail>('/provider/requests/req-3/cancel', 'mock.prv-6', {
      reason: 'O equipamento apresentou uma falha.',
    })

    expect(detail.status).toBe('cancelled')
    expect(detail.cancelledBy).toBe('provider')
  })

  it('completes an in-progress request', () => {
    const detail = post<ServiceRequestDetail>('/provider/requests/req-2/complete', 'mock.prv-2')

    expect(detail.status).toBe('completed')
    expect(detail.events.at(-1)?.type).toBe('completed')
  })

  it('cancels every open request for a suspended account and preserves closed requests', () => {
    const completed = getRecord('req-4')
    const rejected = getRecord('req-7')
    cancelOpenRequestsForUser('usr-1', new Date('2026-11-11T12:00:00.000Z'))

    const openRecords = getMockDatabase().requestRecords.filter((record) => ['pending', 'counter_offer', 'accepted', 'in_progress'].includes(record.request.status))
    expect(openRecords).toHaveLength(0)
    expect(completed.request.status).toBe('completed')
    expect(rejected.request.status).toBe('rejected')
    expect(getRecord('req-2').events.at(-1)).toMatchObject({
      type: 'cancelled',
      actorRole: 'system',
      note: 'Conta suspensa pela administração',
    })
  })

  it('cancels an open request when the system suspends an account', () => {
    const record = getRecord('req-8')
    const result = applyRequestTransition(
      'req-8',
      'system_cancel',
      { id: null, role: 'system', name: 'Sistema' },
      { reason: 'Conta suspensa' },
      new Date('2026-11-11T12:00:00.000Z'),
    )

    expect(result.status).toBe('cancelled')
    expect(result.cancelledBy).toBe('system')
    expect(record.events.at(-1)?.actorRole).toBe('system')
  })

  it('rejects every action that is invalid for the current status with 409', () => {
    const cases = [
      ['/requests/req-8/counter-offer/accept', producerToken],
      ['/provider/requests/req-1/accept', 'mock.prv-1'],
      ['/provider/requests/req-3/reject', 'mock.prv-6'],
      ['/requests/req-2/cancel', producerToken],
      ['/provider/requests/req-4/start', 'mock.prv-1'],
      ['/provider/requests/req-7/complete', 'mock.prv-2'],
      ['/requests/req-6/cancel', producerToken],
    ] as const

    for (const [path, token] of cases) {
      const error = captureError(() => post(path, token, { reason: 'Motivo válido para o teste.' }))
      expect(error.status).toBe(409)
      expect(error.code).toBe('invalid_transition')
    }
  })

  it('rejects provider acceptance when the requested date has passed', () => {
    getRecord('req-8').request.scheduledDate = dateOffset(-1)
    const error = captureError(() => post('/provider/requests/req-8/accept', 'mock.prv-3'))

    expect(error.status).toBe(409)
    expect(error.message).toBe('A data pedida já passou. Faça uma contraproposta com uma nova data.')
  })

  it('rejects a producer acceptance when the counter-offer date has passed', () => {
    const request = getRecord('req-1').request
    if (!request.counterOffer) throw new Error('Seed counter-offer was not found')
    request.counterOffer.date = dateOffset(-1)

    const error = captureError(() => post('/requests/req-1/counter-offer/accept', producerToken))

    expect(error.status).toBe(409)
    expect(error.message).toBe('A data proposta já passou. Recuse a proposta ou cancele a solicitação.')
  })

  it('rejects starting an accepted request before the scheduled date', () => {
    getRecord('req-3').request.scheduledDate = dateOffset(1)
    const error = captureError(() => post('/provider/requests/req-3/start', 'mock.prv-6'))

    expect(error.status).toBe(409)
    expect(error.message).toBe('O serviço só pode ser iniciado a partir da data agendada.')
  })

  it('validates counter-offer changes and messages', () => {
    const error = captureError(() =>
      post('/provider/requests/req-8/counter-offer', 'mock.prv-3', {
        date: getRecord('req-8').request.scheduledDate,
        value: getRecord('req-8').request.value,
        message: 'ok',
      }),
    )

    expect(error.status).toBe(422)
    expect(error.fields).toEqual({ message: 'Explique a proposta ao produtor.' })

    const unchangedOfferError = captureError(() =>
      post('/provider/requests/req-8/counter-offer', 'mock.prv-3', {
        date: getRecord('req-8').request.scheduledDate,
        value: getRecord('req-8').request.value,
        message: 'Uma mensagem de proposta válida.',
      }),
    )
    expect(unchangedOfferError.message).toBe('Proponha uma nova data ou um novo valor.')
  })

  it('checks request participant roles and hides other users requests', () => {
    const forbidden = captureError(() => post('/provider/requests/req-8/accept', 'mock.prv-1'))
    expect(forbidden.status).toBe(404)
    expect(forbidden.code).toBe('request_not_found')

    const wrongRole = captureError(() => post('/provider/requests/req-8/accept', producerToken))
    expect(wrongRole.status).toBe(403)
    expect(wrongRole.code).toBe('forbidden')
  })
})

  it('only exposes contact phone numbers to the other party after acceptance', () => {
    resetMockDatabase()
    const database = getMockDatabase()
    const producer = database.users.find((user) => user.id === 'usr-1')
    const provider = database.users.find((user) => user.id === 'prv-6')
    if (!producer || !provider) throw new Error('Seed users were not found')
    producer.phone = '(45) 99999-0001'
    provider.phone = '(45) 99999-0006'

    const pending = getRequestDetail(getRecord('req-8'), 'producer')
    expect(pending.producer).not.toHaveProperty('phone')
    expect(pending.provider).not.toHaveProperty('phone')

    const acceptedForProducer = getRequestDetail(getRecord('req-3'), 'producer')
    expect(acceptedForProducer.provider.phone).toBe('(45) 99999-0006')
    expect(acceptedForProducer.producer).not.toHaveProperty('phone')

    const acceptedForProvider = getRequestDetail(getRecord('req-3'), 'provider')
    expect(acceptedForProvider.producer.phone).toBe('(45) 99999-0001')
    expect(acceptedForProvider.provider).not.toHaveProperty('phone')
  })
describe('allowed actions', () => {
  it('calculates actions by role, status and Brasília date', () => {
    expect(getAllowedActions(requestWith('pending'), 'producer')).toEqual(['cancel', 'message', 'report'])
    expect(getAllowedActions(requestWith('pending'), 'provider')).toContain('accept')
    expect(getAllowedActions(requestWith('counter_offer', {
      counterOffer: { date: dateOffset(1), value: 1600, message: 'Nova data e valor.', createdAt: '2026-01-01T00:00:00.000Z' },
    }), 'producer')).toContain('accept_counter_offer')
    expect(getAllowedActions(requestWith('accepted', { scheduledDate: dateOffset(1) }), 'provider')).not.toContain('start')
    expect(getAllowedActions(requestWith('accepted', { scheduledDate: dateOffset(-1) }), 'provider')).toContain('start')
    expect(getAllowedActions(requestWith('in_progress'), 'provider')).toContain('complete')
    expect(getAllowedActions(requestWith('completed'), 'producer')).toContain('review')
    expect(getAllowedActions(requestWith('rejected'), 'producer')).toEqual(['report'])
    expect(getAllowedActions(requestWith('cancelled'), 'provider')).toEqual(['report'])
  })
})
