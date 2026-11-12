import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderApp } from '../test/renderApp'

describe('ServiceDetailPage', () => {
  it('shows the service, provider and price', async () => {
    renderApp('/servicos/svc-1')
    expect(await screen.findByRole('heading', { level: 1, name: 'Pulverização Agrícola' })).toBeInTheDocument()
    expect(screen.getByText('Agro Máquinas Paraná')).toBeInTheDocument()
    expect(screen.getByText(/R\$\s180\/h/)).toBeInTheDocument()
    expect(screen.getByText('12 anos')).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Trilha de navegação' })).toHaveTextContent('Serviços')
  })

  it('offers login to visitors', async () => {
    renderApp('/servicos/svc-1')
    expect(await screen.findByRole('link', { name: 'Entrar para contratar' })).toHaveAttribute('href', '/login')
  })

  it('shows a not found state for unknown ids', async () => {
    renderApp('/servicos/nao-existe')
    expect(await screen.findByRole('heading', { level: 1, name: 'Serviço não encontrado' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver serviços' })).toHaveAttribute('href', '/servicos')
  })
})
