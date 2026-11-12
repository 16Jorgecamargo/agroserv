import { describe, expect, it } from 'vitest'
import type { ServiceRequestDetail } from '../../../types/entities'
import { call, captureError, tokens } from '../../../test/mockApi'
import { getMockDatabase } from '../mockDatabase'

describe('GET /requests/:id', () => {
  it('returns the producer request with timeline, counter offer and allowed actions', () => {
    const detail = call<ServiceRequestDetail>('GET', '/requests/req-9', { token: tokens.producer })

    expect(detail.status).toBe('counter_offer')
    expect(detail.counterOffer).toMatchObject({ value: 1000 })
    expect(detail.events.map((event) => event.type)).toEqual(['created', 'counter_offer'])
    expect(detail.allowedActions).toEqual(expect.arrayContaining(['accept_counter_offer', 'decline_counter_offer', 'cancel']))
    expect(detail.provider.phone).toBeUndefined()
  })

  it('shows the provider phone once the request is scheduled', () => {
    const detail = call<ServiceRequestDetail>('GET', '/requests/req-10', { token: tokens.producer })

    expect(detail.status).toBe('accepted')
    expect(detail.provider.phone).toBeTruthy()
  })

  it('answers 404 for a missing id or a request owned by someone else', () => {
    expect(captureError(() => call('GET', '/requests/req-999', { token: tokens.producer }))).toMatchObject({
      status: 404,
      code: 'request_not_found',
    })

    const record = getMockDatabase().requestRecords.find((candidate) => candidate.request.id === 'req-1')
    if (!record) throw new Error('req-1 missing')
    record.request.producerId = 'usr-other'

    expect(captureError(() => call('GET', '/requests/req-1', { token: tokens.producer }))).toMatchObject({ status: 404 })
  })

  it('rejects other roles', () => {
    expect(captureError(() => call('GET', '/requests/req-1', { token: tokens.provider })).status).toBe(403)
  })
})
