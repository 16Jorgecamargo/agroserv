import type { PendingVerification } from '../../../types/api'
import type { User, Verification } from '../../../types/entities'
import { getMockDatabase, persistMockDatabase } from '../mockDatabase'
import { recordAdminAction, requireAdmin, requireReason } from './adminShared'
import { invalidTransition, notFound, notify, toProvider } from './shared'
import type { MockRoute } from './types'
import { getVerificationFor } from './verificationRoutes'

const VERIFICATION_LINK = '/prestador/verificacao'

function listPending(): PendingVerification[] {
  const database = getMockDatabase()
  return database.providerProfiles
    .filter((profile) => profile.verificationStatus === 'under_review')
    .flatMap((profile) => {
      const provider = toProvider(profile.userId)
      const user = database.users.find((candidate) => candidate.id === profile.userId)
      if (!provider || !user) return []
      return [{ provider, email: user.email, document: profile.document, verification: getVerificationFor(profile.userId) }]
    })
    .sort((a, b) => (a.verification.submittedAt ?? '').localeCompare(b.verification.submittedAt ?? ''))
}

function decide(admin: User, providerId: string, decision: 'approved' | 'rejected', reason?: string): Verification {
  const database = getMockDatabase()
  const profile = database.providerProfiles.find((candidate) => candidate.userId === providerId)
  const user = database.users.find((candidate) => candidate.id === providerId)
  if (!profile || !user) notFound('user_not_found', 'Usuário não encontrado.')
  if (profile.verificationStatus !== 'under_review') invalidTransition('Esta verificação não está em análise.')

  const now = new Date().toISOString()
  const record = database.verifications.find((candidate) => candidate.providerId === providerId)
  profile.verificationStatus = decision
  if (decision === 'rejected' && reason) profile.verificationRejectionReason = reason
  else delete profile.verificationRejectionReason
  if (record) {
    record.reviewedAt = now
    if (decision === 'rejected' && reason) record.rejectionReason = reason
    else delete record.rejectionReason
  }

  if (decision === 'approved') {
    notify(providerId, 'verification', 'Sua verificação foi aprovada.', VERIFICATION_LINK)
    recordAdminAction(admin, 'approve_verification', 'verification', providerId, user.name)
  } else {
    notify(providerId, 'verification', 'Sua verificação foi rejeitada', VERIFICATION_LINK, reason)
    recordAdminAction(admin, 'reject_verification', 'verification', providerId, user.name, reason)
  }
  persistMockDatabase()
  return getVerificationFor(providerId)
}

export const adminVerificationRoutes: MockRoute[] = [
  {
    method: 'GET',
    pattern: '/admin/verifications',
    handle: ({ token }) => {
      requireAdmin(token)
      return listPending()
    },
  },
  {
    method: 'POST',
    pattern: '/admin/verifications/:providerId/approve',
    handle: ({ token, params }) => decide(requireAdmin(token), params.providerId, 'approved'),
  },
  {
    method: 'POST',
    pattern: '/admin/verifications/:providerId/reject',
    handle: ({ token, params, body }) => {
      const admin = requireAdmin(token)
      return decide(admin, params.providerId, 'rejected', requireReason(body))
    },
  },
]
