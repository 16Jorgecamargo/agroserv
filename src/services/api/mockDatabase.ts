import { categories } from '../../data/categories'
import {
  adminActions,
  blockedDays,
  equipment,
  favorites,
  messages,
  notifications,
  reports,
  reviews,
  uploads,
  verifications,
  type BlockedDayRecord,
  type FavoriteRecord,
  type NotificationRecord,
  type UploadRecord,
  type VerificationRecord,
} from '../../data/demo'
import { properties, type PropertyRecord } from '../../data/properties'
import { providerProfiles } from '../../data/providers'
import { requestRecords } from '../../data/requests'
import { services } from '../../data/services'
import { userCredentials, users } from '../../data/users'
import type { RequestRecord } from '../../data/requests'
import type { ServiceRecord } from '../../data/services'
import type { UserCredential } from '../../data/users'
import type {
  AdminAction,
  Category,
  Equipment,
  Message,
  PasswordResetTokenRecord,
  ProviderProfile,
  Report,
  Review,
  User,
} from '../../types/entities'

export interface MockDatabase {
  adminActions: AdminAction[]
  blockedDays: BlockedDayRecord[]
  categories: Category[]
  equipment: Equipment[]
  favorites: FavoriteRecord[]
  messages: Message[]
  notifications: NotificationRecord[]
  passwordResetTokens: PasswordResetTokenRecord[]
  properties: PropertyRecord[]
  providerProfiles: ProviderProfile[]
  reports: Report[]
  requestRecords: RequestRecord[]
  reviews: Review[]
  services: ServiceRecord[]
  uploads: UploadRecord[]
  userCredentials: UserCredential[]
  users: User[]
  verifications: VerificationRecord[]
}

const TABLES: (keyof MockDatabase)[] = [
  'adminActions',
  'blockedDays',
  'categories',
  'equipment',
  'favorites',
  'messages',
  'notifications',
  'passwordResetTokens',
  'properties',
  'providerProfiles',
  'reports',
  'requestRecords',
  'reviews',
  'services',
  'uploads',
  'userCredentials',
  'users',
  'verifications',
]

interface StoredMockDatabase {
  version: number
  database: MockDatabase
}

const STORAGE_KEY = 'agroserv_mock_db'
const DATABASE_VERSION = 5

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function createSeedDatabase(): MockDatabase {
  return clone({
    adminActions,
    blockedDays,
    categories,
    equipment,
    favorites,
    messages,
    notifications,
    passwordResetTokens: [],
    properties,
    providerProfiles,
    reports,
    requestRecords,
    reviews,
    services,
    uploads,
    userCredentials,
    users,
    verifications,
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

  return TABLES.every((table) => Array.isArray(database[table]))
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

let mockDatabase: MockDatabase | null = null

export function getMockDatabase(): MockDatabase {
  mockDatabase ??= loadDatabase()
  return mockDatabase
}

export function persistMockDatabase(): void {
  writeDatabase(getMockDatabase())
}

export function resetMockDatabase(): void {
  mockDatabase = createSeedDatabase()
  writeDatabase(mockDatabase)
}

export function reloadMockDatabase(): void {
  mockDatabase = loadDatabase()
}
