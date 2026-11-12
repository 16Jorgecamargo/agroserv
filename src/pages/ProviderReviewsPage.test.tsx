import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { getMockDatabase } from '../services/api/mockDatabase'
import { renderApp } from '../test/renderApp'
import { signInAsDemoProvider } from '../test/session'

describe('reviews screens', () => {
  it('shows the summary, distribution and replies on the service detail', async () => {
    renderApp('/servicos/svc-5')

    const section = await screen.findByRole('region', { name: 'Avaliações' })
    expect(await within(section).findByRole('list', { name: 'Distribuição das notas' })).toBeInTheDocument()
    expect(within(section).getByText('Aplicação uniforme e equipe pontual. Recomendo.')).toBeInTheDocument()
    expect(within(section).getByText('Obrigado pela confiança, Carlos!')).toBeInTheDocument()
  })

  it('lets the provider filter by rating and edit a reply', async () => {
    signInAsDemoProvider()
    renderApp('/prestador/avaliacoes')

    const list = await screen.findByRole('list', { name: 'Avaliações recebidas' })
    await userEvent.click(within(list).getByRole('button', { name: 'Editar resposta a Carlos Henrique Souza' }))
    const field = within(list).getByLabelText('Sua resposta pública')
    await userEvent.clear(field)
    await userEvent.type(field, 'Valeu, Carlos!')
    await userEvent.click(within(list).getByRole('button', { name: 'Publicar resposta' }))

    expect(await screen.findByText('Resposta atualizada.')).toBeInTheDocument()
    expect(getMockDatabase().reviews.find((review) => review.id === 'rev-1')?.reply?.text).toBe('Valeu, Carlos!')

    await userEvent.click(screen.getByRole('button', { name: '3 estrelas' }))
    expect(await screen.findByText('Nenhuma avaliação com esta nota.')).toBeInTheDocument()
  })

  it('marks hidden reviews', async () => {
    const review = getMockDatabase().reviews.find((candidate) => candidate.id === 'rev-1')
    if (review) review.hidden = true
    signInAsDemoProvider()
    renderApp('/prestador/avaliacoes')

    expect(await screen.findByText('Oculta pela administração')).toBeInTheDocument()
  })
})
