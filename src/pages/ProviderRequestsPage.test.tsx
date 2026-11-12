import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { getMockDatabase } from '../services/api/mockDatabase'
import { renderApp } from '../test/renderApp'
import { signInAsDemoProvider } from '../test/session'
import { addDays, getTodayInBrasilia } from '../utils/date'

function findRecord(id: string) {
  const record = getMockDatabase().requestRecords.find((candidate) => candidate.request.id === id)
  if (!record) throw new Error(`${id} missing`)
  return record
}

describe('ProviderRequestsPage', () => {
  it('highlights pending requests and links rows to the provider detail', async () => {
    signInAsDemoProvider()
    renderApp('/prestador/solicitacoes')

    const pending = await screen.findByRole('region', { name: /aguardando resposta/ })
    const links = within(pending).getAllByRole('link', { name: 'Pulverização Agrícola' })
    expect(links[0]).toHaveAttribute('href', expect.stringMatching(/^\/prestador\/solicitacoes\/req-\d+$/))
  })

  it('filters by status', async () => {
    signInAsDemoProvider()
    renderApp('/prestador/solicitacoes?status=rejected')

    const table = await screen.findByRole('table', { name: 'Lista de solicitações recebidas' })
    expect(within(table).getAllByText('Recusada').length).toBeGreaterThan(0)
    expect(within(table).queryByText('Pendente')).not.toBeInTheDocument()
  })
})

describe('ProviderRequestDetailPage', () => {
  it('accepts a pending request and reveals the producer phone', async () => {
    signInAsDemoProvider()
    renderApp('/prestador/solicitacoes/req-14')

    expect(await screen.findByRole('region', { name: 'Propriedade' })).toHaveTextContent('Fazenda Boa Vista')
    expect(screen.getByText('O telefone aparece depois que a solicitação é agendada.')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Aceitar' }))

    expect(await screen.findByText('Solicitação aceita e agendada.')).toBeInTheDocument()
    expect(await screen.findByRole('link', { name: /\(45\) 99999-0001/ })).toBeInTheDocument()
    expect(findRecord('req-14').request.status).toBe('accepted')
  })

  it('rejects with a reason', async () => {
    signInAsDemoProvider()
    renderApp('/prestador/solicitacoes/req-14')

    await userEvent.click(await screen.findByRole('button', { name: 'Recusar' }))
    const dialog = screen.getByRole('dialog')
    await userEvent.type(within(dialog).getByLabelText('Motivo da recusa (obrigatório)'), 'Sem máquina disponível')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Recusar' }))

    expect(await screen.findByText('Solicitação recusada.')).toBeInTheDocument()
    expect(findRecord('req-14').request).toMatchObject({ status: 'rejected', rejectReason: 'Sem máquina disponível' })
  })

  it('sends a counter offer', async () => {
    signInAsDemoProvider()
    renderApp('/prestador/solicitacoes/req-14')

    await userEvent.click(await screen.findByRole('button', { name: 'Fazer contraproposta' }))
    const dialog = screen.getByRole('dialog')
    await userEvent.type(within(dialog).getByLabelText('Novo valor total (R$, opcional)'), '1200')
    await userEvent.type(within(dialog).getByLabelText('Mensagem ao produtor'), 'Faço por um valor fechado.')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Enviar contraproposta' }))

    expect(await screen.findByText('Contraproposta enviada ao produtor.')).toBeInTheDocument()
    expect(findRecord('req-14').request).toMatchObject({ status: 'counter_offer', counterOffer: { value: 1200 } })
  })

  it('asks for a new date or value before sending a counter offer', async () => {
    signInAsDemoProvider()
    renderApp('/prestador/solicitacoes/req-14')

    await userEvent.click(await screen.findByRole('button', { name: 'Fazer contraproposta' }))
    const dialog = screen.getByRole('dialog')
    await userEvent.type(within(dialog).getByLabelText('Mensagem ao produtor'), 'Posso atender.')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Enviar contraproposta' }))

    expect(within(dialog).getByText('Proponha uma nova data ou um novo valor.')).toBeInTheDocument()
  })

  it('hides accept for a past date and highlights a new date proposal', async () => {
    findRecord('req-14').request.scheduledDate = addDays(getTodayInBrasilia(), -1)
    signInAsDemoProvider()
    renderApp('/prestador/solicitacoes/req-14')

    expect(await screen.findByRole('alert')).toHaveTextContent('A data pedida já passou.')
    expect(screen.queryByRole('button', { name: 'Aceitar' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Propor nova data' })).toBeInTheDocument()
  })

  it('explains why a future scheduled service cannot start yet', async () => {
    signInAsDemoProvider()
    renderApp('/prestador/solicitacoes/req-10')

    expect(await screen.findByRole('button', { name: 'Iniciar serviço' })).toBeDisabled()
    expect(screen.getByText(/Disponível a partir de/)).toBeInTheDocument()
  })

  it('completes a service in progress', async () => {
    signInAsDemoProvider()
    renderApp('/prestador/solicitacoes/req-11')

    await userEvent.click(await screen.findByRole('button', { name: 'Concluir serviço' }))
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Concluir' }))

    expect(await screen.findByText('Serviço concluído. O produtor pode avaliar agora.')).toBeInTheDocument()
    expect(findRecord('req-11').request.status).toBe('completed')
  })

  it('shows not found for another provider request', async () => {
    findRecord('req-14').request.providerId = 'prv-2'
    signInAsDemoProvider()
    renderApp('/prestador/solicitacoes/req-14')

    expect(await screen.findByRole('heading', { name: 'Solicitação não encontrada' })).toBeInTheDocument()
  })
})
