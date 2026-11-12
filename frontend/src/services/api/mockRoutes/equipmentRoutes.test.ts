import { describe, expect, it } from 'vitest'
import type { Equipment, ServiceDetail } from '../../../types/entities'
import { call, captureError, tokens } from '../../../test/mockApi'
import { getMockDatabase } from '../mockDatabase'

describe('provider equipment', () => {
  it('creates, edits and lists own equipment', () => {
    const created = call<Equipment>('POST', '/provider/equipment', { token: tokens.provider, body: { type: 'drone', model: 'DJI Agras T40', year: 2024, specs: 'Tanque de 40 L.' } })
    const edited = call<Equipment>('PATCH', `/provider/equipment/${created.id}`, { token: tokens.provider, body: { year: 2025 } })

    expect(edited).toMatchObject({ type: 'drone', model: 'DJI Agras T40', year: 2025, photos: [] })
    expect(call<Equipment[]>('GET', '/provider/equipment', { token: tokens.provider }).map((item) => item.id)).toContain(created.id)
    expect(call<Equipment[]>('GET', '/provider/equipment', { token: tokens.otherProvider }).map((item) => item.id)).not.toContain(created.id)
  })

  it('validates fields', () => {
    const error = captureError(() => call('POST', '/provider/equipment', { token: tokens.provider, body: { type: 'boat', model: 'x', year: 1900, photos: Array(7).fill('a') } }))
    expect(error.fields).toEqual({
      type: 'Selecione o tipo.',
      model: 'Informe marca e modelo.',
      year: 'Informe um ano válido.',
      photos: 'Use no máximo 6 fotos.',
    })
    expect(captureError(() => call('PATCH', '/provider/equipment/eqp-1', { token: tokens.otherProvider, body: { year: 2020 } })).code).toBe('equipment_not_found')
  })

  it('links equipment to services and unlinks it on delete', () => {
    expect(call<ServiceDetail>('GET', '/services/svc-1').equipment.map((item) => item.id)).toEqual(['eqp-1'])
    expect(captureError(() => call('PATCH', '/provider/services/svc-1', { token: tokens.otherProvider, body: { equipmentIds: ['eqp-1'] } })).status).toBe(404)

    call('DELETE', '/provider/equipment/eqp-1', { token: tokens.provider })

    expect(getMockDatabase().services.find((service) => service.id === 'svc-1')?.equipmentIds).toEqual([])
    expect(call<ServiceDetail>('GET', '/services/svc-1').equipment).toEqual([])
  })
})
