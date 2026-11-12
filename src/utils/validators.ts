export interface LoginFormValues {
  email: string
  password: string
}

export type LoginFormErrors = Partial<Record<keyof LoginFormValues, string>>

export interface RegisterFormValues {
  name: string
  email: string
  password: string
  confirmPassword: string
  phone: string
  city: string
  state: string
  role: string
  acceptedTerms: boolean
}

export type RegisterFormErrors = Partial<Record<keyof RegisterFormValues, string>>

export const brazilianStates = [
  { value: 'AC', label: 'Acre' },
  { value: 'AL', label: 'Alagoas' },
  { value: 'AP', label: 'Amapá' },
  { value: 'AM', label: 'Amazonas' },
  { value: 'BA', label: 'Bahia' },
  { value: 'CE', label: 'Ceará' },
  { value: 'DF', label: 'Distrito Federal' },
  { value: 'ES', label: 'Espírito Santo' },
  { value: 'GO', label: 'Goiás' },
  { value: 'MA', label: 'Maranhão' },
  { value: 'MT', label: 'Mato Grosso' },
  { value: 'MS', label: 'Mato Grosso do Sul' },
  { value: 'MG', label: 'Minas Gerais' },
  { value: 'PA', label: 'Pará' },
  { value: 'PB', label: 'Paraíba' },
  { value: 'PR', label: 'Paraná' },
  { value: 'PE', label: 'Pernambuco' },
  { value: 'PI', label: 'Piauí' },
  { value: 'RJ', label: 'Rio de Janeiro' },
  { value: 'RN', label: 'Rio Grande do Norte' },
  { value: 'RS', label: 'Rio Grande do Sul' },
  { value: 'RO', label: 'Rondônia' },
  { value: 'RR', label: 'Roraima' },
  { value: 'SC', label: 'Santa Catarina' },
  { value: 'SP', label: 'São Paulo' },
  { value: 'SE', label: 'Sergipe' },
  { value: 'TO', label: 'Tocantins' },
] as const

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

export function validateRegisterForm(values: RegisterFormValues): RegisterFormErrors {
  const errors: RegisterFormErrors = {}
  const name = values.name.trim()
  const city = values.city.trim()
  const phoneDigits = values.phone.replace(/\D/g, '')

  if (name.length < 2 || name.length > 120) errors.name = 'Informe seu nome.'
  if (!isValidEmail(values.email)) errors.email = 'Informe um e-mail válido.'
  if (values.password.length < 8) errors.password = 'A senha precisa ter pelo menos 8 caracteres.'
  if (!values.confirmPassword) errors.confirmPassword = 'Confirme sua senha.'
  else if (values.confirmPassword !== values.password) errors.confirmPassword = 'As senhas não conferem.'
  if (phoneDigits.length !== 10 && phoneDigits.length !== 11) errors.phone = 'Informe um telefone válido.'
  if (city.length < 2 || city.length > 80) errors.city = 'Informe sua cidade.'
  if (!brazilianStates.some((state) => state.value === values.state)) errors.state = 'Selecione a UF.'
  if (values.role !== 'producer' && values.role !== 'provider') {
    errors.role = 'Escolha como você vai usar o AgroServ.'
  }
  if (!values.acceptedTerms) errors.acceptedTerms = 'Aceite os termos de uso e a política de privacidade.'

  return errors
}
