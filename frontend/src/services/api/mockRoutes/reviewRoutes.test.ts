import { describe, expect, it } from 'vitest'
import type { NotificationList } from '../../../types/api'
import type { Review } from '../../../types/entities'
import { call, captureError, tokens } from '../../../test/mockApi'
import { getMockDatabase } from '../mockDatabase'

function totals() {
  const database = getMockDatabase()
  const service = database.services.find((candidate) => candidate.id === 'svc-1')
  const profile = database.providerProfiles.find((candidate) => candidate.userId === 'prv-1')
  if (!service || !profile) throw new Error('seed missing')
  return { service: { rating: service.rating, count: service.reviewCount }, profile: { rating: profile.rating, count: profile.reviewCount } }
}

function completeReq11() {
  call('POST', '/provider/requests/req-11/complete', { token: tokens.provider })
}

describe('reviews by the producer', () => {
  it('creates one review for a completed request and updates both averages', () => {
    completeReq11()
    const before = totals()
    const review = call<Review>('POST', '/requests/req-11/review', { token: tokens.producer, body: { rating: 4, comment: ' Bom serviço ' } })
    const after = totals()

    expect(review).toMatchObject({ rating: 4, comment: 'Bom serviço', serviceId: 'svc-1', hidden: false })
    expect(Date.parse(review.editableUntil) - Date.parse(review.createdAt)).toBe(7 * 24 * 60 * 60 * 1000)
    expect(after.service.count).toBe(before.service.count + 1)
    expect(after.service.rating).toBeCloseTo((before.service.rating * before.service.count + 4) / (before.service.count + 1), 10)
    expect(after.profile.rating).toBeCloseTo((before.profile.rating * before.profile.count + 4) / (before.profile.count + 1), 10)
    expect(getMockDatabase().requestRecords.find((record) => record.request.id === 'req-11')?.request.reviewId).toBe(review.id)
    expect(call<NotificationList>('GET', '/me/notifications', { token: tokens.provider }).data[0]).toMatchObject({
      type: 'review',
      title: 'Você recebeu uma avaliação de 4 estrelas',
      link: '/prestador/avaliacoes',
    })
    expect(captureError(() => call('POST', '/requests/req-11/review', { token: tokens.producer, body: { rating: 5 } })).message).toBe(
      'Você já avaliou esta solicitação.',
    )
  })

  it('only reviews completed requests', () => {
    expect(captureError(() => call('POST', '/requests/req-14/review', { token: tokens.producer, body: { rating: 5 } })).code).toBe('invalid_transition')
    completeReq11()
    expect(captureError(() => call('POST', '/requests/req-11/review', { token: tokens.producer, body: { rating: 6 } })).fields).toEqual({
      rating: 'Escolha de 1 a 5 estrelas.',
    })
  })

  it('edits within 7 days adjusting the average and blocks afterwards', () => {
    completeReq11()
    const review = call<Review>('POST', '/requests/req-11/review', { token: tokens.producer, body: { rating: 2 } })
    const before = totals()

    call('PATCH', `/reviews/${review.id}`, { token: tokens.producer, body: { rating: 5 } })
    expect(totals().service.rating).toBeCloseTo(before.service.rating + 3 / before.service.count, 10)

    const stored = getMockDatabase().reviews.find((candidate) => candidate.id === review.id)
    if (stored) stored.editableUntil = new Date(Date.now() - 1000).toISOString()
    expect(captureError(() => call('PATCH', `/reviews/${review.id}`, { token: tokens.producer, body: { rating: 1 } })).message).toBe(
      'O prazo para editar esta avaliação terminou.',
    )
  })
})
