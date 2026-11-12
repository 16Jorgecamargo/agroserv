import { describe, expect, it } from 'vitest'
import type { ServiceRequestDetail } from '../../../types/entities'
import { call, captureError, tokens } from '../../../test/mockApi'
import { addDays, getTodayInBrasilia } from '../../../utils/date'
import { getMockDatabase } from '../mockDatabase'

const today = getTodayInBrasilia()

function payload(overrides: Record<string, unknown> = {}) {
  return { serviceId: 'svc-1', propertyId: 'prop-1', scheduledDate: addDays(today, 3), quantity: 4, ...overrides }
}

describe('POST /requests', () => {
  it('creates a pending request with the estimated value, property copy and created event', () => {
    const detail = call<ServiceRequestDetail>('POST', '/requests', { token: tokens.producer, body: payload({ notes: ' Talhão 3 ' }) })

    expect(detail).toMatchObject({
      status: 'pending',
      value: 720,
      priceUnit: 'hour',
      notes: 'Talhão 3',
      location: 'Fazenda Boa Vista, Santa Helena - PR',
      allowedActions: ['cancel', 'message', 'report'],
    })
    expect(detail.events.map((event) => event.type)).toEqual(['created'])
  })

  it('validates property, date, quantity and notes', () => {
    const error = captureError(() =>
      call('POST', '/requests', {
        token: tokens.producer,
        body: payload({ propertyId: 'prop-x', scheduledDate: addDays(today, -1), quantity: 0, notes: 'x'.repeat(1001) }),
      }),
    )

    expect(error.fields).toEqual({
      propertyId: 'Selecione uma propriedade.',
      scheduledDate: 'Escolha uma data a partir de hoje.',
      quantity: 'Informe a quantidade.',
      notes: 'Use no máximo 1000 caracteres.',
    })
  })

  it('rejects days blocked by the provider', () => {
    const blocked = getMockDatabase().blockedDays[0].date
    const error = captureError(() => call('POST', '/requests', { token: tokens.producer, body: payload({ scheduledDate: blocked }) }))
    expect(error.fields?.scheduledDate).toBe('O prestador não atende nesta data.')
    expect(call<string[]>('GET', '/services/svc-1/blocked-days')).toEqual([blocked])
  })

  it('answers 409 for unavailable services and 404 for hidden ones', () => {
    getMockDatabase().services.find((service) => service.id === 'svc-1')!.available = false
    expect(captureError(() => call('POST', '/requests', { token: tokens.producer, body: payload() })).code).toBe('service_unavailable')

    getMockDatabase().services.find((service) => service.id === 'svc-2')!.status = 'paused'
    expect(captureError(() => call('POST', '/requests', { token: tokens.producer, body: payload({ serviceId: 'svc-2' }) })).code).toBe(
      'service_not_found',
    )
  })

  it('only lets producers create requests', () => {
    expect(captureError(() => call('POST', '/requests', { token: tokens.provider, body: payload() })).status).toBe(403)
  })
})
