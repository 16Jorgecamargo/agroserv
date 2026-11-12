import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import type { AuthContextValue } from '../contexts/AuthContext'
import { useAuth } from '../hooks/useAuth'
import type { User, Role } from '../types/entities'
import type { LoginLocationState } from './paths'
import { ProtectedRoute } from './ProtectedRoute'

vi.mock('../hooks/useAuth', () => ({ useAuth: vi.fn() }))

function createUser(role: Role): User {
  return {
    id: `demo-${role}`,
    name: 'Conta de teste',
    email: `${role}@agroserv.com`,
    role,
    city: 'Santa Helena',
    state: 'PR',
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
  }
}

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

function RouteProbe() {
  const location = useLocation()
  const state = location.state as LoginLocationState | null
  return <p>{location.pathname}|{state?.reason}</p>
}

function renderAt(entry: string) {
  render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/login" element={<LoginProbe />} />

        <Route element={<ProtectedRoute allowedRoles={['producer']} />}>
          <Route path="/solicitacoes" element={<p>Área privada do produtor</p>} />
          <Route path="/dashboard" element={<RouteProbe />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['provider']} />}>
          <Route path="/prestador/dashboard" element={<RouteProbe />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin" element={<RouteProbe />} />
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
    expect(screen.queryByText('Área privada do produtor')).not.toBeInTheDocument()
  })

  it('renders private content for an authenticated user with the allowed role', () => {
    mockAuth({ user: createUser('producer'), isAuthenticated: true })
    renderAt('/solicitacoes')

    expect(screen.getByText('Área privada do produtor')).toBeInTheDocument()
  })

  it.each([
    ['producer', '/admin', '/dashboard|forbidden'],
    ['provider', '/dashboard', '/prestador/dashboard|forbidden'],
    ['admin', '/prestador/dashboard', '/admin|forbidden'],
  ] as const)('%s is redirected from a different role area to their own area', (role, requestedPath, expected) => {
    mockAuth({ user: createUser(role), isAuthenticated: true })
    renderAt(requestedPath)

    expect(screen.getByText(expected)).toBeInTheDocument()
  })

  it('waits while the session is being restored', () => {
    mockAuth({ isAuthenticated: false, isLoading: true })
    renderAt('/solicitacoes')

    expect(screen.getByRole('status')).toHaveTextContent('Carregando…')
    expect(screen.queryByText(/login:/)).not.toBeInTheDocument()
  })
})