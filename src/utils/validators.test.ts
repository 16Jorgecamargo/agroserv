import { describe, expect, it } from 'vitest'
import {
  isValidEmail,
  validateAccountProfileForm,
  validateChangePasswordForm,
  validateLoginForm,
  validateProviderProfileForm,
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
