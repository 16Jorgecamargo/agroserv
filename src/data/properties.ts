import type { Property } from '../types/entities'

export interface PropertyRecord extends Property {
  producerId: string
  deletedAt?: string
}

function property(id: string, name: string, areaHectares: number, crops: string[], createdAt: string): PropertyRecord {
  return {
    id,
    producerId: 'usr-1',
    name,
    city: 'Santa Helena',
    state: 'PR',
    accessNotes: 'Acesso pela estrada rural principal.',
    areaHectares,
    crops,
    createdAt,
  }
}

export const properties: PropertyRecord[] = [
  property('prop-1', 'Fazenda Boa Vista', 240, ['Soja', 'Milho'], '2026-01-01T00:00:00.000Z'),
  property('prop-2', 'Sítio São José', 85, ['Soja', 'Milho'], '2026-01-02T00:00:00.000Z'),
]

export function toProperty({ producerId: _producerId, deletedAt: _deletedAt, ...property }: PropertyRecord): Property {
  return property
}
