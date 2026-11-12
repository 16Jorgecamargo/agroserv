import { describe, expect, it } from 'vitest'
import { getTodayInBrasilia } from './date'

describe('getTodayInBrasilia', () => {
  it('uses the Brazilian calendar date late in the evening in Brasília', () => {
    expect(getTodayInBrasilia(new Date('2026-11-12T02:59:00.000Z'))).toBe('2026-11-11')
  })

  it('changes to the next date at midnight in Brasília', () => {
    expect(getTodayInBrasilia(new Date('2026-11-12T03:00:00.000Z'))).toBe('2026-11-12')
  })
})
