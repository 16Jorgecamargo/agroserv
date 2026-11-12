import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { call, tokens } from '../test/mockApi'
import { renderApp } from '../test/renderApp'
import { signInAsDemoAdmin } from '../test/session'

describe('AdminActionsPage', () => {
  it('shows who did what and filters by action', async () => {
    call('POST', '/admin/users/usr-1/suspend', { token: tokens.admin, body: { reason: 'Teste de histórico.' } })
    signInAsDemoAdmin()
    renderApp('/admin/historico')

    const section = await screen.findByRole('region', { name: 'Ações administrativas' })
    expect(within(section).getByText('Suspendeu conta')).toBeInTheDocument()
    expect(within(section).getByText('Motivo: Teste de histórico.')).toBeInTheDocument()

    await userEvent.selectOptions(screen.getByLabelText('Ação'), 'create_category')
    await waitFor(() => expect(screen.getByText('Nenhuma ação encontrada')).toBeInTheDocument())
  })
})
