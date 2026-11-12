import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { getMockDatabase } from '../services/api/mockDatabase'
import { renderApp } from '../test/renderApp'
import { signInAsDemoProducer } from '../test/session'

describe('ProfilePage', () => {
  it('updates personal information and reflects the name in the shared header', async () => {
    signInAsDemoProducer()
    renderApp('/perfil')

    const name = await screen.findByLabelText('Nome completo')
    await userEvent.clear(name)
    await userEvent.type(name, 'Maria dos Santos')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar dados pessoais' }))

    expect(await screen.findByRole('status')).toHaveTextContent('Dados pessoais atualizados.')
    expect(screen.getByText('Maria dos Santos')).toBeInTheDocument()
  })

  it('shows the API error when the current password is wrong', async () => {
    signInAsDemoProducer()
    renderApp('/perfil')
    await userEvent.type(await screen.findByLabelText('Senha atual'), 'errada')
    await userEvent.type(screen.getByLabelText('Nova senha'), 'senha-nova-segura')
    await userEvent.type(screen.getByLabelText('Confirme a nova senha'), 'senha-nova-segura')
    await userEvent.click(screen.getByRole('button', { name: 'Alterar senha' }))

    expect(await screen.findByText('Senha atual incorreta.')).toBeInTheDocument()
  })

  it('warns that an account with open requests cannot be deleted', async () => {
    signInAsDemoProducer()
    renderApp('/perfil')
    await userEvent.click(await screen.findByRole('button', { name: 'Excluir conta' }))
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /^Excluir conta$/ }))

    expect(await screen.findByText('Você tem solicitações em andamento. Conclua ou cancele antes de excluir a conta.')).toBeInTheDocument()
  })

  it('deletes an account without open requests, logs out and returns home', async () => {
    getMockDatabase().requestRecords.forEach((record) => {
      record.request.status = 'completed'
    })
    signInAsDemoProducer()
    renderApp('/perfil')
    await userEvent.click(await screen.findByRole('button', { name: 'Excluir conta' }))
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /^Excluir conta$/ }))

    expect(await screen.findByRole('heading', { name: 'Encontre o serviço agrícola certo para sua propriedade.' })).toBeInTheDocument()
    expect(localStorage.getItem('agroserv_token')).toBeNull()
  })

  it('restores the demo database after confirmation', async () => {
    getMockDatabase().categories[0].name = 'Categoria editada'
    signInAsDemoProducer()
    renderApp('/perfil')
    await userEvent.click(await screen.findByRole('button', { name: 'Restaurar dados demo' }))
    expect(screen.getByRole('dialog', { name: 'Restaurar dados demo?' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Restaurar dados' }))

    expect(await screen.findByRole('status')).toHaveTextContent('Dados demo restaurados.')
    expect(getMockDatabase().categories[0].name).toBe('Plantio')
  })

  it('changes and removes the profile photo', async () => {
    signInAsDemoProducer()
    renderApp('/perfil')

    const photo = new File([new Uint8Array([137, 80, 78, 71])], 'eu.png', { type: 'image/png' })
    await userEvent.upload(await screen.findByLabelText('Escolher foto de perfil'), photo)

    expect(await screen.findByText('Foto de perfil atualizada.')).toBeInTheDocument()
    const stored = getMockDatabase().users.find((user) => user.id === 'usr-1')?.avatarUrl
    expect(stored).toMatch(/^mockfile:upl-/)
    const section = screen.getByRole('region', { name: 'Foto de perfil' })
    expect(await within(section).findByRole('img', { name: 'Carlos Henrique Souza' })).toHaveAttribute('src', expect.stringMatching(/^data:image\/png;base64,/))

    await userEvent.click(within(section).getByRole('button', { name: 'Remover foto' }))
    expect(await screen.findByText('Foto de perfil removida.')).toBeInTheDocument()
    expect(getMockDatabase().users.find((user) => user.id === 'usr-1')?.avatarUrl).toBeUndefined()
  })
})
