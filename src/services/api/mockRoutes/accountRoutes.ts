import type {
  ChangePasswordPayload,
  MessageResponse,
  ProviderProfilePayload,
  UpdateProfilePayload,
} from '../../../types/api'
import type { ProviderProfile, User } from '../../../types/entities'
import { brazilianStateCodes } from '../../../data/states'
import { isOpenRequestStatus } from '../../../utils/requestStatus'
import { ApiError } from '../apiError'
import { getMockDatabase, persistMockDatabase } from '../mockDatabase'
import { areOwnPublicUploads, findUserByToken, OWN_IMAGES_MESSAGE, requireRole } from './shared'
import type { MockRoute, RouteContext } from './types'

const DELETED_EMAIL_DOMAIN = 'conta-excluida.agroserv.invalid'

function bodyRecord(body: unknown): Record<string, unknown> {
  return body && typeof body === 'object' && !Array.isArray(body) ? (body as Record<string, unknown>) : {}
}

function throwFields(fields: Record<string, string>): never {
  throw new ApiError({ status: 422, code: 'validation_error', message: 'Revise os campos destacados.', fields })
}

function updateMe({ token, body }: RouteContext): User {
  const user = findUserByToken(token)
  const payload = bodyRecord(body) as UpdateProfilePayload
  const fields: Record<string, string> = {}
  const updates: Partial<User> = {}

  if (payload.name !== undefined) {
    if (typeof payload.name !== 'string' || payload.name.trim().length < 2 || payload.name.trim().length > 120) {
      fields.name = 'Informe seu nome.'
    } else updates.name = payload.name.trim()
  }
  if (payload.phone !== undefined) {
    const digits = typeof payload.phone === 'string' ? payload.phone.replace(/\D/g, '') : ''
    if (digits.length !== 10 && digits.length !== 11) fields.phone = 'Informe um telefone válido.'
    else updates.phone = payload.phone?.trim()
  }
  if (payload.city !== undefined) {
    if (typeof payload.city !== 'string' || payload.city.trim().length < 2 || payload.city.trim().length > 80) {
      fields.city = 'Informe sua cidade.'
    } else updates.city = payload.city.trim()
  }
  if (payload.state !== undefined) {
    const state = typeof payload.state === 'string' ? payload.state.trim().toUpperCase() : ''
    if (!brazilianStateCodes.has(state)) fields.state = 'Selecione a UF.'
    else updates.state = state
  }
  if (payload.avatarUrl !== undefined) {
    if (payload.avatarUrl === null) updates.avatarUrl = undefined
    else if (typeof payload.avatarUrl === 'string' && areOwnPublicUploads(user.id, [payload.avatarUrl])) updates.avatarUrl = payload.avatarUrl
    else fields.avatarUrl = OWN_IMAGES_MESSAGE
  }

  if (Object.keys(fields).length) throwFields(fields)

  Object.assign(user, updates)

  persistMockDatabase()
  return user
}

function changePassword({ token, body }: RouteContext): MessageResponse {
  const user = findUserByToken(token)
  const { currentPassword, newPassword } = bodyRecord(body) as Partial<ChangePasswordPayload>
  const credential = getMockDatabase().userCredentials.find((candidate) => candidate.userId === user.id)
  const fields: Record<string, string> = {}

  if (typeof currentPassword !== 'string' || !credential || credential.password !== currentPassword) {
    fields.currentPassword = 'Senha atual incorreta.'
  }
  if (typeof newPassword !== 'string' || newPassword.length < 8) {
    fields.newPassword = 'A senha precisa ter pelo menos 8 caracteres.'
  } else if (newPassword === currentPassword) {
    fields.newPassword = 'A nova senha precisa ser diferente da atual.'
  }

  if (Object.keys(fields).length) throwFields(fields)
  if (!credential || typeof newPassword !== 'string') throwFields({ currentPassword: 'Senha atual incorreta.' })

  credential.password = newPassword
  user.mustChangePassword = false
  persistMockDatabase()
  return { message: 'Senha alterada.' }
}

