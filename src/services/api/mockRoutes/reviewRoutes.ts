import type { ReviewList } from '../../../types/api'
import type { Review, ReviewSummary } from '../../../types/entities'
import { ApiError } from '../apiError'
import { getMockDatabase, persistMockDatabase } from '../mockDatabase'
import {
  conflict,
  findOptionalUser,
  findServiceRecord,
  findUserByToken,
  getBody,
  invalidTransition,
  isServiceVisible,
  nextId,
  notify,
  paginate,
  requireUser,
  serviceNotFound,
  toPositiveInt,
  validationError,
} from './shared'
import type { MockRoute, RouteContext } from './types'

const EDIT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000

interface RatingTotals {
  rating: number
  reviewCount: number
}

function addRating(totals: RatingTotals, rating: number): RatingTotals {
  const reviewCount = totals.reviewCount + 1
  return { rating: (totals.rating * totals.reviewCount + rating) / reviewCount, reviewCount }
}

function changeRating(totals: RatingTotals, previous: number, next: number): RatingTotals {
  if (totals.reviewCount === 0) return totals
  return { rating: totals.rating + (next - previous) / totals.reviewCount, reviewCount: totals.reviewCount }
}

export function removeRating(totals: RatingTotals, rating: number): RatingTotals {
  const reviewCount = Math.max(0, totals.reviewCount - 1)
  if (reviewCount === 0) return { rating: 0, reviewCount: 0 }
  return { rating: (totals.rating * totals.reviewCount - rating) / reviewCount, reviewCount }
}

export function adjustReviewAverages(review: Review, change: (totals: RatingTotals) => RatingTotals): void {
  const database = getMockDatabase()
  const service = database.services.find((candidate) => candidate.id === review.serviceId)
  const profile = database.providerProfiles.find((candidate) => candidate.userId === review.providerId)
  for (const target of [service, profile]) {
    if (!target) continue
    const next = change({ rating: target.rating, reviewCount: target.reviewCount })
    target.rating = next.rating
    target.reviewCount = next.reviewCount
  }
}

function reviewNotFound(): never {
  throw new ApiError({ status: 404, code: 'review_not_found', message: 'Avaliação não encontrada.' })
}

function parseRating(value: unknown): Review['rating'] {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > 5) validationError({ rating: 'Escolha de 1 a 5 estrelas.' })
  return value as Review['rating']
}

function parseComment(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined
  if (typeof value !== 'string' || value.trim().length > 1000) validationError({ comment: 'Use no máximo 1000 caracteres.' })
  return value.trim() || undefined
}

function buildSummary(official: RatingTotals, reviews: Review[]): ReviewSummary {
  const distribution: ReviewSummary['distribution'] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  reviews.forEach((review) => {
    distribution[review.rating] += 1
  })
  return { average: Math.round(official.rating * 100) / 100, count: official.reviewCount, writtenCount: reviews.length, distribution }
}

function pageReviews(reviews: Review[], query: RouteContext['query'], official: RatingTotals, summaryReviews: Review[]): ReviewList {
  const page = toPositiveInt(query.page, 1, Number.MAX_SAFE_INTEGER)
  const pageSize = toPositiveInt(query.pageSize, 10, 50)
  const rating = Number(query.rating)
  const filtered = rating >= 1 && rating <= 5 ? reviews.filter((review) => review.rating === rating) : reviews
  const sorted = [...filtered].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return { ...paginate(sorted, page, pageSize), summary: buildSummary(official, summaryReviews) }
}

function createReview({ token, params, body }: RouteContext): Review {
  const user = requireUser(token, 'producer')
  const database = getMockDatabase()
  const record = database.requestRecords.find((candidate) => candidate.request.id === params.id)
  if (!record || record.request.producerId !== user.id) {
    throw new ApiError({ status: 404, code: 'request_not_found', message: 'Solicitação não encontrada.' })
  }
  const request = record.request
  if (request.reviewId) conflict('Você já avaliou esta solicitação.')
  if (request.status !== 'completed') invalidTransition('Só é possível avaliar um serviço concluído.')

  const payload = getBody(body)
  const rating = parseRating(payload.rating)
  const comment = parseComment(payload.comment)
  const now = new Date()
  const review: Review = {
    id: nextId('rev', database.reviews.map((candidate) => candidate.id)),
    requestId: request.id,
    serviceId: request.serviceId,
    serviceTitle: request.serviceTitle,
    providerId: request.providerId,
    producerId: user.id,
    producerName: user.name,
    ...(user.avatarUrl ? { producerAvatarUrl: user.avatarUrl } : {}),
    rating,
    ...(comment ? { comment } : {}),
    hidden: false,
    editableUntil: new Date(now.getTime() + EDIT_WINDOW_MS).toISOString(),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  }

  database.reviews.push(review)
  request.reviewId = review.id
  adjustReviewAverages(review, (totals) => addRating(totals, rating))
  notify(request.providerId, 'review', `Você recebeu uma avaliação de ${rating} estrelas`, '/prestador/avaliacoes')
  persistMockDatabase()
  return review
}

