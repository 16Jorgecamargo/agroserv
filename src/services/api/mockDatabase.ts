import { categories } from '../../data/categories'
import { providers } from '../../data/providers'
import { requestRecords } from '../../data/requests'
import { services } from '../../data/services'
import { userCredentials, users } from '../../data/users'
import type { RequestRecord } from '../../data/requests'
import type { ServiceRecord } from '../../data/services'
import type { UserCredential } from '../../data/users'
import type { Category, Provider, User } from '../../types/entities'

interface MockDatabase {
  categories: Category[]
  providers: Provider[]
  requestRecords: RequestRecord[]
  services: ServiceRecord[]
  userCredentials: UserCredential[]
  users: User[]
}

interface StoredMockDatabase {
  version: number
  database: MockDatabase
}

const STORAGE_KEY = 'agroserv_mock_db'
const DATABASE_VERSION = 1

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function createSeedDatabase(): MockDatabase {
  return clone({
    categories,
    providers,
    requestRecords,
    services,
    userCredentials,
    users,
  })
}

function getStorage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}

function isMockDatabase(value: unknown): value is MockDatabase {
  if (!value || typeof value !== 'object') return false

  const database = value as Record<string, unknown>

  return (
    Array.isArray(database.categories) &&
    Array.isArray(database.providers) &&
    Array.isArray(database.requestRecords) &&
    Array.isArray(database.services) &&
    Array.isArray(database.userCredentials) &&
    Array.isArray(database.users)
  )
}

function writeDatabase(database: MockDatabase): void {
  const storage = getStorage()
  if (!storage) return

  const stored: StoredMockDatabase = {
    version: DATABASE_VERSION,
    database,
  }

  storage.setItem(STORAGE_KEY, JSON.stringify(stored))
}

function loadDatabase(): MockDatabase {
  const storage = getStorage()
  if (!storage) return createSeedDatabase()

  let raw: string | null

  try {
    raw = storage.getItem(STORAGE_KEY)
  } catch {
    return createSeedDatabase()
  }

  if (!raw) {
    const database = createSeedDatabase()
    writeDatabase(database)
    return database
  }

  try {
    const stored = JSON.parse(raw) as Partial<StoredMockDatabase>

    if (stored.version === DATABASE_VERSION && isMockDatabase(stored.database)) {
      return stored.database
    }
  } catch {
    const database = createSeedDatabase()
    writeDatabase(database)
    return database
  }

  const database = createSeedDatabase()
  writeDatabase(database)
  return database
}

let mockDatabase = loadDatabase()

export function getMockDatabase(): MockDatabase {
  return mockDatabase
}

export function persistMockDatabase(): void {
  writeDatabase(mockDatabase)
}

export function resetMockDatabase(): void {
  mockDatabase = createSeedDatabase()
  writeDatabase(mockDatabase)
}

export function reloadMockDatabase(): void {
  mockDatabase = loadDatabase()
}