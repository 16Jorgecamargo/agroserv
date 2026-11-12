import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { getMockDatabase } from '../services/api/mockDatabase'
import { call, tokens } from '../test/mockApi'
import { renderApp } from '../test/renderApp'
import { signInAsDemoAdmin } from '../test/session'
import type { User } from '../types/entities'
import { saveSession } from '../utils/storage'

describe('AdminUsersPage', () => {
  it('lists accounts with search and role filter', async () => {
    signInAsDemoAdmin()
    renderApp('/admin/usuarios')

    const table = await screen.findByRole('table', { name: 'Lista de usuários' })
    expect(within(table).getByRole('link', { name: 'Carlos Henrique Souza' })).toHaveAttribute('href', '/admin/usuarios/usr-1')

    await userEvent.selectOptions(screen.getByLabelText('Papel'), 'provider')
    await waitFor(() => expect(screen.queryByRole('link', { name: 'Carlos Henrique Souza' })).not.toBeInTheDocument())
    expect(screen.getByRole('link', { name: 'Agro Máquinas Paraná' })).toBeInTheDocument()

    await userEvent.type(screen.getByLabelText('Buscar por nome ou e-mail'), 'agro maquinas')
    await userEvent.click(screen.getByRole('button', { name: 'Buscar' }))
    await waitFor(() => expect(screen.getByText('1 conta')).toBeInTheDocument())
  })

  it('creates an administrator with a temporary password', async () => {
    signInAsDemoAdmin()
    renderApp('/admin/usuarios')

    await userEvent.click(await screen.findByRole('button', { name: 'Novo administrador' }))
    const dialog = screen.getByRole('dialog', { name: 'Novo administrador' })
    await userEvent.type(within(dialog).getByLabelText('Nome'), 'Ana Moderadora')
    await userEvent.type(within(dialog).getByLabelText('E-mail'), 'ana@agroserv.com')
    await userEvent.type(within(dialog).getByLabelText('Senha provisória'), 'provisoria1')
    await userEvent.type(within(dialog).getByLabelText('Cidade'), 'Cascavel')
    await userEvent.selectOptions(within(dialog).getByLabelText('UF'), 'PR')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Criar administrador' }))

    expect(await screen.findByRole('link', { name: 'Ana Moderadora' })).toBeInTheDocument()
    expect(getMockDatabase().users.find((user) => user.email === 'ana@agroserv.com')?.mustChangePassword).toBe(true)
  })
})

describe('AdminUserDetailPage', () => {
  it('shows the account and suspends it with a reason', async () => {
    signInAsDemoAdmin()
    renderApp('/admin/usuarios/prv-1')

    expect(await screen.findByRole('heading', { level: 1, name: 'Agro Máquinas Paraná' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Anúncios' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Avaliações recebidas' })).toBeInTheDocument()
    const requests = screen.getByRole('table', { name: 'Solicitações recentes' })
    expect(within(requests).getAllByRole('link')[0].getAttribute('href')).toMatch(/^\/admin\/solicitacoes\//)

    await userEvent.click(screen.getByRole('button', { name: 'Suspender conta' }))
    const dialog = screen.getByRole('dialog')
    await userEvent.type(within(dialog).getByLabelText('Motivo da suspensão (obrigatório)'), 'Conta usada para golpes.')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Suspender conta' }))

    expect(await screen.findByRole('button', { name: 'Reativar conta' })).toBeInTheDocument()
    expect(screen.getByText('Suspensa')).toBeInTheDocument()
    expect(screen.getByText('Suspendeu conta')).toBeInTheDocument()
    expect(screen.getByText('Motivo: Conta usada para golpes.')).toBeInTheDocument()
  })

  it('does not offer suspension of the own account', async () => {
    signInAsDemoAdmin()
    renderApp('/admin/usuarios/adm-1')

    expect(await screen.findByRole('heading', { level: 1 })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Suspender conta' })).not.toBeInTheDocument()
  })
})

describe('AdminRequestDetailPage', () => {
  it('shows a read only request with both phones', async () => {
    signInAsDemoAdmin()
    renderApp('/admin/solicitacoes/req-14')

    expect(await screen.findByRole('link', { name: /Voltar para Carlos Henrique Souza/ })).toHaveAttribute('href', '/admin/usuarios/usr-1')
    expect(screen.getByText('(45) 99999-0001')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Aceitar|Cancelar/ })).not.toBeInTheDocument()
  })
})

describe('temporary password', () => {
  it('sends the new administrator to the account page until the password is changed', async () => {
    const created = call<User>('POST', '/admin/users', {
      token: tokens.admin,
      body: { name: 'Ana Moderadora', email: 'ana@agroserv.com', password: 'provisoria1', city: 'Cascavel', state: 'PR' },
    })
    saveSession(`mock.${created.id}`, created)
    renderApp('/admin/usuarios')

    expect(await screen.findByText('Troque sua senha provisória para continuar.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Minha conta' })).toBeInTheDocument()

    await userEvent.type(screen.getByLabelText('Senha atual'), 'provisoria1')
    await userEvent.type(screen.getByLabelText('Nova senha'), 'definitiva1')
    await userEvent.type(screen.getByLabelText('Confirme a nova senha'), 'definitiva1')
    await userEvent.click(screen.getByRole('button', { name: 'Alterar senha' }))

    await waitFor(() => expect(screen.queryByText('Troque sua senha provisória para continuar.')).not.toBeInTheDocument())
    await userEvent.click(screen.getByRole('link', { name: 'Usuários' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Usuários' })).toBeInTheDocument()
  })
})
