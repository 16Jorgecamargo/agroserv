import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { subscribeUnauthorized } from '../services/api/apiClient'
import { isApiError } from '../services/api/apiError'
import { authService } from '../services/authService'
import type { User } from '../types/entities'
import { clearSession, getStoredUser, getToken, saveSession } from '../utils/storage'
import { AuthContext, type AuthContextValue } from './AuthContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => (getToken() ? getStoredUser() : null))
  const [isLoading, setIsLoading] = useState<boolean>(() => getToken() !== null)

  useEffect(() => {
    const token = getToken()
    if (!token) return
    let active = true
    authService
      .me()
      .then((currentUser) => {
        if (!active || getToken() !== token) return
        saveSession(token, currentUser)
        setUser(currentUser)
      })
      .catch((error: unknown) => {
        if (!active || !isApiError(error) || error.status !== 401 || getToken() !== token) return
        clearSession()
        setUser(null)
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(
    () =>
      subscribeUnauthorized((token) => {
        if (getToken() !== token) return
        clearSession()
        setUser(null)
      }),
    [],
  )

  const login = useCallback(async (email: string, password: string) => {
    const response = await authService.login({ email: email.trim(), password })
    saveSession(response.token, response.user)
    setUser(response.user)
    setIsLoading(false)
    return response.user
  }, [])

  const logout = useCallback(() => {
    clearSession()
    setUser(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated: user !== null, isLoading, login, logout }),
    [user, isLoading, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
