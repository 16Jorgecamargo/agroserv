import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
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

  it('logs in with the demo account and opens the dashboard', async () => {
    renderApp('/login')
    await userEvent.click(screen.getByRole('button', { name: 'Usar conta demo' }))
    expect(screen.getByLabelText('E-mail')).toHaveValue('produtor@agroserv.com')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Olá, Carlos' })).toBeInTheDocument()
    expect(localStorage.getItem('agroserv_token')).toBe('mock.usr-1')
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

  it('toggles password visibility', async () => {
    renderApp('/login')
    const password = screen.getByLabelText('Senha')
    expect(password).toHaveAttribute('type', 'password')
    await userEvent.click(screen.getByRole('button', { name: 'Mostrar senha' }))
    expect(password).toHaveAttribute('type', 'text')
  })

  it('sends authenticated users to the dashboard', async () => {
    signInAsDemoProducer()
    renderApp('/login')
    expect(await screen.findByRole('heading', { level: 1, name: 'Olá, Carlos' })).toBeInTheDocument()
  })
})
