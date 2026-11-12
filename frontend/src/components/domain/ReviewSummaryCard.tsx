import { Star } from 'lucide-react'
import type { ReviewSummary } from '../../types/entities'
import { formatRating } from '../../utils/format'

export function ReviewSummaryCard({ summary }: { summary: ReviewSummary }) {
  const max = Math.max(1, ...Object.values(summary.distribution))

  return (
    <div className="grid gap-6 rounded-card border border-border bg-surface p-5 shadow-card sm:grid-cols-[auto_1fr] sm:items-center">
      <div className="text-center sm:pr-6">
        <p className="text-4xl font-bold text-text tabular-nums">{summary.count ? formatRating(summary.average) : '—'}</p>
        <div className="mt-1 flex justify-center gap-0.5" aria-hidden>
          {[1, 2, 3, 4, 5].map((star) => (
            <Star key={star} className={star <= Math.round(summary.average) ? 'size-4 fill-warning text-warning' : 'size-4 text-border'} />
          ))}
        </div>
        <p className="mt-1 text-sm text-text-muted">
          {summary.count} {summary.count === 1 ? 'avaliação' : 'avaliações'}
        </p>
      </div>
      <ul className="space-y-1.5" aria-label="Distribuição das notas">
        {([5, 4, 3, 2, 1] as const).map((star) => (
          <li key={star} className="flex items-center gap-3 text-sm">
            <span className="w-14 shrink-0 text-text-muted">{star} {star === 1 ? 'estrela' : 'estrelas'}</span>
            <span className="h-2 flex-1 overflow-hidden rounded-full bg-surface-muted" aria-hidden>
              <span className="block h-full rounded-full bg-warning" style={{ width: `${(summary.distribution[star] / max) * 100}%` }} />
            </span>
            <span className="w-6 shrink-0 text-right text-text-muted tabular-nums">{summary.distribution[star]}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
