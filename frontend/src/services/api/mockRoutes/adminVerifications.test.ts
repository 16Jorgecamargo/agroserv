import { describe, expect, it } from 'vitest'
import type { PendingVerification } from '../../../types/api'
import type { ServiceDetail, Verification } from '../../../types/entities'
import { call, captureError, tokens } from '../../../test/mockApi'
import { getMockDatabase } from '../mockDatabase'

describe('admin verifications', () => {
  it('lists providers under review, oldest first', () => {
    const profile = getMockDatabase().providerProfiles.find((candidate) => candidate.userId === 'prv-4')!
    profile.verificationStatus = 'under_review'
    getMockDatabase().verifications.push({ providerId: 'prv-4', documents: [], submittedAt: new Date().toISOString() })

    const queue = call<PendingVerification[]>('GET', '/admin/verifications', { token: tokens.admin })

    expect(queue.map((item) => item.provider.id)).toEqual(['prv-3', 'prv-4'])
    expect(queue[0].verification.documents).toHaveLength(2)
    expect(queue[0].email).toMatch(/@agroserv\.com$/)
  })

  it('approves and gives the verified badge everywhere', () => {
    const verification = call<Verification>('POST', '/admin/verifications/prv-3/approve', { token: tokens.admin })
    const database = getMockDatabase()

    expect(verification.status).toBe('approved')
    const serviceId = database.services.find((service) => service.providerId === 'prv-3')!.id
    expect(call<ServiceDetail>('GET', `/services/${serviceId}`).provider.verified).toBe(true)
    expect(database.notifications.at(-1)).toMatchObject({ userId: 'prv-3', type: 'verification', title: 'Sua verificação foi aprovada.' })
    expect(database.adminActions.at(-1)).toMatchObject({ action: 'approve_verification', targetType: 'verification', targetId: 'prv-3' })
    expect(captureError(() => call('POST', '/admin/verifications/prv-3/approve', { token: tokens.admin })).code).toBe('invalid_transition')
  })

  it('rejects with a reason sent to the provider', () => {
    const verification = call<Verification>('POST', '/admin/verifications/prv-3/reject', {
      token: tokens.admin,
      body: { reason: 'Documento ilegível.' },
    })
    const database = getMockDatabase()

    expect(verification).toMatchObject({ status: 'rejected', rejectionReason: 'Documento ilegível.' })
    expect(call<Verification>('GET', '/provider/verification', { token: 'mock.prv-3' }).rejectionReason).toBe('Documento ilegível.')
    expect(database.notifications.at(-1)).toMatchObject({ userId: 'prv-3', title: 'Sua verificação foi rejeitada', body: 'Documento ilegível.' })
    expect(database.adminActions.at(-1)).toMatchObject({ action: 'reject_verification', reason: 'Documento ilegível.' })
  })

  it('requires the reason and admin role', () => {
    expect(captureError(() => call('POST', '/admin/verifications/prv-3/reject', { token: tokens.admin, body: {} })).fields).toEqual({
      reason: 'Informe o motivo com pelo menos 5 caracteres.',
    })
    expect(captureError(() => call('GET', '/admin/verifications', { token: tokens.provider })).status).toBe(403)
  })
})
