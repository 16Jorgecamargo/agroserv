import { brazilianStateCodes } from '../data/states'

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
  if (!brazilianStateCodes.has(values.state)) errors.state = 'Selecione a UF.'
  if (values.role !== 'producer' && values.role !== 'provider') {
    errors.role = 'Escolha como você vai usar o AgroServ.'
  }
  if (!values.acceptedTerms) errors.acceptedTerms = 'Aceite os termos de uso e a política de privacidade.'

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

export interface AccountProfileFormValues {
  name: string
  phone: string
  city: string
  state: string
}

export type AccountProfileFormErrors = Partial<Record<keyof AccountProfileFormValues, string>>

export function validateAccountProfileForm(values: AccountProfileFormValues): AccountProfileFormErrors {
  const errors: AccountProfileFormErrors = {}
  if (values.name.trim().length < 2 || values.name.trim().length > 120) errors.name = 'Informe seu nome.'
  const phoneDigits = values.phone.replace(/\D/g, '')
  if (phoneDigits.length !== 10 && phoneDigits.length !== 11) errors.phone = 'Informe um telefone válido.'
  if (values.city.trim().length < 2 || values.city.trim().length > 80) errors.city = 'Informe sua cidade.'
  if (!brazilianStateCodes.has(values.state.trim().toUpperCase())) errors.state = 'Selecione a UF.'
  return errors
}

export interface ChangePasswordFormValues {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export type ChangePasswordFormErrors = Partial<Record<keyof ChangePasswordFormValues, string>>

export function validateChangePasswordForm({
  currentPassword,
  newPassword,
  confirmPassword,
}: ChangePasswordFormValues): ChangePasswordFormErrors {
  const errors: ChangePasswordFormErrors = {}
  if (!currentPassword) errors.currentPassword = 'Informe sua senha atual.'
  if (newPassword.length < 8) errors.newPassword = 'A senha precisa ter pelo menos 8 caracteres.'
  else if (newPassword === currentPassword) errors.newPassword = 'A nova senha precisa ser diferente da atual.'
  if (confirmPassword !== newPassword) errors.confirmPassword = 'As senhas não conferem.'
  return errors
}

export interface ProviderProfileFormValues {
  document: string
  serviceRadiusKm: string
  yearsOfExperience: string
  description: string
}

export type ProviderProfileFormErrors = Partial<Record<keyof ProviderProfileFormValues, string>>

export function validateProviderProfileForm(values: ProviderProfileFormValues): ProviderProfileFormErrors {
  const errors: ProviderProfileFormErrors = {}
  const documentDigits = values.document.replace(/\D/g, '')
  if (documentDigits.length !== 11 && documentDigits.length !== 14) {
    errors.document = 'Informe um CPF ou CNPJ válido.'
  }
  const radius = Number(values.serviceRadiusKm)
  if (!Number.isInteger(radius) || radius < 1 || radius > 500) errors.serviceRadiusKm = 'Informe um raio entre 1 e 500 km.'
  const years = Number(values.yearsOfExperience)
  if (!Number.isInteger(years) || years < 0 || years > 80) errors.yearsOfExperience = 'Informe os anos de experiência.'
  if (values.description.length > 1000) errors.description = 'Use no máximo 1000 caracteres.'
  return errors
}

export interface PropertyFormValues {
  name: string
  city: string
  state: string
  accessNotes: string
  areaHectares: string
  crops: string[]
}

export type PropertyFormErrors = Partial<Record<keyof PropertyFormValues, string>>

export function parseDecimal(value: string): number {
  return Number(value.trim().replace(',', '.'))
}

export function validatePropertyForm(values: PropertyFormValues): PropertyFormErrors {
  const errors: PropertyFormErrors = {}
  const area = parseDecimal(values.areaHectares)
  const crops = values.crops.map((crop) => crop.trim())

  if (values.name.trim().length < 2 || values.name.trim().length > 80) errors.name = 'Informe o nome da propriedade.'
  if (values.city.trim().length < 2 || values.city.trim().length > 80) errors.city = 'Informe a cidade.'
  if (!brazilianStateCodes.has(values.state.trim().toUpperCase())) errors.state = 'Selecione a UF.'
  if (values.accessNotes.trim().length > 500) errors.accessNotes = 'Use no máximo 500 caracteres.'
  if (!Number.isFinite(area) || area <= 0 || area > 1_000_000) errors.areaHectares = 'Informe a área em hectares.'
  if (
    crops.length > 10 ||
    crops.some((crop) => crop.length < 2 || crop.length > 40) ||
    new Set(crops.map((crop) => crop.toLowerCase())).size !== crops.length
  ) {
    errors.crops = 'Informe até 10 culturas.'
  }

  return errors
}

export interface RequestFormValues {
  propertyId: string
  scheduledDate: string
  quantity: string
  notes: string
}

export type RequestFormErrors = Partial<Record<keyof RequestFormValues, string>>

export function validateRequestForm(values: RequestFormValues, today: string, blockedDays: readonly string[]): RequestFormErrors {
  const errors: RequestFormErrors = {}
  const quantity = parseDecimal(values.quantity)

  if (!values.propertyId) errors.propertyId = 'Selecione uma propriedade.'
  if (!values.scheduledDate || values.scheduledDate < today) errors.scheduledDate = 'Escolha uma data a partir de hoje.'
  else if (blockedDays.includes(values.scheduledDate)) errors.scheduledDate = 'O prestador não atende nesta data.'
  if (!Number.isFinite(quantity) || quantity <= 0 || quantity > 100_000) errors.quantity = 'Informe a quantidade.'
  if (values.notes.trim().length > 1000) errors.notes = 'Use no máximo 1000 caracteres.'

  return errors
}

export const ACCEPTED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const MAX_FILE_BYTES = 5 * 1024 * 1024

export function validateUploadFile(file: File, acceptedTypes: string[] = ACCEPTED_FILE_TYPES): string | undefined {
  if (!acceptedTypes.includes(file.type)) {
    return acceptedTypes.includes('application/pdf')
      ? 'Envie uma imagem JPG, PNG ou WEBP, ou um PDF.'
      : 'Envie uma imagem JPG, PNG ou WEBP.'
  }
  if (file.size > MAX_FILE_BYTES) return 'O arquivo deve ter no máximo 5 MB.'
  return undefined
}
