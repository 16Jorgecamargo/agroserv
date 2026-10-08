import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from '../test/renderApp'
import { signInAsDemoProducer } from '../test/session'

describe('RequestsPage', () => {
  it('lists all requests and filters by status', async () => {
    signInAsDemoProducer()
    renderApp('/solicitacoes')
    expect(await screen.findByRole('heading', { level: 1, name: 'Minhas solicitações' })).toBeInTheDocument()
    expect(await screen.findByText('8 solicitações')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Todas' })).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(screen.getByRole('button', { name: 'Concluídas' }))
    expect(await screen.findByText('3 solicitações')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Concluídas' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('reads the status from the URL', async () => {
    signInAsDemoProducer()
    renderApp('/solicitacoes?status=cancelled')
    expect(await screen.findByText('1 solicitação')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Canceladas' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('falls back to all requests for an invalid status', async () => {
    signInAsDemoProducer()
    renderApp('/solicitacoes?status=invalido')
    expect(await screen.findByText('8 solicitações')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Todas' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('shows the location column', async () => {
    signInAsDemoProducer()
    renderApp('/solicitacoes')
    expect(await screen.findByRole('columnheader', { name: 'Local' })).toBeInTheDocument()
  })

  it('returns to the filtered page after login', async () => {
    renderApp('/solicitacoes?status=completed')
    expect(await screen.findByText('Faça login para acessar esta área.')).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText('E-mail'), 'produtor@agroserv.com')
    await userEvent.type(screen.getByLabelText('Senha'), '123456')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Minhas solicitações' })).toBeInTheDocument()
    expect(await screen.findByText('3 solicitações')).toBeInTheDocument()
  })
})
