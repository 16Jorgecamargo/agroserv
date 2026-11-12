import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { getMockDatabase } from '../services/api/mockDatabase'
import { renderApp } from '../test/renderApp'
import { signInAsDemoProvider } from '../test/session'

describe('ProviderProfilePage', () => {
  it('loads and updates the professional profile', async () => {
    signInAsDemoProvider()
    renderApp('/prestador/perfil')

    expect(await screen.findByRole('heading', { name: 'Perfil profissional' })).toBeInTheDocument()
    const radius = await screen.findByLabelText('Raio de atendimento (km)')
    await userEvent.clear(radius)
    await userEvent.type(radius, '180')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar perfil profissional' }))

    expect(await screen.findByRole('status')).toHaveTextContent('Perfil profissional atualizado.')
    expect(getMockDatabase().providerProfiles.find((profile) => profile.userId === 'prv-1')?.serviceRadiusKm).toBe(180)
  })

  it('validates the professional fields before sending changes', async () => {
    signInAsDemoProvider()
    renderApp('/prestador/perfil')
    await screen.findByRole('heading', { name: 'Perfil profissional' })
    const document = await screen.findByLabelText('CPF ou CNPJ')
    await userEvent.clear(document)
    await userEvent.type(document, '123')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar perfil profissional' }))

    expect(screen.getByText('Informe um CPF ou CNPJ válido.')).toBeInTheDocument()
    expect(getMockDatabase().providerProfiles.find((profile) => profile.userId === 'prv-1')?.document).toBe('12345678901')
  })

  it('shows the demo restore action on the administrator panel', async () => {
    const { saveSession } = await import('../utils/storage')
    const admin = getMockDatabase().users.find((user) => user.role === 'admin')
    if (!admin) throw new Error('Demo admin account not found')
    saveSession(`mock.${admin.id}`, admin)
    renderApp('/admin')
    expect(await screen.findByRole('heading', { name: 'Painel do administrador' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Restaurar dados demo' })).toBeInTheDocument()
  })
})
