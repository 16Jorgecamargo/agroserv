import { describe, expect, it } from 'vitest'
import type { Property } from '../../../types/entities'
import { call, captureError, tokens } from '../../../test/mockApi'
import { getMockDatabase } from '../mockDatabase'
import { getRequestDetail, getRequestRecord } from './requestTransitions'

const validProperty = {
  name: ' Fazenda Nova ',
  city: 'Toledo',
  state: 'pr',
  areaHectares: 120.5,
  crops: ['Soja', 'Trigo'],
}

describe('property mock routes', () => {
  it('lists the producer properties by creation date', () => {
    const properties = call<Property[]>('GET', '/me/properties', { token: tokens.producer })
    expect(properties.map((property) => property.id)).toEqual(['prop-1', 'prop-2'])
    expect(properties[0]).not.toHaveProperty('producerId')
  })

  it('creates, edits and lists a property', () => {
    const created = call<Property>('POST', '/me/properties', { token: tokens.producer, body: validProperty })
    expect(created).toMatchObject({ id: 'prop-3', name: 'Fazenda Nova', state: 'PR', accessNotes: '', crops: ['Soja', 'Trigo'] })

    const updated = call<Property>('PATCH', '/me/properties/prop-3', { token: tokens.producer, body: { areaHectares: 200 } })
    expect(updated.areaHectares).toBe(200)
    expect(call<Property[]>('GET', '/me/properties', { token: tokens.producer })).toHaveLength(3)
  })

  it('validates every field with the contract messages', () => {
    const error = captureError(() =>
      call('POST', '/me/properties', {
        token: tokens.producer,
        body: { name: 'A', city: '', state: 'XX', accessNotes: 'x'.repeat(501), areaHectares: 0, crops: ['Soja', 'soja'] },
      }),
    )

    expect(error.status).toBe(422)
    expect(error.fields).toEqual({
      name: 'Informe o nome da propriedade.',
      city: 'Informe a cidade.',
      state: 'Selecione a UF.',
      accessNotes: 'Use no máximo 500 caracteres.',
      areaHectares: 'Informe a área em hectares.',
      crops: 'Informe até 10 culturas.',
    })
  })

  it('blocks removal while the property has open requests', () => {
    const error = captureError(() => call('DELETE', '/me/properties/prop-1', { token: tokens.producer }))
    expect(error.status).toBe(409)
    expect(error.message).toBe('Esta propriedade tem solicitações em aberto.')
  })

  it('removes logically and keeps old requests showing the property as removed', () => {
    getMockDatabase().requestRecords.forEach(({ request }) => {
      if (request.propertyId === 'prop-2' && ['pending', 'counter_offer', 'accepted', 'in_progress'].includes(request.status)) {
        request.status = 'cancelled'
      }
    })

    expect(call('DELETE', '/me/properties/prop-2', { token: tokens.producer })).toBeUndefined()
    expect(call<Property[]>('GET', '/me/properties', { token: tokens.producer }).map((property) => property.id)).toEqual(['prop-1'])
    expect(getMockDatabase().properties.find((property) => property.id === 'prop-2')?.deletedAt).toBeTruthy()
    const detail = getRequestDetail(getRequestRecord('req-4'), 'producer')
    expect(detail.propertyRemoved).toBe(true)
  })

  it('hides other producers properties and other roles', () => {
    expect(captureError(() => call('PATCH', '/me/properties/prop-1', { token: tokens.provider, body: {} })).status).toBe(403)
    getMockDatabase().properties.push({ ...getMockDatabase().properties[0], id: 'prop-99', producerId: 'usr-99' })
    expect(captureError(() => call('DELETE', '/me/properties/prop-99', { token: tokens.producer })).code).toBe('property_not_found')
  })
})
