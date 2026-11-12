export interface LoginFormValues {
  email: string
  password: string
}

export type LoginFormErrors = Partial<Record<keyof LoginFormValues, string>>

export interface ResetPasswordFormValues {
  password: string
  confirmPassword: string
}

export type ResetPasswordFormErrors = Partial<Record<keyof ResetPasswordFormValues, string>>

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim())
}

export function validateLoginForm({ email, password }: LoginFormValues): LoginFormErrors {
  const errors: LoginFormErrors = {}
  if (!email.trim()) errors.email = 'Informe seu e-mail.'
  else if (!isValidEmail(email)) errors.email = 'Informe um e-mail válido.'
  if (!password) errors.password = 'Informe sua senha.'
  return errors
}

export function validateForgotPasswordEmail(email: string): string | undefined {
  if (!email.trim() || !isValidEmail(email)) return 'Informe um e-mail válido.'
  return undefined
}

export function validateResetPasswordForm(values: ResetPasswordFormValues): ResetPasswordFormErrors {
  const errors: ResetPasswordFormErrors = {}
  if (values.password.length < 8) errors.password = 'A senha precisa ter pelo menos 8 caracteres.'
  if (!values.confirmPassword) errors.confirmPassword = 'Confirme sua senha.'
  else if (values.confirmPassword !== values.password) errors.confirmPassword = 'As senhas não conferem.'
  return errors
}
