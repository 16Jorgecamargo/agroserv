import { useCallback, useState } from 'react'
import { useAsync } from '../../hooks/useAsync'
import { reviewService } from '../../services/reviewService'
import { Button } from '../ui/Button'
import { ReviewItem } from './ReviewItem'
import { ReviewSummaryCard } from './ReviewSummaryCard'

const PAGE_SIZE = 5

export function ServiceReviews({ serviceId }: { serviceId: string }) {
  const [page, setPage] = useState(1)
  const fetcher = useCallback(() => reviewService.listForService(serviceId, { page, pageSize: PAGE_SIZE }), [serviceId, page])
  const { data, error, isLoading, refetch } = useAsync(fetcher)

  return (
    <section aria-labelledby="reviews-heading" className="mt-8 border-t border-border pt-8">
      <h2 id="reviews-heading" className="text-xl font-semibold text-text">
        Avaliações
      </h2>
      {error && !data ? (
        <p role="alert" className="mt-4 text-sm text-danger">
          {error.message}{' '}
          <button type="button" onClick={refetch} className="font-semibold underline">
            Tentar novamente
          </button>
        </p>
      ) : !data ? (
        <p role="status" className="mt-4 text-sm text-text-muted">
          Carregando avaliações…
        </p>
      ) : (
        <div className="mt-4 space-y-6" aria-busy={isLoading}>
          <ReviewSummaryCard summary={data.summary} />
          {data.data.length === 0 ? (
            <p className="text-sm text-text-muted">Ainda não há avaliações escritas para este serviço.</p>
          ) : (
            <div className="divide-y divide-border">
              {data.data.map((review) => (
                <ReviewItem key={review.id} review={review} />
              ))}
            </div>
          )}
          {data.meta.totalPages > 1 && (
            <nav aria-label="Paginação das avaliações" className="flex items-center justify-between gap-3">
              <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                Anteriores
              </Button>
              <p className="text-sm text-text-muted">
                Página {data.meta.page} de {data.meta.totalPages}
              </p>
              <Button variant="secondary" size="sm" disabled={page >= data.meta.totalPages} onClick={() => setPage(page + 1)}>
                Próximas
              </Button>
            </nav>
          )}
        </div>
      )}
    </section>
  )
}
