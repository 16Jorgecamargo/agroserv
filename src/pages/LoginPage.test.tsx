import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { getMockDatabase } from '../services/api/mockDatabase'
import { renderApp } from '../test/renderApp'
import { signInAsDemoProducer } from '../test/session'

async function submitLogin(email: string, password: string) {
  if (email) await userEvent.type(screen.getByLabelText('E-mail'), email)
  if (password) await userEvent.type(screen.getByLabelText('Senha'), password)
  await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
}

describe('LoginPage', () => {
  it('redirects visitors from private pages with a warning', async () => {
    renderApp('/dashboard')
    expect(await screen.findByRole('heading', { level: 1, name: 'Bem-vindo de volta' })).toBeInTheDocument()
    expect(screen.getByText('Faça login para acessar esta área.')).toBeInTheDocument()
  })

  it('does not show the warning when opened directly', () => {
    renderApp('/login')
    expect(screen.queryByText('Faça login para acessar esta área.')).not.toBeInTheDocument()
  })

  it('validates required fields and email format', async () => {
    renderApp('/login')
    await submitLogin('', '')
    expect(screen.getByText('Informe seu e-mail.')).toBeInTheDocument()
    expect(screen.getByText('Informe sua senha.')).toBeInTheDocument()

    await submitLogin('abc', '1')
    expect(screen.getByText('Informe um e-mail válido.')).toBeInTheDocument()
  })

  it('shows the API message for wrong credentials', async () => {
    renderApp('/login')
    await submitLogin('produtor@agroserv.com', 'errada')
    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha inválidos.')
    expect(localStorage.getItem('agroserv_token')).toBeNull()
  })

  it('fills and logs in with the producer demo account', async () => {
    renderApp('/login')
    await userEvent.click(screen.getByRole('button', { name: 'Usar conta demo: Produtor' }))
    expect(screen.getByLabelText('E-mail')).toHaveValue('produtor@agroserv.com')

    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Olá, Carlos' })).toBeInTheDocument()
    expect(localStorage.getItem('agroserv_token')).toBe('mock.usr-1')
  })

  it('logs in with the provider demo account and opens the provider area', async () => {
    renderApp('/login')
    await userEvent.click(screen.getByRole('button', { name: 'Usar conta demo: Prestador' }))
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Painel do prestador' })).toBeInTheDocument()
    expect(localStorage.getItem('agroserv_token')).toBe('mock.prv-1')
  })

  it('logs in with the administrator demo account and opens the admin area', async () => {
    renderApp('/login')
    await userEvent.click(screen.getByRole('button', { name: 'Usar conta demo: Administrador' }))
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Painel do administrador' })).toBeInTheDocument()
    expect(localStorage.getItem('agroserv_token')).toBe('mock.adm-1')
  })

  it('shows the specific message when a suspended account tries to log in', async () => {
    const user = getMockDatabase().users.find((candidate) => candidate.id === 'usr-1')
    if (!user) throw new Error('Demo producer account not found')
    user.status = 'suspended'

    renderApp('/login')
    await submitLogin('produtor@agroserv.com', '123456')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Sua conta está suspensa. Entre em contato com o suporte.',
    )
    expect(localStorage.getItem('agroserv_token')).toBeNull()
  })

  it('returns to the service after logging in from its detail page', async () => {
    renderApp('/servicos/svc-1')
    await userEvent.click(await screen.findByRole('link', { name: 'Entrar para contratar' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Bem-vindo de volta' })).toBeInTheDocument()
    expect(screen.queryByText('Faça login para acessar esta área.')).not.toBeInTheDocument()

    await submitLogin('produtor@agroserv.com', '123456')
    expect(await screen.findByRole('heading', { level: 1, name: 'Pulverização Agrícola' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Acompanhar no painel' })).toBeInTheDocument()
  })

  it('links to password recovery and account registration', () => {
    renderApp('/login')
    expect(screen.getByRole('link', { name: 'Esqueci minha senha' })).toHaveAttribute('href', '/esqueci-senha')
    expect(screen.getByRole('link', { name: 'Criar conta' })).toHaveAttribute('href', '/cadastro')
  })

  it('toggles password visibility', async () => {
    renderApp('/login')
    const password = screen.getByLabelText('Senha')
    expect(password).toHaveAttribute('type', 'password')

    await userEvent.click(screen.getByRole('button', { name: 'Mostrar senha' }))
    expect(password).toHaveAttribute('type', 'text')
  })

  it('sends authenticated producers to the producer dashboard', async () => {
    signInAsDemoProducer()
    renderApp('/login')
    expect(await screen.findByRole('heading', { level: 1, name: 'Olá, Carlos' })).toBeInTheDocument()
  })
})