import type { User } from '../types/entities'

const TOKEN_KEY = 'agroserv_token'
const USER_KEY = 'agroserv_user'

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

const REQUIRED_USER_FIELDS = ['id', 'name', 'email', 'city', 'state'] as const

function isUser(value: unknown): value is User {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  const record = value as Record<string, unknown>
  return REQUIRED_USER_FIELDS.every((field) => typeof record[field] === 'string')
}

export function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (isUser(parsed)) return parsed
  } catch {
    return discardStoredUser()
  }
  return discardStoredUser()
}

function discardStoredUser(): null {
  try {
    localStorage.removeItem(USER_KEY)
  } catch {
    return null
  }
  return null
}

export function saveSession(token: string, user: User): void {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}
