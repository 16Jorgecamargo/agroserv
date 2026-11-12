import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { users } from '../data/users'
import { getMockDatabase } from '../services/api/mockDatabase'
import { renderApp } from '../test/renderApp'
import { signInAsDemoProvider } from '../test/session'
import { saveSession } from '../utils/storage'

function signInAsProvider4() {
  const provider = users.find((user) => user.id === 'prv-4')
  if (!provider) throw new Error('prv-4 missing')
  saveSession('mock.prv-4', provider)
}

describe('VerificationPage', () => {
  it('sends identity and address documents for review', async () => {
    signInAsProvider4()
    renderApp('/prestador/verificacao')

    expect(await screen.findByRole('heading', { name: 'Não enviada' })).toBeInTheDocument()
    await userEvent.upload(screen.getByLabelText('Documento de identidade'), new File(['%PDF'], 'rg.pdf', { type: 'application/pdf' }))
    await userEvent.upload(screen.getByLabelText('Comprovante de endereço'), new File(['%PDF'], 'luz.pdf', { type: 'application/pdf' }))
    expect(await screen.findByText('luz.pdf')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Enviar para análise' }))

    expect(await screen.findByRole('heading', { name: 'Em análise' })).toBeInTheDocument()
    const documents = screen.getByRole('list', { name: 'Documentos enviados' })
    expect(within(documents).getByText('rg.pdf')).toBeInTheDocument()
    expect(getMockDatabase().uploads.filter((upload) => upload.ownerId === 'prv-4').every((upload) => upload.purpose === 'verification')).toBe(true)
  })

  it('asks for the CPF or CNPJ before sending', async () => {
    const profile = getMockDatabase().providerProfiles.find((candidate) => candidate.userId === 'prv-4')
    if (profile) profile.document = ''
    signInAsProvider4()
    renderApp('/prestador/verificacao')

    expect(await screen.findByText(/Preencha o CPF ou CNPJ no seu perfil antes de enviar./)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ir para o perfil' })).toHaveAttribute('href', '/prestador/perfil')
  })

  it('shows the approved status without the form and the verified badge on cards', async () => {
    signInAsDemoProvider()
    renderApp('/prestador/verificacao')

    expect(await screen.findByRole('heading', { name: 'Aprovada' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Enviar para análise' })).not.toBeInTheDocument()
  })

  it('shows the verified badge on the service detail', async () => {
    renderApp('/servicos/svc-1')

    const aside = await screen.findByRole('complementary', { name: 'Contratação' })
    expect(await within(aside).findByText('Verificado')).toBeInTheDocument()
  })
})
