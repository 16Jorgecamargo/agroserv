import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from '../test/renderApp'

describe('ResetPasswordPage', () => {
  it('requires a valid token and lets the user request another link', async () => {
    renderApp('/redefinir-senha')

    expect(screen.getByRole('alert')).toHaveTextContent('Link inválido ou expirado.')
    await userEvent.click(screen.getByRole('link', { name: 'Solicitar outro link' }))
    expect(await screen.findByRole('heading', { name: 'Recuperar senha' })).toBeInTheDocument()
  })

  it('resets the password and allows login with the new password', async () => {
    renderApp('/esqueci-senha')
    await userEvent.type(screen.getByLabelText('E-mail'), 'produtor@agroserv.com')
    await userEvent.click(screen.getByRole('button', { name: 'Enviar link de redefinição' }))
    await userEvent.click(await screen.findByRole('link', { name: 'Abrir link de redefinição' }))

    await userEvent.type(await screen.findByLabelText('Nova senha'), 'senha-nova-segura')
    await userEvent.type(screen.getByLabelText('Confirme a nova senha'), 'senha-nova-segura')
    await userEvent.click(screen.getByRole('button', { name: 'Redefinir senha' }))

    expect(await screen.findByRole('heading', { name: 'Bem-vindo de volta' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Senha redefinida. Entre com a nova senha.')
    await userEvent.type(screen.getByLabelText('E-mail'), 'produtor@agroserv.com')
    await userEvent.type(screen.getByLabelText('Senha'), 'senha-nova-segura')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(await screen.findByRole('heading', { name: 'Olá, Carlos' })).toBeInTheDocument()
  })

  it('validates password length and confirmation', async () => {
    renderApp('/redefinir-senha?token=token-teste')
    await userEvent.type(screen.getByLabelText('Nova senha'), 'curta')
    await userEvent.type(screen.getByLabelText('Confirme a nova senha'), 'diferente')
    await userEvent.click(screen.getByRole('button', { name: 'Redefinir senha' }))

    expect(screen.getByText('A senha precisa ter pelo menos 8 caracteres.')).toBeInTheDocument()
    expect(screen.getByText('As senhas não conferem.')).toBeInTheDocument()
  })
})
