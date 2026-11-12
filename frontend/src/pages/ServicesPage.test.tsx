import { screen, waitFor, within } from '@testing-library/react'
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

  it('shows the price range only after choosing the unit and sorts the results', async () => {
    renderApp('/servicos')
    const panel = await screen.findByRole('complementary', { name: 'Filtros avançados' })
    expect(within(panel).queryByLabelText('Preço mínimo')).not.toBeInTheDocument()

    await userEvent.selectOptions(within(panel).getByLabelText('Unidade de cobrança'), 'hectare')
    const max = await within(panel).findByLabelText('Preço máximo')
    await userEvent.type(max, '100{Enter}')
    await waitFor(() => expect(screen.getByText(/^Encontramos/).textContent).not.toBe('Encontramos 12 serviços'))

    await userEvent.selectOptions(screen.getByLabelText('Ordenar por'), 'price_desc')
    await waitFor(() => {
      const prices = screen.getAllByRole('article').map((article) => article.textContent ?? '')
      expect(prices.length).toBeGreaterThan(0)
    })
  })

  it('keeps advanced filters in the URL and clears them', async () => {
    renderApp('/servicos?verified=true&minRating=4.5&sort=rating')
    const panel = await screen.findByRole('complementary', { name: 'Filtros avançados' })
    expect(within(panel).getByLabelText('Só prestadores verificados')).toBeChecked()
    expect(within(panel).getByLabelText('Avaliação mínima')).toHaveValue('4.5')
    expect(screen.getByLabelText('Ordenar por')).toHaveValue('rating')

    await userEvent.click(screen.getAllByRole('button', { name: 'Limpar filtros' })[0])

    expect(await screen.findByText('Encontramos 12 serviços')).toBeInTheDocument()
    expect(within(panel).getByLabelText('Só prestadores verificados')).not.toBeChecked()
    expect(screen.getByLabelText('Ordenar por')).toHaveValue('relevance')
  })
})
