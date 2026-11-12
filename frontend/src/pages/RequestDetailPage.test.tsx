import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { getMockDatabase } from '../services/api/mockDatabase'
import { renderApp } from '../test/renderApp'
import { signInAsDemoProducer } from '../test/session'
import { addDays, getTodayInBrasilia } from '../utils/date'

function findRecord(id: string) {
  const record = getMockDatabase().requestRecords.find((candidate) => candidate.request.id === id)
  if (!record) throw new Error(`${id} missing`)
  return record
}

describe('RequestDetailPage', () => {
  it('shows summary, timeline and hides the phone before scheduling', async () => {
    signInAsDemoProducer()
    renderApp('/solicitacoes/req-14')

    expect(await screen.findByRole('heading', { level: 1, name: 'Pulverização Agrícola' })).toBeInTheDocument()
    expect(screen.getByText('Aplicação de fungicida na soja.')).toBeInTheDocument()
    const timeline = screen.getByRole('region', { name: 'Linha do tempo' })
    expect(within(timeline).getByText('Solicitação criada')).toBeInTheDocument()
    expect(screen.getByText('O telefone aparece depois que a solicitação é agendada.')).toBeInTheDocument()
  })

  it('accepts a counter offer and refreshes the status', async () => {
    signInAsDemoProducer()
    renderApp('/solicitacoes/req-9')

    const offer = await screen.findByRole('region', { name: 'Proposta do prestador' })
    expect(within(offer).getByText(/Só consigo atender três dias depois/)).toBeInTheDocument()
    await userEvent.click(within(offer).getByRole('button', { name: 'Aceitar contraproposta' }))

    expect(await screen.findByText('Contraproposta aceita. Serviço agendado.')).toBeInTheDocument()
    expect(await screen.findByRole('link', { name: /\(\d{2}\)/ })).toBeInTheDocument()
    expect(findRecord('req-9').request.status).toBe('accepted')
  })

  it('requires a reason to cancel a scheduled request', async () => {
    signInAsDemoProducer()
    renderApp('/solicitacoes/req-10')

    await userEvent.click(await screen.findByRole('button', { name: 'Cancelar solicitação' }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByRole('button', { name: 'Cancelar solicitação' })).toBeDisabled()

    await userEvent.type(within(dialog).getByLabelText('Motivo do cancelamento (obrigatório)'), 'Chuva prevista')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancelar solicitação' }))

    expect(await screen.findByText('Solicitação cancelada.')).toBeInTheDocument()
    expect(findRecord('req-10').request).toMatchObject({ status: 'cancelled', cancelReason: 'Chuva prevista' })
  })

  it('warns when the requested date already passed', async () => {
    findRecord('req-14').request.scheduledDate = addDays(getTodayInBrasilia(), -2)
    signInAsDemoProducer()
    renderApp('/solicitacoes/req-14')

    expect(await screen.findByRole('alert')).toHaveTextContent('A data pedida já passou.')
  })

  it('shows the conflict message and reloads when the request changed meanwhile', async () => {
    signInAsDemoProducer()
    renderApp('/solicitacoes/req-14')

    await userEvent.click(await screen.findByRole('button', { name: 'Cancelar solicitação' }))
    findRecord('req-14').request.status = 'rejected'
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancelar solicitação' }))

    expect(await screen.findByText('Recusada')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cancelar solicitação' })).not.toBeInTheDocument()
  })

  it('shows not found for unknown ids', async () => {
    signInAsDemoProducer()
    renderApp('/solicitacoes/req-999')

    expect(await screen.findByRole('heading', { name: 'Solicitação não encontrada' })).toBeInTheDocument()
  })

  it('opens the detail from the requests list', async () => {
    signInAsDemoProducer()
    renderApp('/solicitacoes')

    const links = await screen.findAllByRole('link', { name: 'Pulverização Agrícola' })
    expect(links.some((link) => /\/solicitacoes\/req-\d+$/.test(link.getAttribute('href') ?? ''))).toBe(true)
  })
})
