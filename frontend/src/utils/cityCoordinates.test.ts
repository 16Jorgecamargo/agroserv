import { describe, expect, it } from 'vitest'
import { distanceBetweenCities, distanceKm, findCityCoordinates } from './cityCoordinates'

describe('city coordinates', () => {
  it('finds cities ignoring accents, case and extra spaces', () => {
    expect(findCityCoordinates('  marechal  candido rondon ', 'pr')).toEqual(findCityCoordinates('Marechal Cândido Rondon', 'PR'))
    expect(findCityCoordinates('Cascavel', 'PR')).not.toBeNull()
  })

  it('returns null for cities outside the table', () => {
    expect(findCityCoordinates('Cascavel', 'CE')).toBeNull()
    expect(findCityCoordinates('Cidade Inventada', 'PR')).toBeNull()
  })

  it('measures straight-line distance in kilometers', () => {
    const cascavel = findCityCoordinates('Cascavel', 'PR')!
    const toledo = findCityCoordinates('Toledo', 'PR')!
    expect(distanceKm(cascavel, cascavel)).toBe(0)
    expect(distanceKm(cascavel, toledo)).toBeGreaterThan(30)
    expect(distanceKm(cascavel, toledo)).toBeLessThan(45)
  })

  it('returns null when one of the cities is unknown', () => {
    expect(distanceBetweenCities({ city: 'Cascavel', state: 'PR' }, { city: 'Atlântida', state: 'PR' })).toBeNull()
    expect(distanceBetweenCities({ city: 'Cascavel', state: 'PR' }, { city: 'Santa Helena', state: 'PR' })).toBeGreaterThan(80)
  })
})
