import { describe, expect, it } from 'vitest'
import type { Paginated } from '../../../types/api'
import type { Category, Service, ServiceDetail, ServiceRequestDetail } from '../../../types/entities'
import { call, captureError, tokens } from '../../../test/mockApi'
import { getMockDatabase } from '../mockDatabase'
import { getRequestDetail, getRequestRecord } from './requestTransitions'
import { toProvider } from './shared'

function service(id: string) {
  const record = getMockDatabase().services.find((candidate) => candidate.id === id)
  if (!record) throw new Error(id)
  return record
}

describe('catalog visibility', () => {
  it('hides paused, hidden and deleted services from search but keeps them for the owner', () => {
    service('svc-1').status = 'paused'
    service('svc-2').status = 'hidden'
    service('svc-2').hiddenReason = 'Fotos enganosas.'
    service('svc-3').deletedAt = '2026-11-01T00:00:00.000Z'

    const ids = call<Paginated<Service>>('GET', '/services', { query: { pageSize: 60 } }).data.map((item) => item.id)
    expect(ids).not.toContain('svc-1')
    expect(ids).not.toContain('svc-2')
    expect(ids).not.toContain('svc-3')

    expect(captureError(() => call('GET', '/services/svc-1')).code).toBe('service_not_found')
    expect(call<ServiceDetail>('GET', '/services/svc-1', { token: tokens.provider }).status).toBe('paused')
    expect(call<ServiceDetail>('GET', '/services/svc-2', { token: tokens.admin }).hiddenReason).toBe('Fotos enganosas.')
    expect(captureError(() => call('GET', '/services/svc-3', { token: tokens.admin })).status).toBe(404)
  })

  it('hides services of suspended providers and keeps services of inactive categories', () => {
    const provider = getMockDatabase().users.find((user) => user.id === 'prv-2')
    if (provider) provider.status = 'suspended'
    getMockDatabase().categories.find((category) => category.id === 'cat-spraying')!.active = false

    const services = call<Paginated<Service>>('GET', '/services', { query: { pageSize: 60 } }).data
    expect(services.some((item) => item.providerId === 'prv-2')).toBe(false)
    expect(services.some((item) => item.categoryId === 'cat-spraying')).toBe(true)
    expect(call<Category[]>('GET', '/categories').some((category) => category.id === 'cat-spraying')).toBe(false)
    expect(call<Paginated<Service>>('GET', '/services', { query: { category: 'pulverizacao' } }).data).toEqual([])
  })

  it('returns the provider, category and equipment in the service detail', () => {
    const detail = call<ServiceDetail>('GET', '/services/svc-1')

    expect(detail.providerVerified).toBe(true)
    expect(detail.provider).toEqual(toProvider('prv-1'))
    expect(detail.equipment.map((item) => item.id)).toEqual(['eqp-1'])
    expect(detail.photos).toHaveLength(1)
    expect(detail.imageUrl).toBe(detail.photos[0])
  })
})

describe('request notifications', () => {
  it('notifies the producer when the provider accepts a request', () => {
    call<ServiceRequestDetail>('POST', '/provider/requests/req-14/accept', { token: tokens.provider })

    expect(getMockDatabase().notifications.at(-1)).toMatchObject({
      userId: 'usr-1',
      type: 'request_status',
      title: 'Sua solicitação foi agendada',
      link: '/solicitacoes/req-14',
      read: false,
    })
  })

  it('notifies the provider when the producer declines a counter offer', () => {
    call('POST', '/requests/req-9/counter-offer/decline', { token: tokens.producer })

    expect(getMockDatabase().notifications.at(-1)).toMatchObject({
      userId: 'prv-1',
      title: 'Contraproposta recusada',
      link: '/prestador/solicitacoes/req-9',
    })
  })

  it('marks removed services and properties in the request detail', () => {
    service('svc-5').deletedAt = '2026-11-01T00:00:00.000Z'
    getMockDatabase().properties.find((property) => property.id === 'prop-2')!.deletedAt = '2026-11-01T00:00:00.000Z'

    const detail = getRequestDetail(getRequestRecord('req-4'), 'producer')
    expect(detail.serviceRemoved).toBe(true)
    expect(detail.propertyRemoved).toBe(true)
    expect(detail.review?.id).toBe('rev-1')
  })
})
