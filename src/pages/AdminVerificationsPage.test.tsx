import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { getMockDatabase } from '../services/api/mockDatabase'
import { renderApp } from '../test/renderApp'
import { signInAsDemoAdmin } from '../test/session'

describe('AdminVerificationsPage', () => {
  it('shows the documents and approves the provider', async () => {
    signInAsDemoAdmin()
    renderApp('/admin/verificacoes')

    const article = await screen.findByRole('article')
    const documents = within(article).getByRole('group', { name: /^Documentos de / })
    expect(within(documents).getAllByRole('figure')).toHaveLength(2)
    expect(within(article).getByRole('link', { name: 'Abrir documento de identidade' })).toBeInTheDocument()

    await userEvent.click(within(article).getByRole('button', { name: 'Aprovar' }))

    expect(await screen.findByText('Nenhuma verificação pendente')).toBeInTheDocument()
    expect(getMockDatabase().providerProfiles.find((profile) => profile.userId === 'prv-3')?.verificationStatus).toBe('approved')
  })

  it('requires a reason to reject', async () => {
    signInAsDemoAdmin()
    renderApp('/admin/verificacoes')

    await userEvent.click(await screen.findByRole('button', { name: 'Rejeitar' }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByRole('button', { name: 'Rejeitar verificação' })).toBeDisabled()
    await userEvent.type(within(dialog).getByLabelText('Motivo da rejeição (obrigatório)'), 'Documento ilegível.')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Rejeitar verificação' }))

    expect(await screen.findByText('Nenhuma verificação pendente')).toBeInTheDocument()
    expect(getMockDatabase().providerProfiles.find((profile) => profile.userId === 'prv-3')?.verificationStatus).toBe('rejected')
  })
})
