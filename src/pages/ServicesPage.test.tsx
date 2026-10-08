import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from '../test/renderApp'

describe('ServicesPage', () => {
  it('lists the first page and loads more', async () => {
    renderApp('/servicos')
    expect(screen.getByRole('heading', { level: 1, name: 'Encontre serviços agrícolas' })).toBeInTheDocument()
    expect(await screen.findByText('Encontramos 12 serviços')).toBeInTheDocument()
    expect(screen.getAllByRole('article')).toHaveLength(9)
    await userEvent.click(screen.getByRole('button', { name: 'Carregar mais' }))
    await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(12))
    expect(screen.queryByRole('button', { name: 'Carregar mais' })).not.toBeInTheDocument()
  })

  it('filters by category chip', async () => {
    renderApp('/servicos')
    await userEvent.click(await screen.findByRole('button', { name: 'Pulverização' }))
    expect(await screen.findByText('Encontramos 2 serviços')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pulverização' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('reads filters from the URL', async () => {
    renderApp('/servicos?q=colheita&location=cascavel')
    expect(await screen.findByText('Encontramos 1 serviço')).toBeInTheDocument()
    expect(screen.getByLabelText('Qual serviço você precisa?')).toHaveValue('colheita')
  })

  it('shows the empty state and clears filters', async () => {
    renderApp('/servicos?q=xyzabc')
    expect(await screen.findByText('Não encontramos serviços para essa busca.')).toBeInTheDocument()
    await userEvent.click(screen.getAllByRole('button', { name: 'Limpar filtros' })[0])
    expect(await screen.findByText('Encontramos 12 serviços')).toBeInTheDocument()
    expect(screen.getByLabelText('Qual serviço você precisa?')).toHaveValue('')
  })

  it('shows the empty state for an unknown category', async () => {
    renderApp('/servicos?category=inexistente')
    expect(await screen.findByText('Não encontramos serviços para essa busca.')).toBeInTheDocument()
  })
})
