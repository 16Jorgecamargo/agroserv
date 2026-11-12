import { Star } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useToast } from '../../hooks/useToast'
import { isApiError } from '../../services/apiError'
import { reviewService } from '../../services/reviewService'
import type { Review } from '../../types/entities'
import { cn } from '../../utils/cn'
import { formatDateTime } from '../../utils/format'
import { Button } from '../ui/Button'
import { StarRatingInput } from '../ui/StarRatingInput'
import { Textarea } from '../ui/Textarea'

interface RequestReviewSectionProps {
  requestId: string
  review?: Review
  canReview: boolean
  onSaved: () => void
}

function Stars({ value }: { value: number }) {
  return (
    <span role="img" aria-label={`${value} de 5 estrelas`} className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star key={star} className={cn('size-5', star <= value ? 'fill-warning text-warning' : 'text-border')} aria-hidden />
      ))}
    </span>
  )
}

export function RequestReviewSection({ requestId, review, canReview, onSaved }: RequestReviewSectionProps) {
  const toast = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [rating, setRating] = useState(review?.rating ?? 0)
  const [comment, setComment] = useState(review?.comment ?? '')
  const [errors, setErrors] = useState<{ rating?: string; comment?: string; form?: string }>({})
  const [isSaving, setIsSaving] = useState(false)
  const [openedAt] = useState(() => Date.now())
  const canEdit = Boolean(review && openedAt <= Date.parse(review.editableUntil))
  const showForm = (!review && canReview) || (review && isEditing && canEdit)

  if (!review && !canReview) return null

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSaving) return
    const next: typeof errors = {}
    if (rating < 1) next.rating = 'Escolha de 1 a 5 estrelas.'
    if (comment.trim().length > 1000) next.comment = 'Use no máximo 1000 caracteres.'
    setErrors(next)
    if (Object.keys(next).length) return

    setIsSaving(true)
    try {
      if (review) {
        await reviewService.update(review.id, { rating, comment: comment.trim() })
        toast.success('Avaliação atualizada.')
      } else {
        await reviewService.create(requestId, { rating, ...(comment.trim() ? { comment: comment.trim() } : {}) })
        toast.success('Obrigado! Sua avaliação foi publicada.')
      }
      setIsEditing(false)
      onSaved()
    } catch (error) {
      if (isApiError(error) && error.fields) setErrors(error.fields)
      else setErrors({ form: isApiError(error) ? error.message : 'Não foi possível salvar a avaliação.' })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section aria-labelledby="review-heading" className="rounded-card border border-border bg-surface p-5 shadow-card sm:p-6">
      <h2 id="review-heading" className="text-xl font-semibold text-text">
        {review ? 'Sua avaliação' : 'Avaliar serviço'}
      </h2>

      {showForm ? (
        <form noValidate onSubmit={submit} className="mt-4 space-y-4">
          {errors.form && (
            <p role="alert" className="text-sm text-danger">
              {errors.form}
            </p>
          )}
          <StarRatingInput label="Nota" value={rating} onChange={setRating} error={errors.rating} />
          <div>
            <Textarea label="Comentário (opcional)" rows={4} maxLength={1000} value={comment} onChange={(event) => setComment(event.target.value)} error={errors.comment} />
            <p className="mt-1 text-xs text-text-muted tabular-nums">{comment.length}/1000</p>
          </div>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            {review && (
              <Button type="button" variant="secondary" onClick={() => setIsEditing(false)} disabled={isSaving}>
                Cancelar
              </Button>
            )}
            <Button type="submit" isLoading={isSaving}>
              {review ? 'Salvar avaliação' : 'Publicar avaliação'}
            </Button>
          </div>
        </form>
      ) : review ? (
        <div className="mt-4 space-y-3">
          <Stars value={review.rating} />
          {review.comment && <p className="text-text">{review.comment}</p>}
          {review.reply && (
            <div className="rounded-lg bg-surface-muted p-3">
              <p className="text-xs font-semibold text-text-muted">Resposta do prestador</p>
              <p className="mt-1 text-sm text-text">{review.reply.text}</p>
            </div>
          )}
          {canEdit ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-text-muted">Você pode editar até {formatDateTime(review.editableUntil)}.</p>
              <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)}>
                Editar avaliação
              </Button>
            </div>
          ) : (
            <p className="text-xs text-text-muted">O prazo para editar esta avaliação terminou.</p>
          )}
        </div>
      ) : null}
    </section>
  )
}
