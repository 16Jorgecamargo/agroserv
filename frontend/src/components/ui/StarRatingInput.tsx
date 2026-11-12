import { Star } from 'lucide-react'
import { useId } from 'react'
import { cn } from '../../utils/cn'

interface StarRatingInputProps {
  label: string
  value: number
  onChange: (value: number) => void
  error?: string
}

const starLabels = ['Péssimo', 'Ruim', 'Regular', 'Bom', 'Excelente']

export function StarRatingInput({ label, value, onChange, error }: StarRatingInputProps) {
  const name = useId()

  return (
    <fieldset aria-describedby={error ? `${name}-error` : undefined}>
      <legend className="mb-1.5 text-sm font-medium text-text">{label}</legend>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <label key={star} className="cursor-pointer rounded-md p-0.5 focus-within:ring-2 focus-within:ring-primary/40">
            <input
              type="radio"
              name={name}
              value={star}
              checked={value === star}
              onChange={() => onChange(star)}
              className="sr-only"
              aria-label={`${star} ${star === 1 ? 'estrela' : 'estrelas'} (${starLabels[star - 1]})`}
            />
            <Star className={cn('size-7 transition-colors', star <= value ? 'fill-warning text-warning' : 'text-border')} aria-hidden />
          </label>
        ))}
        {value > 0 && <span className="ml-2 text-sm font-medium text-text-muted">{starLabels[value - 1]}</span>}
      </div>
      {error && (
        <p id={`${name}-error`} className="mt-1.5 text-sm text-danger">
          {error}
        </p>
      )}
    </fieldset>
  )
}
