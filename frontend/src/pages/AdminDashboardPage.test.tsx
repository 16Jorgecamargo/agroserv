import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderApp } from '../test/renderApp'
import { signInAsDemoAdmin } from '../test/session'

describe('AdminDashboardPage', () => {
  it('shows platform numbers and links the queues', async () => {
    signInAsDemoAdmin()
    renderApp('/admin')

    expect(await screen.findByRole('heading', { level: 1, name: 'Painel do administrador' })).toBeInTheDocument()
    const verifications = await screen.findByRole('link', { name: /Verificações pendentes/ })
    expect(verifications).toHaveAttribute('href', '/admin/verificacoes')
    expect(verifications).toHaveTextContent('1')
    expect(screen.getByRole('link', { name: /Denúncias abertas/ })).toHaveAttribute('href', '/admin/denuncias')
    expect(screen.getByRole('heading', { name: 'Produtores' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Serviços ativos' })).toBeInTheDocument()
    const statuses = screen.getByRole('list', { name: 'Solicitações por status' })
    expect(within(statuses).getAllByRole('listitem')).toHaveLength(7)
    expect(within(statuses).getByText('Contraproposta')).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Categorias mais solicitadas' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Restaurar dados demo' })).toBeInTheDocument()
  })
})
