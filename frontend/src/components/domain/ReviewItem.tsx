import { Star } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Review } from '../../types/entities'
import { formatDate } from '../../utils/format'
import { Avatar } from '../ui/Avatar'
import { Badge } from '../ui/Badge'

interface ReviewItemProps {
  review: Review
  showService?: boolean
  children?: ReactNode
}

export function ReviewItem({ review, showService = false, children }: ReviewItemProps) {
  return (
    <article className="space-y-3 py-5 first:pt-0 last:pb-0">
      <header className="flex items-start gap-3">
        <Avatar name={review.producerName} src={review.producerAvatarUrl} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-text">{review.producerName}</p>
            {review.hidden && <Badge tone="danger">Oculta pela administração</Badge>}
          </div>
          <p className="text-xs text-text-muted">
            <time dateTime={review.createdAt}>{formatDate(review.createdAt.slice(0, 10))}</time>
            {showService && ` · ${review.serviceTitle}`}
          </p>
        </div>
        <span role="img" aria-label={`${review.rating} de 5 estrelas`} className="flex shrink-0 gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star key={star} className={star <= review.rating ? 'size-4 fill-warning text-warning' : 'size-4 text-border'} aria-hidden />
          ))}
        </span>
      </header>
      {review.comment && <p className="text-text">{review.comment}</p>}
      {review.reply && (
        <div className="ml-11 rounded-lg border-l-2 border-primary bg-surface-muted p-3">
          <p className="text-xs font-semibold text-text-muted">Resposta do prestador</p>
          <p className="mt-1 text-sm text-text">{review.reply.text}</p>
        </div>
      )}
      {children}
    </article>
  )
}
