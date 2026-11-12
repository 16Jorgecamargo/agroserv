import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import type { AuthContextValue } from '../../contexts/AuthContext'
import { useAuth } from '../../hooks/useAuth'
import { PrivateLayout } from '../../layouts/PrivateLayout'
import type { Role, User } from '../../types/entities'
import { Logo } from './Logo'
import { Navbar } from './Navbar'
import { Sidebar } from './Sidebar'

vi.mock('../../hooks/useAuth', () => ({ useAuth: vi.fn() }))

const labels: Record<Role, string> = {
  producer: 'produtor',
  provider: 'prestador',
  admin: 'administrador',
}

function createUser(role: Role): User {
  return {
    id: `usr-${role}`,
    name: 'Carlos Souza',
    email: 'a@b.c',
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

function LocationProbe() {
  const location = useLocation()
  return <p>Localização: {location.pathname}</p>
}

describe('Logo', () => {
  it('links to the home page with the brand artwork', () => {
    render(
      <MemoryRouter>
        <Logo />
      </MemoryRouter>,
    )

    const link = screen.getByRole('link', { name: 'AgroServ, página inicial' })
    expect(link).toHaveAttribute('href', '/')
    expect(link.querySelector('img')).toHaveAttribute('src', expect.stringMatching(/logo-horizontal\.png$/))
  })

  it('uses the white artwork on dark backgrounds', () => {
    render(
      <MemoryRouter>
        <Logo tone="light" />
      </MemoryRouter>,
    )

    const link = screen.getByRole('link', { name: 'AgroServ, página inicial' })
    expect(link.querySelector('img')).toHaveAttribute('src', expect.stringMatching(/logo-horizontal-white\.png$/))
  })
})

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

  it.each([
    ['producer', '/dashboard'],
    ['provider', '/prestador/dashboard'],
    ['admin', '/admin'],
  ] as const)('routes the %s user to their own area from the public navbar', (role, expectedPath) => {
    mockAuth({ isAuthenticated: true, user: createUser(role) })
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>,
    )

    const panelLinks = screen.getAllByRole('link', { name: 'Meu painel' })
    expect(panelLinks.length).toBeGreaterThan(0)
    expect(panelLinks.every((link) => link.getAttribute('href') === expectedPath)).toBe(true)
  })

  it('logs the authenticated user out', async () => {
    const logout = vi.fn()
    mockAuth({ isAuthenticated: true, logout, user: createUser('producer') })
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>,
    )

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
  it('shows the links available in the producer area and calls onLogout', async () => {
    const onLogout = vi.fn()
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Sidebar role="producer" onLogout={onLogout} />
      </MemoryRouter>,
    )

    expect(screen.getByRole('navigation', { name: 'Área do produtor' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Solicitações' })).toHaveAttribute('href', '/solicitacoes')
    expect(screen.getByRole('link', { name: 'Ver serviços' })).toHaveAttribute('href', '/servicos')

    await userEvent.click(screen.getByRole('button', { name: 'Sair' }))
    expect(onLogout).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['provider', 'Painel', '/prestador/dashboard'],
    ['admin', 'Painel', '/admin'],
  ] as const)('shows the existing dashboard link for the %s area', (role, label, href) => {
    render(
      <MemoryRouter initialEntries={[href]}>
        <Sidebar role={role} onLogout={vi.fn()} />
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: label })).toHaveAttribute('href', href)
    expect(screen.getByRole('navigation', { name: `Área do ${labels[role]}` })).toBeInTheDocument()
  })
})

describe('PrivateLayout', () => {
  it.each([
    ['producer', '/dashboard', 'Painel do produtor'],
    ['provider', '/prestador/dashboard', 'Painel do prestador'],
    ['admin', '/admin', 'Painel do administrador'],
  ] as const)('renders the shared layout for %s', (role, path, header) => {
    mockAuth({ isAuthenticated: true, user: createUser(role) })
    render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route element={<PrivateLayout />}>
            <Route path="/dashboard" element={<p>Conteúdo da área</p>} />
            <Route path="/prestador/dashboard" element={<p>Conteúdo da área</p>} />
            <Route path="/admin" element={<p>Conteúdo da área</p>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText(header)).toBeInTheDocument()
    expect(screen.getByText('Carlos Souza')).toBeInTheDocument()
    expect(screen.getByText('Santa Helena - PR')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Notificações (em breve)' })).toBeDisabled()
    expect(screen.getByText('Conteúdo da área')).toBeInTheDocument()
  })

  it.each([
    ['producer', '/dashboard'],
    ['provider', '/prestador/dashboard'],
    ['admin', '/admin'],
  ] as const)('logs the %s user out to the public home', async (role, path) => {
    const logout = vi.fn()
    mockAuth({ isAuthenticated: true, logout, user: createUser(role) })
    render(
      <MemoryRouter initialEntries={[path]}>
        <LocationProbe />
        <Routes>
          <Route element={<PrivateLayout />}>
            <Route path="/dashboard" element={<p>Área privada</p>} />
            <Route path="/prestador/dashboard" element={<p>Área privada</p>} />
            <Route path="/admin" element={<p>Área privada</p>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Sair' }))
    expect(logout).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Localização: /')).toBeInTheDocument()
  })
})
