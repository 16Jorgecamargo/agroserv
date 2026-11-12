import { describe, expect, it } from 'vitest'
import type { Service } from '../../../types/entities'
import { call, captureError, tokens } from '../../../test/mockApi'
import { getMockDatabase } from '../mockDatabase'

describe('favorites', () => {
  it('adds idempotently, lists newest first and removes', () => {
    call('POST', '/me/favorites', { token: tokens.producer, body: { serviceId: 'svc-1' } })
    call('POST', '/me/favorites', { token: tokens.producer, body: { serviceId: 'svc-1' } })

    expect(call<Service[]>('GET', '/me/favorites', { token: tokens.producer }).map((service) => service.id)).toEqual(['svc-1', 'svc-3'])

    call('DELETE', '/me/favorites/svc-1', { token: tokens.producer })
    call('DELETE', '/me/favorites/svc-1', { token: tokens.producer })
    expect(call<Service[]>('GET', '/me/favorites', { token: tokens.producer }).map((service) => service.id)).toEqual(['svc-3'])
  })

  it('hides services that are no longer visible', () => {
    getMockDatabase().services.find((service) => service.id === 'svc-3')!.status = 'paused'
    expect(call<Service[]>('GET', '/me/favorites', { token: tokens.producer })).toEqual([])
  })

  it('returns 404 for unknown services and 403 for other roles', () => {
    expect(captureError(() => call('POST', '/me/favorites', { token: tokens.producer, body: { serviceId: 'nope' } })).code).toBe('service_not_found')
    expect(captureError(() => call('GET', '/me/favorites', { token: tokens.provider })).status).toBe(403)
  })
})