function updateReview({ token, params, body }: RouteContext): Review {
  const user = requireUser(token, 'producer')
  const review = getMockDatabase().reviews.find((candidate) => candidate.id === params.id)
  if (!review || review.producerId !== user.id) reviewNotFound()
  if (new Date().toISOString() > review.editableUntil) conflict('O prazo para editar esta avaliação terminou.')

  const payload = getBody(body)
  const next = payload.rating === undefined ? review.rating : parseRating(payload.rating)
  if (payload.comment !== undefined) {
    const comment = parseComment(payload.comment)
    if (comment) review.comment = comment
    else delete review.comment
  }
  if (next !== review.rating && !review.hidden) {
    const previous = review.rating
    adjustReviewAverages(review, (totals) => changeRating(totals, previous, next))
  }
  review.rating = next
  review.updatedAt = new Date().toISOString()
  persistMockDatabase()
  return review
}

function listServiceReviews({ token, params, query }: RouteContext): ReviewList {
  const record = findServiceRecord(params.id)
  const viewer = findOptionalUser(token)
  const canSee = record && (isServiceVisible(record) || viewer?.role === 'admin' || viewer?.id === record.providerId)
  if (!record || !canSee) serviceNotFound()

  const visible = getMockDatabase().reviews.filter((review) => review.serviceId === record.id && !review.hidden)
  return pageReviews(visible, query, record, visible)
}

export function getProviderReviewSummary(providerId: string): ReviewSummary {
  const database = getMockDatabase()
  const profile = database.providerProfiles.find((candidate) => candidate.userId === providerId)
  const visible = database.reviews.filter((review) => review.providerId === providerId && !review.hidden)
  return buildSummary(profile ?? { rating: 0, reviewCount: 0 }, visible)
}

function listProviderReviews({ token, query }: RouteContext): ReviewList {
  const user = requireUser(token, 'provider')
  const database = getMockDatabase()
  const profile = database.providerProfiles.find((candidate) => candidate.userId === user.id)
  const received = database.reviews.filter((review) => review.providerId === user.id)
  return pageReviews(received, query, profile ?? { rating: 0, reviewCount: 0 }, received.filter((review) => !review.hidden))
}

function replyToReview({ token, params, body }: RouteContext): Review {
  const user = findUserByToken(token)
  if (user.role !== 'provider') throw new ApiError({ status: 403, code: 'forbidden', message: 'Você não tem permissão para esta ação.' })
  const review = getMockDatabase().reviews.find((candidate) => candidate.id === params.id)
  if (!review || review.providerId !== user.id) reviewNotFound()

  const raw = getBody(body).text
  const text = typeof raw === 'string' ? raw.trim() : ''
  if (text.length < 2 || text.length > 1000) validationError({ text: 'Escreva uma resposta de 2 a 1000 caracteres.' })

  const now = new Date().toISOString()
  const isFirst = !review.reply
  review.reply = { text, createdAt: review.reply?.createdAt ?? now, updatedAt: now }
  review.updatedAt = now
  if (isFirst) notify(review.producerId, 'review_reply', `${user.name} respondeu à sua avaliação`, `/servicos/${review.serviceId}`)
  persistMockDatabase()
  return review
}

export const reviewRoutes: MockRoute[] = [
  { method: 'POST', pattern: '/requests/:id/review', handle: createReview },
  { method: 'PATCH', pattern: '/reviews/:id', handle: updateReview },
  { method: 'GET', pattern: '/services/:id/reviews', handle: listServiceReviews },
  { method: 'GET', pattern: '/provider/reviews', handle: listProviderReviews },
  { method: 'PUT', pattern: '/provider/reviews/:id/reply', handle: replyToReview },
]
