import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuth } from '../hooks/useAuth'
import { ApiError } from '../services/api/apiError'
import { authService } from '../services/authService'
import type { User } from '../types/entities'
import { getStoredUser, getToken, saveSession } from '../utils/storage'
import { AuthProvider } from './AuthProvider'

vi.mock('../services/authService', () => ({
  authService: { login: vi.fn(), me: vi.fn() },
}))

const mockedAuthService = vi.mocked(authService)

const user: User = {
  id: 'usr-1',
  name: 'Carlos Henrique Souza',
  email: 'produtor@agroserv.com',
  role: 'producer',
  city: 'Santa Helena',
  state: 'PR',
}

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}

beforeEach(() => {
  vi.resetAllMocks()
})

describe('AuthProvider', () => {
  it('starts logged out without a stored token', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.isLoading).toBe(false)
    expect(mockedAuthService.me).not.toHaveBeenCalled()
  })

  it('logs in and persists the session', async () => {
    mockedAuthService.login.mockResolvedValue({ token: 'mock.usr-1', user })
    const { result } = renderHook(() => useAuth(), { wrapper })
    await act(async () => {
      await result.current.login('  produtor@agroserv.com ', '123456')
    })
    expect(mockedAuthService.login).toHaveBeenCalledWith({ email: 'produtor@agroserv.com', password: '123456' })
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.user?.name).toBe('Carlos Henrique Souza')
    expect(getToken()).toBe('mock.usr-1')
  })

  it('rethrows login errors and keeps the user logged out', async () => {
    mockedAuthService.login.mockRejectedValue(
      new ApiError({ status: 401, code: 'invalid_credentials', message: 'E-mail ou senha inválidos.' }),
    )
    const { result } = renderHook(() => useAuth(), { wrapper })
    await expect(result.current.login('produtor@agroserv.com', 'x')).rejects.toThrow('E-mail ou senha inválidos.')
    expect(result.current.isAuthenticated).toBe(false)
    expect(getToken()).toBeNull()
  })

  it('logs out and clears the session', async () => {
    mockedAuthService.login.mockResolvedValue({ token: 'mock.usr-1', user })
    const { result } = renderHook(() => useAuth(), { wrapper })
    await act(async () => {
      await result.current.login('produtor@agroserv.com', '123456')
    })
    act(() => result.current.logout())
    expect(result.current.isAuthenticated).toBe(false)
    expect(getToken()).toBeNull()
    expect(getStoredUser()).toBeNull()
  })

  it('restores a stored session and refreshes the user', async () => {
    saveSession('mock.usr-1', user)
    mockedAuthService.me.mockResolvedValue({ ...user, name: 'Carlos Atualizado' })
    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current.isLoading).toBe(true)
    expect(result.current.isAuthenticated).toBe(true)
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.user?.name).toBe('Carlos Atualizado')
    expect(getStoredUser()?.name).toBe('Carlos Atualizado')
  })

  it('clears the session when the stored token is rejected', async () => {
    saveSession('mock.usr-1', user)
    mockedAuthService.me.mockRejectedValue(new ApiError({ status: 401, code: 'unauthorized', message: 'Sessão inválida.' }))
    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.isAuthenticated).toBe(false)
    expect(getToken()).toBeNull()
  })

  it('keeps the stored session when the server is unreachable', async () => {
    saveSession('mock.usr-1', user)
    mockedAuthService.me.mockRejectedValue(new ApiError({ status: 0, code: 'network_error', message: 'Offline' }))
    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.isAuthenticated).toBe(true)
    expect(getToken()).toBe('mock.usr-1')
  })

  it('throws when useAuth is used outside the provider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => renderHook(() => useAuth())).toThrow('useAuth must be used within AuthProvider')
    consoleError.mockRestore()
  })
})
