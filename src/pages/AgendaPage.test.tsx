import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { getMockDatabase } from '../services/api/mockDatabase'
import { renderApp } from '../test/renderApp'
import { signInAsDemoProvider } from '../test/session'
import { addDays, getTodayInBrasilia } from '../utils/date'
import { formatDate } from '../utils/format'

describe('AgendaPage', () => {
  it('shows scheduled services in the month and opens them', async () => {
    const record = getMockDatabase().requestRecords.find((candidate) => candidate.request.id === 'req-10')
    if (!record) throw new Error('req-10 missing')
    signInAsDemoProvider()
    renderApp(`/prestador/agenda?mes=${record.request.scheduledDate.slice(0, 7)}`)

    const cell = await screen.findByRole('gridcell', { name: new RegExp(formatDate(record.request.scheduledDate).replace(/\//g, '\\/')) })
    expect(within(cell).getByRole('link', { name: record.request.serviceTitle })).toHaveAttribute('href', '/prestador/solicitacoes/req-10')
  })

  it('blocks and unblocks a future day', async () => {
    const today = getTodayInBrasilia()
    const day = addDays(today, 1).slice(0, 7) === today.slice(0, 7) ? addDays(today, 1) : today
    signInAsDemoProvider()
    renderApp('/prestador/agenda')

    await userEvent.click(await screen.findByRole('button', { name: `Bloquear ${formatDate(day)}` }))
    expect(await screen.findByText(`${formatDate(day)} bloqueado para novas solicitações.`)).toBeInTheDocument()
    expect(getMockDatabase().blockedDays.some((blocked) => blocked.providerId === 'prv-1' && blocked.date === day)).toBe(true)

    await userEvent.click(await screen.findByRole('button', { name: `Desbloquear ${formatDate(day)}` }))
    expect(await screen.findByText(`${formatDate(day)} desbloqueado.`)).toBeInTheDocument()
  })

  it('navigates between months', async () => {
    signInAsDemoProvider()
    renderApp('/prestador/agenda?mes=2026-01')

    expect(await screen.findByRole('heading', { name: /janeiro de 2026/i })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Próximo mês' }))
    expect(await screen.findByRole('heading', { name: /fevereiro de 2026/i })).toBeInTheDocument()
  })
})
