import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import type { AuthContextValue } from '../../contexts/AuthContext'
import { useAuth } from '../../hooks/useAuth'
import { Navbar } from './Navbar'
import { Sidebar } from './Sidebar'

vi.mock('../../hooks/useAuth', () => ({ useAuth: vi.fn() }))

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

describe('Navbar', () => {
  it('shows the login link for visitors', () => {
    mockAuth({})
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: 'Entrar' })).toHaveAttribute('href', '/login')
    expect(screen.getByRole('link', { name: 'Serviços' })).toHaveAttribute('href', '/servicos')
    expect(screen.queryByRole('link', { name: 'Meu painel' })).not.toBeInTheDocument()
  })

  it('shows the dashboard link and logout for authenticated users', async () => {
    const logout = vi.fn()
    mockAuth({
      isAuthenticated: true,
      logout,
      user: { id: 'usr-1', name: 'Carlos Souza', email: 'a@b.c', role: 'producer', city: 'X', state: 'PR' },
    })
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: 'Meu painel' })).toHaveAttribute('href', '/dashboard')
    await userEvent.click(screen.getByRole('button', { name: 'Sair da conta' }))
    expect(logout).toHaveBeenCalledTimes(1)
  })

  it('toggles the mobile menu', async () => {
    mockAuth({})
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>,
    )
    const toggle = screen.getByRole('button', { name: 'Abrir menu' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(toggle)
    expect(screen.getByRole('button', { name: 'Fechar menu' })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('navigation', { name: 'Menu móvel' })).toBeInTheDocument()
  })
})

describe('Sidebar', () => {
  it('lists private links and calls onLogout', async () => {
    const onLogout = vi.fn()
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Sidebar onLogout={onLogout} />
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Solicitações' })).toHaveAttribute('href', '/solicitacoes')
    await userEvent.click(screen.getByRole('button', { name: 'Sair' }))
    expect(onLogout).toHaveBeenCalledTimes(1)
  })
})
