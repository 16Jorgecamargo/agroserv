import { describe, expect, it } from 'vitest'
import type { NotificationList } from '../../../types/api'
import type { Upload, Verification } from '../../../types/entities'
import { call, callAsync, captureError, tokens } from '../../../test/mockApi'
import { getMockDatabase } from '../mockDatabase'

const PROVIDER_4 = 'mock.prv-4'
const PDF = 'data:application/pdf;base64,JVBERi0xLjQ='

function upload(token: string, purpose: 'public' | 'verification') {
  return callAsync<Upload>('POST', '/uploads', { token, body: { name: 'doc.pdf', contentType: 'application/pdf', dataUrl: PDF, purpose } })
}

describe('provider verification', () => {
  it('starts as not sent and goes under review after sending both documents', async () => {
    expect(call<Verification>('GET', '/provider/verification', { token: PROVIDER_4 }).status).toBe('not_sent')
    const identity = await upload(PROVIDER_4, 'verification')
    const address = await upload(PROVIDER_4, 'verification')

    const sent = call<Verification>('POST', '/provider/verification', { token: PROVIDER_4, body: { identityUploadId: identity.id, addressUploadId: address.id } })

    expect(sent.status).toBe('under_review')
    expect(sent.documents.map((document) => document.kind)).toEqual(['identity', 'address'])
    expect(call<NotificationList>('GET', '/me/notifications', { token: tokens.admin }).data[0]).toMatchObject({
      type: 'verification_submitted',
      link: '/admin/verificacoes',
    })
    expect(captureError(() => call('POST', '/provider/verification', { token: PROVIDER_4, body: { identityUploadId: identity.id, addressUploadId: address.id } })).message).toBe(
      'Sua verificação já foi enviada.',
    )
  })

  it('requires the document number and verification uploads of the provider', async () => {
    const profile = getMockDatabase().providerProfiles.find((candidate) => candidate.userId === 'prv-4')
    if (profile) profile.document = ''
    const publicFile = await upload(PROVIDER_4, 'public')
    const foreign = await upload(tokens.provider, 'verification')

    const error = captureError(() => call('POST', '/provider/verification', { token: PROVIDER_4, body: { identityUploadId: publicFile.id, addressUploadId: foreign.id } }))
    expect(error.fields).toEqual({
      document: 'Preencha o CPF ou CNPJ no seu perfil antes de enviar.',
      identityUploadId: 'Envie o documento de identidade.',
      addressUploadId: 'Envie o comprovante de endereço.',
    })
  })

  it('allows sending again after a rejection', async () => {
    const profile = getMockDatabase().providerProfiles.find((candidate) => candidate.userId === 'prv-4')
    if (profile) Object.assign(profile, { verificationStatus: 'rejected', verificationRejectionReason: 'Foto ilegível.' })
    expect(call<Verification>('GET', '/provider/verification', { token: PROVIDER_4 })).toMatchObject({ status: 'rejected', rejectionReason: 'Foto ilegível.' })

    const identity = await upload(PROVIDER_4, 'verification')
    const address = await upload(PROVIDER_4, 'verification')
    expect(call<Verification>('POST', '/provider/verification', { token: PROVIDER_4, body: { identityUploadId: identity.id, addressUploadId: address.id } }).status).toBe('under_review')
  })
})
