import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from '../test/renderApp'

async function fillValidRegistration(role: 'producer' | 'provider' = 'producer', email = 'ana@agroserv.com') {
  await userEvent.type(screen.getByLabelText('Nome completo'), 'Ana Silva')
  await userEvent.type(screen.getByLabelText('E-mail'), email)
  await userEvent.type(screen.getByLabelText('Senha'), 'senha-segura')
  await userEvent.type(screen.getByLabelText('Confirme sua senha'), 'senha-segura')
  await userEvent.type(screen.getByLabelText('Telefone'), '(45) 99999-0000')
  await userEvent.type(screen.getByLabelText('Cidade'), 'Toledo')
  await userEvent.selectOptions(screen.getByLabelText('Estado (UF)'), 'PR')
  await userEvent.click(screen.getByRole('radio', { name: role === 'producer' ? 'Sou produtor rural' : 'Sou prestador de serviços' }))
  await userEvent.click(screen.getByRole('checkbox', { name: 'Li e aceito os termos de uso e a política de privacidade.' }))
}

describe('RegisterPage', () => {
  it('validates required fields before submitting', async () => {
    renderApp('/cadastro')
    await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }))

    expect(screen.getByText('Informe seu nome.')).toBeInTheDocument()
    expect(screen.getByText('Informe um e-mail válido.')).toBeInTheDocument()
    expect(screen.getByText('A senha precisa ter pelo menos 8 caracteres.')).toBeInTheDocument()
    expect(screen.getByText('Confirme sua senha.')).toBeInTheDocument()
    expect(screen.getByText('Informe um telefone válido.')).toBeInTheDocument()
    expect(screen.getByText('Informe sua cidade.')).toBeInTheDocument()
    expect(screen.getByText('Selecione a UF.')).toBeInTheDocument()
    expect(screen.getByText('Escolha como você vai usar o AgroServ.')).toBeInTheDocument()
    expect(screen.getByText('Aceite os termos de uso e a política de privacidade.')).toBeInTheDocument()
  })

  it('creates a producer account, logs in and opens the producer area', async () => {
    renderApp('/cadastro')
    await fillValidRegistration()
    await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Olá, Ana' })).toBeInTheDocument()
    expect(localStorage.getItem('agroserv_token')).toBe('mock.usr-2')
  })

  it('creates a provider account and opens the provider area', async () => {
    renderApp('/cadastro')
    await fillValidRegistration('provider')
    await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Painel do prestador' })).toBeInTheDocument()
    expect(localStorage.getItem('agroserv_token')).toBe('mock.prv-7')
  })

  it('shows the API duplicate email error on the email field', async () => {
    renderApp('/cadastro')
    await fillValidRegistration('producer', 'produtor@agroserv.com')
    await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }))

    expect(await screen.findByText('Este e-mail já está cadastrado.')).toBeInTheDocument()
    expect(screen.getByLabelText('E-mail')).toHaveAttribute('aria-invalid', 'true')
    expect(localStorage.getItem('agroserv_token')).toBeNull()
  })

  it('links to the terms and privacy pages', async () => {
    renderApp('/cadastro')
    await userEvent.click(screen.getByRole('link', { name: 'Termos de uso' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Termos de uso' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('link', { name: 'Voltar ao cadastro' }))
    await userEvent.click(screen.getByRole('link', { name: 'Política de privacidade' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Política de privacidade' })).toBeInTheDocument()
  })
})
