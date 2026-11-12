import { describe, expect, it } from 'vitest'
import {
  isValidEmail,
  validateAccountProfileForm,
  validateChangePasswordForm,
  validateForgotPasswordEmail,
  validateLoginForm,
  validateProviderProfileForm,
  validateRegisterForm,
  validateResetPasswordForm,
} from './validators'

describe('validators', () => {
  it('checks email format', () => {
    expect(isValidEmail('produtor@agroserv.com')).toBe(true)
    expect(isValidEmail(' produtor@agroserv.com ')).toBe(true)
    expect(isValidEmail('produtor@agroserv')).toBe(false)
    expect(isValidEmail('abc')).toBe(false)
  })

  it('validates the login form', () => {
    expect(validateLoginForm({ email: '', password: '' })).toEqual({
      email: 'Informe seu e-mail.',
      password: 'Informe sua senha.',
    })
    expect(validateLoginForm({ email: 'abc', password: '1' })).toEqual({ email: 'Informe um e-mail válido.' })
    expect(validateLoginForm({ email: 'produtor@agroserv.com', password: '123456' })).toEqual({})
  })

  it('validates registration fields and password confirmation', () => {
    expect(
      validateRegisterForm({
        name: '',
        email: 'bad-email',
        password: 'short',
        confirmPassword: 'different',
        phone: '123',
        city: 'X',
        state: '',
        role: '',
        acceptedTerms: false,
      }),
    ).toEqual({
      name: 'Informe seu nome.',
      email: 'Informe um e-mail válido.',
      password: 'A senha precisa ter pelo menos 8 caracteres.',
      confirmPassword: 'As senhas não conferem.',
      phone: 'Informe um telefone válido.',
      city: 'Informe sua cidade.',
      state: 'Selecione a UF.',
      role: 'Escolha como você vai usar o AgroServ.',
      acceptedTerms: 'Aceite os termos de uso e a política de privacidade.',
    })
  })

  it('accepts a valid registration and counts formatted phone digits', () => {
    expect(
      validateRegisterForm({
        name: ' Ana Silva ',
        email: 'ana@agroserv.com',
        password: 'senha-segura',
        confirmPassword: 'senha-segura',
        phone: '(45) 99999-0000',
        city: ' Toledo ',
        state: 'PR',
        role: 'producer',
        acceptedTerms: true,
      }),
    ).toEqual({})
  })

  it('validates forgot password email without checking whether the account exists', () => {
    expect(validateForgotPasswordEmail('')).toBe('Informe um e-mail válido.')
    expect(validateForgotPasswordEmail('invalid')).toBe('Informe um e-mail válido.')
    expect(validateForgotPasswordEmail(' produtor@agroserv.com ')).toBeUndefined()
  })

  it('validates reset password length and confirmation', () => {
    expect(validateResetPasswordForm({ password: 'short', confirmPassword: 'different' })).toEqual({
      password: 'A senha precisa ter pelo menos 8 caracteres.',
      confirmPassword: 'As senhas não conferem.',
    })
    expect(validateResetPasswordForm({ password: 'senha-segura', confirmPassword: 'senha-segura' })).toEqual({})
  })

  it('validates personal profile fields', () => {
    expect(validateAccountProfileForm({ name: 'A', phone: '123', city: '', state: 'XX' })).toEqual({
      name: 'Informe seu nome.',
      phone: 'Informe um telefone válido.',
      city: 'Informe sua cidade.',
      state: 'Selecione a UF.',
    })
    expect(validateAccountProfileForm({ name: 'Maria Souza', phone: '(45) 99999-0001', city: 'Santa Helena', state: 'PR' })).toEqual({})
  })

  it('validates password changes and confirmation', () => {
    expect(validateChangePasswordForm({ currentPassword: '', newPassword: '123', confirmPassword: '1234' })).toEqual({
      currentPassword: 'Informe sua senha atual.',
      newPassword: 'A senha precisa ter pelo menos 8 caracteres.',
      confirmPassword: 'As senhas não conferem.',
    })
    expect(validateChangePasswordForm({ currentPassword: 'senha-atual', newPassword: 'senha-atual', confirmPassword: 'senha-atual' })).toEqual({
      newPassword: 'A nova senha precisa ser diferente da atual.',
    })
  })

  it('validates the professional profile', () => {
    expect(validateProviderProfileForm({ document: '123', serviceRadiusKm: '501', yearsOfExperience: '81', description: 'x'.repeat(1001) })).toEqual({
      document: 'Informe um CPF ou CNPJ válido.',
      serviceRadiusKm: 'Informe um raio entre 1 e 500 km.',
      yearsOfExperience: 'Informe os anos de experiência.',
      description: 'Use no máximo 1000 caracteres.',
    })
    expect(validateProviderProfileForm({ document: '123.456.789-01', serviceRadiusKm: '100', yearsOfExperience: '0', description: '' })).toEqual({})
  })
})
