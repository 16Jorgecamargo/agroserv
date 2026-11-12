import { describe, expect, it } from 'vitest'
import type { ServiceRequest, ServiceRequestDetail } from '../../../types/entities'
import { call, captureError, tokens } from '../../../test/mockApi'
import { addDays, getTodayInBrasilia } from '../../../utils/date'

describe('provider received requests', () => {
  it('lists only the provider requests, newest first, with a status filter', () => {
    const all = call<ServiceRequest[]>('GET', '/provider/requests', { token: tokens.provider })

    expect(all.length).toBeGreaterThan(0)
    expect(all.every((request) => request.providerId === 'prv-1')).toBe(true)
    expect([...all].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((request) => request.id)).toEqual(all.map((request) => request.id))

    const pending = call<ServiceRequest[]>('GET', '/provider/requests', { token: tokens.provider, query: { status: 'pending' } })
    expect(pending.every((request) => request.status === 'pending')).toBe(true)
    expect(captureError(() => call('GET', '/provider/requests', { token: tokens.provider, query: { status: 'x' } })).status).toBe(400)
  })

  it('shows property details and hides the producer phone until scheduled', () => {
    const pending = call<ServiceRequestDetail>('GET', '/provider/requests/req-14', { token: tokens.provider })
    expect(pending.property).toMatchObject({ name: 'Fazenda Boa Vista' })
    expect(pending.producer.phone).toBeUndefined()
    expect(pending.allowedActions).toEqual(['accept', 'reject', 'counter_offer', 'message', 'report'])

    const accepted = call<ServiceRequestDetail>('GET', '/provider/requests/req-10', { token: tokens.provider })
    expect(accepted.producer.phone).toBe('(45) 99999-0001')
  })

  it('answers 404 for requests of another provider', () => {
    expect(captureError(() => call('GET', '/provider/requests/req-14', { token: tokens.otherProvider })).status).toBe(404)
  })

  it('sends a counter offer with a new total value and date', () => {
    const detail = call<ServiceRequestDetail>('POST', '/provider/requests/req-14/counter-offer', {
      token: tokens.provider,
      body: { date: addDays(getTodayInBrasilia(), 12), value: 1300, message: 'Consigo dois dias depois.' },
    })

    expect(detail.status).toBe('counter_offer')
    expect(detail.counterOffer).toMatchObject({ value: 1300, message: 'Consigo dois dias depois.' })
    expect(captureError(() => call('POST', '/provider/requests/req-14/counter-offer', { token: tokens.provider, body: { value: 5, message: 'Outra proposta.' } })).status).toBe(409)
  })
})
