import type { Review } from './entities/review.entity.js';

export interface ReviewView {
  id: string;
  requestId: string;
  serviceId: string;
  serviceTitle: string;
  providerId: string;
  producerId: string;
  producerName: string;
  producerAvatarUrl?: string;
  rating: number;
  comment?: string;
  reply?: { text: string; createdAt: string; updatedAt: string };
  hidden: boolean;
  editableUntil: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewSummaryView {
  average: number;
  count: number;
  writtenCount: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}

export function toReviewView(review: Review): ReviewView {
  // Converte a entidade no tipo Review do contrato
  const avatar = review.producer?.avatarUrl;
  const reply = review.replyText
    ? { text: review.replyText, createdAt: review.replyCreatedAt!, updatedAt: review.replyUpdatedAt! }
    : undefined;
  return {
    id: review.id,
    requestId: review.requestId,
    serviceId: review.serviceId,
    serviceTitle: review.serviceTitle,
    providerId: review.providerId,
    producerId: review.producerId,
    producerName: review.producerName,
    ...(avatar ? { producerAvatarUrl: avatar } : {}),
    rating: review.rating,
    ...(review.comment ? { comment: review.comment } : {}),
    ...(reply ? { reply } : {}),
    hidden: review.hidden,
    editableUntil: review.editableUntil,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
  };
}

export function toReviewSummary(
  official: { rating: number; reviewCount: number },
  counts: Record<number, number>,
): ReviewSummaryView {
  // Média e total oficiais, mais a distribuição das avaliações registradas
  const distribution = { 1: counts[1] ?? 0, 2: counts[2] ?? 0, 3: counts[3] ?? 0, 4: counts[4] ?? 0, 5: counts[5] ?? 0 };
  const writtenCount = Object.values(distribution).reduce((sum, total) => sum + total, 0);
  return { average: official.rating, count: official.reviewCount, writtenCount, distribution };
}
