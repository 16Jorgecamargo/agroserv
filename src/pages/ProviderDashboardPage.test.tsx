import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { getMockDatabase } from '../services/api/mockDatabase'
import { renderApp } from '../test/renderApp'
import { signInAsDemoProvider } from '../test/session'

describe('ProviderDashboardPage', () => {
  it('shows the summary cards, pending and upcoming lists and shortcuts', async () => {
    signInAsDemoProvider()
    renderApp('/prestador/dashboard')

    const summary = await screen.findByRole('region', { name: 'Resumo' })
    expect(await within(summary).findByText('Novas solicitações')).toBeInTheDocument()
    expect(within(summary).getByText('Taxa de aceite')).toBeInTheDocument()
    expect(within(summary).getByText('Valor estimado. O acerto é feito diretamente com o prestador.')).toBeInTheDocument()
    const pending = screen.getByRole('region', { name: 'Aguardando resposta' })
    expect(within(pending).getAllByRole('link', { name: 'Pulverização Agrícola' })[0]).toHaveAttribute('href', '/prestador/solicitacoes/req-14')
    expect(screen.getByRole('region', { name: 'Próximos agendados' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Agenda' })).toHaveAttribute('href', '/prestador/agenda')
  })

  it('shows a dash for the acceptance rate without responses', async () => {
    getMockDatabase().requestRecords = []
    signInAsDemoProvider()
    renderApp('/prestador/dashboard')

    expect(await screen.findByText('Tudo em dia')).toBeInTheDocument()
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
  })
})
