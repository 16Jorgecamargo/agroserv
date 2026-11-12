import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from '../test/renderApp'

describe('ForgotPasswordPage', () => {
  it('shows the generic response and offers the mock reset link for a known account', async () => {
    renderApp('/esqueci-senha')
    await userEvent.type(screen.getByLabelText('E-mail'), 'produtor@agroserv.com')
    await userEvent.click(screen.getByRole('button', { name: 'Enviar link de redefinição' }))

    expect(await screen.findByRole('status')).toHaveTextContent('Se o e-mail existir, enviaremos um link.')
    await userEvent.click(screen.getByRole('link', { name: 'Abrir link de redefinição' }))
    expect(await screen.findByRole('heading', { name: 'Defina uma nova senha' })).toBeInTheDocument()
  })

  it('shows the same response without a reset link for an unknown account', async () => {
    renderApp('/esqueci-senha')
    await userEvent.type(screen.getByLabelText('E-mail'), 'desconhecido@agroserv.com')
    await userEvent.click(screen.getByRole('button', { name: 'Enviar link de redefinição' }))

    expect(await screen.findByRole('status')).toHaveTextContent('Se o e-mail existir, enviaremos um link.')
    expect(screen.queryByRole('link', { name: 'Abrir link de redefinição' })).not.toBeInTheDocument()
  })

  it('validates the email before requesting a reset link', async () => {
    renderApp('/esqueci-senha')
    await userEvent.type(screen.getByLabelText('E-mail'), 'email-invalido')
    await userEvent.click(screen.getByRole('button', { name: 'Enviar link de redefinição' }))

    expect(screen.getByText('Informe um e-mail válido.')).toBeInTheDocument()
    expect(screen.queryByText('Se o e-mail existir, enviaremos um link.')).not.toBeInTheDocument()
  })
})
