# Phase 3 — Authentication and route protection

> Part of `plan_index.md`. Read its Global Constraints first. Depends on Phases 1–2.

### Task 3.1: AuthContext, AuthProvider and useAuth

**Files:**
- Create: `src/contexts/AuthContext.ts`, `src/contexts/AuthProvider.tsx`, `src/hooks/useAuth.ts`
- Test: `src/contexts/AuthProvider.test.tsx`

**Interfaces:**
- Consumes: `authService.login/me` (Task 2.4), `getToken`, `getStoredUser`, `saveSession`, `clearSession` (Task 1.2), `isApiError` (Task 2.2).
- Produces:
  - `interface AuthContextValue { user: User | null; isAuthenticated: boolean; isLoading: boolean; login: (email: string, password: string) => Promise<User>; logout: () => void }`
  - `AuthContext` (React context, default `null`)
  - `AuthProvider({ children })`
  - `useAuth(): AuthContextValue` (throws outside the provider)

- [ ] **Step 1: Write the failing test `src/contexts/AuthProvider.test.tsx`**

```tsx
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/contexts`
Expected: FAIL — cannot resolve `../hooks/useAuth` / `./AuthProvider`.

- [ ] **Step 3: Write `src/contexts/AuthContext.ts`**

```ts
import { createContext } from 'react'
import type { User } from '../types/entities'

export interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<User>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
```

- [ ] **Step 4: Write `src/contexts/AuthProvider.tsx`**

```tsx
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
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
        if (!active) return
        saveSession(token, currentUser)
        setUser(currentUser)
      })
      .catch((error: unknown) => {
        if (!active || !isApiError(error) || error.status !== 401) return
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

  const login = useCallback(async (email: string, password: string) => {
    const response = await authService.login({ email: email.trim(), password })
    saveSession(response.token, response.user)
    setUser(response.user)
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
```

- [ ] **Step 5: Write `src/hooks/useAuth.ts`**

```ts
import { useContext } from 'react'
import { AuthContext, type AuthContextValue } from '../contexts/AuthContext'

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npx vitest run src/contexts && npx tsc -b`
Expected: PASS; tsc exit 0.

- [ ] **Step 7: Commit**

```bash
git add src/contexts src/hooks/useAuth.ts
git commit -m "feat: add AuthProvider with persisted mock session"
```

---

### Task 3.2: Paths, FullScreenLoader and ProtectedRoute

**Files:**
- Create: `src/routes/paths.ts`, `src/components/ui/FullScreenLoader.tsx`, `src/routes/ProtectedRoute.tsx`
- Test: `src/routes/ProtectedRoute.test.tsx`

**Interfaces:**
- Consumes: `useAuth` (Task 3.1).
- Produces:
  - `paths = { home: '/', services: '/servicos', serviceDetail: (id: string) => string, login: '/login', dashboard: '/dashboard', requests: '/solicitacoes' }`
  - `routePatterns = { serviceDetail: '/servicos/:id' }`
  - `interface LoginLocationState { from?: { pathname: string; search: string }; reason?: 'protected' }`
  - `FullScreenLoader()` — `role="status"`, text "Carregando…"
  - `ProtectedRoute()` — layout route rendering `<Outlet />`

- [ ] **Step 1: Write the failing test `src/routes/ProtectedRoute.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import type { AuthContextValue } from '../contexts/AuthContext'
import { useAuth } from '../hooks/useAuth'
import type { LoginLocationState } from './paths'
import { ProtectedRoute } from './ProtectedRoute'

vi.mock('../hooks/useAuth', () => ({ useAuth: vi.fn() }))

function mockAuth(overrides: Partial<AuthContextValue>) {
  vi.mocked(useAuth).mockReturnValue({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    ...overrides,
  })
}

function LoginProbe() {
  const state = useLocation().state as LoginLocationState | null
  return (
    <p>
      login:{state?.from?.pathname}
      {state?.from?.search}|{state?.reason}
    </p>
  )
}

function renderAt(entry: string) {
  render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/login" element={<LoginProbe />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/solicitacoes" element={<p>Área privada</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('ProtectedRoute', () => {
  it('redirects anonymous users to login keeping path and query', () => {
    mockAuth({ isAuthenticated: false })
    renderAt('/solicitacoes?status=completed')
    expect(screen.getByText('login:/solicitacoes?status=completed|protected')).toBeInTheDocument()
    expect(screen.queryByText('Área privada')).not.toBeInTheDocument()
  })

  it('renders the private content for authenticated users', () => {
    mockAuth({ isAuthenticated: true })
    renderAt('/solicitacoes')
    expect(screen.getByText('Área privada')).toBeInTheDocument()
  })

  it('waits while the session is being restored', () => {
    mockAuth({ isAuthenticated: false, isLoading: true })
    renderAt('/solicitacoes')
    expect(screen.getByRole('status')).toHaveTextContent('Carregando…')
    expect(screen.queryByText(/login:/)).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/routes`
Expected: FAIL — cannot resolve `./paths` / `./ProtectedRoute`.

- [ ] **Step 3: Write `src/routes/paths.ts`**

```ts
export const paths = {
  home: '/',
  services: '/servicos',
  serviceDetail: (id: string) => `/servicos/${encodeURIComponent(id)}`,
  login: '/login',
  dashboard: '/dashboard',
  requests: '/solicitacoes',
}

export const routePatterns = {
  serviceDetail: '/servicos/:id',
}

export interface LoginLocationState {
  from?: { pathname: string; search: string }
  reason?: 'protected'
}
```

- [ ] **Step 4: Write `src/components/ui/FullScreenLoader.tsx`**

```tsx
import { Loader2 } from 'lucide-react'

export function FullScreenLoader() {
  return (
    <div role="status" className="grid min-h-dvh place-items-center bg-bg">
      <span className="flex items-center gap-3 text-sm text-text-muted">
        <Loader2 className="size-5 animate-spin text-primary" aria-hidden />
        Carregando…
      </span>
    </div>
  )
}
```

- [ ] **Step 5: Write `src/routes/ProtectedRoute.tsx`**

```tsx
import { Navigate, Outlet, useLocation } from 'react-router'
import { FullScreenLoader } from '../components/ui/FullScreenLoader'
import { useAuth } from '../hooks/useAuth'
import { paths, type LoginLocationState } from './paths'

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return <FullScreenLoader />

  if (!isAuthenticated) {
    const state: LoginLocationState = {
      from: { pathname: location.pathname, search: location.search },
      reason: 'protected',
    }
    return <Navigate to={paths.login} replace state={state} />
  }

  return <Outlet />
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npx vitest run src/routes && npx tsc -b`
Expected: PASS; tsc exit 0.

- [ ] **Step 7: Commit**

```bash
git add src/routes src/components/ui/FullScreenLoader.tsx
git commit -m "feat: add ProtectedRoute that redirects to login preserving the destination"
```
