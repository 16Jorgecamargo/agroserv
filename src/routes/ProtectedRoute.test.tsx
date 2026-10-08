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
