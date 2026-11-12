import { describe, expect, it } from 'vitest'
import type { Paginated } from '../../../types/api'
import type { Service, ServiceDetail, ServiceRequestDetail, Upload } from '../../../types/entities'
import { call, callAsync, captureError, tokens } from '../../../test/mockApi'
import { getMockDatabase } from '../mockDatabase'

const PNG = 'data:image/png;base64,iVBORw0KGgo='

function payload(overrides: Record<string, unknown> = {}) {
  return {
    title: 'Colheita de milho safrinha',
    categoryId: 'cat-harvest',
    description: 'Colheitadeira com plataforma de milho e transbordo incluso.',
    price: 320,
    priceUnit: 'hectare',
    city: 'Toledo',
    state: 'PR',
    ...overrides,
  }
}

function serviceRecord(id: string) {
  const record = getMockDatabase().services.find((candidate) => candidate.id === id)
  if (!record) throw new Error(`${id} missing`)
  return record
}

describe('provider services', () => {
  it('publishes a service straight into the public search', async () => {
    const photo = await callAsync<Upload>('POST', '/uploads', {
      token: tokens.provider,
      body: { name: 'a.png', contentType: 'image/png', dataUrl: PNG, purpose: 'public' },
    })
    const created = call<Service>('POST', '/provider/services', { token: tokens.provider, body: payload({ photos: [photo.url] }) })

    expect(created).toMatchObject({ status: 'active', available: true, imageUrl: photo.url, providerId: 'prv-1' })
    const search = call<Paginated<Service>>('GET', '/services', { query: { q: 'milho safrinha' } })
    expect(search.data.map((service) => service.id)).toContain(created.id)
    expect(call<Service[]>('GET', '/provider/services', { token: tokens.provider })[0].id).toBe(created.id)
  })

  it('validates fields, photo ownership and photo count', async () => {
    const error = captureError(() =>
      call('POST', '/provider/services', { token: tokens.provider, body: payload({ title: 'a', description: 'curta', price: 0, categoryId: 'x' }) }),
    )
    expect(error.fields).toMatchObject({
      title: 'Informe o título.',
      description: 'Descreva o serviço com pelo menos 20 caracteres.',
      price: 'Informe o preço.',
      categoryId: 'Selecione uma categoria.',
    })

    const foreign = await callAsync<Upload>('POST', '/uploads', {
      token: tokens.producer,
      body: { name: 'a.png', contentType: 'image/png', dataUrl: PNG, purpose: 'public' },
    })
    expect(captureError(() => call('POST', '/provider/services', { token: tokens.provider, body: payload({ photos: [foreign.url] }) })).fields).toEqual({
      photos: 'Use apenas imagens enviadas por você.',
    })
    expect(
      captureError(() => call('POST', '/provider/services', { token: tokens.provider, body: payload({ photos: Array.from({ length: 9 }, (_, i) => `x${i}`) }) })).fields,
    ).toEqual({ photos: 'Use no máximo 8 fotos.' })
  })

  it('keeps existing photos when editing and only lets the owner see it', () => {
    const current = serviceRecord('svc-1').photos
    const updated = call<Service>('PATCH', '/provider/services/svc-1', { token: tokens.provider, body: { title: 'Pulverização com drone', photos: current } })

    expect(updated.title).toBe('Pulverização com drone')
    expect(captureError(() => call('GET', '/provider/services/svc-1', { token: tokens.otherProvider })).status).toBe(404)
  })

  it('pauses and reactivates, removing the service from search meanwhile', () => {
    call('POST', '/provider/services/svc-5/pause', { token: tokens.provider })

    expect(captureError(() => call('GET', '/services/svc-5')).status).toBe(404)
    expect(call<ServiceDetail>('GET', '/services/svc-5', { token: tokens.provider }).status).toBe('paused')
    expect(captureError(() => call('POST', '/provider/services/svc-5/pause', { token: tokens.provider })).message).toBe('Este anúncio já está pausado.')

    call('POST', '/provider/services/svc-5/activate', { token: tokens.provider })
    expect(call<ServiceDetail>('GET', '/services/svc-5').status).toBe('active')
  })

  it('blocks pausing or activating a hidden service but lets the owner edit it', () => {
    Object.assign(serviceRecord('svc-5'), { status: 'hidden', hiddenReason: 'Fotos de outro anúncio.' })

    const error = captureError(() => call('POST', '/provider/services/svc-5/activate', { token: tokens.provider }))
    expect(error).toMatchObject({ status: 409, message: 'Anúncio oculto pela administração.' })
    const edited = call<Service>('PATCH', '/provider/services/svc-5', { token: tokens.provider, body: { price: 99 } })
    expect(edited).toMatchObject({ status: 'hidden', hiddenReason: 'Fotos de outro anúncio.', price: 99 })
  })

  it('blocks deleting with open requests and soft deletes otherwise', () => {
    expect(captureError(() => call('DELETE', '/provider/services/svc-5', { token: tokens.provider })).message).toBe(
      'Este serviço tem solicitações em aberto. Pause o anúncio em vez de excluir.',
    )

    getMockDatabase()
      .requestRecords.filter((record) => record.request.serviceId === 'svc-5')
      .forEach((record) => {
        if (['pending', 'counter_offer', 'accepted', 'in_progress'].includes(record.request.status)) record.request.status = 'completed'
      })
    call('DELETE', '/provider/services/svc-5', { token: tokens.provider })

    expect(call<Service[]>('GET', '/provider/services', { token: tokens.provider }).map((service) => service.id)).not.toContain('svc-5')
    expect(captureError(() => call('GET', '/provider/services/svc-5', { token: tokens.provider })).status).toBe(404)
    expect(captureError(() => call('GET', '/services/svc-5')).status).toBe(404)
    expect(call<ServiceRequestDetail>('GET', '/requests/req-12', { token: tokens.producer }).serviceRemoved).toBe(true)
  })
})