function getProviderProfile({ token }: RouteContext): ProviderProfile {
  const user = requireRole(findUserByToken(token), 'provider')
  const profile = getMockDatabase().providerProfiles.find((candidate) => candidate.userId === user.id)
  if (!profile) {
    throw new ApiError({ status: 404, code: 'provider_profile_not_found', message: 'Perfil profissional não encontrado.' })
  }
  return profile
}

function updateProviderProfile({ token, body }: RouteContext): ProviderProfile {
  requireRole(findUserByToken(token), 'provider')
  const profile = getProviderProfile({ token, body, params: {}, query: {} })
  const updatedProfile = { ...profile }
  const payload = bodyRecord(body) as ProviderProfilePayload
  const fields: Record<string, string> = {}

  if (payload.document !== undefined) {
    const digits = typeof payload.document === 'string' ? payload.document.replace(/\D/g, '') : ''
    if (digits.length !== 11 && digits.length !== 14) fields.document = 'Informe um CPF ou CNPJ válido.'
    else if (digits !== updatedProfile.document.replace(/\D/g, '')) {
      updatedProfile.document = payload.document?.trim() ?? ''
      if (updatedProfile.verificationStatus === 'approved' || updatedProfile.verificationStatus === 'under_review') {
        updatedProfile.verificationStatus = 'not_sent'
        delete updatedProfile.verificationRejectionReason
      }
    }
  }
  if (payload.serviceRadiusKm !== undefined) {
    if (!Number.isInteger(payload.serviceRadiusKm) || Number(payload.serviceRadiusKm) < 1 || Number(payload.serviceRadiusKm) > 500) {
      fields.serviceRadiusKm = 'Informe um raio entre 1 e 500 km.'
    } else updatedProfile.serviceRadiusKm = Number(payload.serviceRadiusKm)
  }
  if (payload.yearsOfExperience !== undefined) {
    if (!Number.isInteger(payload.yearsOfExperience) || Number(payload.yearsOfExperience) < 0 || Number(payload.yearsOfExperience) > 80) {
      fields.yearsOfExperience = 'Informe os anos de experiência.'
    } else updatedProfile.yearsOfExperience = Number(payload.yearsOfExperience)
  }
  if (payload.description !== undefined) {
    if (typeof payload.description !== 'string' || payload.description.length > 1000) {
      fields.description = 'Use no máximo 1000 caracteres.'
    } else updatedProfile.description = payload.description.trim()
  }

  if (Object.keys(fields).length) throwFields(fields)

  Object.assign(profile, updatedProfile)

  persistMockDatabase()
  return profile
}

function deleteMe({ token }: RouteContext): MessageResponse {
  const user = findUserByToken(token)
  if (user.role === 'admin') {
    throw new ApiError({ status: 403, code: 'forbidden', message: 'Administradores não podem excluir a própria conta.' })
  }

  const database = getMockDatabase()
  const relatedRequests = database.requestRecords.filter((record) => {
    if (!isOpenRequestStatus(record.request.status)) return false
    if (user.role === 'producer') return record.producerId === user.id
    const service = database.services.find((candidate) => candidate.id === record.request.serviceId)
    return service?.providerId === user.id
  })

  if (relatedRequests.length) {
    throw new ApiError({
      status: 409,
      code: 'conflict',
      message: 'Você tem solicitações em andamento. Conclua ou cancele antes de excluir a conta.',
    })
  }

  user.status = 'deleted'
  user.email = `excluida+${user.id}@${DELETED_EMAIL_DOMAIN}`
  database.userCredentials = database.userCredentials.filter((credential) => credential.userId !== user.id)

  if (user.role === 'provider') {
    database.services.forEach((service) => {
      if (service.providerId !== user.id || service.deletedAt || service.status === 'hidden') return
      service.statusBeforeHidden = service.status
      service.status = 'hidden'
      service.hiddenByAccountDeletion = true
    })
  }

  persistMockDatabase()
  return { message: 'Conta excluída.' }
}

export const accountRoutes: MockRoute[] = [
  { method: 'PATCH', pattern: '/me', handle: updateMe },
  { method: 'PATCH', pattern: '/me/password', handle: changePassword },
  { method: 'DELETE', pattern: '/me', handle: deleteMe },
  { method: 'GET', pattern: '/provider/profile', handle: getProviderProfile },
  { method: 'PATCH', pattern: '/provider/profile', handle: updateProviderProfile },
]
