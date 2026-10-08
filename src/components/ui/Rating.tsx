import { Star } from 'lucide-react'
import { formatRating } from '../../utils/format'

interface RatingProps {
  value: number
  count?: number
}

export function Rating({ value, count }: RatingProps) {
  const label = `Avaliação ${formatRating(value)} de 5${count === undefined ? '' : `, ${count} avaliações`}`
  return (
    <span role="img" aria-label={label} className="inline-flex items-center gap-1 text-sm">
      <Star className="size-4 fill-warning text-warning" aria-hidden />
      <span className="font-semibold text-text">{formatRating(value)}</span>
      {count !== undefined && <span className="text-text-muted">({count})</span>}
    </span>
  )
}
