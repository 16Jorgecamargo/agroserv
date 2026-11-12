import { describe, expect, it } from 'vitest'
import {
  isValidEmail,
  validateForgotPasswordEmail,
  validateLoginForm,
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
})
