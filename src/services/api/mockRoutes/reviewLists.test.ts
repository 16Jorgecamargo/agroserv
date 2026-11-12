import { describe, expect, it } from 'vitest'
import type { NotificationList, ReviewList } from '../../../types/api'
import type { Review } from '../../../types/entities'
import { call, captureError, tokens } from '../../../test/mockApi'
import { getMockDatabase } from '../mockDatabase'

describe('review lists and replies', () => {
  it('lists visible service reviews with the official summary', () => {
    const list = call<ReviewList>('GET', '/services/svc-5/reviews')
    const service = getMockDatabase().services.find((candidate) => candidate.id === 'svc-5')

    expect(list.data.map((review) => review.id)).toEqual(['rev-1'])
    expect(list.summary).toMatchObject({ count: service?.reviewCount, writtenCount: 1, distribution: { 5: 1, 4: 0 } })
    expect(call<ReviewList>('GET', '/services/svc-5/reviews', { query: { rating: 4 } }).data).toHaveLength(0)
  })

  it('hides hidden reviews publicly but shows them to the provider', () => {
    const review = getMockDatabase().reviews.find((candidate) => candidate.id === 'rev-1')
    if (review) review.hidden = true

    expect(call<ReviewList>('GET', '/services/svc-5/reviews').data).toHaveLength(0)
    expect(call<ReviewList>('GET', '/provider/reviews', { token: tokens.provider }).data[0]).toMatchObject({ id: 'rev-1', hidden: true })
  })

  it('creates and edits a reply, notifying the producer only the first time', () => {
    getMockDatabase().reviews.forEach((review) => delete review.reply)

    call<Review>('PUT', '/provider/reviews/rev-1/reply', { token: tokens.provider, body: { text: 'Obrigado!' } })
    const edited = call<Review>('PUT', '/provider/reviews/rev-1/reply', { token: tokens.provider, body: { text: 'Muito obrigado!' } })

    expect(edited.reply?.text).toBe('Muito obrigado!')
    const replies = call<NotificationList>('GET', '/me/notifications', { token: tokens.producer }).data.filter((notification) => notification.type === 'review_reply')
    expect(replies).toHaveLength(1)
    expect(replies[0]).toMatchObject({ title: 'Agro Máquinas Paraná respondeu à sua avaliação', link: '/servicos/svc-5' })
    expect(captureError(() => call('PUT', '/provider/reviews/rev-1/reply', { token: tokens.otherProvider, body: { text: 'Oi' } })).code).toBe('review_not_found')
  })
})
