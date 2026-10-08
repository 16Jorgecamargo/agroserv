import { describe, expect, it } from 'vitest'
import type { User } from '../types/entities'
import { clearSession, getStoredUser, getToken, saveSession } from './storage'

const user: User = {
  id: 'usr-1',
  name: 'Carlos Henrique Souza',
  email: 'produtor@agroserv.com',
  role: 'producer',
  city: 'Santa Helena',
  state: 'PR',
}

describe('storage', () => {
  it('returns null when there is no session', () => {
    expect(getToken()).toBeNull()
    expect(getStoredUser()).toBeNull()
  })

  it('saves and reads the session', () => {
    saveSession('mock.usr-1', user)
    expect(getToken()).toBe('mock.usr-1')
    expect(getStoredUser()).toEqual(user)
    expect(localStorage.getItem('agroserv_token')).toBe('mock.usr-1')
  })

  it('clears the session', () => {
    saveSession('mock.usr-1', user)
    clearSession()
    expect(getToken()).toBeNull()
    expect(getStoredUser()).toBeNull()
  })

  it('ignores a corrupted stored user', () => {
    localStorage.setItem('agroserv_user', '{oops')
    expect(getStoredUser()).toBeNull()
  })

  it('ignores stored values that are not a user and removes them', () => {
    for (const raw of ['{}', '"x"', '123', '[]', '{"id":1,"name":"A"}']) {
      localStorage.setItem('agroserv_user', raw)
      expect(getStoredUser()).toBeNull()
      expect(localStorage.getItem('agroserv_user')).toBeNull()
    }
  })
})
