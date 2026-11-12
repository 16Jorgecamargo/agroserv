import type { User, Verification, VerificationDocument } from '../../../types/entities'
import { getMockDatabase, persistMockDatabase } from '../mockDatabase'
import { conflict, getBody, notifyAdmins, requireUser, textField, throwIfFields } from './shared'
import type { MockRoute, RouteContext } from './types'

const DOCUMENT_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])

export function getVerificationFor(providerId: string): Verification {
  const database = getMockDatabase()
  const profile = database.providerProfiles.find((candidate) => candidate.userId === providerId)
  const record = database.verifications.find((candidate) => candidate.providerId === providerId)
  const status = profile?.verificationStatus ?? 'not_sent'

  return {
    status,
    documents: record?.documents ?? [],
    ...(record?.submittedAt ? { submittedAt: record.submittedAt } : {}),
    ...(record?.reviewedAt ? { reviewedAt: record.reviewedAt } : {}),
    ...(status === 'rejected' && (record?.rejectionReason ?? profile?.verificationRejectionReason)
      ? { rejectionReason: record?.rejectionReason ?? profile?.verificationRejectionReason }
      : {}),
  }
}

function getVerification({ token }: RouteContext): Verification {
  const user = requireUser(token, 'provider')
  return getVerificationFor(user.id)
}

function findDocument(user: User, uploadId: string, kind: VerificationDocument['kind']): VerificationDocument | undefined {
  const upload = getMockDatabase().uploads.find(
    (candidate) => candidate.id === uploadId && candidate.ownerId === user.id && candidate.purpose === 'verification' && DOCUMENT_TYPES.has(candidate.contentType),
  )
  return upload ? { kind, uploadId: upload.id, url: upload.url, name: upload.name } : undefined
}

function submitVerification({ token, body }: RouteContext): Verification {
  const user = requireUser(token, 'provider')
  const database = getMockDatabase()
  const profile = database.providerProfiles.find((candidate) => candidate.userId === user.id)
  if (!profile) return getVerificationFor(user.id)

  if (profile.verificationStatus === 'under_review' || profile.verificationStatus === 'approved') conflict('Sua verificação já foi enviada.')

  const payload = getBody(body)
  const fields: Record<string, string> = {}
  if (!profile.document?.trim()) fields.document = 'Preencha o CPF ou CNPJ no seu perfil antes de enviar.'
  const identity = findDocument(user, textField(payload.identityUploadId), 'identity')
  const address = findDocument(user, textField(payload.addressUploadId), 'address')
  if (!identity) fields.identityUploadId = 'Envie o documento de identidade.'
  if (!address) fields.addressUploadId = 'Envie o comprovante de endereço.'
  throwIfFields(fields)

  const now = new Date().toISOString()
  const documents = [identity, address] as VerificationDocument[]
  const record = database.verifications.find((candidate) => candidate.providerId === user.id)
  if (record) {
    record.documents = documents
    record.submittedAt = now
    delete record.reviewedAt
    delete record.rejectionReason
  } else {
    database.verifications.push({ providerId: user.id, documents, submittedAt: now })
  }
  profile.verificationStatus = 'under_review'
  delete profile.verificationRejectionReason

  notifyAdmins('verification_submitted', `Nova verificação de ${user.name}`, '/admin/verificacoes')
  persistMockDatabase()
  return getVerificationFor(user.id)
}

export const verificationRoutes: MockRoute[] = [
  { method: 'GET', pattern: '/provider/verification', handle: getVerification },
  { method: 'POST', pattern: '/provider/verification', handle: submitVerification },
]
