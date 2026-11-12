import { describe, expect, it } from 'vitest'
import type { Paginated } from '../../../types/api'
import type { Service } from '../../../types/entities'
import { call, captureError, tokens } from '../../../test/mockApi'
import { getMockDatabase } from '../mockDatabase'

const reason = 'Fotos de outro prestador.'

function visibleIds(): string[] {
  return call<Paginated<Service>>('GET', '/services', { query: { pageSize: 50 } }).data.map((service) => service.id)
}

describe('GET /admin/services', () => {
  it('lists services in any status with filters', () => {
    getMockDatabase().services.find((service) => service.id === 'svc-5')!.status = 'paused'

    const paused = call<Paginated<Service>>('GET', '/admin/services', { token: tokens.admin, query: { status: 'paused' } })
    expect(paused.data.map((service) => service.id)).toEqual(['svc-5'])

    const all = call<Paginated<Service>>('GET', '/admin/services', { token: tokens.admin, query: { pageSize: 100 } })
    expect(all.meta.total).toBe(getMockDatabase().services.filter((service) => !service.deletedAt).length)

    const harvest = call<Paginated<Service>>('GET', '/admin/services', { token: tokens.admin, query: { category: 'colheita', pageSize: 100 } })
    expect(harvest.data.every((service) => service.categoryId === 'cat-harvest')).toBe(true)

    const searched = call<Paginated<Service>>('GET', '/admin/services', { token: tokens.admin, query: { q: 'agro maquinas parana' } })
    expect(searched.data.every((service) => service.providerId === 'prv-1')).toBe(true)
  })
})

describe('hide and show', () => {
  it('hides with a reason and restores the previous status', () => {
    getMockDatabase().services.find((service) => service.id === 'svc-5')!.status = 'paused'

    const hidden = call<Service>('POST', '/admin/services/svc-5/hide', { token: tokens.admin, body: { reason } })
    const database = getMockDatabase()
    expect(hidden).toMatchObject({ status: 'hidden', hiddenReason: reason })
    expect(database.notifications.at(-1)).toMatchObject({ userId: 'prv-1', type: 'service_hidden', title: 'Seu anúncio foi ocultado', body: reason })
    expect(database.adminActions.at(-1)).toMatchObject({ action: 'hide_service', targetId: 'svc-5', reason })
    expect(captureError(() => call('POST', '/admin/services/svc-5/hide', { token: tokens.admin, body: { reason } })).code).toBe('invalid_transition')

    const shown = call<Service>('POST', '/admin/services/svc-5/show', { token: tokens.admin })
    expect(shown.status).toBe('paused')
    expect(shown.hiddenReason).toBeUndefined()
    expect(database.adminActions.at(-1)).toMatchObject({ action: 'show_service', targetId: 'svc-5' })
    expect(captureError(() => call('POST', '/admin/services/svc-5/show', { token: tokens.admin })).code).toBe('invalid_transition')
  })

  it('takes a hidden service out of the search', () => {
    call('POST', '/admin/services/svc-1/hide', { token: tokens.admin, body: { reason } })
    expect(visibleIds()).not.toContain('svc-1')
  })

  it('refuses to show services hidden by account deletion', () => {
    const record = getMockDatabase().services.find((service) => service.id === 'svc-1')!
    record.status = 'hidden'
    record.hiddenByAccountDeletion = true

    expect(captureError(() => call('POST', '/admin/services/svc-1/show', { token: tokens.admin })).message).toBe('O prestador excluiu a conta.')
  })
})

describe('DELETE /admin/services/:id', () => {
  it('is blocked with open requests', () => {
    const openServiceId = getMockDatabase().requestRecords.find((record) => record.request.status === 'pending')!.request.serviceId
    expect(captureError(() => call('DELETE', `/admin/services/${openServiceId}`, { token: tokens.admin })).status).toBe(409)
  })

  it('removes the service and notifies the provider', () => {
    const database = getMockDatabase()
    database.requestRecords = database.requestRecords.filter((record) => record.request.serviceId !== 'svc-5')

    call('DELETE', '/admin/services/svc-5', { token: tokens.admin })

    expect(database.services.find((service) => service.id === 'svc-5')?.deletedAt).toBeTruthy()
    expect(database.notifications.at(-1)).toMatchObject({ userId: 'prv-1', title: 'Seu anúncio foi removido pela administração' })
    expect(database.adminActions.at(-1)).toMatchObject({ action: 'delete_service', targetId: 'svc-5' })
    expect(captureError(() => call('POST', '/admin/services/svc-5/show', { token: tokens.admin })).code).toBe('service_not_found')
  })
})
