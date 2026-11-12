import { MessageSquareReply, Star } from 'lucide-react'
import { useCallback, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router'
import { ReportButton } from '../components/domain/ReportButton'
import { ReviewItem } from '../components/domain/ReviewItem'
import { ReviewSummaryCard } from '../components/domain/ReviewSummaryCard'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { FilterChip } from '../components/ui/FilterChip'
import { Skeleton } from '../components/ui/Skeleton'
import { Textarea } from '../components/ui/Textarea'
import { useAsync } from '../hooks/useAsync'
import { usePageTitle } from '../hooks/usePageTitle'
import { useToast } from '../hooks/useToast'
import { isApiError } from '../services/apiError'
import { reviewService } from '../services/reviewService'
import type { Review } from '../types/entities'

const PAGE_SIZE = 10

function ReplyForm({ review, onSaved, onCancel }: { review: Review; onSaved: () => void; onCancel: () => void }) {
  const toast = useToast()
  const [text, setText] = useState(review.reply?.text ?? '')
  const [error, setError] = useState<string>()
  const [isSaving, setIsSaving] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSaving) return
    if (text.trim().length < 2 || text.trim().length > 1000) {
      setError('Escreva uma resposta de 2 a 1000 caracteres.')
      return
    }
    setIsSaving(true)
    try {
      await reviewService.reply(review.id, text.trim())
      toast.success(review.reply ? 'Resposta atualizada.' : 'Resposta publicada.')
      onSaved()
    } catch (caught) {
      setError(isApiError(caught) ? (caught.fields?.text ?? caught.message) : 'Não foi possível salvar a resposta.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form noValidate onSubmit={submit} className="ml-11 space-y-3">
      <Textarea label="Sua resposta pública" rows={3} maxLength={1000} value={text} onChange={(event) => setText(event.target.value)} error={error} />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={onCancel} disabled={isSaving}>
          Cancelar
        </Button>
        <Button type="submit" size="sm" isLoading={isSaving}>
          Publicar resposta
        </Button>
      </div>
    </form>
  )
}

export function ProviderReviewsPage() {
  usePageTitle('Avaliações')
  const [searchParams, setSearchParams] = useSearchParams()
  const rating = Number(searchParams.get('nota')) || 0
  const [page, setPage] = useState(1)
  const [replying, setReplying] = useState<string | null>(null)
  const fetcher = useCallback(() => reviewService.listReceived({ page, pageSize: PAGE_SIZE, ...(rating ? { rating } : {}) }), [page, rating])
  const { data, error, refetch } = useAsync(fetcher)

  function selectRating(next: number) {
    setPage(1)
    setSearchParams(next ? { nota: String(next) } : {})
  }

  return (
    <div className="space-y-8">
      <PageHeader icon={Star} title="Avaliações" description="Veja o que os produtores dizem e responda publicamente." />

      {error && !data ? (
        <ErrorState message={error.message} onRetry={refetch} />
      ) : !data ? (
        <div role="status" aria-label="Carregando avaliações" className="space-y-4">
          <Skeleton className="h-36 rounded-card" />
          <Skeleton className="h-48 rounded-card" />
        </div>
      ) : (
        <>
          <ReviewSummaryCard summary={data.summary} />
          <div role="group" aria-label="Filtrar por nota" className="flex flex-wrap gap-2">
            <FilterChip isActive={rating === 0} onClick={() => selectRating(0)}>
              Todas
            </FilterChip>
            {[5, 4, 3, 2, 1].map((star) => (
              <FilterChip key={star} isActive={rating === star} onClick={() => selectRating(star)}>
                {star} {star === 1 ? 'estrela' : 'estrelas'}
              </FilterChip>
            ))}
          </div>
          {data.data.length === 0 ? (
            <EmptyState icon={Star} title="Nenhuma avaliação" description={rating ? 'Nenhuma avaliação com esta nota.' : 'Quando um produtor avaliar um serviço seu, a avaliação aparece aqui.'} />
          ) : (
            <div className="divide-y divide-border rounded-card border border-border bg-surface p-5 shadow-card sm:p-6" aria-label="Avaliações recebidas" role="list">
              {data.data.map((review) => (
                <div role="listitem" key={review.id}>
                  <ReviewItem review={review} showService>
                    {replying === review.id ? (
                      <ReplyForm
                        review={review}
                        onCancel={() => setReplying(null)}
                        onSaved={() => {
                          setReplying(null)
                          refetch()
                        }}
                      />
                    ) : (
                      <div className="ml-11 flex flex-wrap gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setReplying(review.id)} aria-label={`${review.reply ? 'Editar resposta' : 'Responder'} a ${review.producerName}`}>
                          <MessageSquareReply className="size-4" aria-hidden />
                          {review.reply ? 'Editar resposta' : 'Responder'}
                        </Button>
                        {!review.hidden && (
                          <ReportButton
                            buttonLabel="Denunciar avaliação"
                            title={`Denunciar avaliação de ${review.producerName}`}
                            targets={[{ type: 'review', id: review.id, label: `Avaliação de ${review.producerName}` }]}
                          />
                        )}
                      </div>
                    )}
                  </ReviewItem>
                </div>
              ))}
            </div>
          )}
          {data.meta.totalPages > 1 && (
            <nav aria-label="Paginação" className="flex items-center justify-between gap-3">
              <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                Anterior
              </Button>
              <p className="text-sm text-text-muted">
                Página {data.meta.page} de {data.meta.totalPages}
              </p>
              <Button variant="secondary" size="sm" disabled={page >= data.meta.totalPages} onClick={() => setPage(page + 1)}>
                Próxima
              </Button>
            </nav>
          )}
        </>
      )}
    </div>
  )
}
