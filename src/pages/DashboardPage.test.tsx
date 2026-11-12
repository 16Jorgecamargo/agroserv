import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { renderApp } from '../test/renderApp'
import { getMockDatabase } from '../services/api/mockDatabase'
import { signInAsDemoProducer } from '../test/session'
import { keepOnlyFixedRequests } from '../test/seed'

describe('DashboardPage', () => {
  beforeEach(keepOnlyFixedRequests)

  it('shows greeting, stats and recent requests', async () => {
    signInAsDemoProducer()
    renderApp('/dashboard')
    expect(await screen.findByRole('heading', { level: 1, name: 'Olá, Carlos' })).toBeInTheDocument()
    expect(await screen.findByText(/R\$\s8\.500/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Solicitações abertas' }).closest('article')).toHaveTextContent('3')
    expect(screen.getByText('Total estimado contratado')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Em andamento' }).closest('article')).toHaveTextContent('1')
    const table = screen.getByRole('table', { name: 'Solicitações recentes' })
    expect(within(table).getAllByRole('row')).toHaveLength(6)
    expect(within(table).getByRole('link', { name: 'Pulverização com Drone' })).toHaveAttribute('href', '/servicos/svc-10')
    expect(await screen.findByText('Você tem uma contraproposta para responder.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver contraproposta' })).toHaveAttribute(
      'href',
      '/solicitacoes?status=counter_offer',
    )
  })

  it('hides the counter-offer alert when there is nothing to answer', async () => {
    const counterOffer = getMockDatabase().requestRecords.find((record) => record.request.status === 'counter_offer')
    if (counterOffer) counterOffer.request.status = 'cancelled'
    signInAsDemoProducer()
    renderApp('/dashboard')
    await screen.findByRole('heading', { level: 1, name: 'Olá, Carlos' })
    expect(await screen.findByText('Total estimado contratado')).toBeInTheDocument()
    expect(screen.queryByText('Você tem uma contraproposta para responder.')).not.toBeInTheDocument()
  })

  it('logs out to the homepage', async () => {
    signInAsDemoProducer()
    renderApp('/dashboard')
    await screen.findByRole('heading', { level: 1, name: 'Olá, Carlos' })
    await userEvent.click(screen.getByRole('button', { name: 'Sair' }))
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Encontre o serviço agrícola certo para sua propriedade.' }),
    ).toBeInTheDocument()
    expect(screen.queryByText('Faça login para acessar esta área.')).not.toBeInTheDocument()
    expect(localStorage.getItem('agroserv_token')).toBeNull()
  })

  it('recovers the user from the token when the stored profile is missing', async () => {
    localStorage.setItem('agroserv_token', 'mock.usr-1')
    renderApp('/dashboard')
    expect(await screen.findByRole('heading', { level: 1, name: 'Olá, Carlos' })).toBeInTheDocument()
  })
})
