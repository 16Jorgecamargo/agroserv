import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from '../test/renderApp'

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

  it('searches from the hero search bar', async () => {
    renderApp('/')
    await userEvent.type(screen.getByLabelText('Qual serviço você precisa?'), 'colheita')
    await userEvent.click(screen.getByRole('button', { name: 'Buscar' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Encontre serviços agrícolas' })).toBeInTheDocument()
    expect(await screen.findByText('Encontramos 2 serviços')).toBeInTheDocument()
  })

  it('shows the 404 page for unknown routes', () => {
    renderApp('/rota-inexistente')
    expect(screen.getByRole('heading', { level: 1, name: 'Página não encontrada' })).toBeInTheDocument()
  })
})
