import { beforeEach, describe, expect, it } from 'vitest'
import {
  getMockDatabase,
  persistMockDatabase,
  reloadMockDatabase,
  resetMockDatabase,
} from './mockDatabase'

const STORAGE_KEY = 'agroserv_mock_db'

describe('mock database', () => {
  beforeEach(() => {
    resetMockDatabase()
  })

  it('initializes from the seed when storage is missing', () => {
    localStorage.removeItem(STORAGE_KEY)

    reloadMockDatabase()

    expect(getMockDatabase().categories[0].name).toBe('Plantio')
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull()
  })

  it('recreates the seed when stored data is corrupted', () => {
    localStorage.setItem(STORAGE_KEY, 'not valid JSON')

    reloadMockDatabase()

    expect(getMockDatabase().categories[0].name).toBe('Plantio')
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}').version).toBe(2)
  })

  it('recreates the seed when the stored version is old', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        database: {},
      }),
    )

    reloadMockDatabase()

    expect(getMockDatabase().categories[0].name).toBe('Plantio')
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}').version).toBe(2)
  })

  it('keeps saved changes after reloading the database', () => {
    getMockDatabase().categories[0].name = 'Categoria alterada'
    persistMockDatabase()

    reloadMockDatabase()

    expect(getMockDatabase().categories[0].name).toBe('Categoria alterada')
  })

  it('restores the seed when the database is reset', () => {
    getMockDatabase().categories[0].name = 'Categoria alterada'
    persistMockDatabase()

    resetMockDatabase()

    expect(getMockDatabase().categories[0].name).toBe('Plantio')
  })
})