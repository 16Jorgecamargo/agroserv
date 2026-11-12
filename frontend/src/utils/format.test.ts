import { describe, expect, it } from 'vitest'
import {
  formatCount,
  formatCurrency,
  formatDate,
  formatLocation,
  formatPrice,
  formatRating,
  getFirstName,
  getInitials,
} from './format'

const normalizeSpaces = (value: string) => value.replace(/\s/g, ' ')

describe('format', () => {
  it('formats BRL currency without cents', () => {
    expect(normalizeSpaces(formatCurrency(8420))).toBe('R$ 8.420')
  })

  it('formats price with unit suffix', () => {
    expect(normalizeSpaces(formatPrice(180, 'hour'))).toBe('R$ 180/h')
    expect(normalizeSpaces(formatPrice(95, 'hectare'))).toBe('R$ 95/ha')
    expect(normalizeSpaces(formatPrice(850, 'trip'))).toBe('R$ 850/viagem')
  })

  it('formats ISO dates in pt-BR without timezone shift', () => {
    expect(formatDate('2026-10-15')).toBe('15/10/2026')
    expect(formatDate('2026-10-01T00:00:00.000Z')).toBe('01/10/2026')
  })

  it('formats location', () => {
    expect(formatLocation('Santa Helena', 'PR')).toBe('Santa Helena - PR')
  })

  it('formats rating with comma and one decimal', () => {
    expect(formatRating(4.9)).toBe('4,9')
    expect(formatRating(5)).toBe('5,0')
  })

  it('pluralizes counts', () => {
    expect(formatCount(1, 'serviço', 'serviços')).toBe('1 serviço')
    expect(formatCount(0, 'serviço', 'serviços')).toBe('0 serviços')
    expect(formatCount(12, 'serviço', 'serviços')).toBe('12 serviços')
  })

  it('builds initials and first name', () => {
    expect(getInitials('Carlos Henrique Souza')).toBe('CH')
    expect(getInitials('ana')).toBe('A')
    expect(getInitials('  ')).toBe('')
    expect(getFirstName('Carlos Henrique Souza')).toBe('Carlos')
  })
})
