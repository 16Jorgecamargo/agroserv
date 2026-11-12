import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { getMockDatabase } from '../../services/api/mockDatabase'
import { call, tokens } from '../../test/mockApi'
import { renderApp } from '../../test/renderApp'
import { signInAsDemoProducer } from '../../test/session'

describe('RequestReviewSection', () => {
  it('reviews a completed request with stars and a comment', async () => {
    call('POST', '/provider/requests/req-11/complete', { token: tokens.provider })
    signInAsDemoProducer()
    renderApp('/solicitacoes/req-11')

    const section = await screen.findByRole('region', { name: 'Avaliar serviço' })
    await userEvent.click(within(section).getByLabelText('4 estrelas (Bom)'))
    await userEvent.type(within(section).getByLabelText('Comentário (opcional)'), 'Equipe pontual.')
    await userEvent.click(within(section).getByRole('button', { name: 'Publicar avaliação' }))

    expect(await screen.findByText('Obrigado! Sua avaliação foi publicada.')).toBeInTheDocument()
    const published = await screen.findByRole('region', { name: 'Sua avaliação' })
    expect(within(published).getByRole('img', { name: '4 de 5 estrelas' })).toBeInTheDocument()
    expect(within(published).getByText('Equipe pontual.')).toBeInTheDocument()
  })

  it('edits an existing review inside the window', async () => {
    signInAsDemoProducer()
    renderApp('/solicitacoes/req-4')

    const section = await screen.findByRole('region', { name: 'Sua avaliação' })
    expect(within(section).getByText(/Você pode editar até/)).toBeInTheDocument()
    await userEvent.click(within(section).getByRole('button', { name: 'Editar avaliação' }))
    await userEvent.click(within(section).getByLabelText('3 estrelas (Regular)'))
    await userEvent.click(within(section).getByRole('button', { name: 'Salvar avaliação' }))

    expect(await screen.findByText('Avaliação atualizada.')).toBeInTheDocument()
    expect(getMockDatabase().reviews.find((review) => review.id === 'rev-1')?.rating).toBe(3)
  })

  it('becomes read only after the edit window', async () => {
    const review = getMockDatabase().reviews.find((candidate) => candidate.id === 'rev-1')
    if (review) review.editableUntil = new Date(Date.now() - 1000).toISOString()
    signInAsDemoProducer()
    renderApp('/solicitacoes/req-4')

    const section = await screen.findByRole('region', { name: 'Sua avaliação' })
    expect(within(section).getByText('O prazo para editar esta avaliação terminou.')).toBeInTheDocument()
    expect(within(section).queryByRole('button', { name: 'Editar avaliação' })).not.toBeInTheDocument()
  })
})
