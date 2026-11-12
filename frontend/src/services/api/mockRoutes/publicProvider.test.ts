import { describe, expect, it } from 'vitest'
import type { ProviderPublicProfile } from '../../../types/api'
import { call, captureError } from '../../../test/mockApi'
import { getMockDatabase } from '../mockDatabase'

describe('GET /providers/:id', () => {
  it('returns visible services, equipment and the five latest visible reviews', () => {
    getMockDatabase().services.find((service) => service.id === 'svc-5')!.status = 'paused'
    const profile = call<ProviderPublicProfile>('GET', '/providers/prv-1')

    expect(profile.provider).toMatchObject({ id: 'prv-1', name: 'Agro Máquinas Paraná', verified: true })
    expect(profile.services.map((service) => service.id)).toEqual(['svc-1'])
    expect(profile.equipment.map((item) => item.id)).toEqual(['eqp-1', 'eqp-2'])
    expect(profile.recentReviews.length).toBeLessThanOrEqual(5)
    expect(profile.recentReviews.every((review) => !review.hidden)).toBe(true)
    expect(profile.reviewSummary.count).toBe(getMockDatabase().providerProfiles.find((item) => item.userId === 'prv-1')!.reviewCount)
  })

  it('answers provider_unavailable for suspended accounts and non providers', () => {
    getMockDatabase().users.find((user) => user.id === 'prv-2')!.status = 'suspended'

    const error = captureError(() => call('GET', '/providers/prv-2'))
    expect(error).toMatchObject({ status: 404, code: 'provider_unavailable', message: 'Prestador não está mais na plataforma.' })
    expect(captureError(() => call('GET', '/providers/usr-1')).code).toBe('provider_unavailable')
  })
})
