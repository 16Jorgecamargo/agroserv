import { describe, expect, it } from 'vitest'
import type { Paginated } from '../../../types/api'
import type { Service } from '../../../types/entities'
import { addDays, getTodayInBrasilia } from '../../../utils/date'
import { call } from '../../../test/mockApi'
import { getMockDatabase } from '../mockDatabase'

function search(query: Record<string, string | number | boolean>): Service[] {
  return call<Paginated<Service>>('GET', '/services', { query: { pageSize: 60, ...query } }).data
}

describe('GET /services advanced filters', () => {
  it('filters by price unit and only then by price range', () => {
    const hectare = search({ priceUnit: 'hectare' })
    expect(hectare.length).toBeGreaterThan(0)
    expect(hectare.every((service) => service.priceUnit === 'hectare')).toBe(true)

    const prices = hectare.map((service) => service.price).sort((a, b) => a - b)
    const middle = prices[Math.floor(prices.length / 2)]
    expect(search({ priceUnit: 'hectare', maxPrice: middle }).every((service) => service.price <= middle)).toBe(true)
    expect(search({ priceUnit: 'hectare', minPrice: middle }).every((service) => service.price >= middle)).toBe(true)
    expect(search({ maxPrice: 1 }).length).toBe(search({}).length)
  })

  it('filters by minimum rating and verified providers', () => {
    expect(search({ minRating: 4.8 }).every((service) => service.rating >= 4.8)).toBe(true)
    const verified = search({ verified: 'true' })
    expect(verified.length).toBeGreaterThan(0)
    expect(verified.every((service) => service.providerVerified)).toBe(true)
  })

  it('keeps only available services whose provider did not block the date', () => {
    const blockedDay = addDays(getTodayInBrasilia(), 15)
    const results = search({ date: blockedDay })

    expect(results.some((service) => service.providerId === 'prv-1')).toBe(false)
    expect(results.every((service) => service.available)).toBe(true)
    expect(search({ date: addDays(getTodayInBrasilia(), 16) }).some((service) => service.providerId === 'prv-1')).toBe(true)
  })

  it('sorts by price and rating and ignores invalid values', () => {
    const asc = search({ sort: 'price_asc' }).map((service) => service.price)
    expect(asc).toEqual([...asc].sort((a, b) => a - b))
    const desc = search({ sort: 'price_desc' }).map((service) => service.price)
    expect(desc).toEqual([...desc].sort((a, b) => b - a))
    const rating = search({ sort: 'rating' })
    expect(rating.map((service) => service.rating)).toEqual([...rating.map((service) => service.rating)].sort((a, b) => b - a))
    expect(search({ sort: 'nope', minRating: 9, priceUnit: 'week', date: '2026-13-40' }).length).toBe(search({}).length)
    expect(getMockDatabase().blockedDays.length).toBeGreaterThan(0)
  })
})
