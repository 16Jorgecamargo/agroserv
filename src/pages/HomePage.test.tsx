import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { summarizeServices } from '../hooks/useMarketplaceOverview'
import { authService } from '../services/authService'
import { serviceService } from '../services/serviceService'
import { renderApp } from '../test/renderApp'

async function mockServiceList() {
  const page = await serviceService.list({ page: 1, pageSize: 60 })
  return page.data
}

describe('HomePage', () => {
  it('renders hero, categories and featured services', async () => {
    renderApp('/')
    expect(
      screen.getByRole('heading', { level: 1, name: 'Encontre o serviço agrícola certo para sua propriedade.' }),
    ).toBeInTheDocument()
    expect(await screen.findByRole('link', { name: 'Plantio' })).toHaveAttribute('href', '/servicos?category=plantio')
    expect(await screen.findByRole('heading', { name: 'Pulverização Agrícola' })).toBeInTheDocument()
    expect(screen.getAllByRole('article')).toHaveLength(4)
  })

  it('has navigation to the other areas', () => {
    renderApp('/')
    const mainNav = screen.getByRole('navigation', { name: 'Principal' })
    expect(mainNav).toHaveTextContent('Serviços')
    expect(screen.getByRole('link', { name: 'Encontrar serviços' })).toHaveAttribute('href', '/servicos')
    expect(screen.getByRole('link', { name: 'Acessar meu painel' })).toHaveAttribute('href', '/dashboard')
  })

  it('shows indicators computed from the published services', async () => {
    renderApp('/')
    const services = await mockServiceList()
    const overview = summarizeServices(services)
    const verified = await screen.findByText(/prestador(es)? verificado(s)?/)
    expect(verified.parentElement).toHaveTextContent(String(overview.verifiedProviders))
    expect(screen.getByText(/cidade(s)? atendida(s)?/).parentElement).toHaveTextContent(String(overview.cities))
    expect(screen.queryByText('120+')).not.toBeInTheDocument()
  })

  it.each([
    ['produtor@agroserv.com', '/dashboard'],
    ['prestador@agroserv.com', '/prestador/dashboard'],
    ['admin@agroserv.com', '/admin'],
  ])('sends %s to the matching panel from the hero', async (email, expectedPath) => {
    const session = await authService.login({ email, password: '123456' })
    localStorage.setItem('agroserv_token', session.token)
    localStorage.setItem('agroserv_user', JSON.stringify(session.user))
    renderApp('/')
    expect(await screen.findByRole('button', { name: 'Sair da conta' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Acessar meu painel' })).toHaveAttribute('href', expectedPath)
    const mainNav = within(screen.getByRole('navigation', { name: 'Principal' }))
    expect(mainNav.getByRole('link', { name: 'Painel' })).toHaveAttribute('href', expectedPath)
    const footerNav = within(screen.getByRole('navigation', { name: 'Rodapé' }))
    expect(footerNav.getByRole('link', { name: 'Painel' })).toHaveAttribute('href', expectedPath)
  })

  it('searches from the hero search bar', async () => {
    renderApp('/')
    await userEvent.type(screen.getByLabelText('O que você procura?'), 'colheita')
    await userEvent.click(screen.getByRole('button', { name: 'Pesquisar' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Encontre serviços agrícolas' })).toBeInTheDocument()
    expect(await screen.findByText('Encontramos 2 serviços')).toBeInTheDocument()
  })

  it('shows the 404 page for unknown routes', () => {
    renderApp('/rota-inexistente')
    expect(screen.getByRole('heading', { level: 1, name: 'Página não encontrada' })).toBeInTheDocument()
  })

  it('still renders when the stored user is corrupted', async () => {
    localStorage.setItem('agroserv_token', 'mock.usr-1')
    localStorage.setItem('agroserv_user', '{}')
    renderApp('/')
    expect(
      screen.getByRole('heading', { level: 1, name: 'Encontre o serviço agrícola certo para sua propriedade.' }),
    ).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: 'Sair da conta' })).toBeInTheDocument()
  })
})
