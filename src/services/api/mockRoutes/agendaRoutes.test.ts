import { describe, expect, it } from 'vitest'
import type { ProviderAgenda } from '../../../types/api'
import { call, captureError, tokens } from '../../../test/mockApi'
import { addDays, getTodayInBrasilia } from '../../../utils/date'
import { getMockDatabase } from '../mockDatabase'

const today = getTodayInBrasilia()

function requestDate(id: string) {
  const record = getMockDatabase().requestRecords.find((candidate) => candidate.request.id === id)
  if (!record) throw new Error(`${id} missing`)
  return record.request
}

describe('provider agenda', () => {
  it('returns scheduled, in progress and completed requests of the month plus blocked days', () => {
    const scheduled = requestDate('req-10')
    const agenda = call<ProviderAgenda>('GET', '/provider/agenda', { token: tokens.provider, query: { month: scheduled.scheduledDate.slice(0, 7) } })

    expect(agenda.requests.map((request) => request.id)).toContain('req-10')
    expect(agenda.requests.every((request) => ['accepted', 'in_progress', 'completed'].includes(request.status))).toBe(true)
    const blocked = addDays(today, 15)
    expect(call<ProviderAgenda>('GET', '/provider/agenda', { token: tokens.provider, query: { month: blocked.slice(0, 7) } }).blockedDays).toContain(blocked)
  })

  it('blocks idempotently from today on and unblocks', () => {
    const day = addDays(today, 4)
    call('POST', '/provider/blocked-days', { token: tokens.provider, body: { date: day } })
    call('POST', '/provider/blocked-days', { token: tokens.provider, body: { date: day } })

    expect(getMockDatabase().blockedDays.filter((blocked) => blocked.providerId === 'prv-1' && blocked.date === day)).toHaveLength(1)
    expect(captureError(() => call('POST', '/provider/blocked-days', { token: tokens.provider, body: { date: addDays(today, -1) } })).fields).toEqual({
      date: 'Escolha uma data a partir de hoje.',
    })

    call('DELETE', `/provider/blocked-days/${day}`, { token: tokens.provider })
    call('DELETE', `/provider/blocked-days/${day}`, { token: tokens.provider })
    expect(getMockDatabase().blockedDays.some((blocked) => blocked.providerId === 'prv-1' && blocked.date === day)).toBe(false)
  })

  it('refuses new requests on blocked days without cancelling scheduled ones', () => {
    const scheduled = requestDate('req-10')
    call('POST', '/provider/blocked-days', { token: tokens.provider, body: { date: scheduled.scheduledDate } })

    expect(scheduled.status).toBe('accepted')
    const error = captureError(() =>
      call('POST', '/requests', { token: tokens.producer, body: { serviceId: 'svc-1', propertyId: 'prop-1', scheduledDate: scheduled.scheduledDate, quantity: 2 } }),
    )
    expect(error.fields).toMatchObject({ scheduledDate: 'O prestador não atende nesta data.' })
  })
})
