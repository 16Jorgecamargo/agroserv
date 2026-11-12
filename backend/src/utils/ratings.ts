export interface RatingTotals {
  rating: number;
  reviewCount: number;
}

export function addRating(totals: RatingTotals, rating: number): RatingTotals {
  // novaMédia = (média × total + nota) / (total + 1)
  const reviewCount = totals.reviewCount + 1;
  return { rating: (totals.rating * totals.reviewCount + rating) / reviewCount, reviewCount };
}

export function changeRating(totals: RatingTotals, previous: number, next: number): RatingTotals {
  // média += (notaNova − notaAntiga) / total
  if (totals.reviewCount === 0) return totals;
  return { rating: totals.rating + (next - previous) / totals.reviewCount, reviewCount: totals.reviewCount };
}

export function removeRating(totals: RatingTotals, rating: number): RatingTotals {
  // média = (média × total − nota) / (total − 1), ou 0 se zerar
  const reviewCount = Math.max(0, totals.reviewCount - 1);
  if (reviewCount === 0) return { rating: 0, reviewCount: 0 };
  return { rating: (totals.rating * totals.reviewCount - rating) / reviewCount, reviewCount };
}

export function roundRating(rating: number): number {
  // As médias saem da API com 2 casas
  return Math.round(rating * 100) / 100;
}
