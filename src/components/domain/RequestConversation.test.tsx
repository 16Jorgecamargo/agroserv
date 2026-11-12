import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from '../../test/renderApp'
import { signInAsDemoProducer, signInAsDemoProvider } from '../../test/session'

describe('RequestConversation', () => {
  it('shows messages with own ones on the right and sends a new message', async () => {
    signInAsDemoProducer()
    renderApp('/solicitacoes/req-10')

    const conversation = await screen.findByRole('region', { name: 'Conversa' })
    const list = await within(conversation).findByRole('list', { name: 'Mensagens' })
    expect(within(list).getAllByText(/Você · Produtor/).length).toBeGreaterThan(0)

    await userEvent.type(within(conversation).getByLabelText('Mensagem'), 'Chego às 7h.')
    expect(within(conversation).getByText('12/2000')).toBeInTheDocument()
    await userEvent.click(within(conversation).getByRole('button', { name: 'Enviar' }))

    expect(await within(conversation).findByText('Chego às 7h.')).toBeInTheDocument()
    expect(within(conversation).getByText('0/2000')).toBeInTheDocument()
  })

  it('is read only once the request is closed', async () => {
    signInAsDemoProvider()
    renderApp('/prestador/solicitacoes/req-12')

    const conversation = await screen.findByRole('region', { name: 'Conversa' })
    expect(within(conversation).getByText('Esta conversa está encerrada.')).toBeInTheDocument()
    expect(within(conversation).queryByLabelText('Mensagem')).not.toBeInTheDocument()
  })
})
